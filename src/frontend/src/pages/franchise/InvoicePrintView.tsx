import type { Booking } from "../../backend.d";
import { InvoiceDocument } from "./InvoiceDocument";

interface InvoicePrintViewProps {
  booking: Booking;
}

export function InvoicePrintView({ booking }: InvoicePrintViewProps) {
  return (
    <div className="invoice-print-root fixed inset-0 z-[9999] bg-white overflow-auto print:relative print:inset-auto print:z-auto">
      <style>{`
        @media print {
          body > * {
            display: none !important;
          }
          .invoice-print-root {
            display: block !important;
            position: static !important;
          }
        }
      `}</style>
      <InvoiceDocument booking={booking} />
    </div>
  );
}
