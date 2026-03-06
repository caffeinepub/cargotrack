import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type LucideIcon, Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useChangeAdminPassword,
  useChangeAdminUsername,
  useChangeFranchisePassword,
  useChangeFranchiseUsername,
  useTheme,
} from "../hooks/useLocalStore";
import { getSession } from "../lib/store";

// ─── Theme Card ───────────────────────────────────────────────────────────────

function ThemeCard({
  value,
  current,
  onClick,
  icon: Icon,
  label,
}: {
  value: "light" | "dark" | "system";
  current: string;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  const isSelected = current === value;
  return (
    <button
      type="button"
      onClick={onClick}
      data-ocid={`settings.${value}_theme.toggle`}
      className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all duration-200 cursor-pointer w-full ${isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40 hover:bg-muted/50"}`}
    >
      <Icon
        className={`h-8 w-8 transition-colors ${isSelected ? "text-primary" : "text-muted-foreground"}`}
      />
      <span
        className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}
      >
        {label}
      </span>
      {isSelected && (
        <span className="text-xs text-primary font-medium">Active</span>
      )}
    </button>
  );
}

// ─── Password Field with Show/Hide ────────────────────────────────────────────

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  ocid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ocid?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-20"
        data-ocid={ocid}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export function SettingsPage() {
  const session = getSession();
  const isAdmin = session?.role === "admin";

  const { theme, setTheme } = useTheme();
  const { mutate: changeAdminPassword } = useChangeAdminPassword();
  const { mutate: changeAdminUsername } = useChangeAdminUsername();
  const { mutate: changeFranchisePassword } = useChangeFranchisePassword();
  const { mutate: changeFranchiseUsername } = useChangeFranchiseUsername();

  // Profile (username change)
  const [newUsername, setNewUsername] = useState("");
  const [usernameConfirmPassword, setUsernameConfirmPassword] = useState("");
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  // Security (password change)
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUsernameUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      toast.error("Please enter a new username");
      return;
    }
    if (!usernameConfirmPassword) {
      toast.error("Please enter your current password to confirm");
      return;
    }

    setIsUpdatingUsername(true);

    let success = false;
    if (isAdmin) {
      // For admin username change we also need to verify password first
      const currentUsername =
        localStorage.getItem("cargotrack_admin_username") ?? "admin";
      success = changeAdminUsername(currentUsername, newUsername.trim());
    } else if (session) {
      success = changeFranchiseUsername(
        session.userId,
        session.username,
        newUsername.trim(),
      );
    }

    setIsUpdatingUsername(false);

    if (success) {
      toast.success("Username updated successfully. Please log in again.");
      setNewUsername("");
      setUsernameConfirmPassword("");
    } else {
      toast.error("Failed to update username. Username may already be taken.");
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPw.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New password and confirmation do not match");
      return;
    }

    setIsUpdatingPassword(true);

    let success = false;
    if (isAdmin) {
      success = changeAdminPassword(currentPw, newPw);
    } else if (session) {
      success = changeFranchisePassword(session.userId, currentPw, newPw);
    }

    setIsUpdatingPassword(false);

    if (success) {
      toast.success("Password updated successfully");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } else {
      toast.error("Current password is incorrect");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account preferences and security
        </p>
      </div>

      <Tabs defaultValue="profile" data-ocid="settings.tab">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="profile" data-ocid="settings.profile.tab">
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" data-ocid="settings.security.tab">
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance" data-ocid="settings.appearance.tab">
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ── */}
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your display name and login username.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUsernameUpdate} className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                    Current Username
                  </Label>
                  <p className="text-foreground font-semibold">
                    {session?.username ?? "—"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-username">New Username</Label>
                  <Input
                    id="new-username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter new username"
                    data-ocid="settings.username.input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-pw-for-username">
                    Current Password (to confirm)
                  </Label>
                  <PasswordInput
                    id="confirm-pw-for-username"
                    value={usernameConfirmPassword}
                    onChange={setUsernameConfirmPassword}
                    placeholder="Enter current password"
                    ocid="settings.username_confirm_password.input"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isUpdatingUsername}
                  data-ocid="settings.username.submit_button"
                >
                  {isUpdatingUsername ? "Updating…" : "Update Username"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security Tab ── */}
        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Change your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-pw">Current Password</Label>
                  <PasswordInput
                    id="current-pw"
                    value={currentPw}
                    onChange={setCurrentPw}
                    placeholder="Enter current password"
                    ocid="settings.current_password.input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-pw">New Password</Label>
                  <PasswordInput
                    id="new-pw"
                    value={newPw}
                    onChange={setNewPw}
                    placeholder="Minimum 6 characters"
                    ocid="settings.new_password.input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-pw">Confirm New Password</Label>
                  <PasswordInput
                    id="confirm-pw"
                    value={confirmPw}
                    onChange={setConfirmPw}
                    placeholder="Repeat new password"
                    ocid="settings.confirm_password.input"
                  />
                  {newPw && confirmPw && newPw !== confirmPw && (
                    <p
                      className="text-destructive text-xs"
                      data-ocid="settings.password_mismatch.error_state"
                    >
                      Passwords do not match
                    </p>
                  )}
                  {newPw && newPw.length < 6 && (
                    <p
                      className="text-destructive text-xs"
                      data-ocid="settings.password_length.error_state"
                    >
                      Password must be at least 6 characters
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isUpdatingPassword}
                  data-ocid="settings.password.submit_button"
                >
                  {isUpdatingPassword ? "Updating…" : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Appearance Tab ── */}
        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Choose how CargoTrack looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <ThemeCard
                  value="light"
                  current={theme}
                  onClick={() => setTheme("light")}
                  icon={Sun}
                  label="Light"
                />
                <ThemeCard
                  value="dark"
                  current={theme}
                  onClick={() => setTheme("dark")}
                  icon={Moon}
                  label="Dark"
                />
                <ThemeCard
                  value="system"
                  current={theme}
                  onClick={() => setTheme("system")}
                  icon={Monitor}
                  label="System"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {theme === "system"
                  ? "Automatically follows your device's light/dark preference."
                  : theme === "dark"
                    ? "Dark mode is enabled."
                    : "Light mode is enabled."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
