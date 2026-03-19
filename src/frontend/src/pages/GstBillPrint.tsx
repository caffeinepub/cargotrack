import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type GstServiceRow = {
  id: string;
  serviceName: string;
  taxableAmount: number;
};

type GstBill = {
  id: string;
  billNumber: string;
  date: string;
  shipperName: string;
  shipperGstin: string;
  worldyflyGstin: string;
  taxType: "cgst_sgst" | "igst";
  services: GstServiceRow[];
  totalTaxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  createdAt: string;
};

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function numToWords(n: number): string {
  if (n === 0) return "";
  if (n < 20) return ONES[n];
  if (n < 100) {
    const rem = n % 10;
    return rem !== 0
      ? `${TENS[Math.floor(n / 10)]} ${ONES[rem]}`
      : TENS[Math.floor(n / 10)];
  }
  if (n < 1000) {
    const rem = n % 100;
    return rem !== 0
      ? `${ONES[Math.floor(n / 100)]} Hundred ${numToWords(rem)}`
      : `${ONES[Math.floor(n / 100)]} Hundred`;
  }
  if (n < 100000) {
    const rem = n % 1000;
    return rem !== 0
      ? `${numToWords(Math.floor(n / 1000))} Thousand ${numToWords(rem)}`
      : `${numToWords(Math.floor(n / 1000))} Thousand`;
  }
  if (n < 10000000) {
    const rem = n % 100000;
    return rem !== 0
      ? `${numToWords(Math.floor(n / 100000))} Lakh ${numToWords(rem)}`
      : `${numToWords(Math.floor(n / 100000))} Lakh`;
  }
  const rem = n % 10000000;
  return rem !== 0
    ? `${numToWords(Math.floor(n / 10000000))} Crore ${numToWords(rem)}`
    : `${numToWords(Math.floor(n / 10000000))} Crore`;
}

function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  const rupeePart = rupees === 0 ? "Zero" : numToWords(rupees);
  const paisePart = paise > 0 ? ` and ${numToWords(paise)} Paise` : "";
  return `INR ${rupeePart} Rupees${paisePart} Only`.toUpperCase();
}

