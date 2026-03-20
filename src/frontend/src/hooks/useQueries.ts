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

// ─── Customer Hooks ─────────────────────────────────────────────────────────

import type {
  BillingItem,
  BillingRecord,
  BillingRecordId,
  Customer,
  CustomerId,
  PaymentRecord,
  Product,
  ProductId,
} from "../backend.d";
import {
  Variant_gst_nonGst,
  Variant_igst_none_cgstSgst,
  Variant_paid_unpaid_partial,
} from "../backend.d";

export function useCustomers() {
  const { actor, isFetching } = useActor();
  return useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    Customer,
    Error,
    { name: string; phone: string; address: string; gstin: string }
  >({
    mutationFn: async ({ name, phone, address, gstin }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createCustomer(name, phone, address, gstin);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    Customer,
    Error,
    {
      id: CustomerId;
      name: string;
      phone: string;
      address: string;
      gstin: string;
    }
  >({
    mutationFn: async ({ id, name, phone, address, gstin }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateCustomer(id, name, phone, address, gstin);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<void, Error, CustomerId>({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteCustomer(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

// ─── Product Hooks ──────────────────────────────────────────────────────────

export function useProducts() {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    Product,
    Error,
    {
      name: string;
      price: number;
      gstPercent: number;
      hsnSacCode: string;
      unit: string;
    }
  >({
    mutationFn: async ({ name, price, gstPercent, hsnSacCode, unit }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createProduct(name, price, gstPercent, hsnSacCode, unit);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    Product,
    Error,
    {
      id: ProductId;
      name: string;
      price: number;
      gstPercent: number;
      hsnSacCode: string;
      unit: string;
      isActive: boolean;
    }
  >({
    mutationFn: async ({
      id,
      name,
      price,
      gstPercent,
      hsnSacCode,
      unit,
      isActive,
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateProduct(
        id,
        name,
        price,
        gstPercent,
        hsnSacCode,
        unit,
        isActive,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<void, Error, ProductId>({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteProduct(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

// ─── Billing Hooks ──────────────────────────────────────────────────────────

export function useBillingRecords() {
  const { actor, isFetching } = useActor();
  return useQuery<BillingRecord[]>({
    queryKey: ["billing-records"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBillingRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

interface CreateBillingPayload {
  billNumber: string;
  billDate: bigint;
  billType: Variant_gst_nonGst;
  customerId: string;
  customerName: string;
  customerGstin: string;
  items: BillingItem[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  taxType: Variant_igst_none_cgstSgst;
  paymentMethod: string;
  status: Variant_paid_unpaid_partial;
  notes: string;
}

export function useCreateBillingRecord() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<BillingRecord, Error, CreateBillingPayload>({
    mutationFn: async (p) => {
      if (!actor) throw new Error("Not connected");
      return actor.createBillingRecord(
        p.billNumber,
        p.billDate,
        p.billType,
        p.customerId,
        p.customerName,
        p.customerGstin,
        p.items,
        p.subtotal,
        p.discountAmount,
        p.taxableAmount,
        p.cgst,
        p.sgst,
        p.igst,
        p.totalAmount,
        p.taxType,
        p.paymentMethod,
        p.status,
        p.notes,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["billing-records"] });
    },
  });
}

export function useDeleteBillingRecord() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<void, Error, BillingRecordId>({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteBillingRecord(id);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["billing-records"] });
    },
  });
}

export function useAllPaymentsForBilling() {
  const { actor, isFetching } = useActor();
  return useQuery<PaymentRecord[]>({
    queryKey: ["all-billing-payments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPayments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordBillingPayment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation<
    PaymentRecord,
    Error,
    {
      billingRecordId: string;
      amount: number;
      paymentMethod: string;
      paymentDate: bigint;
      notes: string;
    }
  >({
    mutationFn: async ({
      billingRecordId,
      amount,
      paymentMethod,
      paymentDate,
      notes,
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.recordPayment(
        billingRecordId,
        amount,
        paymentMethod,
        paymentDate,
        notes,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["all-billing-payments"] });
      void qc.invalidateQueries({ queryKey: ["billing-records"] });
    },
  });
}

export {
  Variant_gst_nonGst,
  Variant_igst_none_cgstSgst,
  Variant_paid_unpaid_partial,
};
export type {
  BillingItem,
  BillingRecord,
  BillingRecordId,
  Customer,
  CustomerId,
  PaymentRecord,
  Product,
  ProductId,
};
