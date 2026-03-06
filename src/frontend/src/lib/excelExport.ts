/**
 * CSV/Excel export utility for CargoTrack bookings
 * Uses pure CSV with BOM for Excel compatibility (no xlsx dependency required)
 */

import type { Booking } from "../backend.d";
import { TrackingMilestone } from "../backend.d";
import { formatDate } from "./helpers";
import type { StoredExpense, StoredIncomeEntry } from "./store";
import { getChargesByBooking, getTrackingByAWB } from "./store";

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

// ─── CSV Helpers ──────────────────────────────────────────────────────────────

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // If value contains comma, newline, or double-quote, wrap in quotes
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCSV(row: (string | number | null | undefined)[]): string {
  return row.map(escapeCSV).join(",");
}

function downloadCSV(csvContent: string, filename: string): void {
  // UTF-8 BOM for Excel compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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
 * Returns the freight charge amount for a given booking.
 */
function getFreightAmount(bookingId: string): number {
  const charges = getChargesByBooking(bookingId);
  return charges.find((c) => c.label === "Freight")?.amount ?? 0;
}

// ─── Bookings Export ──────────────────────────────────────────────────────────

/**
 * Exports an array of bookings to a .csv file and triggers download.
 * @param bookings - Array of Booking objects to export
 * @param label - Optional label for the filename (e.g. franchise name)
 */
export function exportBookingsToCSV(bookings: Booking[], label?: string): void {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayDisplay = today.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const labelText = label ? `Franchise: ${label}` : "All Franchises";

  const HEADERS = [
    "AWB Number",
    "Booking ID",
    "Date",
    "Agent/Franchise",
    "Shipper Name",
    "Consignee Name",
    "Destination",
    "Total PCS",
    "Total Weight (kg)",
    "Freight (INR)",
    "Current Status",
  ];

  const dataRows = bookings.map((booking) => {
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
    const freight = getFreightAmount(booking.bookingId.toString());

    return [
      booking.awbNumber ?? "",
      `#${booking.bookingId.toString()}`,
      date,
      booking.createdBy,
      booking.shipper.name,
      booking.consignee.name,
      booking.destinationCountry,
      totalPcs,
      Number(totalWeight.toFixed(2)),
      freight,
      status,
    ];
  });

  const lines: string[] = [
    "WORLDYFLY LOGISTICS - Bookings Export",
    `Generated: ${todayDisplay} | ${labelText}`,
    "",
    rowToCSV(HEADERS),
    ...dataRows.map(rowToCSV),
  ];

  const labelPart = label ? `-${label.toLowerCase().replace(/\s+/g, "-")}` : "";
  downloadCSV(lines.join("\n"), `bookings-export${labelPart}-${todayStr}.csv`);
}

// ─── Statement Export ─────────────────────────────────────────────────────────

export interface StatementRow {
  date: string;
  description: string;
  awb: string;
  debit: number; // invoice raised
  credit: number; // payment received
  balance: number; // running balance
}

export function exportStatement(
  rows: StatementRow[],
  franchiseName?: string,
): void {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayDisplay = today.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const labelText = franchiseName
    ? `Franchise: ${franchiseName}`
    : "All Franchises";

  const HEADERS = [
    "Date",
    "Description",
    "AWB / Ref",
    "Debit (INR)",
    "Credit (INR)",
    "Balance (INR)",
  ];

  const dataRows = rows.map((r) => [
    r.date,
    r.description,
    r.awb,
    r.debit > 0 ? r.debit : "",
    r.credit > 0 ? r.credit : "",
    r.balance,
  ]);

  // Totals row
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const netBalance = totalDebit - totalCredit;

  const lines: string[] = [
    "WORLDYFLY LOGISTICS - Account Statement",
    `Generated: ${todayDisplay} | ${labelText}`,
    "",
    rowToCSV(HEADERS),
    ...dataRows.map(rowToCSV),
    "",
    rowToCSV(["TOTALS", "", "", totalDebit, totalCredit, netBalance]),
  ];

  const labelPart = franchiseName
    ? `-${franchiseName.toLowerCase().replace(/\s+/g, "-")}`
    : "";
  downloadCSV(lines.join("\n"), `statement${labelPart}-${todayStr}.csv`);
}

// ─── Expenses Export ──────────────────────────────────────────────────────────

export function exportExpenses(expenses: StoredExpense[]): void {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayDisplay = today.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const HEADERS = ["Date", "Category", "Description", "Amount (INR)"];
  const dataRows = expenses.map((e) => [
    e.date,
    e.category,
    e.description,
    e.amount,
  ]);
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const lines: string[] = [
    "WORLDYFLY LOGISTICS - Expense Report",
    `Generated: ${todayDisplay}`,
    "",
    rowToCSV(HEADERS),
    ...dataRows.map(rowToCSV),
    "",
    rowToCSV(["", "", "TOTAL", total]),
  ];

  downloadCSV(lines.join("\n"), `expenses-${todayStr}.csv`);
}

// ─── Income Export ────────────────────────────────────────────────────────────

export function exportIncome(entries: StoredIncomeEntry[]): void {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayDisplay = today.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const HEADERS = ["Date", "Source", "Description", "Amount (INR)"];
  const dataRows = entries.map((e) => [
    e.date,
    e.source,
    e.description,
    e.amount,
  ]);
  const total = entries.reduce((s, e) => s + e.amount, 0);

  const lines: string[] = [
    "WORLDYFLY LOGISTICS - Income Report",
    `Generated: ${todayDisplay}`,
    "",
    rowToCSV(HEADERS),
    ...dataRows.map(rowToCSV),
    "",
    rowToCSV(["", "", "TOTAL", total]),
  ];

  downloadCSV(lines.join("\n"), `income-${todayStr}.csv`);
}
