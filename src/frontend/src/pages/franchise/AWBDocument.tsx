import type { Booking } from "../../backend.d";
import { KYC_LABEL } from "../../lib/kycLabels";

const COMPANY = {
  name: "WORLDYFLY",
  tagline: "International Courier & Cargo Services",
  address:
    "First Floor, 11/423H, St Joseph Building, Akapparambu Junction, Opposite Cochin International Airport, Nedumbasserry - 686583",
  phone: "+91 95263 69141",
  website: "www.worldyfly.com",
};

// Simple CSS barcode visual renderer
function BarcodeStrip({ value }: { value: string }) {
  // Generate pseudo-barcode pattern from string chars
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
        className="barcode-bar"
        style={{
          display: "flex",
          height: "45px",
          gap: "1px",
          alignItems: "stretch",
          background: "#fff",
          padding: "2px",
          border: "1px solid #ddd",
        }}
      >
        {bars.map((w, i) => (
          <div
            key={`bar-${i}-${w}`}
            className="barcode-bar"
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
          fontSize: "11px",
          fontWeight: "700",
          marginTop: "2px",
          letterSpacing: "1px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  border: "1px solid #666",
  padding: "3px 5px",
  fontSize: "9px",
  verticalAlign: "top",
};

const labelStyle: React.CSSProperties = {
  fontSize: "7px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  color: "#555",
  display: "block",
  marginBottom: "1px",
};

const valueStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: "600",
  lineHeight: "1.3",
};

interface Props {
  booking: Booking;
}

function AWBCopy({
  booking,
  copyLabel,
}: {
  booking: Booking;
  copyLabel: "ACCOUNT COPY" | "SHIPPER COPY";
}) {
  const awbNumber = booking.awbNumber ?? booking.invoice.invoiceNumber;
  const grandTotal = booking.boxItems.reduce((s, i) => s + i.total, 0);
  const totalWeight = booking.boxes.reduce((s, b) => s + b.grossWeight, 0);
  const totalVolWeight = booking.boxes.reduce((s, b) => s + b.volumeWeight, 0);
  const allDims = booking.boxes
    .map((b) => `${b.length}×${b.width}×${b.height}`)
    .join(", ");
  const noPkg = booking.boxes.length;

  const createdDate = new Date(Number(booking.createdTimestamp / 1_000_000n));
  const dateStr = createdDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const descriptionOfGoods = booking.boxItems
    .map((i) => i.description)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(", ");

  // Parse structured consignee address fields
  function parseAddressField(address: string, key: string): string {
    const regex = new RegExp(`${key}:\\s*([^,]+)`, "i");
    const match = address.match(regex);
    return match ? match[1].trim() : "";
  }

  const consigneeCountry = booking.destinationCountry;
  const consigneeCity = parseAddressField(booking.consignee.address, "City");
  const consigneeZip = parseAddressField(booking.consignee.address, "Zip");
  const consigneeFloor = parseAddressField(booking.consignee.address, "Floor");
  const consigneeHouseNo = parseAddressField(
    booking.consignee.address,
    "House No",
  );
  const consigneeBuildingNo = parseAddressField(
    booking.consignee.address,
    "Building No",
  );
  const consigneeStreetNo = parseAddressField(
    booking.consignee.address,
    "Street No",
  );
  const consigneeStreet = parseAddressField(
    booking.consignee.address,
    "Street",
  );
  const consigneeTown = parseAddressField(booking.consignee.address, "Town");
  const consigneeEmail = parseAddressField(booking.consignee.address, "Email");

  // Build formatted consignee address lines
  const consigneeAddressLines = [
    consigneeFloor ? `Floor: ${consigneeFloor}` : "",
    consigneeHouseNo ? `House No: ${consigneeHouseNo}` : "",
    consigneeBuildingNo ? `Building No: ${consigneeBuildingNo}` : "",
    consigneeStreetNo ? `Street No: ${consigneeStreetNo}` : "",
    consigneeStreet ? `Street: ${consigneeStreet}` : "",
    consigneeTown ? `Town: ${consigneeTown}` : "",
    consigneeCity ? consigneeCity : "",
    consigneeZip ? `${consigneeZip}` : "",
    consigneeCountry,
  ].filter(Boolean);

  // Shipper zip from address
  const shipperAddrParts = booking.shipper.address
    .split(",")
    .map((p) => p.trim());
  const shipperCity =
    shipperAddrParts.length > 1
      ? shipperAddrParts[shipperAddrParts.length - 2]
      : "";
  const shipperZipMatch = booking.shipper.address.match(/Zip:\s*([^,\n]+)/i);
  const shipperZip = shipperZipMatch ? shipperZipMatch[1].trim() : "";

  return (
    <div
      style={{
        border: "2px solid #333",
        marginBottom: "16px",
        fontFamily: "Arial, Helvetica, sans-serif",
        background: "#fff",
      }}
    >
      {/* Header */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td
              style={{
                border: "1px solid #666",
                padding: "6px",
                width: "30%",
                verticalAlign: "middle",
              }}
            >
              <img
                src="/assets/uploads/20260305_152357_0000-removebg-preview-1.png"
                alt="Worldyfly"
                style={{ height: "50px", objectFit: "contain" }}
              />
            </td>
            <td
              style={{
                border: "1px solid #666",
                padding: "6px",
                verticalAlign: "top",
              }}
            >
              <div
                style={{
                  fontWeight: "800",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                }}
              >
                {COMPANY.name}
              </div>
              <div style={{ fontSize: "8px", color: "#555" }}>
                {COMPANY.address}
              </div>
              <div
                style={{
                  fontSize: "8px",
                  color: "#333",
                  fontWeight: "600",
                  marginTop: "2px",
                }}
              >
                Track your Shipment :- {COMPANY.website}
              </div>
            </td>
            <td
              style={{
                border: "1px solid #666",
                padding: "6px",
                width: "28%",
                verticalAlign: "top",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontWeight: "700",
                  fontSize: "11px",
                  marginBottom: "4px",
                  letterSpacing: "1px",
                  background: "#111",
                  color: "#fff",
                  padding: "2px 6px",
                }}
              >
                {copyLabel}
              </div>
              <BarcodeStrip value={awbNumber} />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Date / Origin / Ref No / Destination */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, width: "15%" }}>
              <span style={labelStyle}>DATE</span>
              <span style={valueStyle}>{dateStr}</span>
            </td>
            <td style={{ ...cellStyle, width: "18%" }}>
              <span style={labelStyle}>ORIGIN</span>
              <span style={valueStyle}>{booking.originCountry}</span>
            </td>
            <td style={{ ...cellStyle, width: "20%" }}>
              <span style={labelStyle}>REF NO.</span>
              <span style={valueStyle}>{booking.invoice.invoiceNumber}</span>
            </td>
            <td style={{ ...cellStyle }}>
              <span style={labelStyle}>DESTINATION</span>
              <span style={valueStyle}>{booking.destinationCountry}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Shipper / Consignee */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td
              style={{
                ...cellStyle,
                width: "50%",
                borderRight: "1px solid #666",
              }}
            >
              <span style={labelStyle}>SHIPPER (CONTACT / COMPANY NAME)</span>
              <span style={valueStyle}>{booking.shipper.name}</span>
            </td>
            <td style={{ ...cellStyle, width: "50%" }}>
              <span style={labelStyle}>CONSIGNEE (CONTACT / COMPANY NAME)</span>
              <span style={valueStyle}>{booking.consignee.name}</span>
            </td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #666" }}>
              <span style={labelStyle}>ADDRESS</span>
              <span style={{ ...valueStyle, fontSize: "9px" }}>
                {booking.shipper.address
                  .replace(/\nZip:[^,\n]*/i, "")
                  .replace(/,\s*Zip:[^,\n]*/i, "")}
              </span>
            </td>
            <td style={{ ...cellStyle }}>
              <span style={labelStyle}>ADDRESS</span>
              <span style={{ ...valueStyle, fontSize: "9px" }}>
                {consigneeAddressLines.join(", ")}
              </span>
              {consigneeEmail && (
                <span
                  style={{
                    ...valueStyle,
                    fontSize: "8px",
                    display: "block",
                    color: "#555",
                    marginTop: "2px",
                  }}
                >
                  Email: {consigneeEmail}
                </span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* KYC Details */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td colSpan={2} style={{ ...cellStyle }}>
              <span style={labelStyle}>KYC DETAILS</span>
              <span style={{ fontSize: "9px" }}>
                {KYC_LABEL[booking.shipper.kycType] ?? booking.shipper.kycType}{" "}
                Number &nbsp; <strong>{booking.shipper.kycNumber}</strong>
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* City / Zipcode / Country */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td
              style={{
                ...cellStyle,
                width: "25%",
                borderRight: "1px solid #666",
              }}
            >
              <span style={labelStyle}>CITY</span>
              <span style={valueStyle}>{shipperCity}</span>
            </td>
            <td
              style={{
                ...cellStyle,
                width: "14%",
                borderRight: "1px solid #666",
              }}
            >
              <span style={labelStyle}>ZIPCODE</span>
              <span style={valueStyle}>{shipperZip}</span>
            </td>
            <td
              style={{
                ...cellStyle,
                width: "11%",
                borderRight: "2px solid #333",
              }}
            >
              <span style={labelStyle}>COUNTRY</span>
              <span style={valueStyle}>INDIA</span>
            </td>
            <td
              style={{
                ...cellStyle,
                width: "25%",
                borderRight: "1px solid #666",
              }}
            >
              <span style={labelStyle}>CITY</span>
              <span style={valueStyle}>
                {consigneeCity || booking.destinationCountry}
              </span>
            </td>
            <td
              style={{
                ...cellStyle,
                width: "14%",
                borderRight: "1px solid #666",
              }}
            >
              <span style={labelStyle}>ZIPCODE</span>
              <span style={valueStyle}>{consigneeZip}</span>
            </td>
            <td style={{ ...cellStyle }}>
              <span style={labelStyle}>COUNTRY</span>
              <span style={valueStyle}>{consigneeCountry}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Tel No / Service */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td
              style={{
                ...cellStyle,
                width: "38%",
                borderRight: "1px solid #666",
              }}
            >
              <span style={labelStyle}>TEL NO.</span>
              <span style={valueStyle}>{booking.shipper.phone}</span>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #666" }}>
              <span style={labelStyle}>TEL NO.</span>
              <span style={valueStyle}>{booking.consignee.phone}</span>
            </td>
            <td style={{ ...cellStyle, width: "16%", textAlign: "center" }}>
              <span style={labelStyle}>SERVICE</span>
              <span
                style={{ ...valueStyle, fontSize: "11px", fontWeight: "800" }}
              >
                AIR
              </span>
              <br />
              <span style={{ fontSize: "8px" }}>ECONOMY</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Shipment Type / Declared Value / No PKG / Description / Service */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td
              style={{
                ...cellStyle,
                width: "14%",
                borderRight: "1px solid #666",
              }}
            >
              <span style={labelStyle}>SHIPMENT TYPE</span>
              <span style={valueStyle}>NON-DOX</span>
            </td>
            <td
              style={{
                ...cellStyle,
                width: "22%",
                borderRight: "1px solid #666",
              }}
            >
              <span style={labelStyle}>DECLARED VALUE</span>
              <span style={valueStyle}>
                {grandTotal.toFixed(2)} &nbsp; {booking.invoice.currency}
              </span>
            </td>
            <td
              style={{
                ...cellStyle,
                width: "12%",
                borderRight: "1px solid #666",
              }}
            >
              <span style={labelStyle}>NO OF PKG</span>
              <span style={valueStyle}>{noPkg}</span>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #666" }}>
              <span style={labelStyle}>DESCRIPTION OF GOODS</span>
              <span style={{ ...valueStyle, fontSize: "9px" }}>
                {descriptionOfGoods}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Actual Weight / Dimensions / Vol Weight / Pick Up */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td
              style={{
                ...cellStyle,
                width: "18%",
                borderRight: "1px solid #666",
              }}
            >
              <span style={labelStyle}>ACTUAL WEIGHT</span>
              <span style={valueStyle}>{totalWeight.toFixed(2)}</span>
            </td>
            <td
              style={{
                ...cellStyle,
                width: "30%",
                borderRight: "1px solid #666",
              }}
            >
              <span style={labelStyle}>DIMENSIONS (L×W×H cm)</span>
              <span style={{ ...valueStyle, fontSize: "9px" }}>
                {allDims || "—"}
              </span>
            </td>
            <td
              style={{
                ...cellStyle,
                width: "18%",
                borderRight: "1px solid #666",
              }}
            >
              <span style={labelStyle}>VOL WEIGHT</span>
              <span style={valueStyle}>{totalVolWeight.toFixed(2)}</span>
            </td>
            <td style={{ ...cellStyle }}>
              <span style={labelStyle}>PICK UP</span>
              <span style={valueStyle}>&nbsp;</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Shipper Agreement + Received in Good Condition */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td
              style={{
                ...cellStyle,
                width: "65%",
                borderRight: "1px solid #666",
                verticalAlign: "top",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontWeight: "700",
                  fontSize: "8px",
                  marginBottom: "3px",
                  textTransform: "uppercase",
                }}
              >
                SHIPPER AGREEMENT
              </span>
              <span
                style={{ fontSize: "7px", lineHeight: "1.4", color: "#555" }}
              >
                I/WE AGREE THAT TERMS AND CONDITION OF CARRIAGE APPLY TO THIS
                SHIPMENTS &amp; LIMIT LIABILITY.
              </span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "4px",
                  marginTop: "8px",
                }}
              >
                <div>
                  <span style={labelStyle}>NAME</span>
                  <div
                    style={{
                      borderBottom: "1px solid #aaa",
                      minHeight: "16px",
                    }}
                  />
                </div>
                <div>
                  <span style={labelStyle}>SIGN</span>
                  <div
                    style={{
                      borderBottom: "1px solid #aaa",
                      minHeight: "16px",
                    }}
                  />
                </div>
                <div>
                  <span style={labelStyle}>DATE</span>
                  <div
                    style={{
                      borderBottom: "1px solid #aaa",
                      minHeight: "16px",
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px",
                  marginTop: "4px",
                }}
              >
                <div>
                  <span style={labelStyle}>TIME</span>
                  <div
                    style={{
                      borderBottom: "1px solid #aaa",
                      minHeight: "16px",
                    }}
                  />
                </div>
              </div>
            </td>
            <td style={{ ...cellStyle, verticalAlign: "top" }}>
              <span
                style={{
                  display: "block",
                  fontWeight: "700",
                  fontSize: "8px",
                  marginBottom: "3px",
                  textTransform: "uppercase",
                }}
              >
                RECEIVED IN GOOD CONDITION
              </span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "4px",
                  marginTop: "6px",
                }}
              >
                <div>
                  <span style={labelStyle}>NAME</span>
                  <div
                    style={{
                      borderBottom: "1px solid #aaa",
                      minHeight: "16px",
                    }}
                  />
                </div>
                <div>
                  <span style={labelStyle}>SIGN</span>
                  <div
                    style={{
                      borderBottom: "1px solid #aaa",
                      minHeight: "16px",
                    }}
                  />
                </div>
                <div>
                  <span style={labelStyle}>DATE</span>
                  <div
                    style={{
                      borderBottom: "1px solid #aaa",
                      minHeight: "16px",
                    }}
                  />
                </div>
                <div>
                  <span style={labelStyle}>TIME</span>
                  <div
                    style={{
                      borderBottom: "1px solid #aaa",
                      minHeight: "16px",
                    }}
                  />
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function AWBDocument({ booking }: Props) {
  return (
    <>
      <style>{`
      @media screen {
        .awb-doc-root { max-width: 900px; padding: 16px; }
      }
      @media print {
        .awb-doc-root { max-width: 100%; padding: 0; }
        .barcode-bar { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      }
      .barcode-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
    `}</style>
      <div
        className="awb-doc-root"
        style={{
          fontFamily: "Arial, Helvetica, sans-serif",
          color: "#111",
          background: "#fff",
          margin: "0 auto",
        }}
      >
        <AWBCopy booking={booking} copyLabel="ACCOUNT COPY" />
        <AWBCopy booking={booking} copyLabel="SHIPPER COPY" />
      </div>
    </>
  );
}
