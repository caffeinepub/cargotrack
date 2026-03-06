import type { Booking } from "../../backend.d";
import { formatDate } from "../../lib/helpers";
import { KYC_LABEL } from "../../lib/kycLabels";

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

const tbl: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  border: "1px solid black",
};

const td: React.CSSProperties = {
  border: "1px solid black",
  padding: "8px",
  verticalAlign: "top",
  fontSize: "10pt",
};

const label: React.CSSProperties = {
  fontSize: "8pt",
  fontWeight: "bold",
  display: "block",
  marginBottom: "4px",
};

const content: React.CSSProperties = {
  fontSize: "9pt",
};

interface Props {
  booking: Booking;
}

export function InvoiceDocument({ booking }: Props) {
  const grandTotal = booking.boxItems.reduce((s, i) => s + i.total, 0);
  const totalWeight = booking.boxes.reduce((s, b) => s + b.grossWeight, 0);
  const allDims = booking.boxes
    .map((b) => `${b.length}×${b.width}×${b.height} cm`)
    .join(", ");
  const invoiceDateStr = formatDate(booking.invoice.invoiceDate);
  const currency = booking.invoice.currency;

  const kycLabel =
    KYC_LABEL[booking.shipper.kycType] ?? booking.shipper.kycType;

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        fontSize: "10pt",
        margin: "20px",
        color: "#000",
        background: "#fff",
        maxWidth: "900px",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      {/* INVOICE title */}
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "14pt",
          padding: "10px",
          borderBottom: "none",
          border: "1px solid black",
          borderBottomColor: "transparent",
          background: "#f9f9f9",
          letterSpacing: "4px",
        }}
      >
        INVOICE
      </div>

      {/* Table 1: Exporter / Consignee / Invoice info */}
      <table style={tbl}>
        <tbody>
          {/* Row 1: Exporter | Invoice No & Date | Exporter Ref */}
          <tr>
            <td
              width="50%"
              rowSpan={2}
              style={{ ...td, borderRight: "1px solid black" }}
            >
              <span style={label}>Exporter</span>
              <div style={content}>
                <strong>{booking.shipper.name.toUpperCase()}</strong>
                <br />
                {booking.shipper.address}
                <br />
                Tel: {booking.shipper.phone}
                <br />
                {kycLabel} Number-{booking.shipper.kycNumber}
              </div>
            </td>
            <td width="25%" style={{ ...td, borderRight: "1px solid black" }}>
              <span style={label}>Invoice No. and Date</span>
              <div style={content}>
                {booking.invoice.invoiceNumber} &nbsp;&nbsp; {invoiceDateStr}
              </div>
            </td>
            <td width="25%" style={td}>
              <span style={label}>Exporter Ref.</span>
              <div style={content}>{booking.awbNumber ?? "—"}</div>
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ ...td, borderLeft: "1px solid black" }}>
              <span style={label}>Buyer's order no. and date</span>
              <div style={{ minHeight: "16px" }}>&nbsp;</div>
            </td>
          </tr>

          {/* Row 2: Consignee | Buyer | Origin/Destination */}
          <tr>
            <td
              width="50%"
              rowSpan={2}
              style={{ ...td, borderRight: "1px solid black" }}
            >
              <span style={label}>Consignee</span>
              <div style={content}>
                <strong>{booking.consignee.name.toUpperCase()}</strong>
                <br />
                {booking.consignee.address}
                <br />
                Telephone: {booking.consignee.phone}
              </div>
            </td>
            <td
              colSpan={2}
              style={{ ...td, borderLeft: "1px solid black", height: "70px" }}
            >
              <span style={label}>Buyer (if other than consignee)</span>
              <div style={{ minHeight: "50px" }}>&nbsp;</div>
            </td>
          </tr>
          <tr>
            <td
              style={{
                ...td,
                borderLeft: "1px solid black",
                borderRight: "1px solid black",
                width: "25%",
              }}
            >
              <span style={label}>Country of origin of goods</span>
              <div style={content}>
                <strong>INDIA</strong>
              </div>
            </td>
            <td style={{ ...td, width: "25%" }}>
              <span style={label}>Country of final destination</span>
              <div style={content}>
                <strong>{booking.destinationCountry.toUpperCase()}</strong>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Table 2: Shipment info */}
      <table style={{ ...tbl, borderTop: "none" }}>
        <tbody>
          <tr>
            <td width="25%" style={{ ...td, borderRight: "1px solid black" }}>
              <span style={label}>Pre-Carriage by</span>
              <div style={{ minHeight: "14px" }}>&nbsp;</div>
            </td>
            <td width="25%" style={{ ...td, borderRight: "1px solid black" }}>
              <span style={label}>Place of Receipt</span>
              <div style={{ minHeight: "14px" }}>&nbsp;</div>
            </td>
            <td width="50%" colSpan={2} style={td}>
              <span style={label}>Terms of delivery &amp; Payment</span>
              <div style={content}>
                Actual Weight: {totalWeight.toFixed(2)} kg
              </div>
            </td>
          </tr>
          <tr>
            <td style={{ ...td, borderRight: "1px solid black" }}>
              <span style={label}>Vessel / Flight No.</span>
              <div style={{ minHeight: "14px" }}>&nbsp;</div>
            </td>
            <td style={{ ...td, borderRight: "1px solid black" }}>
              <span style={label}>Port of Loading</span>
              <div style={content}>{booking.originCountry}</div>
            </td>
            <td colSpan={2} style={td}>
              <span style={label}>Dimension</span>
              <div style={content}>{allDims || "—"}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Table 3: Product items */}
      <table
        style={{
          ...tbl,
          borderTop: "none",
        }}
      >
        <thead>
          <tr>
            {[
              { label: "BOX", width: "10%", align: "center" as const },
              { label: "DESCRIPTION", width: "40%", align: "left" as const },
              { label: "HSN", width: "15%", align: "center" as const },
              { label: "QTY", width: "10%", align: "center" as const },
              { label: "RATE", width: "10%", align: "right" as const },
              {
                label: `AMOUNT(${currency})`,
                width: "15%",
                align: "right" as const,
              },
            ].map((col) => (
              <th
                key={col.label}
                style={{
                  border: "1px solid black",
                  fontSize: "8pt",
                  background: "#f2f2f2",
                  textAlign: col.align,
                  padding: "6px 8px",
                  width: col.width,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {booking.boxItems.length > 0 ? (
            booking.boxItems.map((item, idx) => (
              <tr key={`${item.boxNumber.toString()}-${idx}`}>
                <td
                  style={{
                    borderLeft: "1px solid black",
                    borderRight: "1px solid black",
                    borderTop: "none",
                    borderBottom: "none",
                    padding: "6px 8px",
                    fontSize: "9pt",
                    textAlign: "center",
                  }}
                >
                  {item.boxNumber.toString()}
                </td>
                <td
                  style={{
                    borderLeft: "1px solid black",
                    borderRight: "1px solid black",
                    borderTop: "none",
                    borderBottom: "none",
                    padding: "6px 8px",
                    fontSize: "9pt",
                  }}
                >
                  {item.description}
                </td>
                <td
                  style={{
                    borderLeft: "1px solid black",
                    borderRight: "1px solid black",
                    borderTop: "none",
                    borderBottom: "none",
                    padding: "6px 8px",
                    fontSize: "9pt",
                    textAlign: "center",
                    fontFamily: "monospace",
                  }}
                >
                  {item.hsCode}
                </td>
                <td
                  style={{
                    borderLeft: "1px solid black",
                    borderRight: "1px solid black",
                    borderTop: "none",
                    borderBottom: "none",
                    padding: "6px 8px",
                    fontSize: "9pt",
                    textAlign: "center",
                  }}
                >
                  {item.quantity.toString()}
                </td>
                <td
                  style={{
                    borderLeft: "1px solid black",
                    borderRight: "1px solid black",
                    borderTop: "none",
                    borderBottom: "none",
                    padding: "6px 8px",
                    fontSize: "9pt",
                    textAlign: "right",
                  }}
                >
                  {item.rate.toFixed(2)}
                </td>
                <td
                  style={{
                    borderLeft: "1px solid black",
                    borderRight: "1px solid black",
                    borderTop: "none",
                    borderBottom: "none",
                    padding: "6px 8px",
                    fontSize: "9pt",
                    textAlign: "right",
                  }}
                >
                  {item.total.toFixed(2)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={6}
                style={{
                  border: "1px solid black",
                  padding: "40px",
                  textAlign: "center",
                  color: "#aaa",
                  fontSize: "9pt",
                  height: "80px",
                }}
              >
                No items
              </td>
            </tr>
          )}
        </tbody>
        {/* Total row */}
        <tfoot>
          <tr>
            <td
              colSpan={5}
              style={{
                borderTop: "1px solid black",
                borderBottom: "1px solid black",
                borderLeft: "1px solid black",
                borderRight: "1px solid black",
                padding: "6px 8px",
                fontWeight: "bold",
                fontSize: "10pt",
                textAlign: "right",
              }}
            >
              Total &nbsp; {currency}
            </td>
            <td
              style={{
                borderTop: "1px solid black",
                borderBottom: "1px solid black",
                borderLeft: "1px solid black",
                borderRight: "1px solid black",
                padding: "6px 8px",
                fontWeight: "bold",
                fontSize: "10pt",
                textAlign: "right",
              }}
            >
              {grandTotal.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Table 4: Amount in words + Declaration */}
      <table style={{ ...tbl, borderTop: "none" }}>
        <tbody>
          <tr>
            <td colSpan={2} style={td}>
              <span style={label}>Amount chargeable (in Words):</span>
              <div style={content}>
                <strong>{currency}</strong> &nbsp; {numberToWords(grandTotal)}
              </div>
            </td>
          </tr>
          <tr>
            <td
              width="70%"
              style={{
                ...td,
                borderRight: "1px solid black",
                height: "80px",
              }}
            >
              <span style={label}>Declaration:</span>
              <div style={{ fontSize: "9pt" }}>
                The above mentioned items are not for commercial use and value
                declared only for custom purpose.
              </div>
            </td>
            <td width="30%" style={{ ...td, height: "80px" }}>
              <span style={label}>Signature / Date / Co stamp.</span>
              <div style={{ marginTop: "6px", fontSize: "10pt" }}>For</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
