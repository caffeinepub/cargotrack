import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Product {
    id: ProductId;
    name: string;
    unit: string;
    gstPercent: number;
    isActive: boolean;
    price: number;
    hsnSacCode: string;
}
export interface Consignee {
    name: string;
    idNumber: string;
    address: string;
    phone: string;
    idType: KycType;
}
export type BookingId = bigint;
export type Time = bigint;
export interface BillingRecord {
    id: BillingRecordId;
    customerName: string;
    status: Variant_paid_unpaid_partial;
    customerGstin: string;
    paymentMethod: string;
    taxableAmount: number;
    cgst: number;
    discountAmount: number;
    igst: number;
    createdAt: Time;
    sgst: number;
    billDate: Time;
    billType: Variant_gst_nonGst;
    totalAmount: number;
    notes: string;
    billNumber: string;
    customerId: string;
    items: Array<BillingItem>;
    taxType: Variant_igst_none_cgstSgst;
    subtotal: number;
}
export interface PaymentRecord {
    id: string;
    paymentMethod: string;
    notes: string;
    paymentDate: Time;
    amount: number;
    billingRecordId: string;
}
export interface Box {
    height: number;
    grossWeight: number;
    length: number;
    volumeWeight: number;
    width: number;
    boxNumber: bigint;
}
export type FranchiseId = string;
export interface Invoice {
    invoiceDate: Time;
    invoiceNumber: string;
    currency: string;
}
export interface Customer {
    id: CustomerId;
    name: string;
    createdAt: Time;
    gstin: string;
    address: string;
    phone: string;
}
export type AWBNumber = string;
export interface BillingItem {
    rate: number;
    gstPercent: number;
    description: string;
    productId: string;
    quantity: bigint;
    amount: number;
}
export type UserId = string;
export type BillingRecordId = string;
export interface TrackingUpdate {
    awbNumber: AWBNumber;
    carrierTrackingURL?: string;
    carrierName?: string;
    notes?: string;
    timestamp: Time;
    milestone: TrackingMilestone;
    carrierTrackingNumber?: string;
}
export type CustomerId = string;
export interface BoxItem {
    total: number;
    rate: number;
    description: string;
    quantity: bigint;
    boxNumber: bigint;
    hsCode: string;
}
export interface AWBAssignRequest {
    bookingId: BookingId;
    awbNumber: string;
}
export interface Booking {
    shipper: Shipper;
    status: BookingStatus;
    bookingId: BookingId;
    awbAssignedDate?: Time;
    boxItems: Array<BoxItem>;
    invoice: Invoice;
    awbNumber?: AWBNumber;
    createdBy: UserId;
    createdTimestamp: Time;
    boxes: Array<Box>;
    updatedTimestamp: Time;
    originCountry: string;
    destinationCountry: string;
    consignee: Consignee;
}
export type ProductId = string;
export interface Shipper {
    kycNumber: string;
    name: string;
    address: string;
    phone: string;
    kycType: KycType;
}
export interface Franchise {
    principal: Principal;
    username: string;
    isActive: boolean;
    contactEmail: string;
    franchiseName: string;
    franchiseId: FranchiseId;
    contactPhone: string;
}
export interface UserProfile {
    userId: string;
    name: string;
    role: UserRole;
    franchiseId?: FranchiseId;
}
export enum BookingStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum KycType {
    pan = "pan",
    passport = "passport",
    aadhaar = "aadhaar",
    drivingLicense = "drivingLicense"
}
export enum TrackingMilestone {
    outForDelivery = "outForDelivery",
    handoverToCarrier = "handoverToCarrier",
    movedToWarehouse = "movedToWarehouse",
    inTransit = "inTransit",
    reachedDestinationPort = "reachedDestinationPort",
    baggingDone = "baggingDone",
    customsClearanceAtOrigin = "customsClearanceAtOrigin"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_gst_nonGst {
    gst = "gst",
    nonGst = "nonGst"
}
export enum Variant_igst_none_cgstSgst {
    igst = "igst",
    none = "none",
    cgstSgst = "cgstSgst"
}
export enum Variant_paid_unpaid_partial {
    paid = "paid",
    unpaid = "unpaid",
    partial = "partial"
}
export interface backendInterface {
    addTrackingUpdate(awbNumber: AWBNumber, milestone: TrackingMilestone, notes: string | null, carrierName: string | null, carrierTrackingNumber: string | null, carrierTrackingURL: string | null): Promise<void>;
    adminResetFranchisePassword(franchiseId: FranchiseId, newPassword: string): Promise<Franchise>;
    assignAWBAndApprove(awbAssignRequest: AWBAssignRequest): Promise<Booking>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBillingRecord(billNumber: string, billDate: Time, billType: Variant_gst_nonGst, customerId: string, customerName: string, customerGstin: string, items: Array<BillingItem>, subtotal: number, discountAmount: number, taxableAmount: number, cgst: number, sgst: number, igst: number, totalAmount: number, taxType: Variant_igst_none_cgstSgst, paymentMethod: string, status: Variant_paid_unpaid_partial, notes: string): Promise<BillingRecord>;
    createBooking(shipper: Shipper, consignee: Consignee, destinationCountry: string, invoice: Invoice, boxes: Array<Box>, boxItems: Array<BoxItem>): Promise<Booking>;
    createCustomer(name: string, phone: string, address: string, gstin: string): Promise<Customer>;
    createFranchise(franchisePrincipal: Principal, username: string, franchiseName: string, contactPhone: string, contactEmail: string): Promise<Franchise>;
    createProduct(name: string, price: number, gstPercent: number, hsnSacCode: string, unit: string): Promise<Product>;
    deleteBillingRecord(id: BillingRecordId): Promise<void>;
    deleteCustomer(id: CustomerId): Promise<void>;
    deleteProduct(id: ProductId): Promise<void>;
    franchiseeUpdatePassword(currentPassword: string, newPassword: string): Promise<void>;
    getAllFranchisees(): Promise<Array<Franchise>>;
    getAllPayments(): Promise<Array<PaymentRecord>>;
    getBillingRecordById(id: BillingRecordId): Promise<BillingRecord>;
    getBillingRecords(): Promise<Array<BillingRecord>>;
    getBookingByAWB(awbNumber: AWBNumber): Promise<Booking>;
    getBookingById(bookingId: BookingId): Promise<Booking>;
    getBookings(): Promise<Array<Booking>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomers(): Promise<Array<Customer>>;
    getFranchise(franchiseId: FranchiseId): Promise<Franchise>;
    getPaymentsForBill(billingRecordId: string): Promise<Array<PaymentRecord>>;
    getProducts(): Promise<Array<Product>>;
    getTrackingByAWB(awbNumber: AWBNumber): Promise<Array<TrackingUpdate>>;
    getTrackingByBookingId(bookingId: BookingId): Promise<Array<TrackingUpdate>>;
    getUnreadCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markNotificationsRead(): Promise<void>;
    recordPayment(billingRecordId: string, amount: number, paymentMethod: string, paymentDate: Time, notes: string): Promise<PaymentRecord>;
    rejectBooking(bookingId: BookingId): Promise<Booking>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    test(): Promise<void>;
    updateBillingRecord(id: BillingRecordId, billNumber: string, billDate: Time, billType: Variant_gst_nonGst, customerId: string, customerName: string, customerGstin: string, items: Array<BillingItem>, subtotal: number, discountAmount: number, taxableAmount: number, cgst: number, sgst: number, igst: number, totalAmount: number, taxType: Variant_igst_none_cgstSgst, paymentMethod: string, status: Variant_paid_unpaid_partial, notes: string): Promise<BillingRecord>;
    updateCustomer(id: CustomerId, name: string, phone: string, address: string, gstin: string): Promise<Customer>;
    updateFranchise(franchiseId: FranchiseId, franchiseName: string, contactPhone: string, contactEmail: string): Promise<Franchise>;
    updateFranchiseStatus(franchiseId: FranchiseId, isActive: boolean): Promise<Franchise>;
    updateProduct(id: ProductId, name: string, price: number, gstPercent: number, hsnSacCode: string, unit: string, isActive: boolean): Promise<Product>;
}
