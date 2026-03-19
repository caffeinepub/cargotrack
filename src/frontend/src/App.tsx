import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { AdminLayout } from "./layouts/AdminLayout";
import { FranchiseLayout } from "./layouts/FranchiseLayout";
import { AccountsPage } from "./pages/AccountsPage";
import { GstBillPrint } from "./pages/GstBillPrint";
import { LoginPage } from "./pages/LoginPage";
import { PrintPage } from "./pages/PrintPage";
import { PublicTracking } from "./pages/PublicTracking";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminBookings } from "./pages/admin/AdminBookings";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminFranchises } from "./pages/admin/AdminFranchises";
import { AdminTracking } from "./pages/admin/AdminTracking";
import { FranchiseBookings } from "./pages/franchise/FranchiseBookings";
import { FranchiseDashboard } from "./pages/franchise/FranchiseDashboard";
import { NewBooking } from "./pages/franchise/NewBooking";

// Root
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  ),
});

// Public
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: PublicTracking,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// Admin layout route
const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminLayout,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/admin/dashboard" });
  },
  component: () => null,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/dashboard",
  component: AdminDashboard,
});

const adminBookingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/bookings",
  component: AdminBookings,
});

const adminNewBookingRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/new-booking",
  component: NewBooking,
});

const adminTrackingRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/tracking",
  component: AdminTracking,
});

const adminFranchisesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/franchises",
  component: AdminFranchises,
});

const adminAccountsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/accounts",
  component: AccountsPage,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/settings",
  component: SettingsPage,
});

// Franchise layout route
const franchiseLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/franchise",
  component: FranchiseLayout,
});

const franchiseDashboardRoute = createRoute({
  getParentRoute: () => franchiseLayoutRoute,
  path: "/dashboard",
  component: FranchiseDashboard,
});

const franchiseNewBookingRoute = createRoute({
  getParentRoute: () => franchiseLayoutRoute,
  path: "/new-booking",
  component: NewBooking,
});

const franchiseBookingsRoute = createRoute({
  getParentRoute: () => franchiseLayoutRoute,
  path: "/bookings",
  component: FranchiseBookings,
});

const franchiseAccountsRoute = createRoute({
  getParentRoute: () => franchiseLayoutRoute,
  path: "/accounts",
  component: AccountsPage,
});

const franchiseSettingsRoute = createRoute({
  getParentRoute: () => franchiseLayoutRoute,
  path: "/settings",
  component: SettingsPage,
});

// Print routes (no layout, standalone pages)
const printInvoiceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/print/invoice/$bookingId",
  component: () => <PrintPage docType="invoice" />,
});

const printAWBRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/print/awb/$bookingId",
  component: () => <PrintPage docType="awb" />,
});

const printAccountsInvoiceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/print/accounts-invoice/$bookingId",
  component: () => <PrintPage docType="accounts-invoice" />,
});

const printLabelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/print/label/$bookingId",
  component: () => <PrintPage docType="label" />,
});

const printGstBillRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/print/gst-bill/$gstBillId",
  component: GstBillPrint,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  printInvoiceRoute,
  printAWBRoute,
  printAccountsInvoiceRoute,
  printLabelRoute,
  printGstBillRoute,
  adminLayoutRoute.addChildren([
    adminIndexRoute,
    adminDashboardRoute,
    adminBookingsRoute,
    adminNewBookingRoute,
    adminTrackingRoute,
    adminFranchisesRoute,
    adminAccountsRoute,
    adminSettingsRoute,
  ]),
  franchiseLayoutRoute.addChildren([
    franchiseDashboardRoute,
    franchiseNewBookingRoute,
    franchiseBookingsRoute,
    franchiseAccountsRoute,
    franchiseSettingsRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
