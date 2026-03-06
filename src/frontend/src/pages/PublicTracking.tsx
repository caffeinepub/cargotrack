import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Link } from "@tanstack/react-router";
import {
  Anchor,
  Globe,
  Loader2,
  MapPin,
  Package,
  Plane,
  Search,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { StatusBadge } from "../components/StatusBadge";
import { TrackingTimeline } from "../components/TrackingTimeline";
import {
  useBookingByAWBPublic,
  useTrackingByAWBPublic,
} from "../hooks/useLocalStore";
import { formatDate } from "../lib/helpers";

// ─── 3D Scene Components ────────────────────────────────────────────────────

function Globe3D() {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.12;
      meshRef.current.rotation.x = Math.sin(Date.now() * 0.0003) * 0.08;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y += delta * 0.12;
      wireRef.current.rotation.x = Math.sin(Date.now() * 0.0003) * 0.08;
    }
  });

  return (
    <group>
      {/* Solid inner globe */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshPhongMaterial
          color="#0a1628"
          emissive="#050e1e"
          emissiveIntensity={0.4}
          transparent
          opacity={0.9}
          shininess={60}
        />
      </mesh>
      {/* Wireframe overlay */}
      <mesh ref={wireRef}>
        <sphereGeometry args={[1.82, 20, 20]} />
        <meshBasicMaterial
          color="#00d4aa"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>
      {/* Outer glow ring */}
      <mesh>
        <sphereGeometry args={[1.95, 32, 32]} />
        <meshBasicMaterial
          color="#00b894"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// City dots on the globe surface
function CityDot({
  lat,
  lon,
  radius = 1.83,
}: {
  lat: number;
  lon: number;
  radius?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const position = useMemo<[number, number, number]>(() => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return [
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    ];
  }, [lat, lon, radius]);

  useFrame(() => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(Date.now() * 0.002 + lat) * 0.3;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.028, 8, 8]} />
      <meshBasicMaterial color="#ffd166" transparent opacity={0.9} />
    </mesh>
  );
}

// Cargo plane orbiting the globe
function CargoPlaneMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(0);

  useFrame((_, delta) => {
    angleRef.current += delta * 0.4;
    const angle = angleRef.current;
    const orbitRadius = 2.6;
    const tiltAngle = Math.PI / 6;

    if (groupRef.current) {
      const x = orbitRadius * Math.cos(angle);
      const y = orbitRadius * Math.sin(tiltAngle) * Math.sin(angle);
      const z = orbitRadius * Math.cos(tiltAngle) * Math.sin(angle);

      groupRef.current.position.set(x, y, z);

      const tangentX = -Math.sin(angle);
      const tangentY = Math.sin(tiltAngle) * Math.cos(angle);
      const tangentZ = Math.cos(tiltAngle) * Math.cos(angle);

      const lookTarget = new THREE.Vector3(
        x + tangentX * 0.1,
        y + tangentY * 0.1,
        z + tangentZ * 0.1,
      );
      groupRef.current.lookAt(lookTarget);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Fuselage */}
      <mesh>
        <cylinderGeometry args={[0.03, 0.04, 0.25, 8]} />
        <meshPhongMaterial
          color="#e8fff8"
          emissive="#00d4aa"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Left wing */}
      <mesh position={[0.12, 0, -0.02]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.22, 0.015, 0.06]} />
        <meshPhongMaterial
          color="#c8f0e8"
          emissive="#00b894"
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Right wing */}
      <mesh position={[-0.12, 0, -0.02]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.22, 0.015, 0.06]} />
        <meshPhongMaterial
          color="#c8f0e8"
          emissive="#00b894"
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Tail fin */}
      <mesh position={[0, 0.045, -0.11]}>
        <boxGeometry args={[0.015, 0.07, 0.06]} />
        <meshPhongMaterial
          color="#ffd166"
          emissive="#e5a820"
          emissiveIntensity={0.6}
        />
      </mesh>
      {/* Engine glow */}
      <mesh position={[0.09, -0.015, 0.01]}>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshBasicMaterial color="#ffd166" transparent opacity={0.85} />
      </mesh>
      <mesh position={[-0.09, -0.015, 0.01]}>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshBasicMaterial color="#ffd166" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

