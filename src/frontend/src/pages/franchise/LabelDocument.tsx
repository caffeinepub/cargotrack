import type { Booking } from "../../backend.d";

// Reuse same barcode renderer as AWBDocument
function BarcodeStrip({ value }: { value: string }) {
  const bars: number[] = [];
  for (let i = 0; i < 60; i++) {
    const charCode = value.charCodeAt(i % value.length) ?? 65;
    bars.push(((charCode + i) % 4) + 1);
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div
        style={{
          display: "flex",
          height: "50px",
          gap: "1px",
          alignItems: "stretch",
          background: "#fff",
          padding: "2px",
        }}
      >
        {bars.map((w, i) => (
          <div
            key={`bar-${i}-${w}`}
            style={{
              width: `${w}px`,
              background: i % 2 === 0 ? "#000" : "#fff",
              flexShrink: 0,
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "12px",
          fontWeight: "700",
          marginTop: "3px",
          letterSpacing: "2px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

interface Props {
  booking: Booking;
}

export function LabelDocument({ booking }: Props) {
  const awbNumber = booking.awbNumber ?? booking.invoice.invoiceNumber;
  const createdDate = new Date(Number(booking.createdTimestamp / 1_000_000n));
  const dateStr = createdDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const totalPcs = booking.boxes.length;
  const totalWeight = booking.boxes.reduce((s, b) => s + b.grossWeight, 0);

  const cell: React.CSSProperties = {
    border: "1px solid #000",
    padding: "5px 7px",
    fontSize: "10px",
    verticalAlign: "top",
  };

  const lbl: React.CSSProperties = {
    fontSize: "7px",
    fontWeight: "800",
    textTransform: "uppercase" as const,
    color: "#555",
    display: "block",
    marginBottom: "2px",
    letterSpacing: "0.5px",
  };

  const val: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: "600",
    lineHeight: "1.3",
    color: "#000",
  };

  return (
    <div
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        background: "#fff",
        color: "#000",
        // 4x6 inch label: 384px x 576px at 96dpi
        width: "384px",
        minHeight: "576px",
        border: "2px solid #000",
        boxSizing: "border-box",
        padding: "0",
        margin: "0 auto",
      }}
    >
      {/* AWB Number + Barcode header */}
      <div
        style={{
          borderBottom: "2px solid #000",
          padding: "10px",
          textAlign: "center",
          background: "#f8f8f8",
        }}
      >
        <div
          style={{
            fontSize: "9px",
            fontWeight: "800",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "#555",
            marginBottom: "6px",
          }}
        >
          AIR WAYBILL
        </div>
        <BarcodeStrip value={awbNumber} />
      </div>

      {/* Date + Destination row */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderBottom: "1px solid #000",
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                ...cell,
                width: "50%",
                borderTop: "none",
                borderLeft: "none",
              }}
            >
              <span style={lbl}>DATE</span>
              <span style={{ ...val, fontSize: "13px" }}>{dateStr}</span>
            </td>
            <td
              style={{
                ...cell,
                width: "50%",
                borderTop: "none",
                borderRight: "none",
              }}
            >
              <span style={lbl}>DESTINATION</span>
              <span style={{ ...val, fontSize: "13px", fontWeight: "800" }}>
                {booking.destinationCountry.toUpperCase()}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* PCS + Weight row */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderBottom: "1px solid #000",
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                ...cell,
                width: "50%",
                borderTop: "none",
                borderLeft: "none",
              }}
            >
              <span style={lbl}>NO. OF PIECES</span>
              <span style={{ ...val, fontSize: "18px", fontWeight: "800" }}>
                {totalPcs}
              </span>
            </td>
            <td
              style={{
                ...cell,
                width: "50%",
                borderTop: "none",
                borderRight: "none",
              }}
            >
              <span style={lbl}>GROSS WEIGHT (kg)</span>
              <span style={{ ...val, fontSize: "18px", fontWeight: "800" }}>
                {totalWeight.toFixed(2)}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Shipper block */}
      <div style={{ borderBottom: "1px solid #000", padding: "7px 8px" }}>
        <span style={lbl}>FROM (SHIPPER)</span>
        <div style={{ ...val, fontSize: "12px", fontWeight: "700" }}>
          {booking.shipper.name}
        </div>
        <div
          style={{
            fontSize: "10px",
            color: "#333",
            lineHeight: "1.4",
            marginTop: "2px",
          }}
        >
          {booking.shipper.address}
        </div>
        <div style={{ fontSize: "10px", color: "#333", marginTop: "2px" }}>
          Tel: {booking.shipper.phone}
        </div>
        <div style={{ fontSize: "10px", color: "#555", marginTop: "2px" }}>
          {booking.originCountry}
        </div>
      </div>

      {/* Consignee block */}
      <div style={{ borderBottom: "1px solid #000", padding: "7px 8px" }}>
        <span style={lbl}>TO (CONSIGNEE)</span>
        <div style={{ ...val, fontSize: "13px", fontWeight: "800" }}>
          {booking.consignee.name}
        </div>
        <div
          style={{
            fontSize: "10px",
            color: "#333",
            lineHeight: "1.4",
            marginTop: "2px",
          }}
        >
          {booking.consignee.address}
        </div>
        <div style={{ fontSize: "10px", color: "#333", marginTop: "2px" }}>
          Tel: {booking.consignee.phone}
        </div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "#000",
            marginTop: "3px",
          }}
        >
          {booking.destinationCountry.toUpperCase()}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "5px 8px",
          fontSize: "8px",
          color: "#999",
          textAlign: "center",
          letterSpacing: "0.5px",
        }}
      >
        www.worldyfly.com
      </div>
    </div>
  );
}
