import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type BookingId = bigint;
export type Time = bigint;
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
export type AWBNumber = string;
export type UserId = string;
export interface AWBAssignRequest {
    bookingId: BookingId;
    awbNumber: string;
}
export interface TrackingUpdate {
    awbNumber: AWBNumber;
    carrierTrackingURL?: string;
    carrierName?: string;
    notes?: string;
    timestamp: Time;
    milestone: TrackingMilestone;
    carrierTrackingNumber?: string;
}
export interface BoxItem {
    total: number;
    rate: number;
    description: string;
    quantity: bigint;
    boxNumber: bigint;
    hsCode: string;
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
export interface Consignee {
    name: string;
    idNumber: string;
    address: string;
    phone: string;
    idType: KycType;
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
export interface backendInterface {
    addTrackingUpdate(awbNumber: AWBNumber, milestone: TrackingMilestone, notes: string | null, carrierName: string | null, carrierTrackingNumber: string | null, carrierTrackingURL: string | null): Promise<void>;
    adminResetFranchisePassword(franchiseId: FranchiseId, newPassword: string): Promise<Franchise>;
    assignAWBAndApprove(awbAssignRequest: AWBAssignRequest): Promise<Booking>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBooking(shipper: Shipper, consignee: Consignee, destinationCountry: string, invoice: Invoice, boxes: Array<Box>, boxItems: Array<BoxItem>): Promise<Booking>;
    createFranchise(franchisePrincipal: Principal, username: string, franchiseName: string, contactPhone: string, contactEmail: string): Promise<Franchise>;
    franchiseeUpdatePassword(currentPassword: string, newPassword: string): Promise<void>;
    getAllFranchisees(): Promise<Array<Franchise>>;
    getBookingByAWB(awbNumber: AWBNumber): Promise<Booking>;
    getBookingById(bookingId: BookingId): Promise<Booking>;
    getBookings(): Promise<Array<Booking>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFranchise(franchiseId: FranchiseId): Promise<Franchise>;
    getTrackingByAWB(awbNumber: AWBNumber): Promise<Array<TrackingUpdate>>;
    getTrackingByBookingId(bookingId: BookingId): Promise<Array<TrackingUpdate>>;
    getUnreadCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markNotificationsRead(): Promise<void>;
    rejectBooking(bookingId: BookingId): Promise<Booking>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    test(): Promise<void>;
    updateFranchise(franchiseId: FranchiseId, franchiseName: string, contactPhone: string, contactEmail: string): Promise<Franchise>;
    updateFranchiseStatus(franchiseId: FranchiseId, isActive: boolean): Promise<Franchise>;
}
