import { cn } from "@/lib/utils";
import {
  Anchor,
  CheckCircle2,
  ExternalLink,
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
      <div className="py-10 text-center text-muted-foreground">
        No tracking updates available yet.
      </div>
    );
  }

  // Sort by timestamp descending (latest first)
  const sorted = [...updates].sort((a, b) => Number(b.timestamp - a.timestamp));

  // Map milestone to order index for progress calculation
  const getMilestoneOrder = (milestone: string) => {
    const idx = MILESTONE_ORDER.indexOf(milestone);
    return idx === -1 ? 0 : idx;
  };

  const latestMilestoneOrder = getMilestoneOrder(sorted[0]?.milestone ?? "");

  return (
    <div className={cn("relative", compact ? "space-y-0" : "")}>
      {sorted.map((update, idx) => {
        const Icon = MILESTONE_ICONS[update.milestone] ?? CheckCircle2;
        const isFirst = idx === 0;
        const isLast = idx === sorted.length - 1;
        const milestoneOrder = getMilestoneOrder(update.milestone);
        const isCompleted = milestoneOrder < latestMilestoneOrder;

        return (
          <motion.div
            key={`${update.milestone}-${update.timestamp.toString()}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: idx * 0.1,
              duration: 0.45,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className={cn("relative flex gap-5", compact ? "pb-5" : "pb-8")}
          >
            {/* Gradient rail line */}
            {!isLast && (
              <div
                className={cn(
                  "absolute w-0.5 z-0 timeline-rail",
                  compact
                    ? "left-[15px] top-7 bottom-0"
                    : "left-[19px] top-10 bottom-0",
                )}
              />
            )}

            {/* Icon node */}
            <div className="relative z-10 flex-shrink-0 flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center rounded-full transition-all duration-300",
                  compact ? "h-8 w-8 border-2" : "h-10 w-10 border-2",
                  isFirst
                    ? "border-primary bg-primary text-primary-foreground animate-pulse-ring"
                    : isCompleted
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border bg-card text-muted-foreground",
                )}
              >
                <Icon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
              </div>
            </div>

            {/* Content */}
            <div
              className={cn(
                "flex-1 min-w-0 rounded-xl transition-all duration-200",
                compact ? "pt-0.5 pb-1" : "pt-0.5",
              )}
            >
              <div
                className={cn(
                  "rounded-xl p-4 border",
                  isFirst
                    ? "bg-primary/5 border-primary/20"
                    : isCompleted
                      ? "bg-muted/40 border-border/60"
                      : "bg-card/50 border-border/40",
                )}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={cn(
                        "font-semibold leading-tight",
                        compact ? "text-sm" : "text-[15px]",
                        isFirst
                          ? "text-foreground"
                          : isCompleted
                            ? "text-foreground/80"
                            : "text-muted-foreground",
                      )}
                    >
                      {MILESTONE_LABELS[update.milestone] ?? update.milestone}
                    </p>
                    {isFirst && (
                      <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary border border-primary/25">
                        Latest
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "whitespace-nowrap font-mono",
                      compact ? "text-xs" : "text-xs",
                      isFirst ? "text-primary/80" : "text-muted-foreground/70",
                    )}
                  >
                    {formatTimestamp(update.timestamp)}
                  </span>
                </div>

                {/* Notes */}
                {update.notes && (
                  <p
                    className={cn(
                      "mt-2 leading-relaxed italic",
                      compact ? "text-xs" : "text-sm",
                      isFirst
                        ? "text-foreground/70"
                        : "text-muted-foreground/80",
                    )}
                  >
                    {update.notes}
                  </p>
                )}

                {/* Carrier info */}
                {update.milestone === "handoverToCarrier" &&
                  update.carrierName && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        <Truck className="h-3 w-3" />
                        {update.carrierName}
                      </span>
                      {update.carrierTrackingNumber && (
                        <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-md border border-border/60">
                          #{update.carrierTrackingNumber}
                        </span>
                      )}
                      {update.carrierTrackingURL && (
                        <a
                          href={update.carrierTrackingURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-foreground/80 transition-all hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                        >
                          Track with carrier
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
