import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  MinusCircle,
  Package,
  PackageOpen,
  Pencil,
  PiggyBank,
  Plus,
  Printer,
  Receipt,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Booking } from "../backend.d";
import {
  useAddExpense,
  useAddIncomeEntry,
  useAddPayment,
  useAllBookings,
  useAllExpenses,
  useAllFranchises,
  useAllIncomeEntries,
  useAllPayments,
  useChargesByBooking,
  useDeleteCharge,
  useDeleteExpense,
  useDeleteIncomeEntry,
  useDeletePayment,
  useFranchiseBookings,
  useLocalSession,
  useSaveCharge,
  useUpdateCharge,
} from "../hooks/useLocalStore";
import {
  type StatementRow,
  exportExpenses,
  exportIncome,
  exportStatement,
} from "../lib/excelExport";
import {
  type StoredCharge,
  type StoredExpense,
  type StoredIncomeEntry,
  type StoredPayment,
  getAllBookings,
  getChargesByBooking,
  getPaymentsByBooking,
} from "../lib/store";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESET_CHARGES = [
  "Freight",
  "PCS Charges",
  "Customs Duty",
  "Packaging Charges",
  "Documentation Charges",
];

const EXPENSE_CATEGORIES = [
  "Rent",
  "Salaries",
  "Fuel",
  "Office Supplies",
  "Customs Duty",
  "Miscellaneous",
  "Custom",
] as const;

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
] as const;

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Edit Row (new charge) ────────────────────────────────────────────────────

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

// ─── Inline Edit Row (existing charge) ───────────────────────────────────────

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
        <span className="text-sm text-muted-foreground font-mono">INR</span>
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

// ─── Payment Form ─────────────────────────────────────────────────────────────

interface PaymentFormProps {
  bookingId: string;
  franchiseId: string | null;
  onSaved: () => void;
}

function PaymentForm({ bookingId, franchiseId, onSaved }: PaymentFormProps) {
  const { mutate: addPayment } = useAddPayment();
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<
    "cash" | "bank_transfer" | "cheque" | "other"
  >("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    const parsed = Number.parseFloat(amount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      toast.error("Enter a valid amount greater than 0");
      return;
    }
    addPayment({
      bookingId,
      franchiseId,
      amount: parsed,
      paymentDate: date,
      paymentMethod: method,
      reference: reference.trim(),
      notes: notes.trim(),
    });
    setAmount("");
    setReference("");
    setNotes("");
    setOpen(false);
    onSaved();
    toast.success("Payment recorded");
  };

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs gap-1"
        onClick={() => setOpen(true)}
        data-ocid="accounts.payment.open_modal_button"
      >
        <Plus className="h-3 w-3" />
        Record Payment
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-primary/30 rounded-lg p-3 bg-primary/5 space-y-3"
      data-ocid="accounts.payment.panel"
    >
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Record Payment
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-8 text-sm"
            data-ocid="accounts.payment.input"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Amount (INR)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="h-8 text-sm"
            data-ocid="accounts.payment.amount_input"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Method</Label>
          <Select
            value={method}
            onValueChange={(v) => setMethod(v as typeof method)}
          >
            <SelectTrigger
              className="h-8 text-sm"
              data-ocid="accounts.payment.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Reference (opt.)</Label>
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Txn ID / Cheque no."
            className="h-8 text-sm"
            data-ocid="accounts.payment.reference_input"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="h-7 px-3 text-xs gap-1"
          onClick={handleSubmit}
          data-ocid="accounts.payment.submit_button"
        >
          <Check className="h-3 w-3" />
          Save Payment
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs"
          onClick={() => setOpen(false)}
          data-ocid="accounts.payment.cancel_button"
        >
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Charges + Payments Panel ─────────────────────────────────────────────────

