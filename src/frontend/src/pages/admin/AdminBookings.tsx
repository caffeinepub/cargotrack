import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Edit2,
  Eye,
  FileText,
  Loader2,
  Pencil,
  PlusCircle,
  Printer,
  Search,
  Tag,
  Trash2,
} from "lucide-react";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { BookingStatus, KycType } from "../../backend.d";
import type { Booking } from "../../backend.d";
import { StatusBadge } from "../../components/StatusBadge";
import {
  useAllBookings,
  useAllFranchises,
  useAssignAWBAndApprove,
  useRejectBooking,
  useUpdateBooking,
} from "../../hooks/useLocalStore";
import { COUNTRIES } from "../../lib/constants";
import { exportBookingsToCSV } from "../../lib/excelExport";
import { formatDate, formatTimestamp } from "../../lib/helpers";
import HS_CODE_DATABASE from "../../lib/hsCodeDatabase";
import { KYC_LABEL } from "../../lib/kycLabels";

// ─── Types for the edit form ──────────────────────────────────────────────────

interface BoxFormRow {
  id: string;
  grossWeight: string;
  length: string;
  width: string;
  height: string;
}

interface BoxItemRow {
  id: string;
  boxNumber: string;
  description: string;
  hsCode: string;
  quantity: string;
  rate: string;
  showSuggestions: boolean;
}

function calcVolumeWeight(l: string, w: string, h: string): number {
  return (
    ((Number.parseFloat(l) || 0) *
      (Number.parseFloat(w) || 0) *
      (Number.parseFloat(h) || 0)) /
    5000
  );
}

// ─── BookingDetailModal ───────────────────────────────────────────────────────

