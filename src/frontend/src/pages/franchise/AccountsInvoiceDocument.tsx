import type { Booking } from "../../backend.d";
import { getChargesByBooking } from "../../lib/store";

const COMPANY = {
  name: "WORLDYFLY",
  tagline: "International Courier & Cargo Services",
  address1: "11/423H, Second Floor, St Joseph Building,",
  address2: "Akapparambu Junction, Opposite Cochin International Airport,",
  address3: "Nedumbasserry - 686583, Kerala, India",
  phone: "+91 95263 69141",
  email: "info@worldyfly.com",
  website: "www.worldyfly.com",
};

// ─── Number to Words ──────────────────────────────────────────────────────────

function numberToWords(n: number): string {
  const ones = [
    "",
    "ONE",
    "TWO",
    "THREE",
    "FOUR",
    "FIVE",
    "SIX",
    "SEVEN",
    "EIGHT",
    "NINE",
    "TEN",
    "ELEVEN",
    "TWELVE",
    "THIRTEEN",
    "FOURTEEN",
    "FIFTEEN",
    "SIXTEEN",
    "SEVENTEEN",
    "EIGHTEEN",
    "NINETEEN",
  ];
  const tens = [
    "",
    "",
    "TWENTY",
    "THIRTY",
    "FORTY",
    "FIFTY",
    "SIXTY",
    "SEVENTY",
    "EIGHTY",
    "NINETY",
  ];

  if (n === 0) return "ZERO";
  if (n < 0) return `MINUS ${numberToWords(-n)}`;

  const whole = Math.floor(n);
  const dec = Math.round((n - whole) * 100);

  function convert(num: number): string {
    if (num === 0) return "";
    if (num < 20) return `${ones[num]} `;
    if (num < 100)
      return `${tens[Math.floor(num / 10)]} ${num % 10 ? `${ones[num % 10]} ` : ""}`;
    if (num < 1000)
      return `${ones[Math.floor(num / 100)]} HUNDRED ${convert(num % 100)}`;
    if (num < 100000)
      return `${convert(Math.floor(num / 1000))}THOUSAND ${convert(num % 1000)}`;
    if (num < 10000000)
      return `${convert(Math.floor(num / 100000))}LAKH ${convert(num % 100000)}`;
    return `${convert(Math.floor(num / 10000000))}CRORE ${convert(num % 10000000)}`;
  }

  let result = convert(whole).trim();
  if (dec > 0) result += ` AND ${convert(dec).trim()} PAISE`;
  return `${result} ONLY`;
}

// ─── Franchise Name Lookup ────────────────────────────────────────────────────

function getFranchiseName(franchiseId: string): string {
  try {
    const raw = localStorage.getItem("cargotrack_franchises");
    if (!raw) return franchiseId === "admin" ? "Admin (Direct)" : franchiseId;
    const franchises = JSON.parse(raw) as Array<{
      franchiseId: string;
      franchiseName: string;
      username: string;
      contactPhone?: string;
      contactEmail?: string;
    }>;
    // createdBy stores either franchiseId or username (for admin it's "admin")
    const found =
      franchises.find((f) => f.franchiseId === franchiseId) ??
      franchises.find((f) => f.username === franchiseId);
    return (
      found?.franchiseName ??
      (franchiseId === "admin" ? "Admin (Direct)" : franchiseId)
    );
  } catch {
    return franchiseId;
  }
}

function getFranchiseDetails(franchiseId: string): {
  name: string;
  phone: string;
  email: string;
} {
  try {
    const raw = localStorage.getItem("cargotrack_franchises");
    if (!raw)
      return { name: getFranchiseName(franchiseId), phone: "", email: "" };
    const franchises = JSON.parse(raw) as Array<{
      franchiseId: string;
      franchiseName: string;
      username: string;
      contactPhone?: string;
      contactEmail?: string;
    }>;
    const found =
      franchises.find((f) => f.franchiseId === franchiseId) ??
      franchises.find((f) => f.username === franchiseId);
    return {
      name:
        found?.franchiseName ??
        (franchiseId === "admin" ? "Admin (Direct)" : franchiseId),
      phone: found?.contactPhone ?? "",
      email: found?.contactEmail ?? "",
    };
  } catch {
    return { name: getFranchiseName(franchiseId), phone: "", email: "" };
  }
}

// ─── Format Date ──────────────────────────────────────────────────────────────

function formatDateDMY(ts: bigint): string {
  // ts is nanoseconds
  const ms = Number(ts / 1_000_000n);
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ACCENT = "#003366";
const ACCENT_LIGHT = "#e8f0fa";
const BORDER = "#b0bfcf";

const cellStyle: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  padding: "6px 10px",
  fontSize: "11px",
  verticalAlign: "top",
};

