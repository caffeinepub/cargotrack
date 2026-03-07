import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Booking } from "../backend.d";
import { getAllBookings, storedToBooking } from "../lib/store";
import { AWBDocument } from "./franchise/AWBDocument";
import { AccountsInvoiceDocument } from "./franchise/AccountsInvoiceDocument";
import { InvoiceDocument } from "./franchise/InvoiceDocument";
import { LabelDocument } from "./franchise/LabelDocument";

interface PrintPageProps {
  docType: "invoice" | "awb" | "accounts-invoice" | "label";
}

export function PrintPage({ docType }: PrintPageProps) {
  const { bookingId } = useParams({ strict: false }) as { bookingId?: string };
  const [booking, setBooking] = useState<Booking | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setNotFound(true);
      return;
    }
    const all = getAllBookings();
    const found = all.find((b) => b.bookingId.toString() === bookingId);
    if (found) {
      setBooking(storedToBooking(found));
    } else {
      setNotFound(true);
    }
  }, [bookingId]);

  // No auto-print: user sees the document on screen first and clicks Print manually

  if (notFound) {
    return (
      <div
        style={{
          padding: "40px",
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
        }}
      >
        <h2>Booking not found</h2>
        <p>
          The booking ID "{bookingId}" could not be found. Please close this tab
          and try again.
        </p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div
        style={{
          padding: "40px",
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
        }}
      >
        <p>Loading document...</p>
      </div>
    );
  }

  const printStyles =
    docType === "label"
      ? `
        @media print {
          @page { size: 4in 6in; margin: 0; }
          body { margin: 0; background: #fff; }
          .no-print { display: none !important; }
          .label-wrapper { padding: 0 !important; background: #fff !important; min-height: unset !important; }
        }
      `
      : `
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          body { margin: 0; background: #fff; }
          .no-print { display: none !important; }
        }
      `;

  return (
    <div>
      <style>{printStyles}</style>
      <div
        className="no-print"
        style={{
          background: "#f5f5f5",
          padding: "8px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #ddd",
          fontFamily: "Arial, sans-serif",
          fontSize: "13px",
        }}
      >
        <span>
          {docType === "invoice"
            ? "Invoice"
            : docType === "accounts-invoice"
              ? "Accounts Invoice"
              : docType === "label"
                ? "Shipping Label"
                : "AWB"}{" "}
          — Booking #{bookingId}
        </span>
        <button
          type="button"
          onClick={() => window.print()}
          style={{
            background: "#1a1a1a",
            color: "#fff",
            border: "none",
            padding: "6px 16px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Print / Save as PDF
        </button>
      </div>
      {docType === "invoice" ? (
        <InvoiceDocument booking={booking} />
      ) : docType === "accounts-invoice" ? (
        <AccountsInvoiceDocument booking={booking} />
      ) : docType === "label" ? (
        <div
          className="label-wrapper"
          style={{
            padding: "20px",
            background: "#f5f5f5",
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <LabelDocument booking={booking} />
        </div>
      ) : (
        <AWBDocument booking={booking} />
      )}
    </div>
  );
}
