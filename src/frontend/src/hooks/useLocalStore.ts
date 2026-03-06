/**
 * React hooks for the localStorage-based data store.
 * These replace the backend actor-based useQueries.ts for the localStorage implementation.
 */

import { useCallback, useEffect, useState } from "react";
import type {
  BookingId,
  Box,
  BoxItem,
  Consignee,
  Invoice,
  Shipper,
} from "../backend.d";
import type { TrackingMilestone } from "../backend.d";
import type { Booking, Franchise, TrackingUpdate } from "../backend.d";
import {
  type Session,
  type StoredBooking,
  type StoredCharge,
  type StoredFranchise,
  type StoredTracking,
  authenticate,
  clearSession,
  getAllBookings,
  getAllFranchises,
  getBookingByAWB,
  getBookingsByFranchise,
  getChargesByBooking,
  getSession,
  getTrackingByAWB,
  setSession,
  addTrackingUpdate as storeAddTracking,
  assignAWBAndApprove as storeAssignAWB,
  createBooking as storeCreateBooking,
  createFranchise as storeCreateFranchise,
  deleteCharge as storeDeleteCharge,
  deleteFranchise as storeDeleteFranchise,
  deleteTrackingUpdate as storeDeleteTracking,
  rejectBooking as storeRejectBooking,
  resetFranchisePassword as storeResetPassword,
  saveCharge as storeSaveCharge,
  updateCharge as storeUpdateCharge,
  updateFranchiseStatus as storeUpdateStatus,
  storedToBooking,
  storedToFranchise,
  storedToTracking,
} from "../lib/store";

// ─── Auth Hook ────────────────────────────────────────────────────────────────