export function GstBillPrint() {
  const { gstBillId } = useParams({ strict: false }) as { gstBillId: string };
  const [bill, setBill] = useState<GstBill | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("gstBills");
    if (!stored) {
      setNotFound(true);
      return;
    }
    const bills: GstBill[] = JSON.parse(stored);
    const found = bills.find((b) => b.id === gstBillId);
    if (!found) {
      setNotFound(true);
      return;
    }
    setBill(found);
  }, [gstBillId]);

  if (notFound) {
    return (
      <div
        style={{
          padding: "40px",
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
        }}
      >
        <h2>GST Bill Not Found</h2>
        <p>
          The bill ID <strong>{gstBillId}</strong> could not be found.
        </p>
      </div>
    );
  }

  if (!bill) {
    return (
      <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        Loading...
      </div>
    );
  }

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(n);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        body { font-family: Arial, sans-serif; font-size: 10pt; color: #000; background: #fff; }
        .print-page { max-width: 800px; margin: 0 auto; padding: 24px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 6px 8px; }
        th { background: #f2f2f2; font-size: 9pt; text-align: center; }
        td { font-size: 9pt; vertical-align: top; }
        .header-table td { border: none; padding: 2px 0; }
        .total-row td { font-weight: bold; }
      `}</style>

      <div className="print-page">
        {/* Print button */}
        <div
          className="no-print"
          style={{ marginBottom: "16px", display: "flex", gap: "10px" }}
        >
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: "8px 20px",
              background: "#1a3c6e",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            🖨️ Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            style={{
              padding: "8px 16px",
              background: "#eee",
              border: "1px solid #ccc",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Header */}
        <table style={{ marginBottom: "12px", border: "1px solid #000" }}>
          <tbody>
            <tr>
              <td style={{ width: "80px", border: "none", padding: "8px" }}>
                <img
                  src="/assets/uploads/20260305_152357_0000-removebg-preview-1.png"
                  alt="Worldyfly Logo"
                  style={{ width: "70px", height: "auto" }}
                />
              </td>
              <td style={{ border: "none", padding: "8px" }}>
                <div style={{ fontWeight: "bold", fontSize: "14pt" }}>
                  WORLDYFLY LOGISTICS
                </div>
                <div
                  style={{
                    fontSize: "9pt",
                    marginTop: "3px",
                    lineHeight: "1.5",
                  }}
                >
                  11/423H, Second Floor, St Joseph Building, Akapparambu
                  Junction,
                  <br />
                  Opposite Cochin International Airport, Nedumbasserry - 686583
                  <br />
                  Phone: +91 95263 69141 | Email: info@worldyfly.com |
                  www.worldyfly.com
                </div>
              </td>
              <td
                style={{
                  border: "none",
                  padding: "8px",
                  textAlign: "right",
                  verticalAlign: "top",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    fontSize: "16pt",
                    color: "#1a3c6e",
                  }}
                >
                  TAX INVOICE
                </div>
                <div style={{ fontSize: "8pt", marginTop: "4px" }}>
                  <strong>GSTIN:</strong> {bill.worldyflyGstin}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bill details + Billed To */}
        <table style={{ marginBottom: "12px" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%" }}>
                <div
                  style={{
                    fontSize: "8pt",
                    fontWeight: "bold",
                    marginBottom: "3px",
                  }}
                >
                  BILLED TO
                </div>
                <div style={{ fontSize: "10pt", fontWeight: "bold" }}>
                  {bill.shipperName}
                </div>
                {bill.shipperGstin && (
                  <div style={{ fontSize: "9pt", marginTop: "3px" }}>
                    <strong>GSTIN:</strong> {bill.shipperGstin}
                  </div>
                )}
              </td>
              <td style={{ width: "50%" }}>
                <table className="header-table">
                  <tbody>
                    <tr>
                      <td
                        style={{
                          fontSize: "9pt",
                          fontWeight: "bold",
                          width: "120px",
                        }}
                      >
                        Invoice No.:
                      </td>
                      <td style={{ fontSize: "9pt" }}>{bill.billNumber}</td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: "9pt", fontWeight: "bold" }}>
                        Date:
                      </td>
                      <td style={{ fontSize: "9pt" }}>{bill.date}</td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: "9pt", fontWeight: "bold" }}>
                        Tax Type:
                      </td>
                      <td style={{ fontSize: "9pt" }}>
                        {bill.taxType === "cgst_sgst"
                          ? "CGST + SGST (Intrastate - Kerala)"
                          : "IGST (Interstate/International)"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Services table */}
        <table style={{ marginBottom: "0" }}>
          <thead>
            <tr>
              <th style={{ width: "5%" }}>S.No</th>
              <th style={{ width: "65%", textAlign: "left" }}>
                Description of Service
              </th>
              <th style={{ width: "30%", textAlign: "right" }}>
                Taxable Amount (INR)
              </th>
            </tr>
          </thead>
          <tbody>
            {bill.services.map((svc, idx) => (
              <tr key={svc.id}>
                <td style={{ textAlign: "center" }}>{idx + 1}</td>
                <td>{svc.serviceName}</td>
                <td style={{ textAlign: "right" }}>
                  {formatINR(svc.taxableAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* GST Breakdown */}
        <table style={{ marginBottom: "12px" }}>
          <tbody>
            <tr>
              <td
                style={{
                  border: "1px solid #000",
                  textAlign: "right",
                  fontWeight: "bold",
                }}
              >
                Total Taxable Amount
              </td>
              <td
                style={{
                  border: "1px solid #000",
                  textAlign: "right",
                  width: "30%",
                }}
              >
                {formatINR(bill.totalTaxable)}
              </td>
            </tr>
            {bill.taxType === "cgst_sgst" ? (
              <>
                <tr>
                  <td style={{ border: "1px solid #000", textAlign: "right" }}>
                    CGST @ 9%
                  </td>
                  <td style={{ border: "1px solid #000", textAlign: "right" }}>
                    {formatINR(bill.cgst)}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000", textAlign: "right" }}>
                    SGST @ 9%
                  </td>
                  <td style={{ border: "1px solid #000", textAlign: "right" }}>
                    {formatINR(bill.sgst)}
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td style={{ border: "1px solid #000", textAlign: "right" }}>
                  IGST @ 18%
                </td>
                <td style={{ border: "1px solid #000", textAlign: "right" }}>
                  {formatINR(bill.igst)}
                </td>
              </tr>
            )}
            <tr className="total-row">
              <td
                style={{
                  border: "1px solid #000",
                  textAlign: "right",
                  fontSize: "11pt",
                }}
              >
                Grand Total
              </td>
              <td
                style={{
                  border: "1px solid #000",
                  textAlign: "right",
                  fontSize: "11pt",
                }}
              >
                {formatINR(bill.grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Amount in words */}
        <table style={{ marginBottom: "12px" }}>
          <tbody>
            <tr>
              <td style={{ border: "1px solid #000" }}>
                <span style={{ fontWeight: "bold", fontSize: "8pt" }}>
                  Amount Chargeable (in Words):{" "}
                </span>
                {amountInWords(bill.grandTotal)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Declaration / Signature */}
        <table>
          <tbody>
            <tr>
              <td
                style={{
                  width: "70%",
                  height: "70px",
                  border: "1px solid #000",
                }}
              >
                <span style={{ fontWeight: "bold", fontSize: "8pt" }}>
                  Declaration:{" "}
                </span>
                <span style={{ fontSize: "9pt" }}>
                  We declare that this invoice shows the actual price of the
                  services described and that all particulars are true and
                  correct.
                </span>
              </td>
              <td
                style={{
                  width: "30%",
                  height: "70px",
                  border: "1px solid #000",
                  textAlign: "center",
                  verticalAlign: "bottom",
                  paddingBottom: "6px",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "9pt" }}>
                  For Worldyfly Logistics
                </div>
                <div style={{ fontSize: "8pt", marginTop: "20px" }}>
                  Authorised Signatory
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style={{
            marginTop: "16px",
            textAlign: "center",
            fontSize: "8pt",
            color: "#666",
          }}
        >
          This is a computer generated invoice. | www.worldyfly.com
        </div>
      </div>
    </>
  );
}
