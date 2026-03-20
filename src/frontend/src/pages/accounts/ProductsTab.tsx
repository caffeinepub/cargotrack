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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../../backend.d";
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "../../hooks/useQueries";

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

const DEFAULT_PRODUCTS = [
  {
    name: "Air Cargo",
    price: 0,
    gstPercent: 18,
    hsnSacCode: "9965",
    unit: "kg",
  },
  {
    name: "TSP Clearance",
    price: 0,
    gstPercent: 18,
    hsnSacCode: "9965",
    unit: "job",
  },
  {
    name: "Documentation",
    price: 0,
    gstPercent: 18,
    hsnSacCode: "9965",
    unit: "job",
  },
  {
    name: "Handling Charges",
    price: 0,
    gstPercent: 18,
    hsnSacCode: "9965",
    unit: "job",
  },
  {
    name: "Custom Clearance",
    price: 0,
    gstPercent: 18,
    hsnSacCode: "9965",
    unit: "job",
  },
];

const EMPTY_FORM = {
  name: "",
  price: "",
  gstPercent: "18",
  hsnSacCode: "9965",
  unit: "job",
  isActive: true,
};

export function ProductsTab() {
  const { data: products = [], isLoading } = useProducts();
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const deleteMut = useDeleteProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [seeded, setSeeded] = useState(false);

  // Auto-seed defaults when products list is empty and loaded
  useEffect(() => {
    if (!isLoading && products.length === 0 && !seeded) {
      setSeeded(true);
      const seed = async () => {
        for (const p of DEFAULT_PRODUCTS) {
          try {
            await createMut.mutateAsync(p);
          } catch {
            // ignore
          }
        }
      };
      void seed();
    }
  }, [isLoading, products.length, seeded, createMut]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: String(p.price),
      gstPercent: String(p.gstPercent),
      hsnSacCode: p.hsnSacCode,
      unit: p.unit,
      isActive: p.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const price = Number.parseFloat(form.price) || 0;
    const gstPercent = Number.parseFloat(form.gstPercent) || 0;
    try {
      if (editing) {
        await updateMut.mutateAsync({
          id: editing.id,
          name: form.name,
          price,
          gstPercent,
          hsnSacCode: form.hsnSacCode,
          unit: form.unit,
          isActive: form.isActive,
        });
        toast.success("Product updated");
      } else {
        await createMut.mutateAsync({
          name: form.name,
          price,
          gstPercent,
          hsnSacCode: form.hsnSacCode,
          unit: form.unit,
        });
        toast.success("Product added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save product");
    }
  };

  const handleToggleActive = async (p: Product) => {
    try {
      await updateMut.mutateAsync({ ...p, isActive: !p.isActive });
      toast.success(p.isActive ? "Product deactivated" : "Product activated");
    } catch {
      toast.error("Failed to update product");
    }
  };

  const handleDelete = async (p: Product) => {
    try {
      await deleteMut.mutateAsync(p.id);
      toast.success("Product deleted");
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete product");
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
            <Package className="h-5 w-5 text-primary" />
            Products & Services
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Catalog of services for billing and GST invoices
          </p>
        </div>
        <Button
          onClick={openCreate}
          data-ocid="products.open_modal_button"
          className="flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {isLoading ? (
        <div
          className="flex justify-center py-12"
          data-ocid="products.loading_state"
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary opacity-60" />
        </div>
      ) : products.length === 0 ? (
        <div
          className="py-16 flex flex-col items-center gap-3 text-muted-foreground"
          data-ocid="products.empty_state"
        >
          <Package className="h-10 w-10 opacity-40" />
          <p className="text-sm">Setting up default services...</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table data-ocid="products.table">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs text-right">
                  Price (INR)
                </TableHead>
                <TableHead className="text-xs text-right">GST %</TableHead>
                <TableHead className="text-xs hidden md:table-cell">
                  HSN/SAC
                </TableHead>
                <TableHead className="text-xs hidden md:table-cell">
                  Unit
                </TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p, idx) => (
                <TableRow
                  key={p.id}
                  data-ocid={`products.item.${idx + 1}`}
                  className={p.isActive ? "" : "opacity-50"}
                >
                  <TableCell className="font-medium text-sm">
                    {p.name}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {formatINR(p.price)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {p.gstPercent}%
                  </TableCell>
                  <TableCell className="text-sm hidden md:table-cell font-mono text-xs">
                    {p.hsnSacCode}
                  </TableCell>
                  <TableCell className="text-sm hidden md:table-cell">
                    {p.unit}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={p.isActive}
                      onCheckedChange={() => handleToggleActive(p)}
                      data-ocid={`products.switch.${idx + 1}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(p)}
                        data-ocid={`products.edit_button.${idx + 1}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(p)}
                        data-ocid={`products.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="products.dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Product" : "Add Product / Service"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="prod-name">Name *</Label>
              <Input
                id="prod-name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Air Cargo"
                data-ocid="products.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prod-price">Default Price (INR)</Label>
                <Input
                  id="prod-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price: e.target.value }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod-gst">GST %</Label>
                <Input
                  id="prod-gst"
                  type="number"
                  min="0"
                  max="100"
                  value={form.gstPercent}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, gstPercent: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="prod-hsn">HSN / SAC Code</Label>
                <Input
                  id="prod-hsn"
                  value={form.hsnSacCode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, hsnSacCode: e.target.value }))
                  }
                  placeholder="9965"
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prod-unit">Unit</Label>
                <Input
                  id="prod-unit"
                  value={form.unit}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, unit: e.target.value }))
                  }
                  placeholder="kg / job / hr"
                />
              </div>
            </div>
            {editing && (
              <div className="flex items-center gap-2">
                <Switch
                  id="prod-active"
                  checked={form.isActive}
                  onCheckedChange={(v) =>
                    setForm((p) => ({ ...p, isActive: v }))
                  }
                  data-ocid="products.switch"
                />
                <Label htmlFor="prod-active">Active</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="products.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              data-ocid="products.submit_button"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Update" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent data-ocid="products.delete_dialog">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{deleteConfirm?.name}</strong>? This cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              data-ocid="products.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleteMut.isPending}
              data-ocid="products.confirm_button"
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
