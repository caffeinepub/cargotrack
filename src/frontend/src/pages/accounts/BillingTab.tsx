import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import {
  CreditCard,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Printer,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  BillingItem,
  BillingRecord,
  PaymentRecord,
} from "../../backend.d";
import {
  Variant_gst_nonGst,
  Variant_igst_none_cgstSgst,
  Variant_paid_unpaid_partial,
  useAllPaymentsForBilling,
  useBillingRecords,
  useCreateBillingRecord,
  useCustomers,
  useDeleteBillingRecord,
  useProducts,
  useRecordBillingPayment,
} from "../../hooks/useQueries";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtDate(ts: bigint) {
  return new Date(Number(ts / 1_000_000n)).toLocaleDateString("en-IN");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function statusBadge(status: Variant_paid_unpaid_partial) {
  if (status === Variant_paid_unpaid_partial.paid)
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        Paid
      </Badge>
    );
  if (status === Variant_paid_unpaid_partial.partial)
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        Partial
      </Badge>
    );
  return <Badge variant="destructive">Unpaid</Badge>;
}

interface BillItemRow {
  id: string;
  productId: string;
  description: string;
  quantity: string;
  rate: string;
  gstPercent: string;
  amount: number;
}

function calcTotals(
  items: BillItemRow[],
  discount: number,
  billType: Variant_gst_nonGst,
  taxType: Variant_igst_none_cgstSgst,
) {
  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const cgst =
    billType === Variant_gst_nonGst.gst &&
    taxType === Variant_igst_none_cgstSgst.cgstSgst
      ? taxableAmount * 0.09
      : 0;
  const sgst =
    billType === Variant_gst_nonGst.gst &&
    taxType === Variant_igst_none_cgstSgst.cgstSgst
      ? taxableAmount * 0.09
      : 0;
  const igst =
    billType === Variant_gst_nonGst.gst &&
    taxType === Variant_igst_none_cgstSgst.igst
      ? taxableAmount * 0.18
      : 0;
  const totalAmount = taxableAmount + cgst + sgst + igst;
  return { subtotal, taxableAmount, cgst, sgst, igst, totalAmount };
}

const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank Transfer"];

