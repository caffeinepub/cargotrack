/**
 * localStorage-based data store for CargoTrack
 * All data is persisted to localStorage and managed via event-driven updates.
 */

import {
  BookingStatus,
  type KycType,
  type TrackingMilestone,
} from "../backend.d";
import type {
  Booking,
  BookingId,
  Box,
  BoxItem,
  Consignee,
  Franchise,
  Invoice,
  Shipper,
  TrackingUpdate,
} from "../backend.d";

// ─── Storage Keys ────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  BOOKINGS: "cargotrack_bookings",
  FRANCHISES: "cargotrack_franchises",
  TRACKING: "cargotrack_tracking",
  SESSION: "cargotrack_session",
  BOOKING_COUNTER: "cargotrack_booking_counter",
  CHARGES: "cargotrack_charges",
} as const;

// ─── Session ─────────────────────────────────────────────────────────────────

export interface Session {
  role: "admin" | "franchise";
  userId: string;
  username: string;
  franchiseName?: string;
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

// ─── Serializable Booking ────────────────────────────────────────────────────
// We store bookings as plain objects (bigint → string for JSON compat)

export interface StoredBooking {
  id: string;
  bookingId: string; // bigint as string
  franchiseId: string | null;
  createdBy: string;
  status: BookingStatus;
  awbNumber: string | null;
  awbAssignedDate: string | null; // timestamp ms as string
  createdTimestamp: string; // ms as string
  updatedTimestamp: string;
  originCountry: string;
  destinationCountry: string;
  shipper: {
    name: string;
    phone: string;
    address: string;
    kycType: KycType;
    kycNumber: string;
  };
  consignee: {
    name: string;
    phone: string;
    address: string;
    idType: KycType;
    idNumber: string;
  };
  invoice: {
    invoiceNumber: string;
    invoiceDate: string; // ms as string
    currency: string;
  };
  boxes: Array<{
    boxNumber: string;
    grossWeight: number;
    length: number;
    width: number;
    height: number;
    volumeWeight: number;
  }>;
  boxItems: Array<{
    boxNumber: string;
    description: string;
    hsCode: string;
    quantity: string;
    rate: number;
    total: number;
  }>;
}

export interface StoredTracking {
  id: string;
  awbNumber: string;
  milestone: TrackingMilestone;
  timestamp: string; // ms as string
  notes: string | null;
  carrierName: string | null;
  carrierTrackingNumber: string | null;
  carrierTrackingURL: string | null;
}

// ─── Storage Helpers ─────────────────────────────────────────────────────────

function readBookings(): StoredBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!raw) return [];
    return JSON.parse(raw) as StoredBooking[];
  } catch {
    return [];
  }
}

function writeBookings(bookings: StoredBooking[]): void {
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  window.dispatchEvent(new Event("cargotrack:bookings"));
}

function readTracking(): StoredTracking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRACKING);
    if (!raw) return [];
    return JSON.parse(raw) as StoredTracking[];
  } catch {
    return [];
  }
}

function writeTracking(tracking: StoredTracking[]): void {
  localStorage.setItem(STORAGE_KEYS.TRACKING, JSON.stringify(tracking));
  window.dispatchEvent(new Event("cargotrack:tracking"));
}

function readFranchises(): StoredFranchise[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FRANCHISES);
    if (!raw) return [];
    return JSON.parse(raw) as StoredFranchise[];
  } catch {
    return [];
  }
}

function writeFranchises(franchises: StoredFranchise[]): void {
  localStorage.setItem(STORAGE_KEYS.FRANCHISES, JSON.stringify(franchises));
  window.dispatchEvent(new Event("cargotrack:franchises"));
}

function nextBookingId(): number {
  const raw = localStorage.getItem(STORAGE_KEYS.BOOKING_COUNTER) ?? "0";
  const next = Number.parseInt(raw, 10) + 1;
  localStorage.setItem(STORAGE_KEYS.BOOKING_COUNTER, String(next));
  return next;
}

// ─── Franchise Storage ───────────────────────────────────────────────────────