function BookingDetailPanel({
  booking,
  isAdmin,
}: { booking: Booking; isAdmin: boolean }) {
  const currency = "INR";
  const bookingId = booking.bookingId.toString();
  const franchiseId =
    booking.createdBy === "admin"
      ? null
      : ((booking as Booking & { franchiseId?: string }).franchiseId ?? null);

  const { charges, refresh: refreshCharges } = useChargesByBooking(bookingId);
  const { payments, refresh: refreshPayments } =
    usePaymentsByBooking(bookingId);
  const { mutate: saveCharge } = useSaveCharge();
  const { mutate: updateCharge } = useUpdateCharge();
  const { mutate: deleteCharge } = useDeleteCharge();
  const { mutate: deletePayment } = useDeletePayment();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRow, setNewRow] = useState<string | null>(null);

  const totalCharged = charges.reduce((s, c) => s + c.amount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const balance = totalCharged - totalPaid;

  const handleSaveNew = useCallback(
    (label: string, amount: number) => {
      saveCharge({ bookingId, label, amount, currency: "INR" });
      setNewRow(null);
      refreshCharges();
      toast.success("Charge added");
    },
    [bookingId, saveCharge, refreshCharges],
  );

  const handleSaveEdit = useCallback(
    (id: string, label: string, amount: number) => {
      updateCharge(id, { label, amount });
      setEditingId(null);
      refreshCharges();
      toast.success("Charge updated");
    },
    [updateCharge, refreshCharges],
  );

  const handleDeleteCharge = useCallback(
    (id: string) => {
      toast("Delete this charge?", {
        action: {
          label: "Delete",
          onClick: () => {
            deleteCharge(id);
            refreshCharges();
            toast.success("Charge removed");
          },
        },
      });
    },
    [deleteCharge, refreshCharges],
  );

  const handleDeletePayment = useCallback(
    (id: string) => {
      toast("Delete this payment record?", {
        action: {
          label: "Delete",
          onClick: () => {
            deletePayment(id);
            refreshPayments();
            toast.success("Payment removed");
          },
        },
      });
    },
    [deletePayment, refreshPayments],
  );

  const methodLabel = (m: StoredPayment["paymentMethod"]) => {
    const found = PAYMENT_METHODS.find((x) => x.value === m);
    return found?.label ?? m;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="border-t border-border bg-muted/20 px-4 pb-5 pt-4 space-y-5"
    >
      {/* ─── Charges section ─── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Charges
        </p>

        {/* Preset quick-add buttons */}
        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {PRESET_CHARGES.map((label) => (
              <Button
                key={label}
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => setNewRow(label)}
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
              onClick={() => setNewRow("")}
              disabled={newRow !== null}
              data-ocid="accounts.add_row_button"
            >
              <Plus className="h-3 w-3" />
              Add Row
            </Button>
          </div>
        )}

        <div className="rounded-md border border-border overflow-hidden">
          <Table data-ocid="accounts.charges.table">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs">Label</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Currency</TableHead>
                {isAdmin && <TableHead className="text-xs">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {charges.length === 0 && newRow === null && (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 4 : 3}
                    className="text-center text-sm text-muted-foreground py-6"
                    data-ocid="accounts.charges.empty_state"
                  >
                    No charges added yet.
                    {isAdmin && " Use the buttons above to add charges."}
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
                    {isAdmin && (
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
                            onClick={() => handleDeleteCharge(charge.id)}
                            data-ocid={`accounts.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ),
              )}
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

        {charges.length > 0 && (
          <div className="flex justify-end mt-2 pr-1 gap-6 text-sm">
            <span className="text-muted-foreground">
              Invoiced:{" "}
              <span className="font-mono font-semibold text-foreground">
                {formatINR(totalCharged)}
              </span>
            </span>
            <span className="text-muted-foreground">
              Paid:{" "}
              <span className="font-mono font-semibold text-foreground">
                {formatINR(totalPaid)}
              </span>
            </span>
            <span className={balance > 0 ? "text-destructive" : "text-success"}>
              Balance:{" "}
              <span className="font-mono font-bold">{formatINR(balance)}</span>
            </span>
          </div>
        )}
      </div>

      {/* ─── Payments section ─── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Payments Received
          </p>
          {isAdmin && (
            <PaymentForm
              bookingId={bookingId}
              franchiseId={franchiseId}
              onSaved={refreshPayments}
            />
          )}
        </div>

        {payments.length === 0 ? (
          <div
            className="text-center text-sm text-muted-foreground py-4 rounded-md border border-dashed border-border"
            data-ocid="accounts.payments.empty_state"
          >
            No payments recorded yet.
          </div>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Method</TableHead>
                  <TableHead className="text-xs">Reference</TableHead>
                  <TableHead className="text-xs">Amount (INR)</TableHead>
                  {isAdmin && (
                    <TableHead className="text-xs">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment, idx) => (
                  <TableRow
                    key={payment.id}
                    data-ocid={`accounts.payments.item.${idx + 1}`}
                  >
                    <TableCell className="text-sm font-mono">
                      {payment.paymentDate}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {methodLabel(payment.paymentMethod)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.reference || "—"}
                    </TableCell>
                    <TableCell className="text-sm font-mono font-semibold text-success">
                      {formatINR(payment.amount)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-destructive hover:text-destructive"
                          onClick={() => handleDeletePayment(payment.id)}
                          data-ocid={`accounts.payments.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Booking row (summary + expandable) ──────────────────────────────────────

interface BookingRowProps {
  booking: Booking;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  isAdmin: boolean;
}

function BookingRow({
  booking,
  index,
  isOpen,
  onToggle,
  isAdmin,
}: BookingRowProps) {
  const bookingId = booking.bookingId.toString();
  const { charges } = useChargesByBooking(bookingId);
  const { payments } = usePaymentsByBooking(bookingId);

  const invoiced = charges.reduce((s, c) => s + c.amount, 0);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const balance = invoiced - paid;

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/print/accounts-invoice/${bookingId}`, "_blank");
  };

  return (
    <div
      className={`border border-border rounded-lg overflow-hidden transition-shadow ${isOpen ? "shadow-md ring-1 ring-primary/20" : "shadow-sm"}`}
      data-ocid={`accounts.item.${index}`}
    >
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
        onClick={onToggle}
        data-ocid={`accounts.manage_button.${index}`}
        aria-expanded={isOpen}
      >
        <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-1">
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
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide leading-none mb-0.5">
              Booking
            </p>
            <p className="text-sm font-mono">#{bookingId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide leading-none mb-0.5">
              Shipper
            </p>
            <p className="text-sm truncate max-w-[140px]">
              {booking.shipper.name}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide leading-none mb-0.5">
              Destination
            </p>
            <p className="text-sm truncate max-w-[140px]">
              {booking.destinationCountry}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-muted-foreground leading-none mb-0.5">
                Invoiced
              </p>
              <p className="text-sm font-mono font-semibold">
                {formatINR(invoiced)}
              </p>
            </div>
            {invoiced > 0 && (
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-0.5">
                  Balance
                </p>
                <p
                  className={`text-sm font-mono font-bold ${balance > 0 ? "text-destructive" : "text-success"}`}
                >
                  {formatINR(balance)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {charges.length > 0 && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5">
              {charges.length} charge{charges.length !== 1 ? "s" : ""}
            </Badge>
          )}
          {booking.awbNumber && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1 shrink-0"
              onClick={handlePrint}
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

      <AnimatePresence>
        {isOpen && <BookingDetailPanel booking={booking} isAdmin={isAdmin} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab 1: Invoices ──────────────────────────────────────────────────────────

function InvoicesTab({
  bookings,
  isAdmin,
}: {
  bookings: Booking[];
  isAdmin: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const handleToggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  if (bookings.length === 0) {
    return (
      <div
        className="py-20 flex flex-col items-center gap-3 text-muted-foreground"
        data-ocid="accounts.invoices.empty_state"
      >
        <PackageOpen className="h-10 w-10 opacity-40" />
        <p className="text-sm">No bookings found. Create a booking first.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
      data-ocid="accounts.invoices.list"
    >
      {bookings.map((booking, idx) => {
        const id = booking.bookingId.toString();
        return (
          <BookingRow
            key={id}
            booking={booking}
            index={idx + 1}
            isOpen={openId === id}
            onToggle={() => handleToggle(id)}
            isAdmin={isAdmin}
          />
        );
      })}
    </motion.div>
  );
}

// ─── Tab 2: Statement ─────────────────────────────────────────────────────────

interface StatementTabProps {
  bookings: Booking[];
  allPayments: StoredPayment[];
  isAdmin: boolean;
  franchises: Array<{ franchiseId: string; franchiseName: string }>;
  currentFranchiseId: string | null;
  currentFranchiseName: string | undefined;
}

function StatementTab({
  bookings,
  allPayments,
  isAdmin,
  franchises,
  currentFranchiseName,
}: StatementTabProps) {
  const [filterFranchise, setFilterFranchise] = useState<string>("all");

  // Build filtered bookings
  const filteredBookings = useMemo(() => {
    if (!isAdmin) return bookings;
    if (filterFranchise === "all") return bookings;
    return bookings.filter((b) => {
      const stored = getAllBookings().find(
        (s) => s.bookingId === b.bookingId.toString(),
      );
      if (!stored) return false;
      return stored.franchiseId === filterFranchise;
    });
  }, [bookings, filterFranchise, isAdmin]);

  // Build statement rows
  const statementRows = useMemo((): StatementRow[] => {
    const rows: StatementRow[] = [];

    for (const booking of filteredBookings) {
      const bookingId = booking.bookingId.toString();
      const charges = getChargesByBooking(bookingId);
      const total = charges.reduce((s, c) => s + c.amount, 0);

      if (total > 0) {
        rows.push({
          date: new Date(Number(booking.createdTimestamp / 1_000_000n))
            .toISOString()
            .slice(0, 10),
          description: `Invoice — Booking #${bookingId} (${booking.shipper.name})`,
          awb: booking.awbNumber ?? `#${bookingId}`,
          debit: total,
          credit: 0,
          balance: 0,
        });
      }

      // payments for this booking
      const bookingPayments = allPayments.filter(
        (p) => p.bookingId === bookingId,
      );
      for (const payment of bookingPayments) {
        const shouldInclude = isAdmin
          ? filterFranchise === "all" ||
            filteredBookings.some(
              (b) => b.bookingId.toString() === payment.bookingId,
            )
          : true;
        if (shouldInclude) {
          rows.push({
            date: payment.paymentDate,
            description: `Payment — ${PAYMENT_METHODS.find((m) => m.value === payment.paymentMethod)?.label ?? payment.paymentMethod}${payment.reference ? ` (${payment.reference})` : ""}`,
            awb: booking.awbNumber ?? `#${bookingId}`,
            debit: 0,
            credit: payment.amount,
            balance: 0,
          });
        }
      }
    }

    // Sort by date ascending
    rows.sort((a, b) => a.date.localeCompare(b.date));

    // Compute running balance
    let runningBalance = 0;
    for (const row of rows) {
      runningBalance += row.debit - row.credit;
      row.balance = runningBalance;
    }

    return rows;
  }, [filteredBookings, allPayments, filterFranchise, isAdmin]);

  const totalDebit = statementRows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = statementRows.reduce((s, r) => s + r.credit, 0);
  const netBalance = totalDebit - totalCredit;

  const selectedFranchiseName =
    filterFranchise === "all"
      ? undefined
      : franchises.find((f) => f.franchiseId === filterFranchise)
          ?.franchiseName;

  const handleExport = () => {
    const name = isAdmin ? selectedFranchiseName : currentFranchiseName;
    exportStatement(statementRows, name);
    toast.success("Statement exported");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {isAdmin && (
            <Select value={filterFranchise} onValueChange={setFilterFranchise}>
              <SelectTrigger
                className="w-48 h-9 text-sm"
                data-ocid="accounts.statement.franchise_select"
              >
                <SelectValue placeholder="All Franchises" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Franchises</SelectItem>
                {franchises.map((f) => (
                  <SelectItem key={f.franchiseId} value={f.franchiseId}>
                    {f.franchiseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-9 gap-2"
          onClick={handleExport}
          disabled={statementRows.length === 0}
          data-ocid="accounts.statement.download_button"
        >
          <Download className="h-4 w-4" />
          Download Statement
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Total Debits
          </p>
          <p className="text-lg font-mono font-bold text-destructive">
            {formatINR(totalDebit)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Total Credits
          </p>
          <p className="text-lg font-mono font-bold text-success">
            {formatINR(totalCredit)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Net Balance
          </p>
          <p
            className={`text-lg font-mono font-bold ${netBalance > 0 ? "text-destructive" : "text-success"}`}
          >
            {formatINR(netBalance)}
          </p>
        </div>
      </div>

      {/* Statement table */}
      {statementRows.length === 0 ? (
        <div
          className="py-16 flex flex-col items-center gap-3 text-muted-foreground"
          data-ocid="accounts.statement.empty_state"
        >
          <BookOpen className="h-10 w-10 opacity-40" />
          <p className="text-sm">No transactions yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table data-ocid="accounts.statement.table">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs">AWB / Ref</TableHead>
                <TableHead className="text-xs text-right">
                  Debit (INR)
                </TableHead>
                <TableHead className="text-xs text-right">
                  Credit (INR)
                </TableHead>
                <TableHead className="text-xs text-right">
                  Balance (INR)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statementRows.map((row, idx) => (
                <TableRow
                  key={`${row.date}-${idx}`}
                  data-ocid={`accounts.statement.item.${idx + 1}`}
                  className={
                    row.debit > 0 ? "bg-destructive/5" : "bg-success/5"
                  }
                >
                  <TableCell className="text-sm font-mono">
                    {row.date}
                  </TableCell>
                  <TableCell className="text-sm max-w-[240px] truncate">
                    <div className="flex items-center gap-1.5">
                      {row.debit > 0 ? (
                        <ArrowDownRight className="h-3.5 w-3.5 text-destructive shrink-0" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5 text-success shrink-0" />
                      )}
                      {row.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">
                    {row.awb}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-destructive">
                    {row.debit > 0 ? formatINR(row.debit) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-success">
                    {row.credit > 0 ? formatINR(row.credit) : "—"}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono text-sm font-semibold ${row.balance > 0 ? "text-destructive" : "text-success"}`}
                  >
                    {formatINR(row.balance)}
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals row */}
              <TableRow className="bg-muted/60 font-semibold">
                <TableCell colSpan={3} className="text-sm font-bold">
                  Totals
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-bold text-destructive">
                  {formatINR(totalDebit)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-bold text-success">
                  {formatINR(totalCredit)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono text-sm font-bold ${netBalance > 0 ? "text-destructive" : "text-success"}`}
                >
                  {formatINR(netBalance)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
}

// ─── Tab 3: Expenses ──────────────────────────────────────────────────────────

function ExpensesTab() {
  const { expenses } = useAllExpenses();
  const { mutate: addExpense } = useAddExpense();
  const { mutate: deleteExpense } = useDeleteExpense();

  const [date, setDate] = useState(today());
  const [category, setCategory] = useState<string>("Rent");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const todayExpenses = expenses.filter((e) => e.date === today());
  const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);
  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);

  const handleAdd = () => {
    const parsed = Number.parseFloat(amount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const finalCategory =
      category === "Custom"
        ? customCategory.trim() || "Miscellaneous"
        : category;
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    addExpense({
      date,
      category: finalCategory,
      description: description.trim(),
      amount: parsed,
    });
    setAmount("");
    setDescription("");
    setCustomCategory("");
    toast.success("Expense added");
  };

  const handleDelete = (id: string) => {
    toast("Delete this expense?", {
      action: {
        label: "Delete",
        onClick: () => {
          deleteExpense(id);
          toast.success("Expense deleted");
        },
      },
    });
  };

  const handleExport = () => {
    exportExpenses(expenses);
    toast.success("Expenses exported");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Add form */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-semibold">Add Expense</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-sm"
              data-ocid="accounts.expense.input"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                className="h-9 text-sm"
                data-ocid="accounts.expense.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {category === "Custom" && (
            <div className="space-y-1">
              <Label className="text-xs">Custom Category</Label>
              <Input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Vehicle Repair"
                className="h-9 text-sm"
                data-ocid="accounts.expense.custom_input"
              />
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              className="h-9 text-sm"
              data-ocid="accounts.expense.description_input"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Amount (INR)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-9 text-sm"
              data-ocid="accounts.expense.amount_input"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={handleAdd}
          data-ocid="accounts.expense.submit_button"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Daily summary */}
      <div className="flex gap-3 flex-wrap">
        <div className="rounded-lg border border-border bg-card px-4 py-3 flex items-center gap-3">
          <TrendingDown className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Today's Expenses
            </p>
            <p className="text-lg font-mono font-bold text-destructive">
              {formatINR(todayTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Table + download */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground">
          All Expenses
        </p>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 h-8"
          onClick={handleExport}
          disabled={expenses.length === 0}
          data-ocid="accounts.expense.download_button"
        >
          <Download className="h-4 w-4" />
          Download Excel
        </Button>
      </div>

      {expenses.length === 0 ? (
        <div
          className="py-16 flex flex-col items-center gap-3 text-muted-foreground"
          data-ocid="accounts.expense.empty_state"
        >
          <MinusCircle className="h-10 w-10 opacity-40" />
          <p className="text-sm">No expenses recorded yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table data-ocid="accounts.expense.table">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs text-right">
                  Amount (INR)
                </TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((exp, idx) => (
                <TableRow
                  key={exp.id}
                  data-ocid={`accounts.expense.item.${idx + 1}`}
                >
                  <TableCell className="text-sm font-mono">
                    {exp.date}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {exp.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{exp.description}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold text-destructive">
                    {formatINR(exp.amount)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(exp.id)}
                      data-ocid={`accounts.expense.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/60">
                <TableCell colSpan={3} className="text-sm font-bold">
                  Grand Total
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-bold text-destructive">
                  {formatINR(grandTotal)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
}

// ─── Tab 4: Income ────────────────────────────────────────────────────────────

function IncomeTab() {
  const { entries } = useAllIncomeEntries();
  const { mutate: addIncome } = useAddIncomeEntry();
  const { mutate: deleteIncome } = useDeleteIncomeEntry();

  const [date, setDate] = useState(today());
  const [source, setSource] = useState("Cash");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const todayEntries = entries.filter((e) => e.date === today());
  const todayTotal = todayEntries.reduce((s, e) => s + e.amount, 0);
  const grandTotal = entries.reduce((s, e) => s + e.amount, 0);

  const handleAdd = () => {
    const parsed = Number.parseFloat(amount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    addIncome({
      date,
      source,
      description: description.trim(),
      amount: parsed,
    });
    setAmount("");
    setDescription("");
    toast.success("Income entry added");
  };

  const handleDelete = (id: string) => {
    toast("Delete this income entry?", {
      action: {
        label: "Delete",
        onClick: () => {
          deleteIncome(id);
          toast.success("Income entry deleted");
        },
      },
    });
  };

  const handleExport = () => {
    exportIncome(entries);
    toast.success("Income exported");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Note */}
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">Note:</strong> These are standalone
        income entries. Franchise invoice payments are tracked in the{" "}
        <span className="font-medium text-primary">Statement</span> tab.
      </div>

      {/* Add form */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-semibold">Add Income Entry</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-sm"
              data-ocid="accounts.income.input"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger
                className="h-9 text-sm"
                data-ocid="accounts.income.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              className="h-9 text-sm"
              data-ocid="accounts.income.description_input"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Amount (INR)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="h-9 text-sm"
              data-ocid="accounts.income.amount_input"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={handleAdd}
          data-ocid="accounts.income.submit_button"
        >
          <Plus className="h-4 w-4" />
          Add Income
        </Button>
      </div>

      {/* Daily summary */}
      <div className="flex gap-3 flex-wrap">
        <div className="rounded-lg border border-border bg-card px-4 py-3 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-success" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Today's Income
            </p>
            <p className="text-lg font-mono font-bold text-success">
              {formatINR(todayTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Table + download */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-muted-foreground">
          All Income
        </p>
        <Button
          size="sm"
          variant="outline"
          className="gap-2 h-8"
          onClick={handleExport}
          disabled={entries.length === 0}
          data-ocid="accounts.income.download_button"
        >
          <Download className="h-4 w-4" />
          Download Excel
        </Button>
      </div>

      {entries.length === 0 ? (
        <div
          className="py-16 flex flex-col items-center gap-3 text-muted-foreground"
          data-ocid="accounts.income.empty_state"
        >
          <PiggyBank className="h-10 w-10 opacity-40" />
          <p className="text-sm">No income entries recorded yet.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table data-ocid="accounts.income.table">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Source</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs text-right">
                  Amount (INR)
                </TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, idx) => (
                <TableRow
                  key={entry.id}
                  data-ocid={`accounts.income.item.${idx + 1}`}
                >
                  <TableCell className="text-sm font-mono">
                    {entry.date}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {entry.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{entry.description}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold text-success">
                    {formatINR(entry.amount)}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(entry.id)}
                      data-ocid={`accounts.income.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/60">
                <TableCell colSpan={3} className="text-sm font-bold">
                  Grand Total
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-bold text-success">
                  {formatINR(grandTotal)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
}

// ─── Tab 5: Reports ───────────────────────────────────────────────────────────

type ReportView = "ledger" | "pl" | "trial";

interface ReportsTabProps {
  bookings: Booking[];
  allPayments: StoredPayment[];
  expenses: StoredExpense[];
  incomeEntries: StoredIncomeEntry[];
}

function ReportsTab({
  bookings,
  allPayments,
  expenses,
  incomeEntries,
}: ReportsTabProps) {
  const [view, setView] = useState<ReportView>("ledger");

  // Aggregate data
  const allCharges = useMemo(() => {
    const result: Array<{
      bookingId: string;
      charge: StoredCharge;
      awb: string;
      date: string;
    }> = [];
    for (const b of bookings) {
      const bId = b.bookingId.toString();
      const charges = getChargesByBooking(bId);
      for (const c of charges) {
        result.push({
          bookingId: bId,
          charge: c,
          awb: b.awbNumber ?? `#${bId}`,
          date: new Date(Number(b.createdTimestamp / 1_000_000n))
            .toISOString()
            .slice(0, 10),
        });
      }
    }
    return result;
  }, [bookings]);

  // ── Ledger ──────────────────────────────────────────────────────────────────

  interface LedgerRow {
    id: string;
    date: string;
    account: string;
    description: string;
    debit: number;
    credit: number;
  }

  const ledgerRows = useMemo((): LedgerRow[] => {
    const rows: LedgerRow[] = [];

    for (const { charge, awb, date } of allCharges) {
      rows.push({
        id: charge.id,
        date,
        account: charge.label,
        description: `Invoice charge — ${awb}`,
        debit: charge.amount,
        credit: 0,
      });
    }

    for (const payment of allPayments) {
      const b = bookings.find(
        (bk) => bk.bookingId.toString() === payment.bookingId,
      );
      rows.push({
        id: payment.id,
        date: payment.paymentDate,
        account: "Payments Received",
        description: `Payment — ${b?.shipper.name ?? payment.bookingId} (${PAYMENT_METHODS.find((m) => m.value === payment.paymentMethod)?.label ?? payment.paymentMethod})`,
        debit: 0,
        credit: payment.amount,
      });
    }

    for (const exp of expenses) {
      rows.push({
        id: exp.id,
        date: exp.date,
        account: exp.category,
        description: exp.description,
        debit: exp.amount,
        credit: 0,
      });
    }

    for (const inc of incomeEntries) {
      rows.push({
        id: inc.id,
        date: inc.date,
        account: `Income — ${inc.source}`,
        description: inc.description,
        debit: 0,
        credit: inc.amount,
      });
    }

    rows.sort((a, b) => a.date.localeCompare(b.date));

    return rows;
  }, [allCharges, allPayments, expenses, incomeEntries, bookings]);

  // Running balance for ledger
  const ledgerWithBalance = useMemo(() => {
    let balance = 0;
    return ledgerRows.map((r) => {
      balance += r.debit - r.credit;
      return { ...r, balance };
    });
  }, [ledgerRows]);

  // ── P&L ─────────────────────────────────────────────────────────────────────

  const plData = useMemo(() => {
    // Income side
    const freightIncome = allCharges
      .filter(({ charge }) => charge.label === "Freight")
      .reduce((s, { charge }) => s + charge.amount, 0);
    const pcsIncome = allCharges
      .filter(({ charge }) => charge.label === "PCS Charges")
      .reduce((s, { charge }) => s + charge.amount, 0);
    const packagingIncome = allCharges
      .filter(({ charge }) => charge.label === "Packaging Charges")
      .reduce((s, { charge }) => s + charge.amount, 0);
    const docIncome = allCharges
      .filter(({ charge }) => charge.label === "Documentation Charges")
      .reduce((s, { charge }) => s + charge.amount, 0);
    const otherInvoiceIncome = allCharges
      .filter(
        ({ charge }) =>
          ![
            "Freight",
            "PCS Charges",
            "Packaging Charges",
            "Documentation Charges",
            "Customs Duty",
          ].includes(charge.label),
      )
      .reduce((s, { charge }) => s + charge.amount, 0);

    const cashIncome = incomeEntries
      .filter((e) => e.source === "Cash")
      .reduce((s, e) => s + e.amount, 0);
    const bankIncome = incomeEntries
      .filter((e) => e.source === "Bank Transfer")
      .reduce((s, e) => s + e.amount, 0);
    const otherStandaloneIncome = incomeEntries
      .filter((e) => !["Cash", "Bank Transfer"].includes(e.source))
      .reduce((s, e) => s + e.amount, 0);

    const totalIncome =
      freightIncome +
      pcsIncome +
      packagingIncome +
      docIncome +
      otherInvoiceIncome +
      cashIncome +
      bankIncome +
      otherStandaloneIncome;

    // Expense side
    const expenseByCategory: Record<string, number> = {};
    for (const exp of expenses) {
      expenseByCategory[exp.category] =
        (expenseByCategory[exp.category] ?? 0) + exp.amount;
    }
    const totalExpenses = Object.values(expenseByCategory).reduce(
      (s, v) => s + v,
      0,
    );

    // Add customs duty (invoice charge) to expense side too
    const customsDuty = allCharges
      .filter(({ charge }) => charge.label === "Customs Duty")
      .reduce((s, { charge }) => s + charge.amount, 0);

    const totalExpensesWithDuty = totalExpenses + customsDuty;

    return {
      income: {
        freight: freightIncome,
        pcs: pcsIncome,
        packaging: packagingIncome,
        documentation: docIncome,
        otherInvoice: otherInvoiceIncome,
        cash: cashIncome,
        bank: bankIncome,
        otherStandalone: otherStandaloneIncome,
        total: totalIncome,
      },
      expenses: {
        byCategory: expenseByCategory,
        customsDuty,
        total: totalExpensesWithDuty,
      },
      netProfit: totalIncome - totalExpensesWithDuty,
    };
  }, [allCharges, incomeEntries, expenses]);

  // ── Trial Balance ────────────────────────────────────────────────────────────

  interface TrialRow {
    account: string;
    debit: number;
    credit: number;
  }

  const trialRows = useMemo((): TrialRow[] => {
    const chargeByLabel: Record<string, number> = {};
    for (const { charge } of allCharges) {
      chargeByLabel[charge.label] =
        (chargeByLabel[charge.label] ?? 0) + charge.amount;
    }

    const expByCategory: Record<string, number> = {};
    for (const exp of expenses) {
      expByCategory[exp.category] =
        (expByCategory[exp.category] ?? 0) + exp.amount;
    }

    const totalPayments = allPayments.reduce((s, p) => s + p.amount, 0);
    const totalStandaloneIncome = incomeEntries.reduce(
      (s, e) => s + e.amount,
      0,
    );

    const INVOICE_CHARGE_KEYS = [
      "Freight",
      "PCS Charges",
      "Packaging Charges",
      "Documentation Charges",
      "Customs Duty",
    ] as const;
    const EXPENSE_KEYS = [
      "Rent",
      "Salaries",
      "Fuel",
      "Office Supplies",
      "Customs Duty",
      "Miscellaneous",
    ] as const;

    const rows: TrialRow[] = [
      {
        account: "Freight Income",
        debit: 0,
        credit: chargeByLabel.Freight ?? 0,
      },
      {
        account: "PCS Charges",
        debit: 0,
        credit: chargeByLabel["PCS Charges"] ?? 0,
      },
      {
        account: "Packaging Charges",
        debit: 0,
        credit: chargeByLabel["Packaging Charges"] ?? 0,
      },
      {
        account: "Documentation Charges",
        debit: 0,
        credit: chargeByLabel["Documentation Charges"] ?? 0,
      },
      {
        account: "Customs Duty (Invoice)",
        debit: chargeByLabel["Customs Duty"] ?? 0,
        credit: 0,
      },
      {
        account: "Other Invoice Income",
        debit: 0,
        credit: Object.entries(chargeByLabel)
          .filter(
            ([k]) => !(INVOICE_CHARGE_KEYS as readonly string[]).includes(k),
          )
          .reduce((s, [, v]) => s + v, 0),
      },
      { account: "Standalone Income", debit: 0, credit: totalStandaloneIncome },
      { account: "Payments Received", debit: 0, credit: totalPayments },
      { account: "Rent", debit: expByCategory.Rent ?? 0, credit: 0 },
      { account: "Salaries", debit: expByCategory.Salaries ?? 0, credit: 0 },
      { account: "Fuel", debit: expByCategory.Fuel ?? 0, credit: 0 },
      {
        account: "Office Supplies",
        debit: expByCategory["Office Supplies"] ?? 0,
        credit: 0,
      },
      {
        account: "Customs Duty (Expense)",
        debit: expByCategory["Customs Duty"] ?? 0,
        credit: 0,
      },
      {
        account: "Miscellaneous",
        debit: expByCategory.Miscellaneous ?? 0,
        credit: 0,
      },
      {
        account: "Other Expenses",
        debit: Object.entries(expByCategory)
          .filter(([k]) => !(EXPENSE_KEYS as readonly string[]).includes(k))
          .reduce((s, [, v]) => s + v, 0),
        credit: 0,
      },
    ];

    return rows.filter((r) => r.debit > 0 || r.credit > 0);
  }, [allCharges, expenses, allPayments, incomeEntries]);

  const trialTotalDebit = trialRows.reduce((s, r) => s + r.debit, 0);
  const trialTotalCredit = trialRows.reduce((s, r) => s + r.credit, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-5"
    >
      {/* Sub-view toggle */}
      <div
        className="flex gap-1 p-1 rounded-lg bg-muted w-fit"
        data-ocid="accounts.reports.toggle"
      >
        {(
          [
            { id: "ledger" as ReportView, label: "Ledger", icon: BookOpen },
            { id: "pl" as ReportView, label: "P&L Account", icon: TrendingUp },
            {
              id: "trial" as ReportView,
              label: "Trial Balance",
              icon: FileText,
            },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === id
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-ocid={`accounts.reports.${id}_tab`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Ledger View ── */}
      {view === "ledger" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            All transactions in chronological order — invoices, payments,
            expenses, and income.
          </p>
          {ledgerWithBalance.length === 0 ? (
            <div
              className="py-16 flex flex-col items-center gap-3 text-muted-foreground"
              data-ocid="accounts.ledger.empty_state"
            >
              <BookOpen className="h-10 w-10 opacity-40" />
              <p className="text-sm">No transactions to display.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table data-ocid="accounts.ledger.table">
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Account</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs text-right">Debit</TableHead>
                    <TableHead className="text-xs text-right">Credit</TableHead>
                    <TableHead className="text-xs text-right">
                      Balance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerWithBalance.map((row, idx) => (
                    <TableRow
                      key={row.id}
                      data-ocid={`accounts.ledger.item.${idx + 1}`}
                      className={row.debit > 0 ? "" : "bg-success/5"}
                    >
                      <TableCell className="text-xs font-mono">
                        {row.date}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {row.account}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {row.description}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-destructive">
                        {row.debit > 0 ? formatINR(row.debit) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-success">
                        {row.credit > 0 ? formatINR(row.credit) : "—"}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono text-sm font-semibold ${row.balance >= 0 ? "text-destructive" : "text-success"}`}
                      >
                        {formatINR(row.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* ── P&L View ── */}
      {view === "pl" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Profit & Loss statement showing all income and expenses.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expenses side */}
            <div className="rounded-lg border border-destructive/20 overflow-hidden">
              <div className="bg-destructive/10 px-4 py-2.5 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <h3 className="font-semibold text-sm">Expenses (Dr.)</h3>
              </div>
              <div className="divide-y divide-border">
                {plData.expenses.customsDuty > 0 && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span>Customs Duty (Invoice)</span>
                    <span className="font-mono text-destructive">
                      {formatINR(plData.expenses.customsDuty)}
                    </span>
                  </div>
                )}
                {Object.entries(plData.expenses.byCategory).map(
                  ([cat, amt]) => (
                    <div
                      key={cat}
                      className="flex justify-between px-4 py-2.5 text-sm"
                    >
                      <span>{cat}</span>
                      <span className="font-mono text-destructive">
                        {formatINR(amt)}
                      </span>
                    </div>
                  ),
                )}
                {plData.expenses.total === 0 && (
                  <div className="px-4 py-4 text-sm text-muted-foreground text-center">
                    No expenses recorded.
                  </div>
                )}
                <div className="flex justify-between px-4 py-3 bg-destructive/5 font-semibold text-sm">
                  <span>Total Expenses</span>
                  <span className="font-mono text-destructive">
                    {formatINR(plData.expenses.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Income side */}
            <div className="rounded-lg border border-success/20 overflow-hidden">
              <div className="bg-success/10 px-4 py-2.5 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <h3 className="font-semibold text-sm">Income (Cr.)</h3>
              </div>
              <div className="divide-y divide-border">
                {plData.income.freight > 0 && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span>Freight Income</span>
                    <span className="font-mono text-success">
                      {formatINR(plData.income.freight)}
                    </span>
                  </div>
                )}
                {plData.income.pcs > 0 && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span>PCS Charges</span>
                    <span className="font-mono text-success">
                      {formatINR(plData.income.pcs)}
                    </span>
                  </div>
                )}
                {plData.income.packaging > 0 && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span>Packaging Charges</span>
                    <span className="font-mono text-success">
                      {formatINR(plData.income.packaging)}
                    </span>
                  </div>
                )}
                {plData.income.documentation > 0 && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span>Documentation Charges</span>
                    <span className="font-mono text-success">
                      {formatINR(plData.income.documentation)}
                    </span>
                  </div>
                )}
                {plData.income.otherInvoice > 0 && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span>Other Invoice Income</span>
                    <span className="font-mono text-success">
                      {formatINR(plData.income.otherInvoice)}
                    </span>
                  </div>
                )}
                {plData.income.cash > 0 && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span>Standalone Income — Cash</span>
                    <span className="font-mono text-success">
                      {formatINR(plData.income.cash)}
                    </span>
                  </div>
                )}
                {plData.income.bank > 0 && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span>Standalone Income — Bank Transfer</span>
                    <span className="font-mono text-success">
                      {formatINR(plData.income.bank)}
                    </span>
                  </div>
                )}
                {plData.income.otherStandalone > 0 && (
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span>Standalone Income — Other</span>
                    <span className="font-mono text-success">
                      {formatINR(plData.income.otherStandalone)}
                    </span>
                  </div>
                )}
                {plData.income.total === 0 && (
                  <div className="px-4 py-4 text-sm text-muted-foreground text-center">
                    No income recorded.
                  </div>
                )}
                <div className="flex justify-between px-4 py-3 bg-success/5 font-semibold text-sm">
                  <span>Total Income</span>
                  <span className="font-mono text-success">
                    {formatINR(plData.income.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Net result */}
          <div
            className={`rounded-lg border-2 px-5 py-4 flex justify-between items-center ${
              plData.netProfit >= 0
                ? "border-success/40 bg-success/10"
                : "border-destructive/40 bg-destructive/10"
            }`}
          >
            <div className="flex items-center gap-2">
              {plData.netProfit >= 0 ? (
                <TrendingUp className="h-5 w-5 text-success" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
              <span className="font-bold text-base">
                {plData.netProfit >= 0 ? "Net Profit" : "Net Loss"}
              </span>
            </div>
            <span
              className={`font-mono text-xl font-bold ${plData.netProfit >= 0 ? "text-success" : "text-destructive"}`}
            >
              {formatINR(Math.abs(plData.netProfit))}
            </span>
          </div>
        </div>
      )}

      {/* ── Trial Balance View ── */}
      {view === "trial" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Summary of all account balances — total debits should equal total
            credits in a balanced ledger.
          </p>
          {trialRows.length === 0 ? (
            <div
              className="py-16 flex flex-col items-center gap-3 text-muted-foreground"
              data-ocid="accounts.trial.empty_state"
            >
              <FileText className="h-10 w-10 opacity-40" />
              <p className="text-sm">No data to display yet.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table data-ocid="accounts.trial.table">
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">Account Name</TableHead>
                    <TableHead className="text-xs text-right">
                      Debit (INR)
                    </TableHead>
                    <TableHead className="text-xs text-right">
                      Credit (INR)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trialRows.map((row, idx) => (
                    <TableRow
                      key={row.account}
                      data-ocid={`accounts.trial.item.${idx + 1}`}
                    >
                      <TableCell className="text-sm font-medium">
                        {row.account}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-destructive">
                        {row.debit > 0 ? formatINR(row.debit) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-success">
                        {row.credit > 0 ? formatINR(row.credit) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/60 font-bold">
                    <TableCell className="text-sm font-bold">Totals</TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-destructive">
                      {formatINR(trialTotalDebit)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-success">
                      {formatINR(trialTotalCredit)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
          {trialRows.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {Math.abs(trialTotalDebit - trialTotalCredit) < 0.01 ? (
                <span className="text-success font-medium">
                  ✓ Trial balance is balanced (debits = credits)
                </span>
              ) : (
                <span className="text-warning font-medium">
                  ⚠ Difference of{" "}
                  {formatINR(Math.abs(trialTotalDebit - trialTotalCredit))} —
                  payments received are included in credits but not offset by a
                  corresponding debit entry in this view.
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── usePaymentsByBooking (local hook for detail panel) ───────────────────────

function usePaymentsByBooking(bookingId: string) {
  const { payments: allPayments, refresh } = useAllPayments();
  const payments = useMemo(
    () => allPayments.filter((p) => p.bookingId === bookingId),
    [allPayments, bookingId],
  );
  return { payments, refresh };
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

  useEffect(() => {
    setMap(build());
  }, [build]);

  return map;
}

// ─── Main AccountsPage ────────────────────────────────────────────────────────

export function AccountsPage() {
  const { session } = useLocalSession();
  const isAdmin = session?.role === "admin";

  // Load bookings — both hooks always called (rules of hooks)
  const adminResult = useAllBookings();
  const franchiseResult = useFranchiseBookings(session?.userId ?? "");
  const bookings = isAdmin ? adminResult.bookings : franchiseResult.bookings;

  const { franchises } = useAllFranchises();
  const { payments: allPayments } = useAllPayments();
  const { expenses } = useAllExpenses();
  const { entries: incomeEntries } = useAllIncomeEntries();

  const chargeCountMap = useChargeCountMap(bookings);

  // Sum all charge amounts reactively — chargeCountMap ensures recomputation when charges change
  const totalInvoiced = useMemo(() => {
    // Rebuild per-booking totals; chargeCountMap is used as a reactive signal (its sum is the total)
    return (
      Object.values(chargeCountMap).reduce((acc, _) => acc, 0) +
      (() => {
        let total = 0;
        for (const b of bookings) {
          const charges = getChargesByBooking(b.bookingId.toString());
          total += charges.reduce((s, c) => s + c.amount, 0);
        }
        return total;
      })()
    );
  }, [bookings, chargeCountMap]);

  // Franchise sees only Statement tab
  const defaultTab = isAdmin ? "invoices" : "statement";

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
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl font-bold">Accounts</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {isAdmin
              ? "Full accounting — invoices, payments, expenses, income & financial reports"
              : "Your account statement and invoice history"}
          </p>
        </div>
        {isAdmin && totalInvoiced > 0 && (
          <div className="rounded-lg border border-border bg-card px-4 py-2.5 text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Invoiced
            </p>
            <p className="text-lg font-mono font-bold text-primary">
              {formatINR(totalInvoiced)}
            </p>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} data-ocid="accounts.tab">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          {isAdmin && (
            <>
              <TabsTrigger
                value="invoices"
                className="flex items-center gap-1.5 text-sm"
                data-ocid="accounts.invoices_tab"
              >
                <Receipt className="h-4 w-4" />
                Invoices
              </TabsTrigger>
              <TabsTrigger
                value="statement"
                className="flex items-center gap-1.5 text-sm"
                data-ocid="accounts.statement_tab"
              >
                <BookOpen className="h-4 w-4" />
                Statement
              </TabsTrigger>
              <TabsTrigger
                value="expenses"
                className="flex items-center gap-1.5 text-sm"
                data-ocid="accounts.expenses_tab"
              >
                <TrendingDown className="h-4 w-4" />
                Expenses
              </TabsTrigger>
              <TabsTrigger
                value="income"
                className="flex items-center gap-1.5 text-sm"
                data-ocid="accounts.income_tab"
              >
                <TrendingUp className="h-4 w-4" />
                Income
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="flex items-center gap-1.5 text-sm"
                data-ocid="accounts.reports_tab"
              >
                <FileText className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </>
          )}
          {!isAdmin && (
            <TabsTrigger
              value="statement"
              className="flex items-center gap-1.5 text-sm"
              data-ocid="accounts.statement_tab"
            >
              <BookOpen className="h-4 w-4" />
              My Statement
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab content */}
        {isAdmin && (
          <TabsContent value="invoices" className="mt-5">
            <InvoicesTab bookings={bookings} isAdmin={isAdmin} />
          </TabsContent>
        )}

        <TabsContent value="statement" className="mt-5">
          <StatementTab
            bookings={bookings}
            allPayments={allPayments}
            isAdmin={isAdmin}
            franchises={franchises.map((f) => ({
              franchiseId: (f as { franchiseId: string }).franchiseId,
              franchiseName: f.franchiseName,
            }))}
            currentFranchiseId={isAdmin ? null : (session?.userId ?? null)}
            currentFranchiseName={session?.franchiseName}
          />
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="expenses" className="mt-5">
              <ExpensesTab />
            </TabsContent>
            <TabsContent value="income" className="mt-5">
              <IncomeTab />
            </TabsContent>
            <TabsContent value="reports" className="mt-5">
              <ReportsTab
                bookings={bookings}
                allPayments={allPayments}
                expenses={expenses}
                incomeEntries={incomeEntries}
              />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Non-admin fallback hint for other tabs */}
      {!isAdmin && (
        <p className="text-xs text-muted-foreground">
          <Package className="h-3.5 w-3.5 inline mr-1 opacity-60" />
          Showing statement for your franchise account only. Contact admin for
          full account details.
        </p>
      )}
    </div>
  );
}
