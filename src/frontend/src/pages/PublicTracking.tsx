import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Globe,
  Loader2,
  MapPin,
  Package2,
  Search,
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Package2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-foreground">
              CargoTrack
            </span>
          </div>
          <Link to="/login">
            <Button variant="outline" size="sm" data-ocid="nav.link">
              Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative bg-sidebar py-20 px-4 overflow-hidden">
          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.92 0.01 220) 1px, transparent 1px), linear-gradient(90deg, oklch(0.92 0.01 220) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="relative max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
                <Globe className="h-3 w-3" />
                International Cargo &amp; Courier Tracking
              </span>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-sidebar-foreground mb-4 leading-tight">
                Track Your Shipment
              </h1>
              <p className="text-sidebar-foreground/70 mb-8 text-lg">
                Enter your AWB number to get real-time updates on your cargo
              </p>

              {/* Search box */}
              <div className="flex gap-2 max-w-lg mx-auto">
                <div className="relative flex-1">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Enter AWB number..."
                    className="h-12 bg-card text-foreground border-border pl-4 text-base"
                    data-ocid="tracking.search_input"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !inputValue.trim()}
                  className="h-12 px-6 font-semibold"
                  data-ocid="tracking.primary_button"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Track</span>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Results */}
        <section className="max-w-3xl mx-auto px-4 py-12">
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-12"
                data-ocid="tracking.loading_state"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </motion.div>
            )}

            {notFound && !isLoading && (
              <motion.div
                key="not-found"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
                data-ocid="tracking.error_state"
              >
                <Package2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-display text-lg font-semibold mb-1">
                  Shipment Not Found
                </h3>
                <p className="text-muted-foreground text-sm">
                  No shipment found for AWB <strong>{searchAWB}</strong>. Please
                  check the number and try again.
                </p>
              </motion.div>
            )}

            {booking && !isLoading && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
                data-ocid="tracking.success_state"
              >
                {/* Shipment Summary Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                          AWB Number
                        </p>
                        <CardTitle className="font-display text-2xl">
                          {booking.awbNumber}
                        </CardTitle>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Origin
                        </p>
                        <p className="font-medium text-sm flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          {booking.originCountry}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Destination
                        </p>
                        <p className="font-medium text-sm flex items-center gap-1">
                          <ArrowRight className="h-3 w-3 text-primary" />
                          {booking.destinationCountry}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Shipper
                        </p>
                        <p className="font-medium text-sm">
                          {booking.shipper.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Consignee
                        </p>
                        <p className="font-medium text-sm">
                          {booking.consignee.name}
                        </p>
                      </div>
                    </div>
                    {booking.awbAssignedDate && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          AWB Assigned:{" "}
                          <span className="font-medium text-foreground">
                            {formatDate(booking.awbAssignedDate)}
                          </span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tracking Timeline Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-lg">
                      Tracking History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {updates.length === 0 ? (
                      <div
                        className="py-6 text-center text-muted-foreground text-sm"
                        data-ocid="tracking.empty_state"
                      >
                        Tracking updates will appear here once your shipment is
                        processed.
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

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