export function useLocalSession() {
  const [session, setSessionState] = useState<Session | null>(() =>
    getSession(),
  );

  const login = useCallback((username: string, password: string): boolean => {
    const s = authenticate(username, password);
    if (s) {
      setSession(s);
      setSessionState(s);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSessionState(null);
  }, []);

  return {
    session,
    isAuthenticated: !!session,
    isAdmin: session?.role === "admin",
    isFranchise: session?.role === "franchise",
    login,
    logout,
  };
}

// ─── Storage Change Listener ──────────────────────────────────────────────────

function useStorageEvent(eventName: string, handler: () => void) {
  useEffect(() => {
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [eventName, handler]);
}

// ─── Bookings Hooks ───────────────────────────────────────────────────────────

export function useAllBookings() {
  const [bookings, setBookings] = useState<Booking[]>(() =>
    getAllBookings().map(storedToBooking),
  );

  const refresh = useCallback(() => {
    setBookings(getAllBookings().map(storedToBooking));
  }, []);

  useStorageEvent("cargotrack:bookings", refresh);

  return { bookings, refresh };
}

export function useFranchiseBookings(franchiseId: string) {
  const [bookings, setBookings] = useState<Booking[]>(() =>
    getBookingsByFranchise(franchiseId).map(storedToBooking),
  );

  const refresh = useCallback(() => {
    setBookings(getBookingsByFranchise(franchiseId).map(storedToBooking));
  }, [franchiseId]);

  useStorageEvent("cargotrack:bookings", refresh);

  return { bookings, refresh };
}

export function useBookingByAWBPublic(awb: string | null) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const search = useCallback((awbNumber: string) => {
    setIsLoading(true);
    setNotFound(false);
    // Simulate async for UX
    setTimeout(() => {
      const found = getBookingByAWB(awbNumber);
      setBooking(found ? storedToBooking(found) : null);
      setNotFound(!found);
      setIsLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    if (awb) search(awb);
    else {
      setBooking(null);
      setNotFound(false);
    }
  }, [awb, search]);

  return { booking, isLoading, notFound };
}

// ─── Booking Mutations ────────────────────────────────────────────────────────

export function useCreateBooking() {
  const session = getSession();

  const mutate = useCallback(
    (params: {
      shipper: Shipper;
      consignee: Consignee;
      destinationCountry: string;
      invoice: Invoice;
      boxes: Box[];
      boxItems: BoxItem[];
    }): StoredBooking => {
      return storeCreateBooking({
        franchiseId: session?.role === "franchise" ? session.userId : null,
        createdBy: session?.username ?? "admin",
        ...params,
      });
    },
    [session],
  );

  return { mutate };
}

export function useAssignAWBAndApprove() {
  const mutate = useCallback(
    (bookingId: BookingId, awbNumber: string): boolean => {
      const result = storeAssignAWB(bookingId, awbNumber);
      return !!result;
    },
    [],
  );
  return { mutate };
}

export function useRejectBooking() {
  const mutate = useCallback((bookingId: BookingId): boolean => {
    const result = storeRejectBooking(bookingId);
    return !!result;
  }, []);
  return { mutate };
}

// ─── Tracking Hooks ───────────────────────────────────────────────────────────

export function useTrackingByAWB(awb: string | null) {
  const [updates, setUpdates] = useState<(TrackingUpdate & { id: string })[]>(
    () =>
      awb
        ? getTrackingByAWB(awb).map((t) => ({
            ...storedToTracking(t),
            id: t.id,
          }))
        : [],
  );

  const refresh = useCallback(() => {
    if (!awb) {
      setUpdates([]);
      return;
    }
    setUpdates(
      getTrackingByAWB(awb).map((t) => ({ ...storedToTracking(t), id: t.id })),
    );
  }, [awb]);

  useStorageEvent("cargotrack:tracking", refresh);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { updates, refresh };
}

export function useTrackingByAWBPublic(awb: string | null) {
  const [updates, setUpdates] = useState<TrackingUpdate[]>([]);

  useEffect(() => {
    if (!awb) {
      setUpdates([]);
      return;
    }
    setUpdates(getTrackingByAWB(awb).map(storedToTracking));
  }, [awb]);

  const handleStorageChange = useCallback(() => {
    if (!awb) return;
    setUpdates(getTrackingByAWB(awb).map(storedToTracking));
  }, [awb]);

  useStorageEvent("cargotrack:tracking", handleStorageChange);

  return { updates };
}

export function useAddTrackingUpdate() {
  const mutate = useCallback(
    (params: {
      awbNumber: string;
      milestone: TrackingMilestone;
      notes: string | null;
      carrierName: string | null;
      carrierTrackingNumber: string | null;
      carrierTrackingURL: string | null;
    }): StoredTracking => {
      return storeAddTracking(params);
    },
    [],
  );
  return { mutate };
}

export function useDeleteTrackingUpdate() {
  const mutate = useCallback((id: string): void => {
    storeDeleteTracking(id);
  }, []);
  return { mutate };
}

// ─── Franchise Hooks ──────────────────────────────────────────────────────────

export function useAllFranchises() {
  const [franchises, setFranchises] = useState<
    (Franchise & { password?: string })[]
  >(() => getAllFranchises().map(storedToFranchise));

  const refresh = useCallback(() => {
    setFranchises(getAllFranchises().map(storedToFranchise));
  }, []);

  useStorageEvent("cargotrack:franchises", refresh);

  return { franchises, refresh };
}

export function useCreateFranchise() {
  const mutate = useCallback(
    (params: {
      franchiseName: string;
      username: string;
      password: string;
      contactPhone: string;
      contactEmail: string;
    }): StoredFranchise => {
      return storeCreateFranchise(params);
    },
    [],
  );
  return { mutate };
}

export function useUpdateFranchiseStatus() {
  const mutate = useCallback(
    (franchiseId: string, isActive: boolean): boolean => {
      const result = storeUpdateStatus(franchiseId, isActive);
      return !!result;
    },
    [],
  );
  return { mutate };
}

export function useResetFranchisePassword() {
  const mutate = useCallback(
    (franchiseId: string, newPassword: string): boolean => {
      const result = storeResetPassword(franchiseId, newPassword);
      return !!result;
    },
    [],
  );
  return { mutate };
}

export function useDeleteFranchise() {
  const mutate = useCallback((franchiseId: string): void => {
    storeDeleteFranchise(franchiseId);
  }, []);
  return { mutate };
}

// ─── Charges Hooks ────────────────────────────────────────────────────────────

export function useChargesByBooking(bookingId: string) {
  const [charges, setCharges] = useState<StoredCharge[]>(() =>
    getChargesByBooking(bookingId),
  );

  const refresh = useCallback(() => {
    setCharges(getChargesByBooking(bookingId));
  }, [bookingId]);

  useStorageEvent("cargotrack:charges", refresh);

  return { charges, refresh };
}

export function useSaveCharge() {
  const mutate = useCallback(
    (charge: Omit<StoredCharge, "id" | "createdAt">): StoredCharge => {
      return storeSaveCharge(charge);
    },
    [],
  );
  return { mutate };
}

export function useUpdateCharge() {
  const mutate = useCallback(
    (
      id: string,
      updates: Partial<Pick<StoredCharge, "label" | "amount">>,
    ): StoredCharge | null => {
      return storeUpdateCharge(id, updates);
    },
    [],
  );
  return { mutate };
}

export function useDeleteCharge() {
  const mutate = useCallback((id: string): void => {
    storeDeleteCharge(id);
  }, []);
  return { mutate };
}
