import type { Booking } from "../../backend.d";
import { AWBDocument } from "./AWBDocument";

interface AWBPrintViewProps {
  booking: Booking;
}

export function AWBPrintView({ booking }: AWBPrintViewProps) {
  return (
    <div className="awb-print-root fixed inset-0 z-[9999] bg-white overflow-auto print:relative print:inset-auto print:z-auto">
      <style>{`
        @media print {
          body > * {
            display: none !important;
          }
          .awb-print-root {
            display: block !important;
            position: static !important;
          }
        }
      `}</style>
      <AWBDocument booking={booking} />
    </div>
  );
}
