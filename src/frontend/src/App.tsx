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
import { LoginPage } from "./pages/LoginPage";
import { PublicTracking } from "./pages/PublicTracking";
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

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  adminLayoutRoute.addChildren([
    adminIndexRoute,
    adminDashboardRoute,
    adminBookingsRoute,
    adminNewBookingRoute,
    adminTrackingRoute,
    adminFranchisesRoute,
  ]),
  franchiseLayoutRoute.addChildren([
    franchiseDashboardRoute,
    franchiseNewBookingRoute,
    franchiseBookingsRoute,
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
