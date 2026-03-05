import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { BookingStatus } from "../../backend.d";
import type { Booking } from "../../backend.d";
import { StatusBadge } from "../../components/StatusBadge";
import {
  useAllBookings,
  useAssignAWBAndApprove,
  useRejectBooking,
} from "../../hooks/useLocalStore";
import { formatDate } from "../../lib/helpers";

export function AdminDashboard() {
  const { bookings } = useAllBookings();
  const { mutate: assignAWB } = useAssignAWBAndApprove();
  const { mutate: rejectBooking } = useRejectBooking();

  const [assigningBooking, setAssigningBooking] = useState<Booking | null>(
    null,
  );
  const [awbInput, setAwbInput] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const total = bookings.length;
  const pending = bookings.filter((b) => b.status === BookingStatus.pending);
  const approved = bookings.filter(
    (b) => b.status === BookingStatus.approved,
  ).length;
  const rejected = bookings.filter(
    (b) => b.status === BookingStatus.rejected,
  ).length;

  const handleAssign = async () => {
    if (!assigningBooking || !awbInput.trim()) return;
    setIsAssigning(true);
    await new Promise((r) => setTimeout(r, 300));
    const success = assignAWB(assigningBooking.bookingId, awbInput.trim());
    if (success) {
      toast.success(`AWB ${awbInput.trim()} assigned and booking approved`);
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
      toast.error("Failed to reject booking");
    }
  };

  const statCards = [
    {
      label: "Total Bookings",
      value: total,
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Pending Approval",
      value: pending.length,
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Approved",
      value: approved,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Rejected",
      value: rejected,
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of all shipments and pending actions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
                      {card.label}
                    </p>
                    <p className="font-display text-3xl font-bold">
                      {card.value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${card.bg}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pending Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">
            Pending Approvals
            {pending.length > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold px-1.5">
                {pending.length}
              </span>
            )}
          </h2>
          <Link to="/admin/bookings">
            <Button variant="ghost" size="sm" data-ocid="admin.view_all.link">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>

        {pending.length === 0 ? (
          <Card>
            <CardContent
              className="py-10 text-center"
              data-ocid="dashboard.empty_state"
            >
              <CheckCircle2 className="h-8 w-8 mx-auto text-success mb-2" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm text-muted-foreground">
                No pending bookings to approve.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 5).map((booking, idx) => (
              <motion.div
                key={booking.bookingId.toString()}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                data-ocid={`dashboard.booking.item.${idx + 1}`}
              >
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm truncate">
                            #{booking.bookingId.toString()}
                          </p>
                          <StatusBadge status={booking.status} />
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {booking.shipper.name} → {booking.destinationCountry}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(booking.createdTimestamp)}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          onClick={() => {
                            setAssigningBooking(booking);
                            setAwbInput("");
                          }}
                          data-ocid={`dashboard.booking.edit_button.${idx + 1}`}
                        >
                          Assign AWB
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(booking)}
                          data-ocid={`dashboard.booking.delete_button.${idx + 1}`}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Bookings Table */}
      {bookings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">
              Recent Bookings
            </h2>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground uppercase text-xs tracking-wider">
                    ID
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground uppercase text-xs tracking-wider">
                    Shipper
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground uppercase text-xs tracking-wider">
                    Destination
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground uppercase text-xs tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground uppercase text-xs tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 8).map((b, i) => (
                  <tr
                    key={b.bookingId.toString()}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                    data-ocid={`dashboard.recent.item.${i + 1}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium">
                      #{b.bookingId.toString()}
                    </td>
                    <td className="px-4 py-3 max-w-[160px] truncate">
                      {b.shipper.name}
                    </td>
                    <td className="px-4 py-3 max-w-[160px] truncate">
                      {b.destinationCountry}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(b.createdTimestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
          <div className="py-2 space-y-4">
            {assigningBooking && (
              <div className="rounded-lg bg-muted p-3 text-sm">
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
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="awb-input">AWB Number</Label>
              <Input
                id="awb-input"
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
