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
import { Loader2, PlusCircle, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAllFranchises,
  useCreateFranchise,
  useDeleteFranchise,
  useResetFranchisePassword,
  useUpdateFranchiseStatus,
} from "../../hooks/useLocalStore";

interface AddFranchiseForm {
  franchiseName: string;
  username: string;
  password: string;
  contactPhone: string;
  contactEmail: string;
}

const emptyForm: AddFranchiseForm = {
  franchiseName: "",
  username: "",
  password: "",
  contactPhone: "",
  contactEmail: "",
};

export function AdminFranchises() {
  const { franchises } = useAllFranchises();
  const { mutate: createFranchise } = useCreateFranchise();
  const { mutate: updateStatus } = useUpdateFranchiseStatus();
  const { mutate: resetPassword } = useResetFranchisePassword();
  const { mutate: deleteFranchise } = useDeleteFranchise();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [form, setForm] = useState<AddFranchiseForm>(emptyForm);
  const [isCreating, setIsCreating] = useState(false);

  const [resetFranchiseId, setResetFranchiseId] = useState<string | null>(null);
  const [resetFranchiseName, setResetFranchiseName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const resetFranchiseObj = franchises.find(
    (f) => f.franchiseId === resetFranchiseId,
  );

  const handleCreate = async () => {
    if (!form.franchiseName || !form.username || !form.password) {
      toast.error("Franchise name, username, and password are required");
      return;
    }
    setIsCreating(true);
    await new Promise((r) => setTimeout(r, 300));
    try {
      createFranchise({
        franchiseName: form.franchiseName,
        username: form.username,
        password: form.password,
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
      });
      toast.success(`Franchise "${form.franchiseName}" created`);
      setShowAddDialog(false);
      setForm(emptyForm);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create franchise",
      );
    }
    setIsCreating(false);
  };

  const handleToggleStatus = (franchiseId: string, current: boolean) => {
    const success = updateStatus(franchiseId, !current);
    if (success) {
      toast.success(`Franchise ${current ? "deactivated" : "activated"}`);
    } else {
      toast.error("Failed to update status");
    }
  };

  const handleResetPassword = async () => {
    if (!resetFranchiseId || !newPassword.trim()) return;
    setIsResetting(true);
    await new Promise((r) => setTimeout(r, 300));
    const success = resetPassword(resetFranchiseId, newPassword.trim());
    if (success) {
      toast.success("Password reset successfully");
      setResetFranchiseId(null);
      setNewPassword("");
    } else {
      toast.error("Failed to reset password");
    }
    setIsResetting(false);
  };

  const handleDelete = (franchiseId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete franchise "${name}"?`))
      return;
    deleteFranchise(franchiseId);
    toast.success("Franchise deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Franchise Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage franchise accounts and their access
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          data-ocid="franchises.open_modal_button"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Franchise
        </Button>
      </div>

      {franchises.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-border py-16 text-center"
          data-ocid="franchises.empty_state"
        >
          <p className="text-muted-foreground font-medium">No franchises yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add your first franchise account above
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table data-ocid="franchises.table">
            <TableHeader>
              <TableRow>
                <TableHead>Franchise Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Contact Phone</TableHead>
                <TableHead>Contact Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {franchises.map((f, idx) => (
                <TableRow
                  key={f.franchiseId}
                  data-ocid={`franchises.item.${idx + 1}`}
                >
                  <TableCell className="font-medium">
                    {f.franchiseName}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {f.username}
                  </TableCell>
                  <TableCell>{f.contactPhone || "—"}</TableCell>
                  <TableCell>{f.contactEmail || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={f.isActive}
                        onCheckedChange={() =>
                          handleToggleStatus(f.franchiseId, f.isActive)
                        }
                        data-ocid={`franchises.switch.${idx + 1}`}
                      />
                      <Badge
                        variant={f.isActive ? "default" : "secondary"}
                        className={
                          f.isActive
                            ? "bg-success/10 text-success border-success/30"
                            : ""
                        }
                      >
                        {f.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setResetFranchiseId(f.franchiseId);
                          setResetFranchiseName(f.franchiseName);
                          setNewPassword("");
                        }}
                        data-ocid={`franchises.edit_button.${idx + 1}`}
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Reset PW
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          handleDelete(f.franchiseId, f.franchiseName)
                        }
                        data-ocid={`franchises.delete_button.${idx + 1}`}
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

      {/* Add Franchise Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent data-ocid="add_franchise.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Add New Franchise
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Franchise Name *</Label>
              <Input
                placeholder="e.g. Mumbai Express Cargo"
                value={form.franchiseName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, franchiseName: e.target.value }))
                }
                data-ocid="add_franchise.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                placeholder="e.g. mumbai_express"
                value={form.username}
                onChange={(e) =>
                  setForm((p) => ({ ...p, username: e.target.value }))
                }
                data-ocid="add_franchise.username.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                placeholder="Set initial password"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                data-ocid="add_franchise.password.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input
                placeholder="+91 98765 43210"
                value={form.contactPhone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contactPhone: e.target.value }))
                }
                data-ocid="add_franchise.phone.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input
                type="email"
                placeholder="franchise@example.com"
                value={form.contactEmail}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contactEmail: e.target.value }))
                }
                data-ocid="add_franchise.email.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setForm(emptyForm);
              }}
              data-ocid="add_franchise.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              data-ocid="add_franchise.confirm_button"
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Franchise
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={!!resetFranchiseId}
        onOpenChange={(open) => !open && setResetFranchiseId(null)}
      >
        <DialogContent data-ocid="reset_password.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {resetFranchiseObj && (
              <p className="text-sm text-muted-foreground">
                Resetting password for <strong>{resetFranchiseName}</strong> (
                {resetFranchiseObj.username})
              </p>
            )}
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-ocid="reset_password.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetFranchiseId(null)}
              data-ocid="reset_password.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={!newPassword.trim() || isResetting}
              data-ocid="reset_password.confirm_button"
            >
              {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
