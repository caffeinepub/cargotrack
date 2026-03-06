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
import { createElement } from "react";
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

const MILESTONE_COLORS: Record<string, string> = {
  baggingDone: "#2ad4c0",
  customsClearanceAtOrigin: "#20c0ae",
  inTransit: "#1eaec0",
  reachedDestinationPort: "#1c9cb0",
  movedToWarehouse: "#1a8aa0",
  handoverToCarrier: "#1878a0",
  outForDelivery: "#2ad4c0",
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
      <div
        className="py-10 text-center"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        No tracking updates available yet.
      </div>
    );
  }

  // Sort by timestamp descending (latest first)
  const sorted = [...updates].sort((a, b) => Number(b.timestamp - a.timestamp));

  // Map milestone to order index
  const getMilestoneOrder = (milestone: string) => {
    const idx = MILESTONE_ORDER.indexOf(milestone);
    return idx === -1 ? 0 : idx;
  };

  const latestMilestoneOrder = getMilestoneOrder(sorted[0]?.milestone ?? "");

  // Progress bar: how far along the 7 milestones we are
  const progressPercent = Math.min(
    ((latestMilestoneOrder + 1) / MILESTONE_ORDER.length) * 100,
    100,
  );

  return (
    <div>
      {/* ── Horizontal milestone progress bar ── */}
      <div className="mb-8">
        {/* Step indicators */}
        <div className="flex items-center justify-between mb-3 gap-1">
          {MILESTONE_ORDER.map((milestone, idx) => {
            const isCompleted = idx <= latestMilestoneOrder;
            const isCurrent = idx === latestMilestoneOrder;
            const Icon = MILESTONE_ICONS[milestone] ?? CheckCircle2;
            return (
              <div
                key={milestone}
                className="flex flex-col items-center gap-1"
                style={{ flex: 1, minWidth: 0 }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className="rounded-full flex items-center justify-center transition-all"
                  style={{
                    width: isCurrent ? 32 : 24,
                    height: isCurrent ? 32 : 24,
                    background: isCompleted
                      ? `rgba(42,212,192,${isCurrent ? 0.2 : 0.12})`
                      : "rgba(255,255,255,0.05)",
                    border: isCompleted
                      ? isCurrent
                        ? "2px solid #2ad4c0"
                        : "1px solid rgba(42,212,192,0.5)"
                      : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: isCurrent
                      ? "0 0 12px rgba(42,212,192,0.4), 0 0 4px rgba(42,212,192,0.3)"
                      : "none",
                    flexShrink: 0,
                  }}
                >
                  {createElement(Icon, {
                    width: isCurrent ? 14 : 11,
                    height: isCurrent ? 14 : 11,
                    color: isCompleted ? "#2ad4c0" : "rgba(255,255,255,0.2)",
                  })}
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Progress rail */}
        <div
          className="relative h-1 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              background: "linear-gradient(to right, #1a8aa0, #2ad4c0)",
              boxShadow: "0 0 8px rgba(42,212,192,0.4)",
            }}
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </div>

        {/* Step labels — only show first and last on mobile */}
        <div className="flex items-center justify-between mt-2">
          <span
            className="text-[9px] uppercase tracking-wider"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Bagging
          </span>
          <span
            className="text-[9px] uppercase tracking-wider"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            Delivered
          </span>
        </div>
      </div>

      {/* ── Timeline list ── */}
      <div className={cn("relative", compact ? "space-y-0" : "")}>
        {sorted.map((update, idx) => {
          const Icon = MILESTONE_ICONS[update.milestone] ?? CheckCircle2;
          const isFirst = idx === 0;
          const isLast = idx === sorted.length - 1;
          const milestoneOrder = getMilestoneOrder(update.milestone);
          const isCompleted = milestoneOrder < latestMilestoneOrder;
          const accentColor = MILESTONE_COLORS[update.milestone] ?? "#2ad4c0";

          return (
            <motion.div
              key={`${update.milestone}-${update.timestamp.toString()}`}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: idx * 0.1,
                duration: 0.45,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className={cn("relative flex gap-5", compact ? "pb-5" : "pb-7")}
            >
              {/* Rail line */}
              {!isLast && (
                <div
                  className="absolute z-0"
                  style={{
                    left: compact ? "15px" : "19px",
                    top: compact ? "28px" : "36px",
                    bottom: 0,
                    width: "2px",
                    background: isFirst
                      ? `linear-gradient(to bottom, ${accentColor}, rgba(42,212,192,0.15))`
                      : "rgba(255,255,255,0.07)",
                  }}
                />
              )}

              {/* Icon node */}
              <div className="relative z-10 flex-shrink-0 flex flex-col items-center">
                <motion.div
                  className="flex items-center justify-center rounded-full transition-all"
                  style={{
                    width: compact ? 32 : 40,
                    height: compact ? 32 : 40,
                    background: isFirst
                      ? "rgba(42,212,192,0.15)"
                      : isCompleted
                        ? "rgba(42,212,192,0.08)"
                        : "rgba(255,255,255,0.04)",
                    border: isFirst
                      ? `2px solid ${accentColor}`
                      : isCompleted
                        ? "1px solid rgba(42,212,192,0.35)"
                        : "1px solid rgba(255,255,255,0.1)",
                    boxShadow: isFirst
                      ? "0 0 16px rgba(42,212,192,0.35), 0 0 6px rgba(42,212,192,0.2)"
                      : "none",
                  }}
                  animate={
                    isFirst
                      ? {
                          boxShadow: [
                            "0 0 0px rgba(42,212,192,0.35), 0 0 0px rgba(42,212,192,0.2)",
                            "0 0 20px rgba(42,212,192,0.5), 0 0 8px rgba(42,212,192,0.3)",
                            "0 0 0px rgba(42,212,192,0.35), 0 0 0px rgba(42,212,192,0.2)",
                          ],
                        }
                      : {}
                  }
                  transition={
                    isFirst
                      ? {
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 2.5,
                          ease: "easeInOut",
                        }
                      : {}
                  }
                >
                  {createElement(Icon, {
                    width: compact ? 14 : 17,
                    height: compact ? 14 : 17,
                    color: isFirst
                      ? accentColor
                      : isCompleted
                        ? "rgba(42,212,192,0.7)"
                        : "rgba(255,255,255,0.25)",
                  })}
                </motion.div>
              </div>

              {/* Content card */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div
                  className="rounded-xl p-4 transition-all"
                  style={{
                    background: isFirst
                      ? "rgba(42,212,192,0.05)"
                      : "rgba(255,255,255,0.03)",
                    border: isFirst
                      ? "1px solid rgba(42,212,192,0.18)"
                      : "1px solid rgba(255,255,255,0.06)",
                    borderLeft: isFirst
                      ? `3px solid ${accentColor}`
                      : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={cn(
                          "font-semibold leading-tight",
                          compact ? "text-sm" : "text-[15px]",
                        )}
                        style={{
                          color: isFirst
                            ? "rgba(255,255,255,0.95)"
                            : isCompleted
                              ? "rgba(255,255,255,0.7)"
                              : "rgba(255,255,255,0.4)",
                        }}
                      >
                        {MILESTONE_LABELS[update.milestone] ?? update.milestone}
                      </p>
                      {isFirst && (
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
                          style={{
                            background: "rgba(42,212,192,0.15)",
                            color: "#2ad4c0",
                            border: "1px solid rgba(42,212,192,0.25)",
                          }}
                        >
                          Latest
                        </span>
                      )}
                    </div>
                    <span
                      className={cn("whitespace-nowrap font-mono text-xs")}
                      style={{
                        color: isFirst
                          ? "rgba(42,212,192,0.75)"
                          : "rgba(255,255,255,0.3)",
                      }}
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
                      )}
                      style={{
                        color: isFirst
                          ? "rgba(255,255,255,0.6)"
                          : "rgba(255,255,255,0.35)",
                      }}
                    >
                      {update.notes}
                    </p>
                  )}

                  {/* Carrier info */}
                  {update.milestone === "handoverToCarrier" &&
                    update.carrierName && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            background: "rgba(42,212,192,0.1)",
                            color: "#2ad4c0",
                            border: "1px solid rgba(42,212,192,0.25)",
                          }}
                        >
                          <Truck className="h-3 w-3" />
                          {update.carrierName}
                        </span>
                        {update.carrierTrackingNumber && (
                          <span
                            className="text-xs font-mono px-2 py-0.5 rounded-md"
                            style={{
                              color: "rgba(255,255,255,0.5)",
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            #{update.carrierTrackingNumber}
                          </span>
                        )}
                        {update.carrierTrackingURL && (
                          <a
                            href={update.carrierTrackingURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all hover:text-primary hover:border-primary/40"
                            style={{
                              color: "rgba(255,255,255,0.6)",
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
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
    </div>
  );
}
