import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { BookingStatus, TrackingMilestone } from "../../backend.d";
import { TrackingTimeline } from "../../components/TrackingTimeline";
import {
  useAddTrackingUpdate,
  useAllBookings,
  useDeleteTrackingUpdate,
  useTrackingByAWB,
} from "../../hooks/useLocalStore";
import { CARRIERS, MILESTONE_LABELS } from "../../lib/constants";
import { formatTimestamp } from "../../lib/helpers";

export function AdminTracking() {
  const { bookings } = useAllBookings();
  const approvedBookings = bookings.filter(
    (b) => b.status === BookingStatus.approved && b.awbNumber,
  );

  const [selectedAWB, setSelectedAWB] = useState<string>("");
  const [milestone, setMilestone] = useState<TrackingMilestone | "">("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [notes, setNotes] = useState("");
  const [carrier, setCarrier] = useState("");
  const [carrierTrackingNumber, setCarrierTrackingNumber] = useState("");
  const [carrierTrackingURL, setCarrierTrackingURL] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { updates: trackingUpdates } = useTrackingByAWB(selectedAWB || null);
  const { mutate: addUpdate } = useAddTrackingUpdate();
  const { mutate: deleteUpdate } = useDeleteTrackingUpdate();

  const handleSubmit = async () => {
    if (!selectedAWB || !milestone) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 300));
    try {
      addUpdate({
        awbNumber: selectedAWB,
        milestone: milestone as TrackingMilestone,
        notes: notes.trim() || null,
        carrierName:
          milestone === TrackingMilestone.handoverToCarrier
            ? carrier || null
            : null,
        carrierTrackingNumber:
          milestone === TrackingMilestone.handoverToCarrier
            ? carrierTrackingNumber.trim() || null
            : null,
        carrierTrackingURL:
          milestone === TrackingMilestone.handoverToCarrier
            ? carrierTrackingURL.trim() || null
            : null,
      });
      toast.success("Tracking update added successfully");
      setMilestone("");
      setNotes("");
      setCarrier("");
      setCarrierTrackingNumber("");
      setCarrierTrackingURL("");
    } catch {
      toast.error("Failed to add tracking update");
    }
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    deleteUpdate(id);
    toast.success("Tracking update removed");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Tracking Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Update shipment tracking milestones for approved bookings
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Select Shipment + Add Update */}
        <div className="space-y-6">
          {/* Select Shipment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base">
                Select Shipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedAWB} onValueChange={setSelectedAWB}>
                <SelectTrigger data-ocid="tracking.select">
                  <SelectValue placeholder="Select AWB number..." />
                </SelectTrigger>
                <SelectContent>
                  {approvedBookings.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      No approved bookings yet
                    </div>
                  ) : (
                    approvedBookings.map((b) => (
                      <SelectItem
                        key={b.bookingId.toString()}
                        value={b.awbNumber!}
                      >
                        {b.awbNumber} — {b.shipper.name} →{" "}
                        {b.destinationCountry}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Add Tracking Update */}
          {selectedAWB && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base">
                    Add Tracking Update
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Milestone</Label>
                    <Select
                      value={milestone}
                      onValueChange={(v) =>
                        setMilestone(v as TrackingMilestone)
                      }
                    >
                      <SelectTrigger data-ocid="tracking.milestone.select">
                        <SelectValue placeholder="Select milestone..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MILESTONE_LABELS).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        data-ocid="tracking.date.input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        data-ocid="tracking.time.input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      placeholder="Add notes about this update..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      data-ocid="tracking.notes.textarea"
                    />
                  </div>

                  {/* Carrier fields — only show for handover milestone */}
                  {milestone === TrackingMilestone.handoverToCarrier && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3 border-t border-border pt-3"
                    >
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Carrier Details
                      </p>
                      <div className="space-y-2">
                        <Label>Carrier</Label>
                        <Select value={carrier} onValueChange={setCarrier}>
                          <SelectTrigger data-ocid="tracking.carrier.select">
                            <SelectValue placeholder="Select carrier..." />
                          </SelectTrigger>
                          <SelectContent>
                            {CARRIERS.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Carrier Tracking Number</Label>
                        <Input
                          placeholder="e.g. 1Z999AA10123456784"
                          value={carrierTrackingNumber}
                          onChange={(e) =>
                            setCarrierTrackingNumber(e.target.value)
                          }
                          data-ocid="tracking.carrier_number.input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Carrier Tracking URL</Label>
                        <Input
                          placeholder="https://tracking.carrier.com/..."
                          value={carrierTrackingURL}
                          onChange={(e) =>
                            setCarrierTrackingURL(e.target.value)
                          }
                          data-ocid="tracking.carrier_url.input"
                        />
                      </div>
                    </motion.div>
                  )}

                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={!milestone || isSubmitting}
                    data-ocid="tracking.submit_button"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Add Tracking Update
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right: Tracking Timeline */}
        <div>
          {selectedAWB ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base">
                  Current Tracking —{" "}
                  <span className="font-mono text-primary">{selectedAWB}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trackingUpdates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No tracking updates yet for this shipment.
                  </p>
                ) : (
                  <div className="space-y-0">
                    {/* Show timeline with delete buttons */}
                    {[...trackingUpdates]
                      .sort((a, b) => Number(b.timestamp - a.timestamp))
                      .map((update) => {
                        const withId = update as typeof update & {
                          id?: string;
                        };
                        return (
                          <div
                            key={`${update.milestone}-${update.timestamp.toString()}`}
                            className="flex items-start gap-2 group"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="border-b border-border pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-semibold text-sm">
                                      {MILESTONE_LABELS[update.milestone] ??
                                        update.milestone}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatTimestamp(update.timestamp)}
                                    </p>
                                    {update.notes && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {update.notes}
                                      </p>
                                    )}
                                    {update.carrierName && (
                                      <p className="text-sm mt-1">
                                        <span className="font-medium">
                                          {update.carrierName}
                                        </span>
                                        {update.carrierTrackingNumber &&
                                          ` — ${update.carrierTrackingNumber}`}
                                        {update.carrierTrackingURL && (
                                          <a
                                            href={update.carrierTrackingURL}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-2 text-primary underline text-xs"
                                          >
                                            Track →
                                          </a>
                                        )}
                                      </p>
                                    )}
                                  </div>
                                  {withId.id && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                      onClick={() => handleDelete(withId.id!)}
                                      data-ocid="tracking.delete_button"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center py-24 text-muted-foreground text-sm">
              Select a shipment to view tracking
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