function BookingDetailModal({
  booking,
  onClose,
  onEdit,
}: {
  booking: Booking;
  onClose: () => void;
  onEdit: () => void;
}) {
  const handlePrintInvoice = () => {
    window.open(`/print/invoice/${booking.bookingId.toString()}`, "_blank");
  };

  const handlePrintAWB = () => {
    window.open(`/print/awb/${booking.bookingId.toString()}`, "_blank");
  };

  const handlePrintAccountsInvoice = () => {
    window.open(
      `/print/accounts-invoice/${booking.bookingId.toString()}`,
      "_blank",
    );
  };

  const handlePrintLabel = () => {
    window.open(`/print/label/${booking.bookingId.toString()}`, "_blank");
  };

  return (
    <DialogContent
      className="max-w-3xl max-h-[90vh] overflow-y-auto"
      data-ocid="booking_detail.dialog"
    >
      <DialogHeader>
        <DialogTitle className="font-display flex items-center justify-between pr-8">
          <span>Booking #{booking.bookingId.toString()}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={onEdit}
            data-ocid="booking_detail.edit_button"
            className="gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Booking
          </Button>
        </DialogTitle>
      </DialogHeader>

      {/* Print buttons at the TOP */}
      {booking.status === BookingStatus.approved && (
        <div className="flex flex-wrap gap-2 pb-2 border-b border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintAWB}
            data-ocid="booking_detail.print_awb_button"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Print AWB
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintInvoice}
            data-ocid="booking_detail.secondary_button"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download Invoice
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintAccountsInvoice}
            data-ocid="booking_detail.accounts_invoice_button"
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Accounts Invoice
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintLabel}
            data-ocid="booking_detail.print_label_button"
          >
            <Tag className="mr-1.5 h-3.5 w-3.5" />
            Print Label
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {/* Status + AWB */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={booking.status} />
          {booking.awbNumber ? (
            <span className="text-sm font-mono bg-muted px-2 py-1 rounded font-semibold">
              AWB: {booking.awbNumber}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground italic">
              AWB not assigned yet
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            Created: {formatTimestamp(booking.createdTimestamp)}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Shipper */}
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">
              Shipper Details
            </h3>
            <div className="space-y-1.5 text-sm">
              <p>
                <strong>Name:</strong> {booking.shipper.name}
              </p>
              <p>
                <strong>Phone:</strong> {booking.shipper.phone}
              </p>
              <p>
                <strong>Address:</strong> {booking.shipper.address}
              </p>
              <p>
                <strong>KYC:</strong>{" "}
                {KYC_LABEL[booking.shipper.kycType] ?? booking.shipper.kycType}{" "}
                — {booking.shipper.kycNumber}
              </p>
            </div>
          </div>

          {/* Consignee */}
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">
              Consignee Details
            </h3>
            <div className="space-y-1.5 text-sm">
              <p>
                <strong>Name:</strong> {booking.consignee.name}
              </p>
              <p>
                <strong>Phone:</strong> {booking.consignee.phone}
              </p>
              <p>
                <strong>Address:</strong> {booking.consignee.address}
              </p>
              <p>
                <strong>ID:</strong>{" "}
                {KYC_LABEL[booking.consignee.idType] ??
                  booking.consignee.idType}{" "}
                — {booking.consignee.idNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Route + Invoice */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">
              Shipment Route
            </h3>
            <div className="space-y-1.5 text-sm">
              <p>
                <strong>Origin:</strong> {booking.originCountry}
              </p>
              <p>
                <strong>Destination:</strong> {booking.destinationCountry}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">
              Invoice
            </h3>
            <div className="space-y-1.5 text-sm">
              <p>
                <strong>Invoice #:</strong> {booking.invoice.invoiceNumber}
              </p>
              <p>
                <strong>Date:</strong> {formatDate(booking.invoice.invoiceDate)}
              </p>
              <p>
                <strong>Currency:</strong> {booking.invoice.currency}
              </p>
            </div>
          </div>
        </div>

        {/* Boxes */}
        {booking.boxes.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">
              Boxes ({booking.boxes.length})
            </h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Box #</TableHead>
                    <TableHead>Gross Wt (kg)</TableHead>
                    <TableHead>L×W×H (cm)</TableHead>
                    <TableHead>Vol Wt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booking.boxes.map((box) => (
                    <TableRow key={box.boxNumber.toString()}>
                      <TableCell>{box.boxNumber.toString()}</TableCell>
                      <TableCell>{box.grossWeight}</TableCell>
                      <TableCell>
                        {box.length}×{box.width}×{box.height}
                      </TableCell>
                      <TableCell>{box.volumeWeight.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Box Items */}
        {booking.boxItems.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground">
              Items
            </h3>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Box #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>HS Code</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booking.boxItems.map((item) => (
                    <TableRow
                      key={`${item.boxNumber.toString()}-${item.description}-${item.hsCode}`}
                    >
                      <TableCell>{item.boxNumber.toString()}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.hsCode}
                      </TableCell>
                      <TableCell>{item.quantity.toString()}</TableCell>
                      <TableCell>
                        {booking.invoice.currency} {item.rate.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {booking.invoice.currency} {item.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          data-ocid="booking_detail.close_button"
        >
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ─── EditBookingDialog ────────────────────────────────────────────────────────

function EditBookingDialog({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  const { mutate: updateBooking } = useUpdateBooking();

  // Shipper
  const [shipperName, setShipperName] = useState(booking.shipper.name);
  const [shipperPhone, setShipperPhone] = useState(booking.shipper.phone);
  const [shipperAddress, setShipperAddress] = useState(booking.shipper.address);
  const [shipperKycType, setShipperKycType] = useState<KycType>(
    booking.shipper.kycType,
  );
  const [shipperKycNumber, setShipperKycNumber] = useState(
    booking.shipper.kycNumber,
  );

  // Consignee
  const [consigneeName, setConsigneeName] = useState(booking.consignee.name);
  const [consigneePhone, setConsigneePhone] = useState(booking.consignee.phone);
  const [consigneeAddress, setConsigneeAddress] = useState(
    booking.consignee.address,
  );
  const [consigneeIdType, setConsigneeIdType] = useState<KycType>(
    booking.consignee.idType,
  );
  const [consigneeIdNumber, setConsigneeIdNumber] = useState(
    booking.consignee.idNumber,
  );

  // Route
  const [destinationCountry, setDestinationCountry] = useState(
    booking.destinationCountry,
  );
  const [countrySearch, setCountrySearch] = useState(
    booking.destinationCountry,
  );
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Invoice
  const [currency, setCurrency] = useState(booking.invoice.currency);
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const ms = Number(booking.invoice.invoiceDate / 1_000_000n);
    return new Date(ms).toISOString().slice(0, 10);
  });

  // Boxes
  const [boxes, setBoxes] = useState<BoxFormRow[]>(
    booking.boxes.map((b) => ({
      id: b.boxNumber.toString(),
      grossWeight: String(b.grossWeight),
      length: String(b.length),
      width: String(b.width),
      height: String(b.height),
    })),
  );

  // Box items
  const [boxItems, setBoxItems] = useState<BoxItemRow[]>(
    booking.boxItems.map((item, i) => ({
      id: String(i + 1),
      boxNumber: item.boxNumber.toString(),
      description: item.description,
      hsCode: item.hsCode,
      quantity: item.quantity.toString(),
      rate: String(item.rate),
      showSuggestions: false,
    })),
  );

  const [isSaving, setIsSaving] = useState(false);

  const filteredCountries = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  const handleAddBox = () => {
    const newId = String(boxes.length + 1);
    setBoxes((prev) => [
      ...prev,
      { id: newId, grossWeight: "", length: "", width: "", height: "" },
    ]);
  };

  const handleRemoveBox = (id: string) => {
    if (boxes.length === 1) return;
    setBoxes((prev) => prev.filter((b) => b.id !== id));
  };

  const handleBoxChange = (
    id: string,
    field: keyof BoxFormRow,
    value: string,
  ) => {
    setBoxes((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    );
  };

  const handleAddItem = () => {
    setBoxItems((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        boxNumber: "1",
        description: "",
        hsCode: "",
        quantity: "",
        rate: "",
        showSuggestions: false,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (boxItems.length === 1) return;
    setBoxItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof BoxItemRow,
    value: string,
  ) => {
    setBoxItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "description") {
          const match = HS_CODE_DATABASE.find(
            (h) => h.description.toLowerCase() === value.toLowerCase(),
          );
          if (match) updated.hsCode = match.code;
          updated.showSuggestions = value.length > 1;
        }
        return updated;
      }),
    );
  };

  const handleSelectHsCode = (
    itemId: string,
    description: string,
    hsCode: string,
  ) => {
    setBoxItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, description, hsCode, showSuggestions: false }
          : item,
      ),
    );
  };

  const getHsSuggestions = (desc: string) => {
    if (!desc || desc.length < 2) return [];
    const lower = desc.toLowerCase();
    return HS_CODE_DATABASE.filter(
      (h) =>
        h.description.toLowerCase().includes(lower) || h.code.includes(lower),
    ).slice(0, 8);
  };

  const handleSave = async () => {
    if (!shipperName || !shipperPhone || !shipperAddress || !shipperKycNumber) {
      toast.error("Please fill in all shipper details");
      return;
    }
    if (
      !consigneeName ||
      !consigneePhone ||
      !consigneeAddress ||
      !consigneeIdNumber
    ) {
      toast.error("Please fill in all consignee details");
      return;
    }
    if (!destinationCountry) {
      toast.error("Please select a destination country");
      return;
    }

    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 300));

    const updatedBoxes = boxes.map((b, i) => ({
      boxNumber: String(i + 1),
      grossWeight: Number.parseFloat(b.grossWeight) || 0,
      length: Number.parseFloat(b.length) || 0,
      width: Number.parseFloat(b.width) || 0,
      height: Number.parseFloat(b.height) || 0,
      volumeWeight: calcVolumeWeight(b.length, b.width, b.height),
    }));

    const updatedBoxItems = boxItems.map((item) => {
      const qty = Number.parseInt(item.quantity) || 0;
      const rate = Number.parseFloat(item.rate) || 0;
      return {
        boxNumber: item.boxNumber,
        description: item.description,
        hsCode: item.hsCode,
        quantity: item.quantity,
        rate,
        total: qty * rate,
      };
    });

    const success = updateBooking(booking.bookingId, {
      shipper: {
        name: shipperName,
        phone: shipperPhone,
        address: shipperAddress,
        kycType: shipperKycType,
        kycNumber: shipperKycNumber,
      },
      consignee: {
        name: consigneeName,
        phone: consigneePhone,
        address: consigneeAddress,
        idType: consigneeIdType,
        idNumber: consigneeIdNumber,
      },
      destinationCountry,
      invoice: {
        invoiceNumber: booking.invoice.invoiceNumber,
        invoiceDate: String(new Date(invoiceDate).getTime()),
        currency,
      },
      boxes: updatedBoxes,
      boxItems: updatedBoxItems,
    });

    setIsSaving(false);

    if (success) {
      toast.success("Booking updated successfully");
      onClose();
    } else {
      toast.error("Failed to update booking");
    }
  };

  return (
    <DialogContent
      className="max-w-3xl max-h-[90vh] overflow-y-auto"
      data-ocid="edit_booking.dialog"
    >
      <DialogHeader>
        <DialogTitle className="font-display flex items-center gap-2">
          <Edit2 className="h-4 w-4" />
          Edit Booking #{booking.bookingId.toString()}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {/* Shipper */}
        <div className="rounded-lg border border-border p-4 space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Shipper Details
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                value={shipperName}
                onChange={(e) => setShipperName(e.target.value)}
                data-ocid="edit_booking.shipper_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input
                value={shipperPhone}
                onChange={(e) => setShipperPhone(e.target.value)}
                data-ocid="edit_booking.shipper_phone.input"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Address *</Label>
              <Textarea
                value={shipperAddress}
                onChange={(e) => setShipperAddress(e.target.value)}
                rows={2}
                data-ocid="edit_booking.shipper_address.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label>KYC Type *</Label>
              <Select
                value={shipperKycType}
                onValueChange={(v) => setShipperKycType(v as KycType)}
              >
                <SelectTrigger data-ocid="edit_booking.shipper_kyc_type.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KycType.aadhaar}>Aadhaar Card</SelectItem>
                  <SelectItem value={KycType.pan}>PAN Card</SelectItem>
                  <SelectItem value={KycType.passport}>Passport</SelectItem>
                  <SelectItem value={KycType.drivingLicense}>
                    Driving License
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>KYC Number *</Label>
              <Input
                value={shipperKycNumber}
                onChange={(e) => setShipperKycNumber(e.target.value)}
                data-ocid="edit_booking.shipper_kyc_number.input"
              />
            </div>
          </div>
        </div>

        {/* Consignee */}
        <div className="rounded-lg border border-border p-4 space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Consignee Details
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                value={consigneeName}
                onChange={(e) => setConsigneeName(e.target.value)}
                data-ocid="edit_booking.consignee_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input
                value={consigneePhone}
                onChange={(e) => setConsigneePhone(e.target.value)}
                data-ocid="edit_booking.consignee_phone.input"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Address *</Label>
              <Textarea
                value={consigneeAddress}
                onChange={(e) => setConsigneeAddress(e.target.value)}
                rows={2}
                data-ocid="edit_booking.consignee_address.textarea"
              />
            </div>
            <div className="space-y-1.5">
              <Label>ID Type *</Label>
              <Select
                value={consigneeIdType}
                onValueChange={(v) => setConsigneeIdType(v as KycType)}
              >
                <SelectTrigger data-ocid="edit_booking.consignee_id_type.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KycType.passport}>Passport</SelectItem>
                  <SelectItem value={KycType.drivingLicense}>
                    Driving License
                  </SelectItem>
                  <SelectItem value={KycType.aadhaar}>
                    International ID
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>ID Number *</Label>
              <Input
                value={consigneeIdNumber}
                onChange={(e) => setConsigneeIdNumber(e.target.value)}
                data-ocid="edit_booking.consignee_id_number.input"
              />
            </div>
          </div>
        </div>

        {/* Route + Invoice */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Route
            </h3>
            <div className="space-y-1.5">
              <Label>Origin</Label>
              <Input value="India" disabled className="bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label>Destination *</Label>
              <div className="relative">
                <Input
                  placeholder="Search country..."
                  value={
                    destinationCountry ? destinationCountry : countrySearch
                  }
                  onChange={(e) => {
                    setCountrySearch(e.target.value);
                    setDestinationCountry("");
                    setShowCountryDropdown(true);
                  }}
                  onFocus={() => setShowCountryDropdown(true)}
                  onBlur={() =>
                    setTimeout(() => setShowCountryDropdown(false), 150)
                  }
                  data-ocid="edit_booking.destination.input"
                />
                <AnimatePresence>
                  {showCountryDropdown &&
                    !destinationCountry &&
                    filteredCountries.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute z-50 top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
                      >
                        {filteredCountries.slice(0, 20).map((country) => (
                          <button
                            key={country}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                            onMouseDown={() => {
                              setDestinationCountry(country);
                              setCountrySearch(country);
                              setShowCountryDropdown(false);
                            }}
                          >
                            {country}
                          </button>
                        ))}
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4 space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
              Invoice
            </h3>
            <div className="space-y-1.5">
              <Label>Invoice #</Label>
              <Input
                value={booking.invoice.invoiceNumber}
                disabled
                className="bg-muted font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                data-ocid="edit_booking.invoice_date.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger data-ocid="edit_booking.currency.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR — Indian Rupee</SelectItem>
                  <SelectItem value="USD">USD — US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Boxes */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Boxes
          </h3>
          <div className="space-y-3">
            {boxes.map((box, idx) => {
              const volWt = calcVolumeWeight(box.length, box.width, box.height);
              return (
                <div
                  key={box.id}
                  className="border border-border rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">Box #{idx + 1}</p>
                    {boxes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleRemoveBox(box.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Gross Wt (kg)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={box.grossWeight}
                        onChange={(e) =>
                          handleBoxChange(box.id, "grossWeight", e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Length (cm)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="0"
                        value={box.length}
                        onChange={(e) =>
                          handleBoxChange(box.id, "length", e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Width (cm)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="0"
                        value={box.width}
                        onChange={(e) =>
                          handleBoxChange(box.id, "width", e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Height (cm)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="0"
                        value={box.height}
                        onChange={(e) =>
                          handleBoxChange(box.id, "height", e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Vol. Wt (auto)</Label>
                      <Input
                        value={volWt > 0 ? volWt.toFixed(3) : "—"}
                        disabled
                        className="h-8 text-sm bg-muted font-mono"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddBox}
              className="w-full border-dashed text-sm"
              size="sm"
            >
              <PlusCircle className="mr-2 h-3.5 w-3.5" />
              Add Box
            </Button>
          </div>
        </div>

        {/* Box Items */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Items
          </h3>
          <div className="rounded-lg border border-border overflow-visible">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Box #</TableHead>
                  <TableHead className="min-w-48">Description</TableHead>
                  <TableHead className="w-28">HS Code</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-28">Rate ({currency})</TableHead>
                  <TableHead className="w-24">Total</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {boxItems.map((item, idx) => {
                  const total =
                    (Number.parseInt(item.quantity) || 0) *
                    (Number.parseFloat(item.rate) || 0);
                  const suggestions = getHsSuggestions(item.description);
                  return (
                    <TableRow
                      key={item.id}
                      data-ocid={`edit_booking.item.${idx + 1}`}
                    >
                      <TableCell>
                        <Select
                          value={item.boxNumber}
                          onValueChange={(v) =>
                            handleItemChange(item.id, "boxNumber", v)
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {boxes.map((b, bi) => (
                              <SelectItem key={b.id} value={String(bi + 1)}>
                                Box {bi + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="relative">
                        <Input
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "description",
                              e.target.value,
                            )
                          }
                          onBlur={() =>
                            setTimeout(
                              () =>
                                setBoxItems((prev) =>
                                  prev.map((i) =>
                                    i.id === item.id
                                      ? { ...i, showSuggestions: false }
                                      : i,
                                  ),
                                ),
                              150,
                            )
                          }
                          className="h-8 text-sm text-foreground"
                          data-ocid={`edit_booking.item_description.input.${idx + 1}`}
                        />
                        <AnimatePresence>
                          {item.showSuggestions && suggestions.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-lg max-h-40 overflow-y-auto"
                            >
                              {suggestions.map((s) => (
                                <button
                                  key={s.code}
                                  type="button"
                                  className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-accent transition-colors text-left"
                                  onMouseDown={() =>
                                    handleSelectHsCode(
                                      item.id,
                                      s.description,
                                      s.code,
                                    )
                                  }
                                >
                                  <span>{s.description}</span>
                                  <span className="font-mono text-muted-foreground ml-2">
                                    {s.code}
                                  </span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="0000.00"
                          value={item.hsCode}
                          onChange={(e) =>
                            handleItemChange(item.id, "hsCode", e.target.value)
                          }
                          className="h-8 text-sm font-mono text-foreground"
                          data-ocid={`edit_booking.item_hscode.input.${idx + 1}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          placeholder="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "quantity",
                              e.target.value,
                            )
                          }
                          className="h-8 text-sm text-foreground"
                          data-ocid={`edit_booking.item_qty.input.${idx + 1}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(item.id, "rate", e.target.value)
                          }
                          className="h-8 text-sm text-foreground"
                          data-ocid={`edit_booking.item_rate.input.${idx + 1}`}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {total > 0 ? total.toFixed(2) : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {boxItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddItem}
            className="border-dashed text-sm"
            size="sm"
          >
            <PlusCircle className="mr-2 h-3.5 w-3.5" />
            Add Item Row
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={onClose}
          data-ocid="edit_booking.cancel_button"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          data-ocid="edit_booking.save_button"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ─── AdminBookings ────────────────────────────────────────────────────────────

export function AdminBookings() {
  const { bookings } = useAllBookings();
  const { franchises } = useAllFranchises();
  const { mutate: assignAWB } = useAssignAWBAndApprove();
  const { mutate: rejectBooking } = useRejectBooking();

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [franchiseFilter, setFranchiseFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [assigningBooking, setAssigningBooking] = useState<Booking | null>(
    null,
  );
  const [awbInput, setAwbInput] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const selectedFranchiseName =
    franchiseFilter !== "all"
      ? (franchises.find((f) => f.username === franchiseFilter)
          ?.franchiseName ?? franchiseFilter)
      : undefined;

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && b.status === BookingStatus.pending) ||
      (filter === "approved" && b.status === BookingStatus.approved) ||
      (filter === "rejected" && b.status === BookingStatus.rejected);
    const matchesSearch =
      !search ||
      b.shipper.name.toLowerCase().includes(search.toLowerCase()) ||
      b.destinationCountry.toLowerCase().includes(search.toLowerCase()) ||
      (b.awbNumber?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      b.bookingId.toString().includes(search);
    const matchesFranchise =
      franchiseFilter === "all" || b.createdBy === franchiseFilter;
    return matchesFilter && matchesSearch && matchesFranchise;
  });

  const handleAssign = async () => {
    if (!assigningBooking || !awbInput.trim()) return;
    setIsAssigning(true);
    await new Promise((r) => setTimeout(r, 300));
    const success = assignAWB(assigningBooking.bookingId, awbInput.trim());
    if (success) {
      toast.success(`AWB ${awbInput.trim()} assigned and approved`);
      setAssigningBooking(null);
      setAwbInput("");
    } else {
      toast.error("Failed to assign AWB");
    }
    setIsAssigning(false);
  };

  const handleReject = (booking: Booking) => {
    const success = rejectBooking(booking.bookingId);
    if (success) {
      toast.success("Booking rejected");
    } else {
      toast.error("Failed to reject");
    }
  };

  const pendingCount = bookings.filter(
    (b) => b.status === BookingStatus.pending,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold">All Bookings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and track all shipment bookings
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            exportBookingsToCSV(filteredBookings, selectedFranchiseName)
          }
          disabled={filteredBookings.length === 0}
          data-ocid="bookings.download_button"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Excel
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, AWB, destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="bookings.search_input"
          />
        </div>
        <Select value={franchiseFilter} onValueChange={setFranchiseFilter}>
          <SelectTrigger className="w-48" data-ocid="bookings.franchise.select">
            <SelectValue placeholder="All Franchises" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Franchises</SelectItem>
            <SelectItem value="admin">Admin (direct)</SelectItem>
            {franchises.map((f) => (
              <SelectItem key={f.franchiseId} value={f.username}>
                {f.franchiseName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList data-ocid="bookings.filter.tab">
          <TabsTrigger value="all" data-ocid="bookings.all.tab">
            All ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-ocid="bookings.pending.tab">
            Pending {pendingCount > 0 && `(${pendingCount})`}
          </TabsTrigger>
          <TabsTrigger value="approved" data-ocid="bookings.approved.tab">
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" data-ocid="bookings.rejected.tab">
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {filteredBookings.length === 0 ? (
            <div
              className="py-16 text-center text-muted-foreground"
              data-ocid="bookings.empty_state"
            >
              No bookings found.
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table data-ocid="bookings.table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>AWB</TableHead>
                    <TableHead>Shipper</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking, idx) => (
                    <TableRow
                      key={booking.bookingId.toString()}
                      className="hover:bg-muted/30"
                      data-ocid={`bookings.item.${idx + 1}`}
                    >
                      <TableCell className="font-mono text-xs font-medium">
                        #{booking.bookingId.toString()}
                      </TableCell>
                      <TableCell>
                        {booking.awbNumber ? (
                          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                            {booking.awbNumber}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">
                            Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-32 truncate">
                        {booking.shipper.name}
                      </TableCell>
                      <TableCell className="max-w-32 truncate">
                        {booking.destinationCountry}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={booking.status} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(booking.createdTimestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedBooking(booking)}
                            title="View"
                            data-ocid={`bookings.edit_button.${idx + 1}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingBooking(booking)}
                            title="Edit"
                            data-ocid={`bookings.pencil_button.${idx + 1}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {booking.status === BookingStatus.pending && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setAssigningBooking(booking);
                                  setAwbInput("");
                                }}
                                data-ocid={`bookings.save_button.${idx + 1}`}
                              >
                                Assign AWB
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(booking)}
                                data-ocid={`bookings.delete_button.${idx + 1}`}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <Dialog
          open={!!selectedBooking}
          onOpenChange={() => setSelectedBooking(null)}
        >
          <BookingDetailModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onEdit={() => {
              const b = selectedBooking;
              setSelectedBooking(null);
              setEditingBooking(b);
            }}
          />
        </Dialog>
      )}

      {/* Edit Booking Dialog */}
      {editingBooking && (
        <Dialog
          open={!!editingBooking}
          onOpenChange={() => setEditingBooking(null)}
        >
          <EditBookingDialog
            booking={editingBooking}
            onClose={() => setEditingBooking(null)}
          />
        </Dialog>
      )}

      {/* Assign AWB Dialog */}
      <Dialog
        open={!!assigningBooking}
        onOpenChange={(open) => !open && setAssigningBooking(null)}
      >
        <DialogContent data-ocid="assign_awb.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Assign AWB Number
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {assigningBooking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg bg-muted p-3 text-sm space-y-1"
              >
                <p>
                  <strong>Booking:</strong> #
                  {assigningBooking.bookingId.toString()}
                </p>
                <p>
                  <strong>Shipper:</strong> {assigningBooking.shipper.name}
                </p>
                <p>
                  <strong>Destination:</strong>{" "}
                  {assigningBooking.destinationCountry}
                </p>
              </motion.div>
            )}
            <div className="space-y-2">
              <Label htmlFor="awb-number">AWB Number</Label>
              <Input
                id="awb-number"
                placeholder="e.g. CT-2026-00123"
                value={awbInput}
                onChange={(e) => setAwbInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAssign()}
                data-ocid="assign_awb.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssigningBooking(null)}
              data-ocid="assign_awb.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!awbInput.trim() || isAssigning}
              data-ocid="assign_awb.confirm_button"
            >
              {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign &amp; Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
