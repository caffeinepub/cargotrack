/**
 * CSV export utility for CargoTrack bookings
 * Uses plain CSV (no external dependencies)
 */

import type { Booking } from "../backend.d";
import { TrackingMilestone } from "../backend.d";
import { formatDate } from "./helpers";
import { getTrackingByAWB } from "./store";

// ─── Milestone Label Map ──────────────────────────────────────────────────────

const MILESTONE_LABELS: Record<TrackingMilestone, string> = {
  [TrackingMilestone.baggingDone]: "Bagging Done",
  [TrackingMilestone.customsClearanceAtOrigin]: "Customs Clearance at Origin",
  [TrackingMilestone.inTransit]: "In Transit",
  [TrackingMilestone.reachedDestinationPort]: "Reached Destination Port",
  [TrackingMilestone.movedToWarehouse]: "Moved to Warehouse",
  [TrackingMilestone.handoverToCarrier]: "Handover to Carrier",
  [TrackingMilestone.outForDelivery]: "Out for Delivery",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the latest tracking milestone label for a given AWB number.
 * Falls back to "Pending" if no AWB or no tracking updates found.
 */
export function getLatestStatus(awbNumber: string | undefined): string {
  if (!awbNumber) return "Pending";
  const tracking = getTrackingByAWB(awbNumber);
  if (tracking.length === 0) return "Pending";

  // Sort by timestamp descending (most recent first)
  const sorted = [...tracking].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp),
  );
  const latest = sorted[0];
  return MILESTONE_LABELS[latest.milestone] ?? latest.milestone;
}

/**
 * Wraps a string value in double quotes, escaping any existing double quotes.
 */
function csvCell(value: string | number): string {
  const str = String(value);
  // Escape double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

// ─── Export Function ──────────────────────────────────────────────────────────

/**
 * Exports an array of bookings to a CSV file and triggers download.
 * @param bookings - Array of Booking objects to export
 * @param label - Optional label for the filename (e.g. franchise name)
 */
export function exportBookingsToCSV(bookings: Booking[], label?: string): void {
  const headers = [
    "AWB Number",
    "Booking ID",
    "Date",
    "Agent/Franchise",
    "Shipper Name",
    "Consignee Name",
    "Total PCS",
    "Total Weight (kg)",
    "Current Status",
  ];

  const rows = bookings.map((booking) => {
    const totalPcs = booking.boxItems.reduce(
      (sum, item) => sum + Number(item.quantity),
      0,
    );
    const totalWeight = booking.boxes.reduce(
      (sum, box) => sum + box.grossWeight,
      0,
    );
    const status = getLatestStatus(booking.awbNumber);
    const date = formatDate(booking.createdTimestamp);

    return [
      csvCell(booking.awbNumber ?? "—"),
      csvCell(`#${booking.bookingId.toString()}`),
      csvCell(date),
      csvCell(booking.createdBy),
      csvCell(booking.shipper.name),
      csvCell(booking.consignee.name),
      csvCell(totalPcs),
      csvCell(totalWeight.toFixed(2)),
      csvCell(status),
    ].join(",");
  });

  const csvContent = [headers.map(csvCell).join(","), ...rows].join("\n");

  // Build filename
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const labelPart = label ? `-${label.toLowerCase().replace(/\s+/g, "-")}` : "";
  const filename = `bookings-export${labelPart}-${today}.csv`;

  // Trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