// Cargo ship orbiting in a different plane
function CargoShipMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(Math.PI); // start opposite side from plane

  useFrame((_, delta) => {
    angleRef.current += delta * 0.18; // slower than plane
    const angle = angleRef.current;
    const orbitRadius = 3.2;
    const tiltAngle = -Math.PI / 8; // nearly equatorial

    if (groupRef.current) {
      const x = orbitRadius * Math.cos(angle);
      const y = orbitRadius * Math.sin(tiltAngle) * Math.sin(angle);
      const z = orbitRadius * Math.cos(tiltAngle) * Math.sin(angle);
      groupRef.current.position.set(x, y, z);

      const tangentX = -Math.sin(angle);
      const tangentY = Math.sin(tiltAngle) * Math.cos(angle);
      const tangentZ = Math.cos(tiltAngle) * Math.cos(angle);
      const lookTarget = new THREE.Vector3(
        x + tangentX * 0.1,
        y + tangentY * 0.1,
        z + tangentZ * 0.1,
      );
      groupRef.current.lookAt(lookTarget);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Hull — flat wide box */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.38, 0.06, 0.14]} />
        <meshPhongMaterial
          color="#1a2a3a"
          emissive="#0d1a26"
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Superstructure (bridge) */}
      <mesh position={[0.08, 0.065, 0]}>
        <boxGeometry args={[0.09, 0.07, 0.1]} />
        <meshPhongMaterial
          color="#00b894"
          emissive="#008a70"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Cargo containers stack 1 */}
      <mesh position={[-0.06, 0.06, 0]}>
        <boxGeometry args={[0.1, 0.05, 0.1]} />
        <meshPhongMaterial
          color="#e05a20"
          emissive="#b03010"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Cargo containers stack 2 */}
      <mesh position={[-0.06, 0.11, 0]}>
        <boxGeometry args={[0.1, 0.05, 0.1]} />
        <meshPhongMaterial
          color="#ffd166"
          emissive="#c09030"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Bow point */}
      <mesh position={[-0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.04, 0.08, 6]} />
        <meshPhongMaterial
          color="#0d1a26"
          emissive="#060e18"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Wake glow */}
      <mesh position={[0.22, -0.02, 0]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshBasicMaterial color="#00d4aa" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

// Floating cargo box orbiting slowly
function CargoBoxMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(Math.PI / 2);

  useFrame((_, delta) => {
    angleRef.current += delta * 0.25;
    const angle = angleRef.current;
    const orbitRadius = 2.9;
    const tiltAngle = Math.PI / 2.5;

    if (groupRef.current) {
      const x = orbitRadius * Math.cos(angle);
      const y = orbitRadius * Math.sin(tiltAngle) * Math.sin(angle);
      const z = orbitRadius * Math.cos(tiltAngle) * Math.sin(angle);
      groupRef.current.position.set(x, y, z);
      // Gentle tumble
      groupRef.current.rotation.x += delta * 0.3;
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main crate */}
      <mesh>
        <boxGeometry args={[0.14, 0.12, 0.12]} />
        <meshPhongMaterial
          color="#c07830"
          emissive="#804820"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Strapping bands H */}
      <mesh position={[0, 0, 0.062]}>
        <boxGeometry args={[0.145, 0.015, 0.005]} />
        <meshPhongMaterial
          color="#ffd166"
          emissive="#c09030"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Strapping bands V */}
      <mesh position={[0, 0, 0.062]}>
        <boxGeometry args={[0.015, 0.125, 0.005]} />
        <meshPhongMaterial
          color="#ffd166"
          emissive="#c09030"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Glow dot */}
      <mesh position={[0.08, 0.07, 0]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshBasicMaterial color="#00d4aa" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// Floating particles around the globe
function FloatingParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, sizes] = useMemo(() => {
    const count = 120;
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 2.2 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      sz[i] = Math.random() * 0.03 + 0.01;
    }
    return [pos, sz];
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.0005;
      pointsRef.current.rotation.x += 0.0002;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        color="#00d4aa"
        size={0.04}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Arc route line between two globe points
function RouteArc({
  startLat,
  startLon,
  endLat,
  endLon,
  globeRadius = 1.85,
}: {
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  globeRadius?: number;
}) {
  const points = useMemo(() => {
    const latLonToVec = (lat: number, lon: number, r: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      );
    };

    const start = latLonToVec(startLat, startLon, globeRadius);
    const end = latLonToVec(endLat, endLon, globeRadius);
    const mid = start
      .clone()
      .add(end)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(globeRadius * 1.5);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(40);
  }, [startLat, startLon, endLat, endLon, globeRadius]);

  const lineObject = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: "#00d4aa",
      transparent: true,
      opacity: 0.45,
    });
    return new THREE.Line(geo, mat);
  }, [points]);

  useFrame(() => {
    if (lineObject) {
      (lineObject.material as THREE.LineBasicMaterial).opacity =
        0.3 + Math.sin(Date.now() * 0.001) * 0.25;
    }
  });

  return <primitive object={lineObject} />;
}

