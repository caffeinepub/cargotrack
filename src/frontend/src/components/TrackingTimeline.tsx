import { cn } from "@/lib/utils";
import {
  Anchor,
  CheckCircle2,
  MapPin,
  Package,
  Plane,
  ShieldCheck,
  Truck,
  Warehouse,
} from "lucide-react";
import { motion } from "motion/react";
import type { TrackingUpdate } from "../backend.d";
import { MILESTONE_LABELS, MILESTONE_ORDER } from "../lib/constants";
import { formatTimestamp } from "../lib/helpers";

const MILESTONE_ICONS: Record<string, React.ElementType> = {
  baggingDone: Package,
  customsClearanceAtOrigin: ShieldCheck,
  inTransit: Plane,
  reachedDestinationPort: Anchor,
  movedToWarehouse: Warehouse,
  handoverToCarrier: Truck,
  outForDelivery: MapPin,
};

interface TrackingTimelineProps {
  updates: TrackingUpdate[];
  compact?: boolean;
}

export function TrackingTimeline({
  updates,
  compact = false,
}: TrackingTimelineProps) {
  if (updates.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No tracking updates available yet.
      </div>
    );
  }

  // Sort by timestamp descending (latest first)
  const sorted = [...updates].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div className="relative">
      {sorted.map((update, idx) => {
        const Icon = MILESTONE_ICONS[update.milestone] ?? CheckCircle2;
        const isFirst = idx === 0;

        return (
          <motion.div
            key={`${update.milestone}-${update.timestamp.toString()}`}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            className={cn("relative flex gap-4", compact ? "pb-4" : "pb-6")}
          >
            {/* Vertical line */}
            {idx < sorted.length - 1 && (
              <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
            )}

            {/* Icon node */}
            <div
              className={cn(
                "relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isFirst
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <p
                  className={cn(
                    "font-semibold leading-tight",
                    compact ? "text-sm" : "text-base",
                    isFirst ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {MILESTONE_LABELS[update.milestone] ?? update.milestone}
                </p>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(update.timestamp)}
                </span>
              </div>

              {update.notes && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {update.notes}
                </p>
              )}

              {update.milestone === "handoverToCarrier" &&
                update.carrierName && (
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <span className="font-medium">{update.carrierName}</span>
                    {update.carrierTrackingNumber && (
                      <span className="text-muted-foreground">
                        #{update.carrierTrackingNumber}
                      </span>
                    )}
                    {update.carrierTrackingURL && (
                      <a
                        href={update.carrierTrackingURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-4 hover:opacity-80"
                      >
                        Track with carrier →
                      </a>
                    )}
                  </div>
                )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
