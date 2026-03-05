import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

// Redirect /franchise/dashboard to /franchise/bookings
export function FranchiseDashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    void navigate({ to: "/franchise/bookings" });
  }, [navigate]);
  return null;
}
