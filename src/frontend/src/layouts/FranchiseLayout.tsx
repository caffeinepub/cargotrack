import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { LogOut, Package, Package2, PlusCircle } from "lucide-react";
import { useEffect } from "react";
import { useLocalSession } from "../hooks/useLocalStore";

export function FranchiseLayout() {
  const { isAuthenticated, isAdmin, isFranchise, logout, session } =
    useLocalSession();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      void navigate({ to: "/login" });
    } else if (isAdmin) {
      void navigate({ to: "/admin/dashboard" });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleLogout = () => {
    logout();
    void navigate({ to: "/login" });
  };

  const navItems = [
    { label: "New Booking", to: "/franchise/new-booking", icon: PlusCircle },
    { label: "My Bookings", to: "/franchise/bookings", icon: Package },
  ];

  if (!isAuthenticated || !isFranchise) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <Package2 className="h-4 w-4 text-sidebar-primary-foreground" />
              </div>
              <div>
                <p className="font-display font-bold text-sidebar-foreground text-sm">
                  CargoTrack
                </p>
                <p className="text-sidebar-foreground/50 text-xs truncate max-w-[120px]">
                  {session?.franchiseName ??
                    session?.username ??
                    "Franchise Portal"}
                </p>
              </div>
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
                            data-ocid={`franchise.${item.label.toLowerCase().replace(/\s+/g, "_")}.link`}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
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
              data-ocid="franchise.logout.button"
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
            <span className="text-sm text-muted-foreground">
              {session?.franchiseName ?? session?.username}
            </span>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
