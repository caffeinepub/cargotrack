import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";
import {
  Anchor,
  ArrowRight,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Plane,
  Search,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { TrackingTimeline } from "../components/TrackingTimeline";
import {
  useBookingByAWBPublic,
  useTrackingByAWBPublic,
} from "../hooks/useLocalStore";
import { formatDate } from "../lib/helpers";

// Decorative background SVG elements
function DecorativePlane({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 60 L70 10 L80 30 L50 50 L110 40 L100 60 L50 70 L60 110 L40 100 L30 70 Z"
        fill="currentColor"
        opacity="0.4"
      />
    </svg>
  );
}

function DecorativeGlobe({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="100"
        cy="100"
        r="90"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.3"
      />
      <ellipse
        cx="100"
        cy="100"
        rx="50"
        ry="90"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.2"
      />
      <ellipse
        cx="100"
        cy="100"
        rx="90"
        ry="35"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.2"
      />
      <line
        x1="10"
        y1="100"
        x2="190"
        y2="100"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.15"
      />
      <line
        x1="100"
        y1="10"
        x2="100"
        y2="190"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.15"
      />
    </svg>
  );
}

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
    <div className="min-h-screen flex flex-col bg-background font-body">
      {/* Sticky top login bar */}
      <div className="fixed top-0 right-0 z-50 p-4">
        <Link to="/login">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10 border border-white/15 hover:border-white/30 backdrop-blur-sm transition-all"
            data-ocid="nav.link"
          >
            Staff Login
          </Button>
        </Link>
      </div>

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="relative tracking-hero-bg min-h-[520px] flex flex-col items-center justify-center px-4 py-24 overflow-hidden">
          {/* Grid overlay */}
          <div className="absolute inset-0 tracking-hero-grid pointer-events-none" />
          {/* Radial glow */}
          <div className="absolute inset-0 tracking-hero-radial pointer-events-none" />

          {/* Decorative plane — top right */}
          <DecorativePlane className="absolute top-8 right-[5%] w-28 h-28 text-primary opacity-[0.06] rotate-12 pointer-events-none" />
          {/* Decorative globe — bottom left */}
          <DecorativeGlobe className="absolute -bottom-10 -left-8 w-56 h-56 text-primary opacity-[0.07] pointer-events-none" />
          {/* Secondary globe — top left */}
          <DecorativeGlobe className="absolute -top-16 right-[15%] w-72 h-72 text-white opacity-[0.04] pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <img
                  src="/assets/uploads/20260305_152357_0000-1.png"
                  alt="Worldyfly Logistics"
                  className="h-16 w-auto object-contain drop-shadow-2xl"
                />
              </div>

              {/* Badge pill */}
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary uppercase tracking-widest mb-6 backdrop-blur-sm"
              >
                <Globe className="h-3 w-3" />
                International Cargo &amp; Courier Tracking
              </motion.span>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-[1.1] tracking-tight"
              >
                Track Your Shipment{" "}
                <span className="relative inline-block">
                  <span className="text-primary">Worldwide</span>
                  <span
                    className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-primary via-primary/80 to-transparent"
                    aria-hidden="true"
                  />
                </span>
              </motion.h1>

              {/* Sub-headline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="text-white/60 mb-10 text-base sm:text-lg leading-relaxed"
              >
                Enter your AWB number below for real-time updates on your cargo.
              </motion.p>

              {/* Search card */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.45,
                  duration: 0.55,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="bg-white rounded-2xl p-2 search-card-shadow"
              >
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Enter AWB number (e.g. WF-2026-00123)..."
                      className="h-14 pl-12 text-foreground text-base border-0 bg-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
                      data-ocid="tracking.search_input"
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={isLoading || !inputValue.trim()}
                    className="h-12 px-6 rounded-xl font-semibold text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
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
                transition={{ delay: 0.65, duration: 0.5 }}
                className="flex items-center justify-center gap-6 mt-8 flex-wrap"
              >
                {[
                  { icon: Globe, label: "200+ Countries" },
                  { icon: Plane, label: "Air Freight" },
                  { icon: Anchor, label: "Sea Cargo" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 text-white/40 text-xs"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ─── RESULTS ─────────────────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 py-14 relative">
          {/* Subtle top fade from hero */}
          <div className="pointer-events-none absolute -top-8 left-0 right-0 h-16 bg-gradient-to-b from-sidebar/5 to-transparent" />
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
                  <div className="h-16 w-16 rounded-full border-2 border-primary/20 flex items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-ping" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">
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
                <Card className="border-border/60 premium-card-shadow overflow-hidden">
                  <CardContent className="py-16 flex flex-col items-center text-center gap-5">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full bg-muted/60 flex items-center justify-center">
                        <Package
                          className="h-12 w-12 text-muted-foreground/50"
                          strokeWidth={1.5}
                        />
                      </div>
                      <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-destructive/15 border border-destructive/25 flex items-center justify-center">
                        <span className="text-destructive text-xs font-bold">
                          ?
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-foreground mb-2">
                        We couldn't find that shipment
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                        No shipment found for AWB{" "}
                        <strong className="font-mono text-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded text-xs">
                          {searchAWB}
                        </strong>
                        . Please double-check the number and try again.
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground/60 max-w-xs">
                      Tip: AWB numbers are case-sensitive. If you're still
                      having trouble, contact{" "}
                      <a
                        href="tel:+919526369141"
                        className="text-primary hover:underline"
                      >
                        +91 95263 69141
                      </a>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {booking && !isLoading && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="space-y-6"
                data-ocid="tracking.success_state"
              >
                {/* ── Shipment Summary Card ────────────────────────────────── */}
                <Card className="border-l-4 border-l-primary border-border/60 premium-card-shadow overflow-hidden">
                  <CardHeader className="pb-4 pt-6 px-6">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      {/* AWB + Route */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-1.5">
                            AWB Number
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-2xl font-bold text-foreground tracking-wide">
                              {booking.awbNumber}
                            </span>
                          </div>
                        </div>

                        {/* Route: Origin → Destination */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5 border border-border/60">
                            <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span className="text-sm font-semibold text-foreground">
                              {booking.originCountry}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground/40">
                            <div className="h-px w-4 bg-current" />
                            <ArrowRight className="h-3.5 w-3.5" />
                            <div className="h-px w-4 bg-current" />
                          </div>
                          <div className="flex items-center gap-1.5 rounded-lg bg-primary/5 px-3 py-1.5 border border-primary/20">
                            <Globe className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span className="text-sm font-semibold text-foreground">
                              {booking.destinationCountry}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status badge */}
                      <StatusBadge
                        status={booking.status}
                        className="text-sm px-4 py-2 font-semibold"
                      />
                    </div>
                  </CardHeader>

                  <CardContent className="px-6 pb-6">
                    {/* Info chips */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <User className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                            Shipper
                          </p>
                        </div>
                        <p className="font-semibold text-sm text-foreground truncate">
                          {booking.shipper.name}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <User className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                            Consignee
                          </p>
                        </div>
                        <p className="font-semibold text-sm text-foreground truncate">
                          {booking.consignee.name}
                        </p>
                      </div>
                    </div>

                    {booking.awbAssignedDate && (
                      <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          AWB Assigned:{" "}
                          <span className="font-semibold text-foreground/80">
                            {formatDate(booking.awbAssignedDate)}
                          </span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ── Tracking Timeline Card ──────────────────────────────── */}
                <Card className="border-border/60 premium-card-shadow overflow-hidden">
                  <CardHeader className="pb-2 pt-6 px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-display text-xl font-bold">
                          Tracking History
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {updates.length} update
                          {updates.length !== 1 ? "s" : ""} recorded
                        </p>
                      </div>
                      <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Plane className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 pt-4">
                    {updates.length === 0 ? (
                      <div
                        className="py-10 text-center space-y-3"
                        data-ocid="tracking.empty_state"
                      >
                        <div className="h-12 w-12 rounded-full bg-muted/60 mx-auto flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Tracking updates will appear here once your shipment
                          is processed.
                        </p>
                      </div>
                    ) : (
                      <TrackingTimeline updates={updates} />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card/60 backdrop-blur-sm">
        {/* Company info strip */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Logo + name */}
            <div className="flex items-center gap-3">
              <img
                src="/assets/uploads/20260305_152357_0000-1.png"
                alt="Worldyfly Logistics"
                className="h-8 w-auto object-contain opacity-80"
              />
            </div>

            {/* Contact details */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <a
                href="tel:+919526369141"
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Phone className="h-3 w-3" />
                +91 95263 69141
              </a>
              <a
                href="mailto:info@worldyfly.com"
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Mail className="h-3 w-3" />
                info@worldyfly.com
              </a>
              <a
                href="https://www.worldyfly.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Globe className="h-3 w-3" />
                www.worldyfly.com
              </a>
            </div>
          </div>
        </div>

        {/* Caffeine credit */}
        <div className="border-t border-border/50 py-4 px-4 text-center">
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} Worldyfly Logistics. &nbsp;
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="hover:text-muted-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Built with ❤️ using caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
