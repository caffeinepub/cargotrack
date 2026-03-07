import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Eye, FileText, Tag } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { BookingStatus } from "../../backend.d";
import type { Booking } from "../../backend.d";
import { StatusBadge } from "../../components/StatusBadge";
import {
  useFranchiseBookings,
  useLocalSession,
} from "../../hooks/useLocalStore";
import { exportBookingsToCSV } from "../../lib/excelExport";
import { formatDate, formatTimestamp } from "../../lib/helpers";
import { KYC_LABEL } from "../../lib/kycLabels";

function BookingDetail({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  const handlePrintInvoice = () => {
    window.open(`/print/invoice/${booking.bookingId.toString()}`, "_blank");
  };

  const handlePrintAWB = () => {
    window.open(`/print/awb/${booking.bookingId.toString()}`, "_blank");
  };

  const handlePrintLabel = () => {
    window.open(`/print/label/${booking.bookingId.toString()}`, "_blank");
  };

  return (
    <>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        data-ocid="franchise_booking_detail.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Booking #{booking.bookingId.toString()}
          </DialogTitle>
        </DialogHeader>

        {/* Print buttons at the TOP */}
        {booking.status === BookingStatus.approved && (
          <div className="flex flex-wrap gap-2 pb-2 border-b border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintAWB}
              data-ocid="franchise_booking_detail.print_awb_button"
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Print AWB
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintInvoice}
              data-ocid="franchise_booking_detail.secondary_button"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintLabel}
              data-ocid="franchise_booking_detail.print_label_button"
            >
              <Tag className="mr-1.5 h-3.5 w-3.5" />
              Print Label
            </Button>
          </div>
        )}

        <div className="space-y-6">
          {/* AWB + Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={booking.status} />
            {booking.awbNumber ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">AWB:</span>
                <span className="font-display font-bold text-xl text-primary font-mono">
                  {booking.awbNumber}
                </span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground italic">
                Awaiting AWB assignment
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {formatTimestamp(booking.createdTimestamp)}
            </span>
          </div>

          {/* Shipper + Consignee */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Shipper
              </h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{booking.shipper.name}</p>
                <p className="text-muted-foreground">{booking.shipper.phone}</p>
                <p className="text-muted-foreground text-xs">
                  {booking.shipper.address}
                </p>
                <p className="text-xs text-muted-foreground">
                  {KYC_LABEL[booking.shipper.kycType]}:{" "}
                  {booking.shipper.kycNumber}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Consignee
              </h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{booking.consignee.name}</p>
                <p className="text-muted-foreground">
                  {booking.consignee.phone}
                </p>
                <p className="text-muted-foreground text-xs">
                  {booking.consignee.address}
                </p>
                <p className="text-xs text-muted-foreground">
                  {KYC_LABEL[booking.consignee.idType]}:{" "}
                  {booking.consignee.idNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Route + Invoice */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Route
              </h3>
              <p className="text-sm">
                <span className="font-medium">{booking.originCountry}</span>
                <span className="mx-2 text-muted-foreground">→</span>
                <span className="font-medium">
                  {booking.destinationCountry}
                </span>
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Invoice
              </h3>
              <div className="text-sm space-y-1">
                <p>
                  <strong>#{booking.invoice.invoiceNumber}</strong>
                </p>
                <p className="text-muted-foreground">
                  {formatDate(booking.invoice.invoiceDate)} ·{" "}
                  {booking.invoice.currency}
                </p>
              </div>
            </div>
          </div>

          {/* Boxes */}
          {booking.boxes.length > 0 && (
            <div>
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Boxes
              </h3>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Box</TableHead>
                      <TableHead>Gross Wt</TableHead>
                      <TableHead>L×W×H</TableHead>
                      <TableHead>Vol Wt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {booking.boxes.map((b) => (
                      <TableRow key={b.boxNumber.toString()}>
                        <TableCell>#{b.boxNumber.toString()}</TableCell>
                        <TableCell>{b.grossWeight} kg</TableCell>
                        <TableCell>
                          {b.length}×{b.width}×{b.height} cm
                        </TableCell>
                        <TableCell>{b.volumeWeight.toFixed(3)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Items */}
          {booking.boxItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Items
              </h3>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Box</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>HS Code</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {booking.boxItems.map((item) => (
                      <TableRow
                        key={`${item.boxNumber.toString()}-${item.hsCode}-${item.description}`}
                      >
                        <TableCell>#{item.boxNumber.toString()}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.hsCode}
                        </TableCell>
                        <TableCell>{item.quantity.toString()}</TableCell>
                        <TableCell>
                          {booking.invoice.currency} {item.rate.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {booking.invoice.currency} {item.total.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="text-right mt-2">
                <span className="text-sm font-semibold">
                  Total: {booking.invoice.currency}{" "}
                  {booking.boxItems.reduce((s, i) => s + i.total, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            data-ocid="franchise_booking_detail.close_button"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </>
  );
}

export function FranchiseBookings() {
  const { session } = useLocalSession();
  const { bookings } = useFranchiseBookings(session?.userId ?? "");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View and track all your shipment bookings
          </p>
        </div>
        {bookings.length > 0 && (
          <Button
            variant="outline"
            onClick={() => exportBookingsToCSV(bookings)}
            data-ocid="my_bookings.download_button"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Excel
          </Button>
        )}
      </div>

      {bookings.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-border py-16 text-center"
          data-ocid="my_bookings.empty_state"
        >
          <p className="text-muted-foreground font-medium">No bookings yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first booking using the "New Booking" option
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table data-ocid="my_bookings.table">
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>AWB Number</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking, idx) => (
                <motion.tr
                  key={booking.bookingId.toString()}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                  data-ocid={`my_bookings.item.${idx + 1}`}
                >
                  <TableCell className="font-mono text-xs font-medium">
                    #{booking.bookingId.toString()}
                  </TableCell>
                  <TableCell>
                    {booking.awbNumber ? (
                      <span className="font-mono text-sm bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                        {booking.awbNumber}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">
                        Pending AWB
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-36 truncate">
                    {booking.destinationCountry}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={booking.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(booking.createdTimestamp)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedBooking(booking)}
                      data-ocid={`my_bookings.edit_button.${idx + 1}`}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      View
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedBooking && (
        <Dialog
          open={!!selectedBooking}
          onOpenChange={() => setSelectedBooking(null)}
        >
          <BookingDetail
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
          />
        </Dialog>
      )}
    </div>
  );
}