// Orbital ring around globe equator
function OrbitalRing() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.05;
      ringRef.current.rotation.x = Math.PI / 3;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
      <ringGeometry args={[2.4, 2.44, 64]} />
      <meshBasicMaterial
        color="#00d4aa"
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Main 3D scene inside Canvas
function Scene3D() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} color="#001a14" />
      <pointLight position={[5, 5, 5]} intensity={3} color="#00d4aa" />
      <pointLight position={[-5, -3, -5]} intensity={1.2} color="#ffd166" />
      <directionalLight position={[3, 4, 2]} intensity={1.4} color="#ffffff" />
      {/* Background stars */}
      <Stars
        radius={80}
        depth={50}
        count={4000}
        factor={3}
        saturation={0.3}
        fade
        speed={0.3}
      />
      {/* Globe */}
      <Globe3D />
      {/* City dots — major cargo hubs */}
      <CityDot lat={28.6} lon={77.2} /> {/* Delhi */}
      <CityDot lat={19.1} lon={72.9} /> {/* Mumbai */}
      <CityDot lat={10.2} lon={76.4} /> {/* Kochi */}
      <CityDot lat={51.5} lon={-0.1} /> {/* London */}
      <CityDot lat={40.7} lon={-74.0} /> {/* New York */}
      <CityDot lat={1.3} lon={103.8} /> {/* Singapore */}
      <CityDot lat={25.2} lon={55.3} /> {/* Dubai */}
      <CityDot lat={35.7} lon={139.7} /> {/* Tokyo */}
      <CityDot lat={-33.9} lon={151.2} /> {/* Sydney */}
      <CityDot lat={48.8} lon={2.3} /> {/* Paris */}
      {/* Shipping routes */}
      <RouteArc startLat={10.2} startLon={76.4} endLat={25.2} endLon={55.3} />
      <RouteArc startLat={25.2} startLon={55.3} endLat={51.5} endLon={-0.1} />
      <RouteArc startLat={19.1} startLon={72.9} endLat={1.3} endLon={103.8} />
      <RouteArc startLat={28.6} startLon={77.2} endLat={40.7} endLon={-74.0} />
      <RouteArc startLat={1.3} startLon={103.8} endLat={35.7} endLon={139.7} />
      {/* Cargo plane — orbits fast at tilt */}
      <CargoPlaneMesh />
      {/* Cargo ship — orbits slow near equator */}
      <CargoShipMesh />
      {/* Floating cargo box — tumbles slowly in polar orbit */}
      <CargoBoxMesh />
      {/* Floating particles */}
      <FloatingParticles />
      {/* Orbital ring */}
      <OrbitalRing />
      {/* Camera controls — auto rotate only */}
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.4}
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
      />
    </>
  );
}

// ─── Public Tracking Page ────────────────────────────────────────────────────

