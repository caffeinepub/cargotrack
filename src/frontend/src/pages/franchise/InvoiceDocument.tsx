import type { Booking } from "../../backend.d";
import { formatDate } from "../../lib/helpers";
import { KYC_LABEL } from "../../lib/kycLabels";

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

// Convert number to words (for amount in words line)
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

// Cell style helpers
const cellStyle: React.CSSProperties = {
  border: "1px solid #555",
  padding: "4px 6px",
  fontSize: "10px",
  verticalAlign: "top",
};

const labelStyle: React.CSSProperties = {
  fontSize: "8px",
  fontWeight: "700",
  textTransform: "uppercase",
  color: "#555",
  display: "block",
  marginBottom: "2px",
};

interface Props {
  booking: Booking;
}

export function InvoiceDocument({ booking }: Props) {
  const grandTotal = booking.boxItems.reduce((s, i) => s + i.total, 0);
  const totalWeight = booking.boxes.reduce((s, b) => s + b.grossWeight, 0);
  const allDims = booking.boxes
    .map((b) => `${b.length}×${b.width}×${b.height}`)
    .join(", ");
  const invoiceDateStr = formatDate(booking.invoice.invoiceDate);
  const currency = booking.invoice.currency;

  // Parse address for city/state/zip extraction (best-effort)
  const shipperAddressParts = booking.shipper.address
    .split(",")
    .map((p) => p.trim());
  const shipperCity = shipperAddressParts[shipperAddressParts.length - 2] ?? "";
  const shipperState =
    shipperAddressParts[shipperAddressParts.length - 1] ?? "";

  const consigneeAddressParts = booking.consignee.address
    .split(",")
    .map((p) => p.trim());
  const consigneeCity =
    consigneeAddressParts[consigneeAddressParts.length - 2] ?? "";

  return (
    <div
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#111",
        background: "#fff",
        padding: "20px",
        maxWidth: "900px",
        margin: "0 auto",
        fontSize: "11px",
      }}
    >
      {/* Company Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "10px",
          paddingBottom: "8px",
          borderBottom: "2px solid #111",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src="/assets/uploads/20260305_152357_0000-1.png"
            alt="Worldyfly Logo"
            style={{ height: "55px", objectFit: "contain" }}
          />
          <div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "800",
                letterSpacing: "1px",
              }}
            >
              {COMPANY.name}
            </div>
            <div style={{ fontSize: "9px", color: "#555" }}>
              {COMPANY.tagline}
            </div>
            <div style={{ fontSize: "9px", color: "#555" }}>
              {COMPANY.address1}
            </div>
            <div style={{ fontSize: "9px", color: "#555" }}>
              {COMPANY.address2}
            </div>
            <div style={{ fontSize: "9px", color: "#555" }}>
              {COMPANY.address3}
            </div>
            <div style={{ fontSize: "9px", color: "#555" }}>
              Tel: {COMPANY.phone} | Email: {COMPANY.email}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: "6px" }}>
          <div
            style={{
              fontSize: "22px",
              fontWeight: "900",
              letterSpacing: "4px",
              textDecoration: "underline",
            }}
          >
            INVOICE
          </div>
          <div style={{ fontSize: "9px", color: "#555", marginTop: "2px" }}>
            COMMERCIAL INVOICE
          </div>
        </div>
      </div>

      {/* Main bordered table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #555",
        }}
      >
        <tbody>
          {/* Row 1: Exporter | Invoice No + Date | Exporter Ref */}
          <tr>
            <td
              rowSpan={3}
              style={{
                ...cellStyle,
                width: "38%",
                borderRight: "1px solid #555",
              }}
            >
              <span style={labelStyle}>Exporter</span>
              <div
                style={{
                  fontWeight: "700",
                  fontSize: "12px",
                  marginBottom: "4px",
                }}
              >
                {booking.shipper.name}
              </div>
              <div style={{ whiteSpace: "pre-line", lineHeight: "1.5" }}>
                {booking.shipper.address}
              </div>
              {shipperCity && (
                <div>
                  {shipperCity}
                  {shipperState ? `, ${shipperState}` : ""}
                </div>
              )}
              <div style={{ marginTop: "4px" }}>
                <strong>
                  {KYC_LABEL[booking.shipper.kycType] ??
                    booking.shipper.kycType}{" "}
                  Number-{booking.shipper.kycNumber}
                </strong>
              </div>
            </td>
            <td
              style={{
                ...cellStyle,
                width: "38%",
                borderRight: "1px solid #555",
              }}
            >
              <span style={labelStyle}>Invoice No. and Date</span>
              <div style={{ fontWeight: "700" }}>
                {booking.invoice.invoiceNumber} &nbsp;&nbsp; {invoiceDateStr}
              </div>
            </td>
            <td style={{ ...cellStyle, width: "24%" }}>
              <span style={labelStyle}>Exporter Ref.</span>
              <div>{booking.awbNumber ?? "—"}</div>
            </td>
          </tr>
          <tr>
            <td
              colSpan={2}
              style={{
                ...cellStyle,
                borderLeft: "1px solid #555",
              }}
            >
              <span style={labelStyle}>Buyer's order no. and date</span>
              <div style={{ minHeight: "16px" }}>&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td
              colSpan={2}
              style={{
                ...cellStyle,
                borderLeft: "1px solid #555",
              }}
            >
              <span style={labelStyle}>Other Reference (s)</span>
              <div style={{ minHeight: "16px" }}>&nbsp;</div>
            </td>
          </tr>

          {/* Row 2: Consignee | Buyer if other has consignee */}
          <tr>
            <td
              rowSpan={2}
              style={{
                ...cellStyle,
                borderRight: "1px solid #555",
                minHeight: "80px",
              }}
            >
              <span style={labelStyle}>Consignee</span>
              <div
                style={{
                  fontWeight: "700",
                  fontSize: "12px",
                  marginBottom: "4px",
                }}
              >
                {booking.consignee.name}
              </div>
              <div style={{ whiteSpace: "pre-line", lineHeight: "1.5" }}>
                {booking.consignee.address}
              </div>
              {consigneeCity && <div>{consigneeCity}</div>}
              <div>Telephone: {booking.consignee.phone}</div>
            </td>
            <td
              colSpan={2}
              style={{
                ...cellStyle,
                borderLeft: "1px solid #555",
                height: "70px",
              }}
            >
              <span style={labelStyle}>Buyer(if other has consignee)</span>
              <div style={{ minHeight: "50px" }}>&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td
              style={{
                ...cellStyle,
                borderLeft: "1px solid #555",
                borderRight: "1px solid #555",
                width: "19%",
              }}
            >
              <span style={labelStyle}>Country of origin of goods</span>
              <div style={{ fontWeight: "600" }}>INDIA</div>
            </td>
            <td style={{ ...cellStyle, width: "19%" }}>
              <span style={labelStyle}>Country of final destination</span>
              <div style={{ fontWeight: "600" }}>
                {booking.destinationCountry}
              </div>
            </td>
          </tr>

          {/* Pre-carriage / Place of receipt / Terms */}
          <tr>
            <td
              style={{
                ...cellStyle,
                borderRight: "1px solid #555",
                width: "19%",
              }}
            >
              <span style={labelStyle}>Pre-Carriage by</span>
              <div style={{ minHeight: "14px" }}>&nbsp;</div>
            </td>
            <td
              style={{
                ...cellStyle,
                borderRight: "1px solid #555",
                width: "19%",
              }}
            >
              <span style={labelStyle}>Place of Receipt by pre-carrier</span>
              <div style={{ minHeight: "14px" }}>&nbsp;</div>
            </td>
            <td colSpan={2} style={{ ...cellStyle }}>
              <span style={labelStyle}>Terms of delivery &amp; Payment</span>
              <div style={{ minHeight: "14px" }}>&nbsp;</div>
            </td>
          </tr>

          {/* Actual Weight / Vessel / Port / Dimension */}
          <tr>
            <td
              colSpan={2}
              style={{ ...cellStyle, borderRight: "1px solid #555" }}
            >
              <div style={{ display: "flex", gap: "32px" }}>
                <div>
                  <span style={labelStyle}>Actual Weight</span>
                  <div style={{ fontWeight: "600" }}>
                    {totalWeight.toFixed(2)} kg
                  </div>
                </div>
              </div>
            </td>
            <td colSpan={2} style={{ ...cellStyle }}>
              <span style={labelStyle}>Dimension</span>
              <div>{allDims || "—"}</div>
            </td>
          </tr>

          {/* Vessel/Flight / Port of Loading */}
          <tr>
            <td
              style={{
                ...cellStyle,
                borderRight: "1px solid #555",
                width: "19%",
              }}
            >
              <span style={labelStyle}>Vessel / Flight No.</span>
              <div style={{ minHeight: "14px" }}>&nbsp;</div>
            </td>
            <td
              style={{
                ...cellStyle,
                borderRight: "1px solid #555",
                width: "19%",
              }}
            >
              <span style={labelStyle}>Port of Loading</span>
              <div>{booking.originCountry}</div>
            </td>
            <td colSpan={2} style={{ ...cellStyle }}>
              <span style={labelStyle}>Port of Discharge</span>
              <div>{booking.destinationCountry}</div>
            </td>
          </tr>

          {/* Items table header */}
          <tr>
            <td
              style={{
                ...cellStyle,
                background: "#f0f0f0",
                fontWeight: "700",
                fontSize: "10px",
                textAlign: "center",
                width: "6%",
                borderRight: "1px solid #555",
              }}
            >
              BOX
            </td>
            <td
              style={{
                ...cellStyle,
                background: "#f0f0f0",
                fontWeight: "700",
                fontSize: "10px",
                borderRight: "1px solid #555",
              }}
            >
              DESCRIPTION
            </td>
            <td
              style={{
                ...cellStyle,
                background: "#f0f0f0",
                fontWeight: "700",
                fontSize: "10px",
                textAlign: "center",
                borderRight: "1px solid #555",
                width: "10%",
              }}
            >
              HSN
            </td>
            <td
              style={{
                ...cellStyle,
                background: "#f0f0f0",
                fontWeight: "700",
                fontSize: "10px",
                textAlign: "center",
                borderRight: "1px solid #555",
                width: "8%",
              }}
            >
              QTY
            </td>
            <td
              style={{
                ...cellStyle,
                background: "#f0f0f0",
                fontWeight: "700",
                fontSize: "10px",
                textAlign: "right",
                borderRight: "1px solid #555",
                width: "10%",
              }}
            >
              RATE
            </td>
            <td
              style={{
                ...cellStyle,
                background: "#f0f0f0",
                fontWeight: "700",
                fontSize: "10px",
                textAlign: "right",
                width: "12%",
              }}
            >
              AMOUNT({currency})
            </td>
          </tr>

          {/* Items rows */}
          {booking.boxItems.length > 0 ? (
            booking.boxItems.map((item, idx) => (
              <tr key={`${item.boxNumber.toString()}-${idx}`}>
                <td
                  style={{
                    ...cellStyle,
                    textAlign: "center",
                    borderRight: "1px solid #555",
                  }}
                >
                  {item.boxNumber.toString()}
                </td>
                <td style={{ ...cellStyle, borderRight: "1px solid #555" }}>
                  {item.description}
                </td>
                <td
                  style={{
                    ...cellStyle,
                    fontFamily: "monospace",
                    textAlign: "center",
                    borderRight: "1px solid #555",
                  }}
                >
                  {item.hsCode}
                </td>
                <td
                  style={{
                    ...cellStyle,
                    textAlign: "center",
                    borderRight: "1px solid #555",
                  }}
                >
                  {item.quantity.toString()}
                </td>
                <td
                  style={{
                    ...cellStyle,
                    textAlign: "right",
                    borderRight: "1px solid #555",
                  }}
                >
                  {item.rate.toFixed(2)}
                </td>
                <td style={{ ...cellStyle, textAlign: "right" }}>
                  {item.total.toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={6}
                style={{
                  ...cellStyle,
                  height: "80px",
                  textAlign: "center",
                  color: "#aaa",
                }}
              >
                No items
              </td>
            </tr>
          )}

          {/* Total row */}
          <tr>
            <td
              colSpan={5}
              style={{
                ...cellStyle,
                textAlign: "right",
                fontWeight: "700",
                borderRight: "1px solid #555",
              }}
            >
              Total &nbsp; {currency}
            </td>
            <td
              style={{
                ...cellStyle,
                textAlign: "right",
                fontWeight: "700",
                fontSize: "12px",
              }}
            >
              {grandTotal.toFixed(2)}
            </td>
          </tr>

          {/* Amount in words */}
          <tr>
            <td colSpan={6} style={{ ...cellStyle }}>
              <span style={labelStyle}>Amount chargeable (in Words):</span>
              <div>
                <strong>{currency}</strong> &nbsp; {numberToWords(grandTotal)}
              </div>
            </td>
          </tr>

          {/* Declaration + Signature */}
          <tr>
            <td
              colSpan={4}
              style={{
                ...cellStyle,
                borderRight: "1px solid #555",
                verticalAlign: "top",
              }}
            >
              <span style={labelStyle}>Declaration:</span>
              <div style={{ fontSize: "9px", lineHeight: "1.5" }}>
                The above mentioned items are not for commercial use and value
                declared only for custom purpose.
              </div>
            </td>
            <td
              colSpan={2}
              style={{
                ...cellStyle,
                verticalAlign: "top",
                minHeight: "60px",
              }}
            >
              <span style={labelStyle}>Signature / Date / Co stamp.</span>
              <div style={{ marginTop: "6px", fontSize: "10px" }}>For</div>
              <div style={{ minHeight: "40px" }}>&nbsp;</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div
        style={{
          marginTop: "8px",
          textAlign: "center",
          fontSize: "8px",
          color: "#aaa",
        }}
      >
        {COMPANY.name} — {COMPANY.address1} {COMPANY.address2}{" "}
        {COMPANY.address3} | Tel: {COMPANY.phone} | {COMPANY.website}
      </div>
    </div>
  );
}
