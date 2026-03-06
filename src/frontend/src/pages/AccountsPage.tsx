import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  ChevronDown,
  ChevronRight,
  PackageOpen,
  Pencil,
  Plus,
  Printer,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Booking } from "../backend.d";
import {
  useAllBookings,
  useChargesByBooking,
  useDeleteCharge,
  useFranchiseBookings,
  useLocalSession,
  useSaveCharge,
  useUpdateCharge,
} from "../hooks/useLocalStore";
import { type StoredCharge, getChargesByBooking } from "../lib/store";

// ─── Preset charge labels ────────────────────────────────────────────────────

const PRESET_CHARGES = [
  "Freight",
  "PCS Charges",
  "Customs Duty",
  "Packaging Charges",
  "Documentation Charges",
];

// ─── Editable charge row (for new charges) ──────────────────────────────────

interface EditRowProps {
  initialLabel?: string;
  currency: string;
  onSave: (label: string, amount: number) => void;
  onCancel: () => void;
  ocidPrefix: string;
}

function EditRow({
  initialLabel = "",
  currency,
  onSave,
  onCancel,
  ocidPrefix,
}: EditRowProps) {
  const [label, setLabel] = useState(initialLabel);
  const [amount, setAmount] = useState("");

  const handleSave = () => {
    const parsed = Number.parseFloat(amount);
    if (!label.trim()) {
      toast.error("Label is required");
      return;
    }
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    onSave(label.trim(), parsed);
  };

  return (
    <TableRow className="bg-primary/5">
      <TableCell>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Charge label"
          className="h-8 text-sm"
          data-ocid={`${ocidPrefix}.input`}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="h-8 text-sm w-28"
          data-ocid={`${ocidPrefix}.amount_input`}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground font-mono">
          {currency}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            className="h-7 px-2"
            onClick={handleSave}
            data-ocid={`${ocidPrefix}.save_button`}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={onCancel}
            data-ocid={`${ocidPrefix}.cancel_button`}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Inline edit row for existing charges ───────────────────────────────────

interface InlineEditRowProps {
  charge: StoredCharge;
  onSave: (label: string, amount: number) => void;
  onCancel: () => void;
  rowIndex: number;
}

function InlineEditRow({
  charge,
  onSave,
  onCancel,
  rowIndex,
}: InlineEditRowProps) {
  const [label, setLabel] = useState(charge.label);
  const [amount, setAmount] = useState(charge.amount.toFixed(2));

  const handleSave = () => {
    const parsed = Number.parseFloat(amount);
    if (!label.trim()) {
      toast.error("Label is required");
      return;
    }
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    onSave(label.trim(), parsed);
  };

  return (
    <TableRow className="bg-accent/10">
      <TableCell>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="h-8 text-sm"
          data-ocid={`accounts.edit.input.${rowIndex}`}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-8 text-sm w-28"
          data-ocid={`accounts.edit.amount_input.${rowIndex}`}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground font-mono">
          {charge.currency}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            className="h-7 px-2"
            onClick={handleSave}
            data-ocid={`accounts.save_button.${rowIndex}`}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={onCancel}
            data-ocid={`accounts.cancel_button.${rowIndex}`}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Charges panel for a single booking ──────────────────────────────────────

function ChargesPanel({ booking }: { booking: Booking }) {
  const currency = booking.invoice.currency;
  const bookingId = booking.bookingId.toString();

  const { charges, refresh } = useChargesByBooking(bookingId);
  const { mutate: saveCharge } = useSaveCharge();
  const { mutate: updateCharge } = useUpdateCharge();
  const { mutate: deleteCharge } = useDeleteCharge();

  const [editingId, setEditingId] = useState<string | null>(null);
  // newRow: null = no new row, string = preset label or "" for blank
  const [newRow, setNewRow] = useState<string | null>(null);

  const handleAddPreset = (label: string) => {
    setNewRow(label);
  };

  const handleAddBlank = () => {
    setNewRow("");
  };

  const handleSaveNew = useCallback(
    (label: string, amount: number) => {
      saveCharge({ bookingId, label, amount, currency });
      setNewRow(null);
      refresh();
      toast.success("Charge added");
    },
    [bookingId, currency, saveCharge, refresh],
  );

  const handleSaveEdit = useCallback(
    (id: string, label: string, amount: number) => {
      updateCharge(id, { label, amount });
      setEditingId(null);
      refresh();
      toast.success("Charge updated");
    },
    [updateCharge, refresh],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteCharge(id);
      refresh();
      toast.success("Charge removed");
    },
    [deleteCharge, refresh],
  );

  const total = charges.reduce((sum, c) => sum + c.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="border-t border-border bg-muted/20 px-4 pb-4 pt-3"
    >
      {/* Preset quick-add buttons */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {PRESET_CHARGES.map((label) => (
          <Button
            key={label}
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => handleAddPreset(label)}
            disabled={newRow !== null}
            data-ocid="accounts.add_row_button"
          >
            <Plus className="h-3 w-3" />
            {label}
          </Button>
        ))}
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={handleAddBlank}
          disabled={newRow !== null}
          data-ocid="accounts.add_row_button"
        >
          <Plus className="h-3 w-3" />
          Add Row
        </Button>
      </div>

      {/* Charges table */}
      <div className="rounded-md border border-border overflow-hidden">
        <Table data-ocid="accounts.charges.table">
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-xs">Label</TableHead>
              <TableHead className="text-xs">Amount</TableHead>
              <TableHead className="text-xs">Currency</TableHead>
              <TableHead className="text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {charges.length === 0 && newRow === null && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-sm text-muted-foreground py-6"
                  data-ocid="accounts.charges.empty_state"
                >
                  No charges added yet. Use the buttons above to add charges.
                </TableCell>
              </TableRow>
            )}

            {charges.map((charge, idx) =>
              editingId === charge.id ? (
                <InlineEditRow
                  key={charge.id}
                  charge={charge}
                  rowIndex={idx + 1}
                  onSave={(label, amount) =>
                    handleSaveEdit(charge.id, label, amount)
                  }
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <TableRow
                  key={charge.id}
                  data-ocid={`accounts.charges.item.${idx + 1}`}
                >
                  <TableCell className="text-sm">{charge.label}</TableCell>
                  <TableCell className="text-sm font-mono">
                    {charge.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {charge.currency}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => setEditingId(charge.id)}
                        data-ocid={`accounts.edit_button.${idx + 1}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(charge.id)}
                        data-ocid={`accounts.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ),
            )}

            {/* New row input */}
            {newRow !== null && (
              <EditRow
                key="new-row"
                initialLabel={newRow}
                currency={currency}
                onSave={handleSaveNew}
                onCancel={() => setNewRow(null)}
                ocidPrefix="accounts.new"
              />
            )}
          </TableBody>
        </Table>
      </div>

      {/* Total */}
      {charges.length > 0 && (
        <div className="flex justify-end mt-2 pr-1">
          <span className="text-sm font-semibold">
            Total:{" "}
            <span className="font-mono text-primary">
              {currency} {total.toFixed(2)}
            </span>
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Single booking row (with expandable charges panel) ──────────────────────

function BookingAccountRow({
  booking,
  index,
  isOpen,
  onToggle,
  chargesCount,
}: {
  booking: Booking;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  chargesCount: number;
}) {
  const handlePrintAccountsInvoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(
      `/print/accounts-invoice/${booking.bookingId.toString()}`,
      "_blank",
    );
  };

  return (
    <div
      className={`border border-border rounded-lg overflow-hidden transition-shadow ${isOpen ? "shadow-md ring-1 ring-primary/20" : "shadow-sm"}`}
      data-ocid={`accounts.item.${index}`}
    >
      {/* Booking summary row */}
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
        onClick={onToggle}
        data-ocid={`accounts.manage_button.${index}`}
        aria-expanded={isOpen}
      >
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
          {/* AWB */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide leading-none mb-0.5">
              AWB
            </p>
            <p className="text-sm font-mono font-semibold">
              {booking.awbNumber ?? (
                <span className="text-muted-foreground italic font-normal text-xs">
                  Pending
                </span>
              )}
            </p>
          </div>
          {/* Booking ID */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide leading-none mb-0.5">
              Booking
            </p>
            <p className="text-sm font-mono">#{booking.bookingId.toString()}</p>
          </div>
          {/* Shipper */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide leading-none mb-0.5">
              Shipper
            </p>
            <p className="text-sm truncate max-w-[160px]">
              {booking.shipper.name}
            </p>
          </div>
          {/* Destination */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide leading-none mb-0.5">
              Destination
            </p>
            <p className="text-sm truncate max-w-[160px]">
              {booking.destinationCountry}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground font-mono">
            {booking.invoice.currency}
          </span>
          {chargesCount > 0 && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {chargesCount} charge{chargesCount !== 1 ? "s" : ""}
            </Badge>
          )}
          {booking.awbNumber && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1 shrink-0"
              onClick={handlePrintAccountsInvoice}
              data-ocid={`accounts.print_invoice_button.${index}`}
              title="Print Accounts Invoice"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Invoice</span>
            </Button>
          )}
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable charges panel */}
      <AnimatePresence>
        {isOpen && <ChargesPanel booking={booking} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Reactive charge-count map ────────────────────────────────────────────────

function useChargeCountMap(bookings: Booking[]): Record<string, number> {
  const build = useCallback(() => {
    const result: Record<string, number> = {};
    for (const b of bookings) {
      const id = b.bookingId.toString();
      result[id] = getChargesByBooking(id).length;
    }
    return result;
  }, [bookings]);

  const [map, setMap] = useState<Record<string, number>>(build);

  const refresh = useCallback(() => {
    setMap(build());
  }, [build]);

  useEffect(() => {
    window.addEventListener("cargotrack:charges", refresh);
    return () => window.removeEventListener("cargotrack:charges", refresh);
  }, [refresh]);

  // Re-compute when bookings change
  useEffect(() => {
    setMap(build());
  }, [build]);

  return map;
}

// ─── Grand total across all visible bookings ─────────────────────────────────

function useGrandTotal(bookings: Booking[]): number {
  const compute = useCallback(() => {
    let total = 0;
    for (const b of bookings) {
      const charges = getChargesByBooking(b.bookingId.toString());
      total += charges.reduce((s, c) => s + c.amount, 0);
    }
    return total;
  }, [bookings]);

  const [total, setTotal] = useState<number>(compute);

  const refresh = useCallback(() => {
    setTotal(compute());
  }, [compute]);

  useEffect(() => {
    window.addEventListener("cargotrack:charges", refresh);
    return () => window.removeEventListener("cargotrack:charges", refresh);
  }, [refresh]);

  useEffect(() => {
    setTotal(compute());
  }, [compute]);

  return total;
}

// ─── Main AccountsPage ────────────────────────────────────────────────────────

export function AccountsPage() {
  const { session } = useLocalSession();
  const isAdmin = session?.role === "admin";

  // Load bookings based on role — both hooks always called (rules of hooks)
  const adminResult = useAllBookings();
  const franchiseResult = useFranchiseBookings(session?.userId ?? "");

  const bookings = isAdmin ? adminResult.bookings : franchiseResult.bookings;

  const [openBookingId, setOpenBookingId] = useState<string | null>(null);

  const handleToggle = useCallback((id: string) => {
    setOpenBookingId((prev) => (prev === id ? null : id));
  }, []);

  const chargeCountMap = useChargeCountMap(bookings);
  const grandTotal = useGrandTotal(bookings);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="font-display text-2xl font-bold">Accounts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage charges per booking — customs duty, packaging, and custom
            fees
          </p>
        </div>
        {grandTotal > 0 && (
          <div className="rounded-lg border border-border bg-card px-4 py-2.5 text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Charges
            </p>
            <p className="text-lg font-mono font-bold text-primary">
              {grandTotal.toFixed(2)}
            </p>
          </div>
        )}
      </motion.div>

      {/* Bookings list */}
      {bookings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-20 flex flex-col items-center gap-3 text-muted-foreground"
          data-ocid="accounts.empty_state"
        >
          <PackageOpen className="h-10 w-10 opacity-40" />
          <p className="text-sm">No bookings found. Create a booking first.</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="space-y-3"
          data-ocid="accounts.table"
        >
          {bookings.map((booking, idx) => {
            const id = booking.bookingId.toString();
            return (
              <BookingAccountRow
                key={id}
                booking={booking}
                index={idx + 1}
                isOpen={openBookingId === id}
                onToggle={() => handleToggle(id)}
                chargesCount={chargeCountMap[id] ?? 0}
              />
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
