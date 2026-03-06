import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useLocalSession } from "../hooks/useLocalStore";

export function LoginPage() {
  const { login, isAuthenticated, isAdmin, session } = useLocalSession();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && session) {
      if (isAdmin) {
        void navigate({ to: "/admin/dashboard" });
      } else {
        void navigate({ to: "/franchise/bookings" });
      }
    }
  }, [isAuthenticated, isAdmin, session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Small delay for UX
    await new Promise((r) => setTimeout(r, 400));

    const success = login(username.trim(), password);
    if (!success) {
      setError("Invalid username or password. Please try again.");
      setIsLoading(false);
      return;
    }

    // Navigation happens via the useEffect above
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sidebar relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.92 0.01 220) 1px, transparent 1px), linear-gradient(90deg, oklch(0.92 0.01 220) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Decorative glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/assets/uploads/20260305_152357_0000-removebg-preview-1.png"
            alt="Worldyfly Logistics"
            className="h-20 w-auto object-contain mb-2 [filter:brightness(0)_invert(1)]"
          />
          <p className="text-sidebar-foreground/60 text-sm mt-1">
            Cargo &amp; Courier Management
          </p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-display text-xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
                  data-ocid="login.error_state"
                >
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError(null);
                    }}
                    className="pl-9 h-11"
                    autoComplete="username"
                    data-ocid="login.username.input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className="pl-9 pr-10 h-11"
                    autoComplete="current-password"
                    data-ocid="login.password.input"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 font-semibold"
                data-ocid="login.primary_button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="rounded-lg bg-muted px-4 py-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Admin:</strong> username{" "}
                  <code className="font-mono bg-background px-1 rounded">
                    admin
                  </code>{" "}
                  / password{" "}
                  <code className="font-mono bg-background px-1 rounded">
                    admin123
                  </code>
                  <br />
                  <strong>Franchise:</strong> use credentials created by admin
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-sidebar-foreground/50 mt-6">
          <a
            href="/"
            className="hover:text-sidebar-foreground/80 transition-colors"
          >
            ← Back to public tracking
          </a>
        </p>
      </motion.div>
    </div>
  );
}
