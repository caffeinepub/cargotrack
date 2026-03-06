import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Eye,
  FileText,
  Loader2,
  Printer,
  Search,
} from "lucide-react";

import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { BookingStatus } from "../../backend.d";
import type { Booking } from "../../backend.d";
import { StatusBadge } from "../../components/StatusBadge";
import { TrackingTimeline } from "../../components/TrackingTimeline";
import {
  useAllBookings,
  useAllFranchises,
  useAssignAWBAndApprove,
  useRejectBooking,
  useTrackingByAWB,
} from "../../hooks/useLocalStore";
import { exportBookingsToCSV } from "../../lib/excelExport";
import { formatDate, formatTimestamp } from "../../lib/helpers";
import { KYC_LABEL } from "../../lib/kycLabels";

function BookingDetailModal({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  const { updates: tracking } = useTrackingByAWB(booking.awbNumber ?? null);
  const handlePrintInvoice = () => {
    window.open(`/print/invoice/${booking.bookingId.toString()}`, "_blank");
  };

  const handlePrintAWB = () => {
    window.open(`/print/awb/${booking.bookingId.toString()}`, "_blank");
  };

  const handlePrintAccountsInvoice = () => {
    window.open(
      `/print/accounts-invoice/${booking.bookingId.toString()}`,
      "_blank",
    );
  };

  return (
    <>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        data-ocid="booking_detail.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Booking #{booking.bookingId.toString()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status + AWB */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={booking.status} />
            {booking.awbNumber ? (
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded font-semibold">
                AWB: {booking.awbNumber}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground italic">
                AWB not assigned yet
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              Created: {formatTimestamp(booking.createdTimestamp)}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Shipper */}
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">
                Shipper Details
              </h3>
              <div className="space-y-1.5 text-sm">
                <p>
                  <strong>Name:</strong> {booking.shipper.name}
                </p>
                <p>
                  <strong>Phone:</strong> {booking.shipper.phone}
                </p>
                <p>
                  <strong>Address:</strong> {booking.shipper.address}
                </p>
                <p>
                  <strong>KYC:</strong>{" "}
                  {KYC_LABEL[booking.shipper.kycType] ??
                    booking.shipper.kycType}{" "}
                  — {booking.shipper.kycNumber}
                </p>
              </div>
            </div>

            {/* Consignee */}
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">
                Consignee Details
              </h3>
              <div className="space-y-1.5 text-sm">
                <p>
                  <strong>Name:</strong> {booking.consignee.name}
                </p>
                <p>
                  <strong>Phone:</strong> {booking.consignee.phone}
                </p>
                <p>
                  <strong>Address:</strong> {booking.consignee.address}
                </p>
                <p>
                  <strong>ID:</strong>{" "}
                  {KYC_LABEL[booking.consignee.idType] ??
                    booking.consignee.idType}{" "}
                  — {booking.consignee.idNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Route + Invoice */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">
                Shipment Route
              </h3>
              <div className="space-y-1.5 text-sm">
                <p>
                  <strong>Origin:</strong> {booking.originCountry}
                </p>
                <p>
                  <strong>Destination:</strong> {booking.destinationCountry}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">
                Invoice
              </h3>
              <div className="space-y-1.5 text-sm">
                <p>
                  <strong>Invoice #:</strong> {booking.invoice.invoiceNumber}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {formatDate(booking.invoice.invoiceDate)}
                </p>
                <p>
                  <strong>Currency:</strong> {booking.invoice.currency}
                </p>
              </div>
            </div>
          </div>

          {/* Boxes */}
          {booking.boxes.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">
                Boxes ({booking.boxes.length})
              </h3>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Box #</TableHead>
                      <TableHead>Gross Wt (kg)</TableHead>
                      <TableHead>L×W×H (cm)</TableHead>
                      <TableHead>Vol Wt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {booking.boxes.map((box) => (
                      <TableRow key={box.boxNumber.toString()}>
                        <TableCell>{box.boxNumber.toString()}</TableCell>
                        <TableCell>{box.grossWeight}</TableCell>
                        <TableCell>
                          {box.length}×{box.width}×{box.height}
                        </TableCell>
                        <TableCell>{box.volumeWeight.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Box Items */}
          {booking.boxItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">
                Items
              </h3>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Box #</TableHead>
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
                        key={`${item.boxNumber.toString()}-${item.description}-${item.hsCode}`}
                      >
                        <TableCell>{item.boxNumber.toString()}</TableCell>
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
            </div>
          )}

          {/* Tracking */}
          <div>
            <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">
              Tracking History
            </h3>
            {tracking && tracking.length > 0 ? (
              <TrackingTimeline updates={tracking} compact />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No tracking updates yet.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          {booking.status === BookingStatus.approved && (
            <>
              <Button
                variant="outline"
                onClick={handlePrintAWB}
                data-ocid="booking_detail.print_awb_button"
              >
                <FileText className="mr-2 h-4 w-4" />
                Print AWB
              </Button>
              <Button
                variant="outline"
                onClick={handlePrintInvoice}
                data-ocid="booking_detail.secondary_button"
              >
                Download Invoice
              </Button>
              <Button
                variant="outline"
                onClick={handlePrintAccountsInvoice}
                data-ocid="booking_detail.accounts_invoice_button"
              >
                <Printer className="mr-2 h-4 w-4" />
                Accounts Invoice
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            data-ocid="booking_detail.close_button"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </>
  );
}

export function AdminBookings() {
  const { bookings } = useAllBookings();
  const { franchises } = useAllFranchises();
  const { mutate: assignAWB } = useAssignAWBAndApprove();
  const { mutate: rejectBooking } = useRejectBooking();

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [franchiseFilter, setFranchiseFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [assigningBooking, setAssigningBooking] = useState<Booking | null>(
    null,
  );
  const [awbInput, setAwbInput] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const selectedFranchiseName =
    franchiseFilter !== "all"
      ? (franchises.find((f) => f.username === franchiseFilter)
          ?.franchiseName ?? franchiseFilter)
      : undefined;

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && b.status === BookingStatus.pending) ||
      (filter === "approved" && b.status === BookingStatus.approved) ||
      (filter === "rejected" && b.status === BookingStatus.rejected);
    const matchesSearch =
      !search ||
      b.shipper.name.toLowerCase().includes(search.toLowerCase()) ||
      b.destinationCountry.toLowerCase().includes(search.toLowerCase()) ||
      (b.awbNumber?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      b.bookingId.toString().includes(search);
    const matchesFranchise =
      franchiseFilter === "all" || b.createdBy === franchiseFilter;
    return matchesFilter && matchesSearch && matchesFranchise;
  });

  const handleAssign = async () => {
    if (!assigningBooking || !awbInput.trim()) return;
    setIsAssigning(true);
    await new Promise((r) => setTimeout(r, 300));
    const success = assignAWB(assigningBooking.bookingId, awbInput.trim());
    if (success) {
      toast.success(`AWB ${awbInput.trim()} assigned and approved`);
      setAssigningBooking(null);
      setAwbInput("");
    } else {
      toast.error("Failed to assign AWB");
    }
    setIsAssigning(false);
  };

  const handleReject = (booking: Booking) => {
    const success = rejectBooking(booking.bookingId);
    if (success) {
      toast.success("Booking rejected");
    } else {
      toast.error("Failed to reject");
    }
  };

  const pendingCount = bookings.filter(
    (b) => b.status === BookingStatus.pending,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">All Bookings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and track all shipment bookings
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            exportBookingsToCSV(filteredBookings, selectedFranchiseName)
          }
          disabled={filteredBookings.length === 0}
          data-ocid="bookings.download_button"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Excel
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, AWB, destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="bookings.search_input"
          />
        </div>
        <Select value={franchiseFilter} onValueChange={setFranchiseFilter}>
          <SelectTrigger className="w-48" data-ocid="bookings.franchise.select">
            <SelectValue placeholder="All Franchises" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Franchises</SelectItem>
            <SelectItem value="admin">Admin (direct)</SelectItem>
            {franchises.map((f) => (
              <SelectItem key={f.franchiseId} value={f.username}>
                {f.franchiseName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList data-ocid="bookings.filter.tab">
          <TabsTrigger value="all" data-ocid="bookings.all.tab">
            All ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-ocid="bookings.pending.tab">
            Pending {pendingCount > 0 && `(${pendingCount})`}
          </TabsTrigger>
          <TabsTrigger value="approved" data-ocid="bookings.approved.tab">
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" data-ocid="bookings.rejected.tab">
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {filteredBookings.length === 0 ? (
            <div
              className="py-16 text-center text-muted-foreground"
              data-ocid="bookings.empty_state"
            >
              No bookings found.
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table data-ocid="bookings.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>AWB</TableHead>
                    <TableHead>Shipper</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking, idx) => (
                    <TableRow
                      key={booking.bookingId.toString()}
                      className="cursor-pointer hover:bg-muted/30"
                      data-ocid={`bookings.item.${idx + 1}`}
                    >
                      <TableCell className="font-mono text-xs font-medium">
                        #{booking.bookingId.toString()}
                      </TableCell>
                      <TableCell>
                        {booking.awbNumber ? (
                          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                            {booking.awbNumber}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">
                            Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-32 truncate">
                        {booking.shipper.name}
                      </TableCell>
                      <TableCell className="max-w-32 truncate">
                        {booking.destinationCountry}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={booking.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(booking.createdTimestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedBooking(booking)}
                            data-ocid={`bookings.edit_button.${idx + 1}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {booking.status === BookingStatus.pending && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setAssigningBooking(booking);
                                  setAwbInput("");
                                }}
                                data-ocid={`bookings.save_button.${idx + 1}`}
                              >
                                Assign AWB
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(booking)}
                                data-ocid={`bookings.delete_button.${idx + 1}`}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <Dialog
          open={!!selectedBooking}
          onOpenChange={() => setSelectedBooking(null)}
        >
          <BookingDetailModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
          />
        </Dialog>
      )}

      {/* Assign AWB Dialog */}
      <Dialog
        open={!!assigningBooking}
        onOpenChange={(open) => !open && setAssigningBooking(null)}
      >
        <DialogContent data-ocid="assign_awb.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Assign AWB Number
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {assigningBooking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg bg-muted p-3 text-sm space-y-1"
              >
                <p>
                  <strong>Booking:</strong> #
                  {assigningBooking.bookingId.toString()}
                </p>
                <p>
                  <strong>Shipper:</strong> {assigningBooking.shipper.name}
                </p>
                <p>
                  <strong>Destination:</strong>{" "}
                  {assigningBooking.destinationCountry}
                </p>
              </motion.div>
            )}
            <div className="space-y-2">
              <Label htmlFor="awb-number">AWB Number</Label>
              <Input
                id="awb-number"
                placeholder="e.g. CT-2026-00123"
                value={awbInput}
                onChange={(e) => setAwbInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAssign()}
                data-ocid="assign_awb.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssigningBooking(null)}
              data-ocid="assign_awb.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!awbInput.trim() || isAssigning}
              data-ocid="assign_awb.confirm_button"
            >
              {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign &amp; Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
