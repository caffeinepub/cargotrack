/**
 * Excel (.xlsx) export utility for CargoTrack bookings
 * Uses SheetJS (xlsx) for styled output with auto-filter
 */

import * as XLSX from "xlsx";
import type { Booking } from "../backend.d";
import { TrackingMilestone } from "../backend.d";
import { formatDate } from "./helpers";
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

// ─── Export Function ──────────────────────────────────────────────────────────

/**
 * Exports an array of bookings to a styled .xlsx file and triggers download.
 * @param bookings - Array of Booking objects to export
 * @param label - Optional label for the filename (e.g. franchise name)
 */
export function exportBookingsToCSV(bookings: Booking[], label?: string): void {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const todayDisplay = today.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // ── Column headers ──────────────────────────────────────────────────────────
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
    "Freight",
    "Current Status",
  ];

  const NUM_COLS = HEADERS.length; // 11
  const LAST_COL_LETTER = "K"; // A..K for 11 columns

  // ── Data rows ───────────────────────────────────────────────────────────────
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
      booking.awbNumber ?? "—",
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

  // ── Build AOA (Array of Arrays) for worksheet ───────────────────────────────
  // Row 0 (index 0): Company header (will be merged)
  // Row 1 (index 1): Export date + label
  // Row 2 (index 2): blank
  // Row 3 (index 3): Column headers — auto-filter applied here
  // Row 4+ (index 4+): Data rows

  const labelText = label ? `Franchise: ${label}` : "All Franchises";

  const aoa: (string | number)[][] = [
    ["WORLDYFLY LOGISTICS - Bookings Export", ...Array(NUM_COLS - 1).fill("")],
    [
      `Generated: ${todayDisplay}   |   ${labelText}`,
      ...Array(NUM_COLS - 1).fill(""),
    ],
    Array(NUM_COLS).fill("") as string[],
    HEADERS,
    ...dataRows,
  ];

  // ── Create worksheet ────────────────────────────────────────────────────────
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Merge Row 1 (index 0) across all columns: A1:K1
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: NUM_COLS - 1 } }, // "WORLDYFLY LOGISTICS..."
    { s: { r: 1, c: 0 }, e: { r: 1, c: NUM_COLS - 1 } }, // "Generated: ..."
  ];

  // Set column widths
  ws["!cols"] = [
    { wch: 20 }, // AWB Number
    { wch: 12 }, // Booking ID
    { wch: 14 }, // Date
    { wch: 22 }, // Agent/Franchise
    { wch: 24 }, // Shipper Name
    { wch: 24 }, // Consignee Name
    { wch: 22 }, // Destination
    { wch: 10 }, // Total PCS
    { wch: 16 }, // Total Weight
    { wch: 14 }, // Freight
    { wch: 28 }, // Current Status
  ];

  // Enable auto-filter on header row (row index 3 = row 4 in Excel)
  ws["!autofilter"] = { ref: `A4:${LAST_COL_LETTER}4` };

  // ── Apply cell styles (SheetJS community edition supports limited styling) ──
  // Style row 1 (index 0): Company header — bold, larger font
  // biome-ignore lint/complexity/useLiteralKeys: SheetJS worksheet uses string-keyed cell addresses
  const headerCell = ws["A1"];
  if (headerCell) {
    headerCell.s = {
      font: { bold: true, sz: 14, color: { rgb: "003366" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  // Style row 2 (index 1): Generated line
  // biome-ignore lint/complexity/useLiteralKeys: SheetJS worksheet uses string-keyed cell addresses
  const generatedCell = ws["A2"];
  if (generatedCell) {
    generatedCell.s = {
      font: { italic: true, sz: 10, color: { rgb: "555555" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  // Style column headers (row index 3 = A4..K4)
  for (let c = 0; c < NUM_COLS; c++) {
    const addr = XLSX.utils.encode_cell({ r: 3, c });
    if (ws[addr]) {
      ws[addr].s = {
        font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "003366" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "FFFFFF" } },
          bottom: { style: "thin", color: { rgb: "FFFFFF" } },
          left: { style: "thin", color: { rgb: "FFFFFF" } },
          right: { style: "thin", color: { rgb: "FFFFFF" } },
        },
      };
    }
  }

  // Style data rows with alternating background
  for (let r = 4; r < 4 + dataRows.length; r++) {
    const isEven = (r - 4) % 2 === 0;
    for (let c = 0; c < NUM_COLS; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (ws[addr]) {
        ws[addr].s = {
          fill: { fgColor: { rgb: isEven ? "FFFFFF" : "EEF4FB" } },
          alignment: { vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } },
          },
        };
      }
    }
  }

  // Set row heights
  ws["!rows"] = [
    { hpt: 28 }, // Row 1: company header
    { hpt: 18 }, // Row 2: generated date
    { hpt: 6 }, // Row 3: blank
    { hpt: 22 }, // Row 4: column headers
  ];

  // ── Create workbook ─────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bookings");

  // ── Trigger download ────────────────────────────────────────────────────────
  const labelPart = label ? `-${label.toLowerCase().replace(/\s+/g, "-")}` : "";
  const filename = `bookings-export${labelPart}-${todayStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}