function NewBillForm({ onClose }: { onClose: () => void }) {
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const createMut = useCreateBillingRecord();

  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState(today());
  const [billType, setBillType] = useState<Variant_gst_nonGst>(
    Variant_gst_nonGst.gst,
  );
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [taxType, setTaxType] = useState<Variant_igst_none_cgstSgst>(
    Variant_igst_none_cgstSgst.cgstSgst,
  );
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [status, setStatus] = useState<Variant_paid_unpaid_partial>(
    Variant_paid_unpaid_partial.unpaid,
  );
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BillItemRow[]>([
    {
      id: crypto.randomUUID(),
      productId: "",
      description: "",
      quantity: "1",
      rate: "0",
      gstPercent: "18",
      amount: 0,
    },
  ]);

  const discountNum = Number.parseFloat(discount) || 0;
  const totals = useMemo(
    () => calcTotals(items, discountNum, billType, taxType),
    [items, discountNum, billType, taxType],
  );

  const onCustomerChange = (id: string) => {
    setCustomerId(id);
    const c = customers.find((c) => c.id === id);
    if (c) {
      setCustomerName(c.name);
      setCustomerGstin(c.gstin);
    }
  };

  const updateItem = (id: string, field: keyof BillItemRow, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "productId") {
          const prod = products.find((p) => p.id === value);
          if (prod) {
            updated.description = prod.name;
            updated.rate = String(prod.price);
            updated.gstPercent = String(prod.gstPercent);
          }
        }
        const qty = Number.parseFloat(updated.quantity) || 0;
        const rate = Number.parseFloat(updated.rate) || 0;
        updated.amount = qty * rate;
        return updated;
      }),
    );
  };

  const addItem = () =>
    setItems((p) => [
      ...p,
      {
        id: crypto.randomUUID(),
        productId: "",
        description: "",
        quantity: "1",
        rate: "0",
        gstPercent: "18",
        amount: 0,
      },
    ]);
  const removeItem = (id: string) =>
    setItems((p) => p.filter((i) => i.id !== id));

  const handleSave = async () => {
    if (!billNumber.trim()) {
      toast.error("Bill number required");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Customer name required");
      return;
    }
    if (items.some((i) => !i.description.trim())) {
      toast.error("All service rows must have a description");
      return;
    }

    const billingItems: BillingItem[] = items.map((i) => ({
      productId: i.productId,
      description: i.description,
      quantity: BigInt(Math.round(Number.parseFloat(i.quantity) || 1)),
      rate: Number.parseFloat(i.rate) || 0,
      gstPercent: Number.parseFloat(i.gstPercent) || 0,
      amount: i.amount,
    }));

    const billDateMs = new Date(billDate).getTime();
    try {
      await createMut.mutateAsync({
        billNumber: billNumber.trim(),
        billDate: BigInt(billDateMs) * 1_000_000n,
        billType,
        customerId,
        customerName: customerName.trim(),
        customerGstin: customerGstin.trim(),
        items: billingItems,
        subtotal: totals.subtotal,
        discountAmount: discountNum,
        taxableAmount: totals.taxableAmount,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        totalAmount: totals.totalAmount,
        taxType:
          billType === Variant_gst_nonGst.gst
            ? taxType
            : Variant_igst_none_cgstSgst.none,
        paymentMethod,
        status,
        notes,
      });
      toast.success("Bill created successfully");
      onClose();
    } catch {
      toast.error("Failed to create bill");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <h3 className="font-semibold text-base">New Bill</h3>

      {/* Bill meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label>Bill Number *</Label>
          <Input
            value={billNumber}
            onChange={(e) => setBillNumber(e.target.value)}
            placeholder="BILL-001"
            data-ocid="billing.input"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Bill Date</Label>
          <Input
            type="date"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Bill Type</Label>
          <Select
            value={billType}
            onValueChange={(v) => setBillType(v as Variant_gst_nonGst)}
          >
            <SelectTrigger data-ocid="billing.select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Variant_gst_nonGst.gst}>GST Bill</SelectItem>
              <SelectItem value={Variant_gst_nonGst.nonGst}>
                Non-GST Bill
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        {billType === Variant_gst_nonGst.gst && (
          <div className="space-y-1.5">
            <Label>Tax Type</Label>
            <Select
              value={taxType}
              onValueChange={(v) => setTaxType(v as Variant_igst_none_cgstSgst)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Variant_igst_none_cgstSgst.cgstSgst}>
                  CGST + SGST (Intrastate)
                </SelectItem>
                <SelectItem value={Variant_igst_none_cgstSgst.igst}>
                  IGST (Interstate)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Customer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Customer</Label>
          <Select value={customerId} onValueChange={onCustomerChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select customer..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
              <SelectItem value="__manual__">Enter manually</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Customer Name *</Label>
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer name"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Customer GSTIN</Label>
          <Input
            value={customerGstin}
            onChange={(e) => setCustomerGstin(e.target.value)}
            placeholder="GSTIN"
            className="font-mono"
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        <Label>Services / Items *</Label>
        <div className="rounded-lg border border-border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs min-w-[180px]">
                  Service / Product
                </TableHead>
                <TableHead className="text-xs w-28">Qty</TableHead>
                <TableHead className="text-xs w-28">Rate (INR)</TableHead>
                <TableHead className="text-xs w-20">GST %</TableHead>
                <TableHead className="text-xs text-right w-28">
                  Amount
                </TableHead>
                <TableHead className="text-xs w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <Select
                        value={item.productId}
                        onValueChange={(v) =>
                          updateItem(item.id, "productId", v)
                        }
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue placeholder="Pick product..." />
                        </SelectTrigger>
                        <SelectContent>
                          {products
                            .filter((p) => p.isActive)
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          <SelectItem value="__custom__">
                            Custom description
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.id, "description", e.target.value)
                        }
                        placeholder="Description"
                        className="h-7 text-xs"
                        data-ocid={`billing.service_input.${idx + 1}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", e.target.value)
                      }
                      className="h-8 text-sm text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) =>
                        updateItem(item.id, "rate", e.target.value)
                      }
                      className="h-8 text-sm text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.gstPercent}
                      onChange={(e) =>
                        updateItem(item.id, "gstPercent", e.target.value)
                      }
                      className="h-8 text-sm text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {formatINR(item.amount)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      data-ocid={`billing.delete_button.${idx + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addItem}
          className="flex items-center gap-1.5"
          data-ocid="billing.secondary_button"
        >
          <Plus className="h-3.5 w-3.5" /> Add Row
        </Button>
      </div>

      {/* Totals + payment */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Payment details */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Discount (INR)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Payment Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as Variant_paid_unpaid_partial)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Variant_paid_unpaid_partial.paid}>
                  Paid
                </SelectItem>
                <SelectItem value={Variant_paid_unpaid_partial.unpaid}>
                  Unpaid
                </SelectItem>
                <SelectItem value={Variant_paid_unpaid_partial.partial}>
                  Partial
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="resize-none"
              rows={2}
              data-ocid="billing.textarea"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2 lg:w-64 self-start">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-mono">{formatINR(totals.subtotal)}</span>
          </div>
          {discountNum > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-mono text-destructive">
                -{formatINR(discountNum)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Taxable Amount</span>
            <span className="font-mono">{formatINR(totals.taxableAmount)}</span>
          </div>
          {totals.cgst > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">CGST @ 9%</span>
              <span className="font-mono">{formatINR(totals.cgst)}</span>
            </div>
          )}
          {totals.sgst > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">SGST @ 9%</span>
              <span className="font-mono">{formatINR(totals.sgst)}</span>
            </div>
          )}
          {totals.igst > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IGST @ 18%</span>
              <span className="font-mono">{formatINR(totals.igst)}</span>
            </div>
          )}
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span>Grand Total</span>
            <span className="font-mono text-primary">
              {formatINR(totals.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button
          variant="outline"
          onClick={onClose}
          data-ocid="billing.cancel_button"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={createMut.isPending}
          data-ocid="billing.submit_button"
        >
          {createMut.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save Bill
        </Button>
      </div>
    </div>
  );
}

function BillDetailPanel({
  bill,
  payments,
  onClose,
}: { bill: BillingRecord; payments: PaymentRecord[]; onClose: () => void }) {
  const recordPayment = useRecordBillingPayment();
  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payDate, setPayDate] = useState(today());
  const [payNotes, setPayNotes] = useState("");

  const billPayments = payments.filter((p) => p.billingRecordId === bill.id);
  const totalPaid = billPayments.reduce((s, p) => s + p.amount, 0);
  const balance = bill.totalAmount - totalPaid;

  const handleRecordPayment = async () => {
    const amount = Number.parseFloat(payAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter valid amount");
      return;
    }
    try {
      await recordPayment.mutateAsync({
        billingRecordId: bill.id,
        amount,
        paymentMethod: payMethod,
        paymentDate: BigInt(new Date(payDate).getTime()) * 1_000_000n,
        notes: payNotes,
      });
      toast.success("Payment recorded");
      setShowPayForm(false);
      setPayAmount("");
    } catch {
      toast.error("Failed to record payment");
    }
  };

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    const html = `<!DOCTYPE html><html><head><title>Bill ${bill.billNumber}</title><style>
      body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;font-size:12px}
      h1{font-size:20px;margin:0}.header{display:flex;justify-content:space-between;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;margin:10px 0}
      th,td{padding:6px 8px;text-align:left;border:1px solid #ddd}
      th{background:#f5f5f5;font-weight:600}.text-right{text-align:right}
      .totals{width:300px;margin-left:auto}.total-row{font-weight:bold;border-top:2px solid #333}
      .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px}
      .badge-paid{background:#dcfce7;color:#166534}.badge-unpaid{background:#fee2e2;color:#991b1b}.badge-partial{background:#fef9c3;color:#854d0e}
    </style></head><body>
      <div class='header'><div><h1>TAX INVOICE</h1><p>Bill No: <strong>${bill.billNumber}</strong></p><p>Date: ${fmtDate(bill.billDate)}</p></div>
      <div style='text-align:right'><strong>Worldyfly Logistics</strong><br/>GSTIN: 32CWHPB3468A1Z3<br/>www.worldyfly.com</div></div>
      <p><strong>Bill To:</strong> ${bill.customerName}${bill.customerGstin ? ` | GSTIN: ${bill.customerGstin}` : ""}</p>
      <table><thead><tr><th>#</th><th>Description</th><th class='text-right'>Qty</th><th class='text-right'>Rate</th><th class='text-right'>Amount</th></tr></thead>
      <tbody>${bill.items.map((it, i) => `<tr><td>${i + 1}</td><td>${it.description}</td><td class='text-right'>${Number(it.quantity)}</td><td class='text-right'>₹${it.rate.toFixed(2)}</td><td class='text-right'>₹${it.amount.toFixed(2)}</td></tr>`).join("")}</tbody></table>
      <table class='totals'><tr><td>Subtotal</td><td class='text-right'>₹${bill.subtotal.toFixed(2)}</td></tr>
      ${bill.discountAmount > 0 ? `<tr><td>Discount</td><td class='text-right'>-₹${bill.discountAmount.toFixed(2)}</td></tr>` : ""}
      <tr><td>Taxable Amount</td><td class='text-right'>₹${bill.taxableAmount.toFixed(2)}</td></tr>
      ${bill.cgst > 0 ? `<tr><td>CGST @ 9%</td><td class='text-right'>₹${bill.cgst.toFixed(2)}</td></tr>` : ""}
      ${bill.sgst > 0 ? `<tr><td>SGST @ 9%</td><td class='text-right'>₹${bill.sgst.toFixed(2)}</td></tr>` : ""}
      ${bill.igst > 0 ? `<tr><td>IGST @ 18%</td><td class='text-right'>₹${bill.igst.toFixed(2)}</td></tr>` : ""}
      <tr class='total-row'><td><strong>Grand Total</strong></td><td class='text-right'><strong>₹${bill.totalAmount.toFixed(2)}</strong></td></tr>
      </table>
      <p>Payment Method: ${bill.paymentMethod} | Status: ${bill.status}</p>
      ${bill.notes ? `<p>Notes: ${bill.notes}</p>` : ""}
    </body></html>`;
    win.document.write(html);
    win.document.close();
    win.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="rounded-xl border border-border bg-card p-5 space-y-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base">Bill #{bill.billNumber}</h3>
            {statusBadge(bill.status)}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {bill.customerName} · {fmtDate(bill.billDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            data-ocid="billing.secondary_button"
          >
            <Printer className="h-4 w-4 mr-1.5" /> Print
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
            data-ocid="billing.close_button"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Items table */}
      <div className="rounded-lg border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="text-xs">#</TableHead>
              <TableHead className="text-xs">Description</TableHead>
              <TableHead className="text-xs text-right">Qty</TableHead>
              <TableHead className="text-xs text-right">Rate</TableHead>
              <TableHead className="text-xs text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bill.items.map((item, idx) => (
              <TableRow key={`${item.description}-${idx}`}>
                <TableCell className="text-sm text-muted-foreground">
                  {idx + 1}
                </TableCell>
                <TableCell className="text-sm">{item.description}</TableCell>
                <TableCell className="text-right text-sm">
                  {Number(item.quantity)}
                </TableCell>
                <TableCell className="text-right text-sm font-mono">
                  {formatINR(item.rate)}
                </TableCell>
                <TableCell className="text-right text-sm font-mono">
                  {formatINR(item.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Totals */}
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1.5 max-w-xs ml-auto text-sm">
        {bill.discountAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-mono">-{formatINR(bill.discountAmount)}</span>
          </div>
        )}
        {bill.cgst > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">CGST @ 9%</span>
            <span className="font-mono">{formatINR(bill.cgst)}</span>
          </div>
        )}
        {bill.sgst > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">SGST @ 9%</span>
            <span className="font-mono">{formatINR(bill.sgst)}</span>
          </div>
        )}
        {bill.igst > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">IGST @ 18%</span>
            <span className="font-mono">{formatINR(bill.igst)}</span>
          </div>
        )}
        <div className="border-t border-border pt-2 flex justify-between font-semibold">
          <span>Grand Total</span>
          <span className="font-mono text-primary">
            {formatINR(bill.totalAmount)}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Total Paid</span>
          <span className="font-mono text-green-600">
            {formatINR(totalPaid)}
          </span>
        </div>
        {balance > 0 && (
          <div className="flex justify-between font-medium">
            <span>Balance Due</span>
            <span className="font-mono text-destructive">
              {formatINR(balance)}
            </span>
          </div>
        )}
      </div>

      {/* Payment history */}
      {billPayments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Payment History</p>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Method</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">
                      {fmtDate(p.paymentDate)}
                    </TableCell>
                    <TableCell className="text-sm">{p.paymentMethod}</TableCell>
                    <TableCell className="text-right text-sm font-mono">
                      {formatINR(p.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.notes}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Record Payment */}
      {bill.status !== Variant_paid_unpaid_partial.paid && (
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => setShowPayForm((v) => !v)}
            className="flex items-center gap-1.5"
            data-ocid="billing.open_modal_button"
          >
            <CreditCard className="h-4 w-4" /> Record Payment
          </Button>
          <AnimatePresence>
            {showPayForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Amount (INR)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="0.00"
                        data-ocid="billing.payment_input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Method</Label>
                      <Select value={payMethod} onValueChange={setPayMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Notes</Label>
                      <Input
                        value={payNotes}
                        onChange={(e) => setPayNotes(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPayForm(false)}
                      data-ocid="billing.cancel_button"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleRecordPayment}
                      disabled={recordPayment.isPending}
                      data-ocid="billing.confirm_button"
                    >
                      {recordPayment.isPending && (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      )}{" "}
                      Record
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

export function BillingTab() {
  const { data: bills = [], isLoading } = useBillingRecords();
  const { data: payments = [] } = useAllPaymentsForBilling();
  const deleteMut = useDeleteBillingRecord();

  const [showForm, setShowForm] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillingRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<BillingRecord | null>(
    null,
  );

  const sorted = useMemo(
    () => [...bills].sort((a, b) => Number(b.createdAt - a.createdAt)),
    [bills],
  );

  const handleDelete = async (bill: BillingRecord) => {
    try {
      await deleteMut.mutateAsync(bill.id);
      toast.success("Bill deleted");
      setDeleteConfirm(null);
      if (selectedBill?.id === bill.id) setSelectedBill(null);
    } catch {
      toast.error("Failed to delete bill");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Billing
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Standalone bills for customers — GST and non-GST
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => {
              setShowForm(true);
              setSelectedBill(null);
            }}
            className="flex items-center gap-1.5"
            data-ocid="billing.open_modal_button"
          >
            <Plus className="h-4 w-4" /> Create New Bill
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <NewBillForm onClose={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedBill && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <BillDetailPanel
              bill={selectedBill}
              payments={payments}
              onClose={() => setSelectedBill(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div
          className="flex justify-center py-12"
          data-ocid="billing.loading_state"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-60" />
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="py-16 flex flex-col items-center gap-3 text-muted-foreground"
          data-ocid="billing.empty_state"
        >
          <FileText className="h-10 w-10 opacity-40" />
          <p className="text-sm">
            No bills yet. Click "Create New Bill" to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table data-ocid="billing.table">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs">Bill No.</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs hidden md:table-cell">
                  Type
                </TableHead>
                <TableHead className="text-xs hidden md:table-cell">
                  Payment
                </TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Total</TableHead>
                <TableHead className="text-xs w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((bill, idx) => (
                <TableRow
                  key={bill.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setSelectedBill(bill)}
                  data-ocid={`billing.item.${idx + 1}`}
                >
                  <TableCell className="font-mono text-sm font-semibold">
                    {bill.billNumber}
                  </TableCell>
                  <TableCell className="text-sm">
                    {fmtDate(bill.billDate)}
                  </TableCell>
                  <TableCell className="text-sm">{bill.customerName}</TableCell>
                  <TableCell className="text-sm hidden md:table-cell">
                    <Badge variant="outline" className="text-xs">
                      {bill.billType === Variant_gst_nonGst.gst
                        ? "GST"
                        : "Non-GST"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm hidden md:table-cell text-muted-foreground">
                    {bill.paymentMethod}
                  </TableCell>
                  <TableCell>{statusBadge(bill.status)}</TableCell>
                  <TableCell className="text-right text-sm font-mono font-semibold">
                    {formatINR(bill.totalAmount)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(bill)}
                      data-ocid={`billing.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirm */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent data-ocid="billing.dialog">
          <DialogHeader>
            <DialogTitle>Delete Bill</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete bill <strong>{deleteConfirm?.billNumber}</strong>? This
            cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              data-ocid="billing.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleteMut.isPending}
              data-ocid="billing.confirm_button"
            >
              {deleteMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