export interface StoredFranchise {
  franchiseId: string;
  username: string;
  password: string;
  franchiseName: string;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Converters ──────────────────────────────────────────────────────────────

export function storedToBooking(s: StoredBooking): Booking {
  return {
    bookingId: BigInt(s.bookingId),
    createdBy: s.createdBy,
    status: s.status,
    awbNumber: s.awbNumber ?? undefined,
    awbAssignedDate: s.awbAssignedDate
      ? BigInt(s.awbAssignedDate) * 1_000_000n
      : undefined,
    createdTimestamp: BigInt(s.createdTimestamp) * 1_000_000n,
    updatedTimestamp: BigInt(s.updatedTimestamp) * 1_000_000n,
    originCountry: s.originCountry,
    destinationCountry: s.destinationCountry,
    shipper: {
      name: s.shipper.name,
      phone: s.shipper.phone,
      address: s.shipper.address,
      kycType: s.shipper.kycType,
      kycNumber: s.shipper.kycNumber,
    },
    consignee: {
      name: s.consignee.name,
      phone: s.consignee.phone,
      address: s.consignee.address,
      idType: s.consignee.idType,
      idNumber: s.consignee.idNumber,
    },
    invoice: {
      invoiceNumber: s.invoice.invoiceNumber,
      invoiceDate: BigInt(s.invoice.invoiceDate) * 1_000_000n,
      currency: s.invoice.currency,
    },
    boxes: s.boxes.map((b) => ({
      boxNumber: BigInt(b.boxNumber),
      grossWeight: b.grossWeight,
      length: b.length,
      width: b.width,
      height: b.height,
      volumeWeight: b.volumeWeight,
    })),
    boxItems: s.boxItems.map((i) => ({
      boxNumber: BigInt(i.boxNumber),
      description: i.description,
      hsCode: i.hsCode,
      quantity: BigInt(i.quantity),
      rate: i.rate,
      total: i.total,
    })),
  };
}

export function storedToTracking(s: StoredTracking): TrackingUpdate {
  return {
    awbNumber: s.awbNumber,
    milestone: s.milestone,
    timestamp: BigInt(s.timestamp) * 1_000_000n,
    notes: s.notes ?? undefined,
    carrierName: s.carrierName ?? undefined,
    carrierTrackingNumber: s.carrierTrackingNumber ?? undefined,
    carrierTrackingURL: s.carrierTrackingURL ?? undefined,
  };
}

export function storedToFranchise(
  s: StoredFranchise,
): Franchise & { password?: string } {
  return {
    franchiseId: s.franchiseId,
    username: s.username,
    franchiseName: s.franchiseName,
    contactPhone: s.contactPhone,
    contactEmail: s.contactEmail,
    isActive: s.isActive,
    // Note: principal is unused in our localStorage-based implementation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    principal: null as any,
    password: s.password,
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

const ADMIN_CREDENTIALS = { username: "admin", password: "admin123" };

export function authenticate(
  username: string,
  password: string,
): Session | null {
  // Check admin
  if (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    return { role: "admin", userId: "admin", username: "admin" };
  }

  // Check franchises
  const franchises = readFranchises();
  const franchise = franchises.find(
    (f) => f.username === username && f.password === password && f.isActive,
  );
  if (franchise) {
    return {
      role: "franchise",
      userId: franchise.franchiseId,
      username: franchise.username,
      franchiseName: franchise.franchiseName,
    };
  }

  return null;
}

// ─── Booking CRUD ─────────────────────────────────────────────────────────────

export function getAllBookings(): StoredBooking[] {
  return readBookings();
}

export function getBookingsByFranchise(franchiseId: string): StoredBooking[] {
  return readBookings().filter((b) => b.franchiseId === franchiseId);
}

export function getBookingByAWB(awb: string): StoredBooking | null {
  return (
    readBookings().find(
      (b) => b.awbNumber?.toLowerCase() === awb.toLowerCase(),
    ) ?? null
  );
}

export function createBooking(params: {
  franchiseId: string | null;
  createdBy: string;
  shipper: Shipper;
  consignee: Consignee;
  destinationCountry: string;
  invoice: Invoice;
  boxes: Box[];
  boxItems: BoxItem[];
}): StoredBooking {
  const id = nextBookingId();
  const now = String(Date.now());
  const stored: StoredBooking = {
    id: `BK-${String(id).padStart(3, "0")}`,
    bookingId: String(id),
    franchiseId: params.franchiseId,
    createdBy: params.createdBy,
    status: BookingStatus.pending,
    awbNumber: null,
    awbAssignedDate: null,
    createdTimestamp: now,
    updatedTimestamp: now,
    originCountry: "India",
    destinationCountry: params.destinationCountry,
    shipper: {
      name: params.shipper.name,
      phone: params.shipper.phone,
      address: params.shipper.address,
      kycType: params.shipper.kycType,
      kycNumber: params.shipper.kycNumber,
    },
    consignee: {
      name: params.consignee.name,
      phone: params.consignee.phone,
      address: params.consignee.address,
      idType: params.consignee.idType,
      idNumber: params.consignee.idNumber,
    },
    invoice: {
      invoiceNumber: params.invoice.invoiceNumber,
      invoiceDate: String(Number(params.invoice.invoiceDate / 1_000_000n)),
      currency: params.invoice.currency,
    },
    boxes: params.boxes.map((b) => ({
      boxNumber: b.boxNumber.toString(),
      grossWeight: b.grossWeight,
      length: b.length,
      width: b.width,
      height: b.height,
      volumeWeight: b.volumeWeight,
    })),
    boxItems: params.boxItems.map((i) => ({
      boxNumber: i.boxNumber.toString(),
      description: i.description,
      hsCode: i.hsCode,
      quantity: i.quantity.toString(),
      rate: i.rate,
      total: i.total,
    })),
  };

  const bookings = readBookings();
  bookings.unshift(stored);
  writeBookings(bookings);
  return stored;
}

export function assignAWBAndApprove(
  bookingId: BookingId,
  awbNumber: string,
): StoredBooking | null {
  const bookings = readBookings();
  const idx = bookings.findIndex((b) => b.bookingId === bookingId.toString());
  if (idx === -1) return null;
  bookings[idx] = {
    ...bookings[idx],
    awbNumber,
    awbAssignedDate: String(Date.now()),
    status: BookingStatus.approved,
    updatedTimestamp: String(Date.now()),
  };
  writeBookings(bookings);
  return bookings[idx];
}

export function rejectBooking(bookingId: BookingId): StoredBooking | null {
  const bookings = readBookings();
  const idx = bookings.findIndex((b) => b.bookingId === bookingId.toString());
  if (idx === -1) return null;
  bookings[idx] = {
    ...bookings[idx],
    status: BookingStatus.rejected,
    updatedTimestamp: String(Date.now()),
  };
  writeBookings(bookings);
  return bookings[idx];
}

// ─── Tracking CRUD ────────────────────────────────────────────────────────────

export function getTrackingByAWB(awb: string): StoredTracking[] {
  return readTracking().filter(
    (t) => t.awbNumber.toLowerCase() === awb.toLowerCase(),
  );
}

export function addTrackingUpdate(params: {
  awbNumber: string;
  milestone: TrackingMilestone;
  notes: string | null;
  carrierName: string | null;
  carrierTrackingNumber: string | null;
  carrierTrackingURL: string | null;
}): StoredTracking {
  const record: StoredTracking = {
    id: `TRK-${Date.now()}`,
    awbNumber: params.awbNumber,
    milestone: params.milestone,
    timestamp: String(Date.now()),
    notes: params.notes,
    carrierName: params.carrierName,
    carrierTrackingNumber: params.carrierTrackingNumber,
    carrierTrackingURL: params.carrierTrackingURL,
  };
  const all = readTracking();
  all.push(record);
  writeTracking(all);
  return record;
}

export function deleteTrackingUpdate(id: string): void {
  const all = readTracking().filter((t) => t.id !== id);
  writeTracking(all);
}

// ─── Franchise CRUD ───────────────────────────────────────────────────────────

export function getAllFranchises(): StoredFranchise[] {
  return readFranchises();
}

export function createFranchise(params: {
  franchiseName: string;
  username: string;
  password: string;
  contactPhone: string;
  contactEmail: string;
}): StoredFranchise {
  // Check username uniqueness
  const existing = readFranchises();
  if (existing.find((f) => f.username === params.username)) {
    throw new Error("Username already exists");
  }

  const franchise: StoredFranchise = {
    franchiseId: `FR-${Date.now()}`,
    username: params.username,
    password: params.password,
    franchiseName: params.franchiseName,
    contactPhone: params.contactPhone,
    contactEmail: params.contactEmail,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  existing.push(franchise);
  writeFranchises(existing);
  return franchise;
}

export function updateFranchiseStatus(
  franchiseId: string,
  isActive: boolean,
): StoredFranchise | null {
  const all = readFranchises();
  const idx = all.findIndex((f) => f.franchiseId === franchiseId);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], isActive };
  writeFranchises(all);
  return all[idx];
}

export function resetFranchisePassword(
  franchiseId: string,
  newPassword: string,
): StoredFranchise | null {
  const all = readFranchises();
  const idx = all.findIndex((f) => f.franchiseId === franchiseId);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], password: newPassword };
  writeFranchises(all);
  return all[idx];
}

