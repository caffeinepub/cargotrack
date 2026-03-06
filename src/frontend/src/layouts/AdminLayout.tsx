import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LogOut,
  Navigation,
  Package,
  PlusCircle,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { BookingStatus } from "../backend.d";
import { useLocalSession, useTheme } from "../hooks/useLocalStore";
import { getAllBookings } from "../lib/store";

export function AdminLayout() {
  const { isAuthenticated, isAdmin, logout } = useLocalSession();
  const navigate = useNavigate();
  const location = useLocation();
  useTheme(); // Apply theme on mount

  // Count pending bookings for badge
  const pendingCount = useMemo(() => {
    return getAllBookings().filter((b) => b.status === BookingStatus.pending)
      .length;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      void navigate({ to: "/login" });
    } else if (!isAdmin) {
      void navigate({ to: "/franchise/bookings" });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleLogout = () => {
    logout();
    void navigate({ to: "/login" });
  };

  const navItems = [
    {
      label: "Dashboard",
      to: "/admin/dashboard",
      icon: LayoutDashboard,
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
    },
    { label: "All Bookings", to: "/admin/bookings", icon: Package },
    { label: "New Booking", to: "/admin/new-booking", icon: PlusCircle },
    { label: "Tracking", to: "/admin/tracking", icon: Navigation },
    { label: "Franchises", to: "/admin/franchises", icon: Users },
    { label: "Accounts", to: "/admin/accounts", icon: Wallet },
    { label: "Settings", to: "/admin/settings", icon: Settings },
  ];

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="px-4 py-4">
            <div className="flex flex-col items-center gap-1">
              <img
                src="/assets/uploads/20260305_152357_0000-removebg-preview-1.png"
                alt="Worldyfly Logistics"
                className="h-12 w-auto object-contain [filter:brightness(0)_invert(1)]"
              />
              <p className="text-sidebar-foreground/50 text-xs">Admin Portal</p>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.to);
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link
                            to={item.to}
                            data-ocid={`admin.${item.label.toLowerCase().replace(/\s+/g, "_")}.link`}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                        {item.badge && (
                          <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="px-4 py-3">
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleLogout}
              data-ocid="admin.logout.button"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
            <SidebarTrigger />
            <div className="flex-1" />
            <span className="text-sm text-muted-foreground">Admin</span>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
