import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AWBAssignRequest,
  AWBNumber,
  Booking,
  BookingId,
  Box,
  BoxItem,
  Consignee,
  Franchise,
  FranchiseId,
  Invoice,
  Shipper,
  TrackingUpdate,
  UserProfile,
} from "../backend.d";
import { TrackingMilestone, UserRole } from "../backend.d";
import { useActor } from "./useActor";

// ─── Queries ────────────────────────────────────────────────────────────────

export function useBookings() {
  const { actor, isFetching } = useActor();
  return useQuery<Booking[]>({
    queryKey: ["bookings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBookings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBookingById(bookingId: BookingId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Booking | null>({
    queryKey: ["booking", bookingId?.toString()],
    queryFn: async () => {
      if (!actor || bookingId === null) return null;
      return actor.getBookingById(bookingId);
    },
    enabled: !!actor && !isFetching && bookingId !== null,
  });
}

export function useBookingByAWB(awbNumber: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Booking | null>({
    queryKey: ["booking-awb", awbNumber],
    queryFn: async () => {
      if (!actor || !awbNumber) return null;
      return actor.getBookingByAWB(awbNumber);
    },
    enabled: !!actor && !isFetching && !!awbNumber,
  });
}

export function useTrackingByAWB(awbNumber: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<TrackingUpdate[]>({
    queryKey: ["tracking-awb", awbNumber],
    queryFn: async () => {
      if (!actor || !awbNumber) return [];
      return actor.getTrackingByAWB(awbNumber);
    },
    enabled: !!actor && !isFetching && !!awbNumber,
  });
}

export function useTrackingByBookingId(bookingId: BookingId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<TrackingUpdate[]>({
    queryKey: ["tracking-booking", bookingId?.toString()],
    queryFn: async () => {
      if (!actor || bookingId === null) return [];
      return actor.getTrackingByBookingId(bookingId);
    },
    enabled: !!actor && !isFetching && bookingId !== null,
  });
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["caller-profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["is-admin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUnreadCount() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["unread-count"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getUnreadCount();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30_000,
  });
}

export function useAllFranchisees() {
  const { actor, isFetching } = useActor();
  return useQuery<Franchise[]>({
    queryKey: ["franchisees"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFranchisees();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useAssignAWBAndApprove() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<Booking, Error, AWBAssignRequest>({
    mutationFn: async (req) => {
      if (!actor) throw new Error("Not connected");
      return actor.assignAWBAndApprove(req);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      void qc.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}

export function useRejectBooking() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<Booking, Error, BookingId>({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Not connected");
      return actor.rejectBooking(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useMarkNotificationsRead() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.markNotificationsRead();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}

export function useAddTrackingUpdate() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    void,
    Error,
    {
      awbNumber: AWBNumber;
      milestone: TrackingMilestone;
      notes: string | null;
      carrierName: string | null;
      carrierTrackingNumber: string | null;
      carrierTrackingURL: string | null;
    }
  >({
    mutationFn: async ({
      awbNumber,
      milestone,
      notes,
      carrierName,
      carrierTrackingNumber,
      carrierTrackingURL,
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addTrackingUpdate(
        awbNumber,
        milestone,
        notes,
        carrierName,
        carrierTrackingNumber,
        carrierTrackingURL,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tracking-awb"] });
      void qc.invalidateQueries({ queryKey: ["tracking-booking"] });
    },
  });
}

export function useCreateBooking() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    Booking,
    Error,
    {
      shipper: Shipper;
      consignee: Consignee;
      destinationCountry: string;
      invoice: Invoice;
      boxes: Box[];
      boxItems: BoxItem[];
    }
  >({
    mutationFn: async ({
      shipper,
      consignee,
      destinationCountry,
      invoice,
      boxes,
      boxItems,
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createBooking(
        shipper,
        consignee,
        destinationCountry,
        invoice,
        boxes,
        boxItems,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useCreateFranchise() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    Franchise,
    Error,
    {
      franchisePrincipal: Principal;
      username: string;
      franchiseName: string;
      contactPhone: string;
      contactEmail: string;
    }
  >({
    mutationFn: async ({
      franchisePrincipal,
      username,
      franchiseName,
      contactPhone,
      contactEmail,
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createFranchise(
        franchisePrincipal,
        username,
        franchiseName,
        contactPhone,
        contactEmail,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["franchisees"] });
    },
  });
}

export function useUpdateFranchiseStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    Franchise,
    Error,
    { franchiseId: FranchiseId; isActive: boolean }
  >({
    mutationFn: async ({ franchiseId, isActive }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateFranchiseStatus(franchiseId, isActive);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["franchisees"] });
    },
  });
}

export function useAdminResetPassword() {
  const { actor } = useActor();
  return useMutation<
    Franchise,
    Error,
    { franchiseId: FranchiseId; newPassword: string }
  >({
    mutationFn: async ({ franchiseId, newPassword }) => {
      if (!actor) throw new Error("Not connected");
      return actor.adminResetFranchisePassword(franchiseId, newPassword);
    },
  });
}

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  return useMutation<void, Error, { user: Principal; role: UserRole }>({
    mutationFn: async ({ user, role }) => {
      if (!actor) throw new Error("Not connected");
      return actor.assignCallerUserRole(user, role);
    },
  });
}

// Re-export enums for convenience
export { TrackingMilestone, UserRole };
