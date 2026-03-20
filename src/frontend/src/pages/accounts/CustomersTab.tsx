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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Customer } from "../../backend.d";
import {
  useBillingRecords,
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "../../hooks/useQueries";
import { Variant_paid_unpaid_partial } from "../../hooks/useQueries";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function CustomersTab() {
  const { data: customers = [], isLoading } = useCustomers();
  const { data: bills = [] } = useBillingRecords();
  const createMut = useCreateCustomer();
  const updateMut = useUpdateCustomer();
  const deleteMut = useDeleteCustomer();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    gstin: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);

  // Per-customer totals from billing records
  const customerStats = useMemo(() => {
    const map: Record<string, { total: number; paid: number }> = {};
    for (const b of bills) {
      if (!map[b.customerId]) map[b.customerId] = { total: 0, paid: 0 };
      map[b.customerId].total += b.totalAmount;
      if (b.status === Variant_paid_unpaid_partial.paid) {
        map[b.customerId].paid += b.totalAmount;
      }
    }
    return map;
  }, [bills]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", phone: "", address: "", gstin: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone,
      address: c.address,
      gstin: c.gstin,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Phone is required");
      return;
    }
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...form });
        toast.success("Customer updated");
      } else {
        await createMut.mutateAsync(form);
        toast.success("Customer added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save customer");
    }
  };

  const handleDelete = async (c: Customer) => {
    try {
      await deleteMut.mutateAsync(c.id);
      toast.success("Customer deleted");
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete customer");
    }
  };

  const isSaving = createMut.isPending || updateMut.isPending;

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
            <Users className="h-5 w-5 text-primary" />
            Customers
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage saved customers for billing and GST bills
          </p>
        </div>
        <Button
          onClick={openCreate}
          data-ocid="customers.open_modal_button"
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {isLoading ? (
        <div
          className="flex justify-center py-12"
          data-ocid="customers.loading_state"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-60" />
        </div>
      ) : customers.length === 0 ? (
        <div
          className="py-16 flex flex-col items-center gap-3 text-muted-foreground"
          data-ocid="customers.empty_state"
        >
          <Users className="h-10 w-10 opacity-40" />
          <p className="text-sm">No customers yet.</p>
          <p className="text-xs">
            Click &quot;Add Customer&quot; to create your first customer record.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table data-ocid="customers.table">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Phone</TableHead>
                <TableHead className="text-xs hidden md:table-cell">
                  Address
                </TableHead>
                <TableHead className="text-xs hidden lg:table-cell">
                  GSTIN
                </TableHead>
                <TableHead className="text-xs text-right">
                  Total Billed
                </TableHead>
                <TableHead className="text-xs text-right">
                  Outstanding
                </TableHead>
                <TableHead className="text-xs w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c, idx) => {
                const stats = customerStats[c.id] ?? { total: 0, paid: 0 };
                const outstanding = stats.total - stats.paid;
                return (
                  <TableRow key={c.id} data-ocid={`customers.item.${idx + 1}`}>
                    <TableCell className="font-medium text-sm">
                      {c.name}
                    </TableCell>
                    <TableCell className="text-sm">{c.phone}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell text-muted-foreground truncate max-w-xs">
                      {c.address}
                    </TableCell>
                    <TableCell className="text-sm hidden lg:table-cell font-mono text-xs">
                      {c.gstin || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono">
                      {formatINR(stats.total)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {outstanding > 0 ? (
                        <Badge
                          variant="destructive"
                          className="font-mono text-xs"
                        >
                          {formatINR(outstanding)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(c)}
                          data-ocid={`customers.edit_button.${idx + 1}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm(c)}
                          data-ocid={`customers.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="customers.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Customer" : "Add Customer"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cust-name">Name *</Label>
              <Input
                id="cust-name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Customer / Company Name"
                data-ocid="customers.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-phone">Phone *</Label>
              <Input
                id="cust-phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+91 XXXXXXXXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-address">Address</Label>
              <Input
                id="cust-address"
                value={form.address}
                onChange={(e) =>
                  setForm((p) => ({ ...p, address: e.target.value }))
                }
                placeholder="Street, City, State"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-gstin">GSTIN</Label>
              <Input
                id="cust-gstin"
                value={form.gstin}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    gstin: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="e.g. 27AAPFU0939F1ZV"
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="customers.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              data-ocid="customers.submit_button"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Update" : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent data-ocid="customers.delete_dialog">
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{deleteConfirm?.name}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              data-ocid="customers.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleteMut.isPending}
              data-ocid="customers.confirm_button"
            >
              {deleteMut.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