const labelStyle: React.CSSProperties = {
  fontSize: "8px",
  fontWeight: "700",
  textTransform: "uppercase",
  color: "#667",
  display: "block",
  marginBottom: "2px",
  letterSpacing: "0.5px",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  booking: Booking;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AccountsInvoiceDocument({ booking }: Props) {
  const charges = getChargesByBooking(booking.bookingId.toString());
  const isAdminBooking = booking.createdBy === "admin";

  // When admin created the booking, bill to the shipper; otherwise bill to the franchise
  const billTo = isAdminBooking
    ? {
        name: booking.shipper.name,
        phone: booking.shipper.phone,
        email: "",
        address: booking.shipper.address,
      }
    : { ...getFranchiseDetails(booking.createdBy), address: "" };

  const totalPcs = booking.boxItems.reduce(
    (sum, item) => sum + Number(item.quantity),
    0,
  );
  const totalWeight = booking.boxes.reduce((s, b) => s + b.grossWeight, 0);
  const grandTotal = charges.reduce((s, c) => s + c.amount, 0);
  const currency = "INR";

  const invoiceNumber = booking.awbNumber ?? "PENDING-AWB";
  const dateStr = formatDateDMY(booking.createdTimestamp);

  // Priority order for charges display
  const PRIORITY_LABELS = [
    "Freight",
    "PCS Charges",
    "Packing Charges",
    "Customs Duty",
    "Documentation Charges",
  ];
  const sortedCharges = [...charges].sort((a, b) => {
    const ai = PRIORITY_LABELS.indexOf(a.label);
    const bi = PRIORITY_LABELS.indexOf(b.label);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#111",
        background: "#fff",
        padding: "28px 32px",
        maxWidth: "820px",
        margin: "0 auto",
        fontSize: "11px",
      }}
    >
      {/* ── Company Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "20px",
          paddingBottom: "16px",
          borderBottom: `3px solid ${ACCENT}`,
        }}
      >
        {/* Left: Logo + Company Info */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <img
            src="/assets/uploads/20260305_152357_0000-1.png"
            alt="Worldyfly Logo"
            style={{ height: "60px", objectFit: "contain" }}
          />
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "900",
                letterSpacing: "2px",
                color: ACCENT,
                lineHeight: "1.1",
              }}
            >
              {COMPANY.name}
            </div>
            <div
              style={{
                fontSize: "9px",
                color: "#667",
                fontStyle: "italic",
                marginBottom: "4px",
              }}
            >
              {COMPANY.tagline}
            </div>
            <div style={{ fontSize: "9px", color: "#444", lineHeight: "1.7" }}>
              {COMPANY.address1}
              <br />
              {COMPANY.address2}
              <br />
              {COMPANY.address3}
              <br />
              Tel: {COMPANY.phone} &nbsp;|&nbsp; {COMPANY.email}
              <br />
              {COMPANY.website}
            </div>
          </div>
        </div>

        {/* Right: Invoice Title + Number/Date */}
        <div style={{ textAlign: "right", minWidth: "220px" }}>
          <div
            style={{
              fontSize: "26px",
              fontWeight: "900",
              letterSpacing: "3px",
              color: ACCENT,
              lineHeight: "1",
            }}
          >
            INVOICE
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "#667",
              letterSpacing: "1px",
              marginBottom: "10px",
            }}
          >
            ACCOUNTS / BILLING
          </div>
          <table style={{ marginLeft: "auto", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td
                  style={{
                    ...cellStyle,
                    background: ACCENT_LIGHT,
                    fontWeight: "700",
                    width: "90px",
                    textAlign: "right",
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  Invoice No.
                </td>
                <td
                  style={{
                    ...cellStyle,
                    fontWeight: "800",
                    fontFamily: "monospace",
                    minWidth: "120px",
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  {invoiceNumber}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    ...cellStyle,
                    background: ACCENT_LIGHT,
                    fontWeight: "700",
                    textAlign: "right",
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  Date
                </td>
                <td style={{ ...cellStyle, border: `1px solid ${BORDER}` }}>
                  {dateStr}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── From / To Section ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {/* From */}
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: ACCENT,
              color: "#fff",
              padding: "5px 10px",
              fontSize: "9px",
              fontWeight: "700",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            From
          </div>
          <div style={{ padding: "10px 12px", lineHeight: "1.8" }}>
            <div style={{ fontWeight: "800", fontSize: "12px", color: ACCENT }}>
              {COMPANY.name} LOGISTICS
            </div>
            <div style={{ fontSize: "10px", color: "#444" }}>
              {COMPANY.address1}
            </div>
            <div style={{ fontSize: "10px", color: "#444" }}>
              {COMPANY.address2}
            </div>
            <div style={{ fontSize: "10px", color: "#444" }}>
              {COMPANY.address3}
            </div>
            <div style={{ fontSize: "10px", color: "#444", marginTop: "4px" }}>
              Tel: {COMPANY.phone}
            </div>
            <div style={{ fontSize: "10px", color: "#444" }}>
              {COMPANY.email}
            </div>
          </div>
        </div>

        {/* To */}
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: ACCENT,
              color: "#fff",
              padding: "5px 10px",
              fontSize: "9px",
              fontWeight: "700",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Bill To
          </div>
          <div style={{ padding: "10px 12px", lineHeight: "1.8" }}>
            <div style={{ fontWeight: "800", fontSize: "12px", color: "#111" }}>
              {billTo.name}
            </div>
            {billTo.address && (
              <div style={{ fontSize: "10px", color: "#444" }}>
                {billTo.address}
              </div>
            )}
            {billTo.phone && (
              <div style={{ fontSize: "10px", color: "#444" }}>
                Tel: {billTo.phone}
              </div>
            )}
            {billTo.email && (
              <div style={{ fontSize: "10px", color: "#444" }}>
                {billTo.email}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Shipment Details Table ── */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            background: ACCENT,
            color: "#fff",
            padding: "6px 10px",
            fontSize: "9px",
            fontWeight: "700",
            letterSpacing: "1px",
            textTransform: "uppercase",
            borderRadius: "4px 4px 0 0",
          }}
        >
          Shipment Details
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: `1px solid ${BORDER}`,
            borderTop: "none",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  ...cellStyle,
                  background: ACCENT_LIGHT,
                  fontWeight: "700",
                  width: "160px",
                  border: `1px solid ${BORDER}`,
                }}
              >
                AWB No.
              </td>
              <td
                style={{
                  ...cellStyle,
                  fontFamily: "monospace",
                  fontWeight: "700",
                  border: `1px solid ${BORDER}`,
                }}
              >
                {booking.awbNumber ?? (
                  <em style={{ color: "#999" }}>Pending</em>
                )}
              </td>
              <td
                style={{
                  ...cellStyle,
                  background: ACCENT_LIGHT,
                  fontWeight: "700",
                  width: "160px",
                  border: `1px solid ${BORDER}`,
                }}
              >
                Date
              </td>
              <td style={{ ...cellStyle, border: `1px solid ${BORDER}` }}>
                {dateStr}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  ...cellStyle,
                  background: ACCENT_LIGHT,
                  fontWeight: "700",
                  border: `1px solid ${BORDER}`,
                }}
              >
                Shipper
              </td>
              <td style={{ ...cellStyle, border: `1px solid ${BORDER}` }}>
                {booking.shipper.name}
              </td>
              <td
                style={{
                  ...cellStyle,
                  background: ACCENT_LIGHT,
                  fontWeight: "700",
                  border: `1px solid ${BORDER}`,
                }}
              >
                Consignee
              </td>
              <td style={{ ...cellStyle, border: `1px solid ${BORDER}` }}>
                {booking.consignee.name}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  ...cellStyle,
                  background: ACCENT_LIGHT,
                  fontWeight: "700",
                  border: `1px solid ${BORDER}`,
                }}
              >
                Origin
              </td>
              <td style={{ ...cellStyle, border: `1px solid ${BORDER}` }}>
                {booking.originCountry}
              </td>
              <td
                style={{
                  ...cellStyle,
                  background: ACCENT_LIGHT,
                  fontWeight: "700",
                  border: `1px solid ${BORDER}`,
                }}
              >
                Destination
              </td>
              <td style={{ ...cellStyle, border: `1px solid ${BORDER}` }}>
                {booking.destinationCountry}
              </td>
            </tr>
            <tr>
              <td
                style={{
                  ...cellStyle,
                  background: ACCENT_LIGHT,
                  fontWeight: "700",
                  border: `1px solid ${BORDER}`,
                }}
              >
                Total PCS
              </td>
              <td style={{ ...cellStyle, border: `1px solid ${BORDER}` }}>
                <strong>{totalPcs}</strong>
              </td>
              <td
                style={{
                  ...cellStyle,
                  background: ACCENT_LIGHT,
                  fontWeight: "700",
                  border: `1px solid ${BORDER}`,
                }}
              >
                Total Weight
              </td>
              <td style={{ ...cellStyle, border: `1px solid ${BORDER}` }}>
                {totalWeight.toFixed(2)} kg
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Charges Table ── */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            background: ACCENT,
            color: "#fff",
            padding: "6px 10px",
            fontSize: "9px",
            fontWeight: "700",
            letterSpacing: "1px",
            textTransform: "uppercase",
            borderRadius: "4px 4px 0 0",
          }}
        >
          Charges
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: `1px solid ${BORDER}`,
            borderTop: "none",
          }}
        >
          <thead>
            <tr style={{ background: ACCENT_LIGHT }}>
              <th
                style={{
                  ...cellStyle,
                  fontWeight: "700",
                  textAlign: "left",
                  fontSize: "10px",
                  border: `1px solid ${BORDER}`,
                }}
              >
                #
              </th>
              <th
                style={{
                  ...cellStyle,
                  fontWeight: "700",
                  textAlign: "left",
                  fontSize: "10px",
                  width: "70%",
                  border: `1px solid ${BORDER}`,
                }}
              >
                Description
              </th>
              <th
                style={{
                  ...cellStyle,
                  fontWeight: "700",
                  textAlign: "right",
                  fontSize: "10px",
                  border: `1px solid ${BORDER}`,
                }}
              >
                Amount ({currency})
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCharges.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  style={{
                    ...cellStyle,
                    textAlign: "center",
                    color: "#aaa",
                    fontStyle: "italic",
                    padding: "20px",
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  No charges added yet
                </td>
              </tr>
            ) : (
              sortedCharges.map((charge, idx) => (
                <tr
                  key={charge.id}
                  style={{
                    background: idx % 2 === 0 ? "#fff" : "#fafbfc",
                  }}
                >
                  <td
                    style={{
                      ...cellStyle,
                      textAlign: "center",
                      color: "#667",
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td
                    style={{
                      ...cellStyle,
                      fontWeight: PRIORITY_LABELS.includes(charge.label)
                        ? "600"
                        : "400",
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    {charge.label}
                  </td>
                  <td
                    style={{
                      ...cellStyle,
                      textAlign: "right",
                      fontFamily: "monospace",
                      border: `1px solid ${BORDER}`,
                    }}
                  >
                    {charge.amount.toFixed(2)}
                  </td>
                </tr>
              ))
            )}

            {/* Grand Total Row */}
            <tr
              style={{
                background: ACCENT,
                color: "#fff",
              }}
            >
              <td
                colSpan={2}
                style={{
                  ...cellStyle,
                  textAlign: "right",
                  fontWeight: "800",
                  fontSize: "12px",
                  letterSpacing: "0.5px",
                  color: "#fff",
                  border: `1px solid ${ACCENT}`,
                }}
              >
                GRAND TOTAL &nbsp; {currency}
              </td>
              <td
                style={{
                  ...cellStyle,
                  textAlign: "right",
                  fontWeight: "900",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  color: "#fff",
                  border: `1px solid ${ACCENT}`,
                }}
              >
                {grandTotal.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Amount in Words ── */}
      <div
        style={{
          border: `1px solid ${BORDER}`,
          borderRadius: "4px",
          padding: "10px 14px",
          marginBottom: "20px",
          background: ACCENT_LIGHT,
        }}
      >
        <span style={labelStyle}>Amount Chargeable (in Words):</span>
        <span style={{ fontWeight: "700", fontSize: "11px" }}>
          {currency}&nbsp;{numberToWords(grandTotal)}
        </span>
      </div>

      {/* ── Declaration + Signature ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: "4px",
            padding: "12px 14px",
          }}
        >
          <span style={labelStyle}>Declaration:</span>
          <p
            style={{
              fontSize: "9px",
              lineHeight: "1.6",
              color: "#444",
              margin: 0,
            }}
          >
            This invoice is for freight and handling services rendered by
            Worldyfly Logistics. All charges are as per agreed terms. Payment is
            due within 30 days of invoice date.
          </p>
        </div>
        <div
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: "4px",
            padding: "12px 14px",
          }}
        >
          <span style={labelStyle}>For WORLDYFLY LOGISTICS</span>
          <div style={{ minHeight: "50px" }} />
          <div
            style={{
              borderTop: `1px solid ${BORDER}`,
              paddingTop: "6px",
              fontSize: "9px",
              color: "#667",
            }}
          >
            Authorised Signatory &nbsp;|&nbsp; Date: ___________
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          marginTop: "12px",
          textAlign: "center",
          fontSize: "8px",
          color: "#aaa",
          borderTop: `1px solid ${BORDER}`,
          paddingTop: "8px",
        }}
      >
        {COMPANY.name} — {COMPANY.address1} {COMPANY.address2}{" "}
        {COMPANY.address3} &nbsp;|&nbsp; Tel: {COMPANY.phone} &nbsp;|&nbsp;{" "}
        {COMPANY.website}
      </div>
    </div>
  );
}