export function deleteFranchise(franchiseId: string): void {
  const all = readFranchises().filter((f) => f.franchiseId !== franchiseId);
  writeFranchises(all);
}

// ─── Charges Storage ──────────────────────────────────────────────────────────

export interface StoredCharge {
  id: string;
  bookingId: string; // matches StoredBooking.bookingId
  label: string; // e.g. "Customs Duty", "Packaging Charges", custom text
  amount: number;
  currency: string; // inherited from booking invoice currency
  createdAt: string; // ms timestamp as string
}

function readCharges(): StoredCharge[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHARGES);
    if (!raw) return [];
    return JSON.parse(raw) as StoredCharge[];
  } catch {
    return [];
  }
}

function writeCharges(charges: StoredCharge[]): void {
  localStorage.setItem(STORAGE_KEYS.CHARGES, JSON.stringify(charges));
  window.dispatchEvent(new Event("cargotrack:charges"));
}

export function getChargesByBooking(bookingId: string): StoredCharge[] {
  return readCharges().filter((c) => c.bookingId === bookingId);
}

export function saveCharge(
  charge: Omit<StoredCharge, "id" | "createdAt">,
): StoredCharge {
  const newCharge: StoredCharge = {
    ...charge,
    id: `CHG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: String(Date.now()),
  };
  const all = readCharges();
  all.push(newCharge);
  writeCharges(all);
  return newCharge;
}

export function updateCharge(
  id: string,
  updates: Partial<Pick<StoredCharge, "label" | "amount">>,
): StoredCharge | null {
  const all = readCharges();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates };
  writeCharges(all);
  return all[idx];
}

export function deleteCharge(id: string): void {
  const all = readCharges().filter((c) => c.id !== id);
  writeCharges(all);
}