export function PublicTracking() {
  const [inputValue, setInputValue] = useState("");
  const [searchAWB, setSearchAWB] = useState<string | null>(null);

  const { booking, isLoading, notFound } = useBookingByAWBPublic(searchAWB);
  const { updates } = useTrackingByAWBPublic(booking?.awbNumber ?? null);

  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setSearchAWB(trimmed);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#080c14" }}
    >
      {/* Staff Login — top right */}
      <div className="fixed top-0 right-0 z-50 p-4">
        <Link to="/login">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/8 border border-white/12 hover:border-white/25 backdrop-blur-md transition-all"
            data-ocid="nav.link"
          >
            Staff Login
          </Button>
        </Link>
      </div>

      {/* ─── HERO WITH 3D CANVAS ──────────────────────────────────────────── */}
      <main className="flex-1">
        <section
          className="relative flex flex-col items-center justify-center overflow-hidden"
          style={{ minHeight: "100vh" }}
        >
          {/* 3D Canvas background */}
          <div className="absolute inset-0 z-0">
            <Canvas
              camera={{ position: [0, 0, 5], fov: 55 }}
              gl={{ alpha: true, antialias: true }}
              style={{ background: "transparent" }}
            >
              <Suspense fallback={null}>
                <Scene3D />
              </Suspense>
            </Canvas>
          </div>

          {/* Dark gradient overlay to frame content */}
          <div
            className="absolute inset-0 z-[1] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, rgba(8,12,20,0.5) 70%, rgba(8,12,20,0.92) 100%)",
            }}
          />

          {/* Bottom fade */}
          <div
            className="absolute bottom-0 left-0 right-0 h-40 z-[1] pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, transparent, #080c14)",
            }}
          />

          {/* Hero Content */}
          <div className="relative z-10 w-full max-w-2xl mx-auto text-center px-4 py-24">
            {/* Logo — original black logo shown with a subtle glow backdrop */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex justify-center mb-8"
            >
              <img
                src="/assets/uploads/20260305_152357_0000-removebg-preview-1.png"
                alt="Worldyfly Logistics"
                className="h-16 w-auto object-contain"
                style={{
                  filter:
                    "brightness(0) invert(1) drop-shadow(0 0 20px rgba(0,212,170,0.5))",
                }}
              />
            </motion.div>

            {/* Badge pill */}
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.45 }}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-6 backdrop-blur-sm"
              style={{
                borderColor: "rgba(0,212,170,0.4)",
                background: "rgba(0,212,170,0.12)",
                color: "#00d4aa",
              }}
            >
              <Globe className="h-3 w-3" />
              International Cargo &amp; Courier Tracking
            </motion.span>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.65 }}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-[1.1] tracking-tight"
            >
              Track Your Shipment{" "}
              <span
                className="relative inline-block"
                style={{ color: "#00d4aa" }}
              >
                Worldwide
                <span
                  className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(to right, #00d4aa, rgba(0,212,170,0.5), transparent)",
                  }}
                  aria-hidden="true"
                />
              </span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="text-white/55 mb-10 text-base sm:text-lg leading-relaxed"
            >
              Enter your AWB number below for real-time updates on your cargo.
            </motion.p>

            {/* Search card — glassmorphism */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.55,
                duration: 0.6,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="rounded-2xl p-2"
              style={{
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,212,170,0.1), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none"
                    style={{ color: "rgba(0,212,170,0.7)" }}
                  />
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Enter AWB number (e.g. WF-2026-00123)..."
                    className="h-14 pl-12 text-base border-0 bg-transparent shadow-none focus-visible:ring-0 placeholder:text-white/30"
                    style={{ color: "rgba(255,255,255,0.9)" }}
                    data-ocid="tracking.search_input"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !inputValue.trim()}
                  className="h-12 px-7 rounded-xl font-semibold text-base flex-shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #007a60, #00d4aa)",
                    color: "#ffffff",
                    boxShadow: "0 4px 16px rgba(0,212,170,0.4)",
                    border: "none",
                  }}
                  data-ocid="tracking.primary_button"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      <span>Track</span>
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.5 }}
              className="flex items-center justify-center gap-6 mt-8 flex-wrap"
            >
              {[
                { icon: Globe, label: "200+ Countries" },
                { icon: Plane, label: "Air Freight" },
                { icon: Anchor, label: "Sea Cargo" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  <Icon
                    className="h-3.5 w-3.5"
                    style={{ color: "rgba(0,212,170,0.7)" }}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── RESULTS ──────────────────────────────────────────────────────── */}
        <section
          className="max-w-3xl mx-auto px-4 py-14 relative"
          style={{ background: "#080c14" }}
        >
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 gap-4"
                data-ocid="tracking.loading_state"
              >
                <div className="relative">
                  <div
                    className="h-16 w-16 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: "rgba(0,212,170,0.2)" }}
                  >
                    <Loader2
                      className="h-7 w-7 animate-spin"
                      style={{ color: "#00d4aa" }}
                    />
                  </div>
                  <div
                    className="absolute inset-0 rounded-full border-2 animate-ping"
                    style={{ borderColor: "rgba(0,212,170,0.1)" }}
                  />
                </div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  Looking up your shipment…
                </p>
              </motion.div>
            )}

            {notFound && !isLoading && (
              <motion.div
                key="not-found"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                data-ocid="tracking.error_state"
              >
                <div
                  className="rounded-2xl border py-16 flex flex-col items-center text-center gap-5"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="relative">
                    <div
                      className="h-24 w-24 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                      <Package
                        className="h-12 w-12"
                        style={{ color: "rgba(255,255,255,0.2)" }}
                        strokeWidth={1.5}
                      />
                    </div>
                    <div
                      className="absolute -top-1 -right-1 h-7 w-7 rounded-full border flex items-center justify-center"
                      style={{
                        background: "rgba(239,68,68,0.15)",
                        borderColor: "rgba(239,68,68,0.25)",
                      }}
                    >
                      <span className="text-red-400 text-xs font-bold">?</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-white mb-2">
                      We couldn&apos;t find that shipment
                    </h3>
                    <p
                      className="text-sm leading-relaxed max-w-xs mx-auto"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      No shipment found for AWB{" "}
                      <strong
                        className="font-mono px-1.5 py-0.5 rounded text-xs"
                        style={{
                          color: "rgba(255,255,255,0.8)",
                          background: "rgba(255,255,255,0.08)",
                        }}
                      >
                        {searchAWB}
                      </strong>
                      . Please double-check the number and try again.
                    </p>
                  </div>
                  <p
                    className="text-xs max-w-xs"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    Tip: AWB numbers are case-sensitive. If you&apos;re still
                    having trouble, contact{" "}
                    <a
                      href="tel:+919526369141"
                      className="hover:underline"
                      style={{ color: "#00d4aa" }}
                    >
                      +91 95263 69141
                    </a>
                  </p>
                </div>
              </motion.div>
            )}

            {booking && !isLoading && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="space-y-6"
                data-ocid="tracking.success_state"
              >
                {/* ── Shipment Summary Card ──────────────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.5 }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(0,212,170,0.25)",
                    borderLeft: "4px solid #00d4aa",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 0 30px rgba(0,212,170,0.08)",
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      {/* AWB + Route */}
                      <div className="space-y-3">
                        <div>
                          <p
                            className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                            style={{ color: "rgba(0,212,170,0.85)" }}
                          >
                            AWB Number
                          </p>
                          {/* Shimmer AWB badge */}
                          <div
                            className="inline-block rounded-lg px-4 py-2 overflow-hidden relative"
                            style={{
                              background: "rgba(0,212,170,0.1)",
                              border: "1px solid rgba(0,212,170,0.25)",
                            }}
                          >
                            <span
                              className="font-mono text-2xl font-bold tracking-wide"
                              style={{ color: "#00d4aa" }}
                            >
                              {booking.awbNumber}
                            </span>
                            {/* Shimmer effect */}
                            <motion.span
                              className="absolute inset-0 pointer-events-none"
                              style={{
                                background:
                                  "linear-gradient(105deg, transparent 40%, rgba(0,212,170,0.18) 50%, transparent 60%)",
                              }}
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{
                                repeat: Number.POSITIVE_INFINITY,
                                repeatDelay: 2,
                                duration: 1.2,
                                ease: "easeInOut",
                              }}
                            />
                          </div>
                        </div>

                        {/* Route: Origin → Destination with animated dash */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <div
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <MapPin
                              className="h-3.5 w-3.5 flex-shrink-0"
                              style={{ color: "#00d4aa" }}
                            />
                            <span className="text-sm font-semibold text-white">
                              {booking.originCountry}
                            </span>
                          </div>

                          {/* Animated dashed line */}
                          <div
                            className="flex items-center gap-1"
                            style={{ color: "rgba(0,212,170,0.5)" }}
                          >
                            <motion.div
                              className="flex items-center gap-0.5"
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{
                                repeat: Number.POSITIVE_INFINITY,
                                duration: 2,
                                ease: "easeInOut",
                              }}
                            >
                              <div
                                className="h-px w-3"
                                style={{ background: "rgba(0,212,170,0.5)" }}
                              />
                              <span className="text-sm">✈️</span>
                              <div
                                className="h-px w-3"
                                style={{ background: "rgba(0,212,170,0.5)" }}
                              />
                            </motion.div>
                          </div>

                          <div
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                            style={{
                              background: "rgba(0,212,170,0.08)",
                              border: "1px solid rgba(0,212,170,0.25)",
                            }}
                          >
                            <Globe
                              className="h-3.5 w-3.5 flex-shrink-0"
                              style={{ color: "#00d4aa" }}
                            />
                            <span className="text-sm font-semibold text-white">
                              {booking.destinationCountry}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status badge with glow */}
                      <div
                        className="rounded-xl"
                        style={{
                          filter: "drop-shadow(0 0 8px rgba(0,212,170,0.3))",
                        }}
                      >
                        <StatusBadge
                          status={booking.status}
                          className="text-sm px-4 py-2 font-semibold"
                        />
                      </div>
                    </div>

                    {/* Info chips */}
                    <div className="grid grid-cols-2 gap-3 mt-5 mb-5">
                      {[
                        { label: "Shipper", value: booking.shipper.name },
                        { label: "Consignee", value: booking.consignee.name },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="rounded-xl p-3.5"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.07)",
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <User
                              className="h-3.5 w-3.5 flex-shrink-0"
                              style={{ color: "#00d4aa" }}
                            />
                            <p
                              className="text-[10px] font-semibold uppercase tracking-widest"
                              style={{ color: "rgba(255,255,255,0.4)" }}
                            >
                              {label}
                            </p>
                          </div>
                          <p className="font-semibold text-sm text-white truncate">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {booking.awbAssignedDate && (
                      <div
                        className="flex items-center gap-2 pt-4"
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        <div
                          className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                          style={{ background: "rgba(0,212,170,0.7)" }}
                        />
                        <p
                          className="text-xs"
                          style={{ color: "rgba(255,255,255,0.4)" }}
                        >
                          AWB Assigned:{" "}
                          <span
                            className="font-semibold"
                            style={{ color: "rgba(255,255,255,0.7)" }}
                          >
                            {formatDate(booking.awbAssignedDate)}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* ── Tracking Timeline Card ─────────────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="font-display text-xl font-bold text-white">
                          Tracking History
                        </h2>
                        <p
                          className="text-sm mt-0.5"
                          style={{ color: "rgba(255,255,255,0.4)" }}
                        >
                          {updates.length} update
                          {updates.length !== 1 ? "s" : ""} recorded
                        </p>
                      </div>
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center"
                        style={{
                          background: "rgba(0,212,170,0.1)",
                          border: "1px solid rgba(0,212,170,0.22)",
                        }}
                      >
                        <Plane
                          className="h-4 w-4"
                          style={{ color: "#00d4aa" }}
                        />
                      </div>
                    </div>

                    {updates.length === 0 ? (
                      <div
                        className="py-10 text-center space-y-3"
                        data-ocid="tracking.empty_state"
                      >
                        <div
                          className="h-12 w-12 rounded-full mx-auto flex items-center justify-center"
                          style={{ background: "rgba(255,255,255,0.05)" }}
                        >
                          <Package
                            className="h-6 w-6"
                            style={{ color: "rgba(255,255,255,0.2)" }}
                          />
                        </div>
                        <p
                          className="text-sm"
                          style={{ color: "rgba(255,255,255,0.35)" }}
                        >
                          Tracking updates will appear here once your shipment
                          is processed.
                        </p>
                      </div>
                    ) : (
                      <TrackingTimeline updates={updates} />
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
      <footer
        style={{
          background: "rgba(255,255,255,0.02)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/assets/uploads/20260305_152357_0000-removebg-preview-1.png"
                alt="Worldyfly Logistics"
                className="h-8 w-auto object-contain [filter:brightness(0)_invert(1)]"
              />
            </div>

            <div
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              <a
                href="https://www.worldyfly.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-link flex items-center gap-1.5 transition-colors"
              >
                <Globe className="h-3 w-3" />
                www.worldyfly.com
              </a>
            </div>
          </div>
        </div>

        <div
          className="py-4 px-4 text-center text-xs"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          © {new Date().getFullYear()} Worldyfly Logistics. &nbsp;
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="footer-caffeine-link hover:underline transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
