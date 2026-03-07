import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Box as BoxIcon,
  CheckCircle2,
  FileText,
  List,
  Loader2,
  MapPin,
  Package,
  PlusCircle,
  Trash2,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { KycType } from "../../backend.d";
import type {
  Box,
  BoxItem,
  Consignee,
  Invoice,
  Shipper,
} from "../../backend.d";
import { useCreateBooking } from "../../hooks/useLocalStore";
import { COUNTRIES } from "../../lib/constants";
import HS_CODE_DATABASE from "../../lib/hsCodeDatabase";

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
  const lv = Number.parseFloat(l) || 0;
  const wv = Number.parseFloat(w) || 0;
  const hv = Number.parseFloat(h) || 0;
  return (lv * wv * hv) / 5000;
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: dynamic icon component
  icon: React.ComponentType<any>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2 className="font-display font-semibold text-base">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export function NewBooking() {
  const { mutate: createBooking } = useCreateBooking();
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Shipper
  const [shipperName, setShipperName] = useState("");
  const [shipperPhone, setShipperPhone] = useState("");
  const [shipperAddress, setShipperAddress] = useState("");
  const [shipperZipCode, setShipperZipCode] = useState("");
  const [shipperKycType, setShipperKycType] = useState<KycType>(
    KycType.aadhaar,
  );
  const [shipperKycNumber, setShipperKycNumber] = useState("");

  // Consignee
  const [consigneeName, setConsigneeName] = useState("");
  const [consigneeFloor, setConsigneeFloor] = useState("");
  const [consigneeHouseNo, setConsigneeHouseNo] = useState("");
  const [consigneeBuildingNo, setConsigneeBuildingNo] = useState("");
  const [consigneeStreetName, setConsigneeStreetName] = useState("");
  const [consigneeStreetNumber, setConsigneeStreetNumber] = useState("");
  const [consigneeTown, setConsigneeTown] = useState("");
  const [consigneeCity, setConsigneeCity] = useState("");
  const [consigneeZipCode, setConsigneeZipCode] = useState("");
  const [consigneeCountry, setConsigneeCountry] = useState("");
  const [consigneePhone, setConsigneePhone] = useState("");
  const [consigneeEmail, setConsigneeEmail] = useState("");
  const [consigneeIdType, setConsigneeIdType] = useState<KycType>(
    KycType.passport,
  );
  const [consigneeIdNumber, setConsigneeIdNumber] = useState("");

  // Route
  const [destinationCountry, setDestinationCountry] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  // Invoice
  const [invoiceNumber] = useState(`INV-${Date.now()}`);
  const [invoiceDate, setInvoiceDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [currency, setCurrency] = useState("INR");

  // Boxes
  const [boxes, setBoxes] = useState<BoxFormRow[]>([
    { id: "1", grossWeight: "", length: "", width: "", height: "" },
  ]);

  // Box items
  const [boxItems, setBoxItems] = useState<BoxItemRow[]>([
    {
      id: "1",
      boxNumber: "1",
      description: "",
      hsCode: "",
      quantity: "",
      rate: "",
      showSuggestions: false,
    },
  ]);

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
    setBoxItems((prev) =>
      prev.map((item) =>
        item.boxNumber === id ? { ...item, boxNumber: "1" } : item,
      ),
    );
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

  const handleSubmit = async () => {
    if (
      !shipperName ||
      !shipperPhone ||
      !shipperAddress ||
      !shipperZipCode ||
      !shipperKycNumber
    ) {
      toast.error(
        "Please fill in all shipper details including phone and zip code",
      );
      return;
    }
    if (
      !consigneeName ||
      !consigneePhone ||
      !consigneeCity ||
      !consigneeZipCode ||
      !consigneeCountry ||
      !consigneeIdNumber
    ) {
      toast.error(
        "Please fill in all consignee details including city, zip code, country and phone",
      );
      return;
    }
    if (!destinationCountry) {
      toast.error("Please select a destination country");
      return;
    }

    const shipper: Shipper = {
      name: shipperName,
      phone: shipperPhone,
      address: shipperZipCode
        ? `${shipperAddress}\nZip: ${shipperZipCode}`
        : shipperAddress,
      kycType: shipperKycType,
      kycNumber: shipperKycNumber,
    };

    const consigneeAddressParts = [
      consigneeFloor ? `Floor: ${consigneeFloor}` : "",
      consigneeHouseNo ? `House No: ${consigneeHouseNo}` : "",
      consigneeBuildingNo ? `Building No: ${consigneeBuildingNo}` : "",
      consigneeStreetNumber ? `Street No: ${consigneeStreetNumber}` : "",
      consigneeStreetName ? `Street: ${consigneeStreetName}` : "",
      consigneeTown ? `Town: ${consigneeTown}` : "",
      consigneeCity ? `City: ${consigneeCity}` : "",
      consigneeZipCode ? `Zip: ${consigneeZipCode}` : "",
      consigneeCountry ? `Country: ${consigneeCountry}` : "",
      consigneeEmail ? `Email: ${consigneeEmail}` : "",
    ]
      .filter(Boolean)
      .join(", ");

    const consignee: Consignee = {
      name: consigneeName,
      phone: consigneePhone,
      address: consigneeAddressParts,
      idType: consigneeIdType,
      idNumber: consigneeIdNumber,
    };

    const invoice: Invoice = {
      invoiceNumber,
      invoiceDate: BigInt(new Date(invoiceDate).getTime()) * 1_000_000n,
      currency,
    };

    const boxPayload: Box[] = boxes.map((b, i) => ({
      boxNumber: BigInt(i + 1),
      grossWeight: Number.parseFloat(b.grossWeight) || 0,
      length: Number.parseFloat(b.length) || 0,
      width: Number.parseFloat(b.width) || 0,
      height: Number.parseFloat(b.height) || 0,
      volumeWeight: calcVolumeWeight(b.length, b.width, b.height),
    }));

    const boxItemPayload: BoxItem[] = boxItems.map((item) => {
      const qty = Number.parseInt(item.quantity) || 0;
      const rate = Number.parseFloat(item.rate) || 0;
      return {
        boxNumber: BigInt(Number.parseInt(item.boxNumber) || 1),
        description: item.description,
        hsCode: item.hsCode,
        quantity: BigInt(qty),
        rate,
        total: qty * rate,
      };
    });

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));

    try {
      const stored = createBooking({
        shipper,
        consignee,
        destinationCountry,
        invoice,
        boxes: boxPayload,
        boxItems: boxItemPayload,
      });
      setSuccessBookingId(stored.id);
      toast.success("Booking created successfully!");
    } catch {
      toast.error("Failed to create booking. Please try again.");
    }
    setIsSubmitting(false);
  };

  const handleReset = () => {
    setSuccessBookingId(null);
    setShipperName("");
    setShipperPhone("");
    setShipperAddress("");
    setShipperZipCode("");
    setShipperKycNumber("");
    setConsigneeName("");
    setConsigneeFloor("");
    setConsigneeHouseNo("");
    setConsigneeBuildingNo("");
    setConsigneeStreetName("");
    setConsigneeStreetNumber("");
    setConsigneeTown("");
    setConsigneeCity("");
    setConsigneeZipCode("");
    setConsigneeCountry("");
    setConsigneePhone("");
    setConsigneeEmail("");
    setConsigneeIdNumber("");
    setDestinationCountry("");
    setCountrySearch("");
    setBoxes([{ id: "1", grossWeight: "", length: "", width: "", height: "" }]);
    setBoxItems([
      {
        id: "1",
        boxNumber: "1",
        description: "",
        hsCode: "",
        quantity: "",
        rate: "",
        showSuggestions: false,
      },
    ]);
  };

  if (successBookingId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto py-16 text-center"
        data-ocid="booking.success_state"
      >
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">
          Booking Submitted!
        </h2>
        <p className="text-muted-foreground mb-1">Booking ID:</p>
        <p className="font-mono text-lg font-semibold text-primary mb-6">
          {successBookingId}
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Your booking has been submitted and is pending admin approval. You
          will receive an AWB number once approved.
        </p>
        <Button onClick={handleReset} data-ocid="booking.primary_button">
          Create Another Booking
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">New Booking</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Fill in all details to create a new shipment booking
        </p>
      </div>

      {/* Section 1: Shipper */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader
            icon={User}
            title="Shipper Details"
            subtitle="Origin sender information and KYC"
          />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                placeholder="e.g. Rajesh Kumar"
                value={shipperName}
                onChange={(e) => setShipperName(e.target.value)}
                data-ocid="booking.shipper_name.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                placeholder="+91 98765 43210"
                value={shipperPhone}
                onChange={(e) => setShipperPhone(e.target.value)}
                data-ocid="booking.shipper_phone.input"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address *</Label>
              <Textarea
                placeholder="Full address including city, state"
                value={shipperAddress}
                onChange={(e) => setShipperAddress(e.target.value)}
                rows={2}
                data-ocid="booking.shipper_address.textarea"
              />
            </div>
            <div className="space-y-2">
              <Label>PIN Code *</Label>
              <Input
                placeholder="e.g. 686583"
                value={shipperZipCode}
                onChange={(e) => setShipperZipCode(e.target.value)}
                data-ocid="booking.shipper_zip.input"
              />
            </div>
            <div className="space-y-2">
              <Label>KYC Document Type *</Label>
              <Select
                value={shipperKycType}
                onValueChange={(v) => setShipperKycType(v as KycType)}
              >
                <SelectTrigger data-ocid="booking.shipper_kyc_type.select">
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
            <div className="space-y-2">
              <Label>KYC Document Number *</Label>
              <Input
                placeholder="e.g. ABCDE1234F"
                value={shipperKycNumber}
                onChange={(e) => setShipperKycNumber(e.target.value)}
                data-ocid="booking.shipper_kyc_number.input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Consignee */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader
            icon={User}
            title="Consignee Details"
            subtitle="Destination recipient information"
          />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Receiver Name *</Label>
              <Input
                placeholder="Full name of recipient"
                value={consigneeName}
                onChange={(e) => setConsigneeName(e.target.value)}
                data-ocid="booking.consignee_name.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Floor</Label>
              <Input
                placeholder="Floor number"
                value={consigneeFloor}
                onChange={(e) => setConsigneeFloor(e.target.value)}
                data-ocid="booking.consignee_floor.input"
              />
            </div>
            <div className="space-y-2">
              <Label>House No.</Label>
              <Input
                placeholder="House number"
                value={consigneeHouseNo}
                onChange={(e) => setConsigneeHouseNo(e.target.value)}
                data-ocid="booking.consignee_house_no.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Building No.</Label>
              <Input
                placeholder="Building number"
                value={consigneeBuildingNo}
                onChange={(e) => setConsigneeBuildingNo(e.target.value)}
                data-ocid="booking.consignee_building_no.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Street Name</Label>
              <Input
                placeholder="Street name"
                value={consigneeStreetName}
                onChange={(e) => setConsigneeStreetName(e.target.value)}
                data-ocid="booking.consignee_street_name.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Street Number</Label>
              <Input
                placeholder="Street number"
                value={consigneeStreetNumber}
                onChange={(e) => setConsigneeStreetNumber(e.target.value)}
                data-ocid="booking.consignee_street_number.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Town</Label>
              <Input
                placeholder="Town"
                value={consigneeTown}
                onChange={(e) => setConsigneeTown(e.target.value)}
                data-ocid="booking.consignee_town.input"
              />
            </div>
            <div className="space-y-2">
              <Label>City *</Label>
              <Input
                placeholder="City"
                value={consigneeCity}
                onChange={(e) => setConsigneeCity(e.target.value)}
                data-ocid="booking.consignee_city.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Zip Code *</Label>
              <Input
                placeholder="e.g. M5J 0G1"
                value={consigneeZipCode}
                onChange={(e) => setConsigneeZipCode(e.target.value)}
                data-ocid="booking.consignee_zip.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Mobile *</Label>
              <Input
                placeholder="International mobile number"
                value={consigneePhone}
                onChange={(e) => setConsigneePhone(e.target.value)}
                data-ocid="booking.consignee_phone.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="recipient@email.com"
                value={consigneeEmail}
                onChange={(e) => setConsigneeEmail(e.target.value)}
                data-ocid="booking.consignee_email.input"
              />
            </div>
            <div className="space-y-2">
              <Label>ID Document Type *</Label>
              <Select
                value={consigneeIdType}
                onValueChange={(v) => setConsigneeIdType(v as KycType)}
              >
                <SelectTrigger data-ocid="booking.consignee_id_type.select">
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
            <div className="space-y-2">
              <Label>ID Number *</Label>
              <Input
                placeholder="Document number"
                value={consigneeIdNumber}
                onChange={(e) => setConsigneeIdNumber(e.target.value)}
                data-ocid="booking.consignee_id_number.input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Route */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader
            icon={MapPin}
            title="Shipment Route"
            subtitle="Origin and destination countries"
          />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Origin Country</Label>
              <Input
                value="India"
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>Destination Country *</Label>
              <div className="relative" ref={countryRef}>
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
                  data-ocid="booking.destination_country.input"
                />
                <AnimatePresence>
                  {showCountryDropdown &&
                    !destinationCountry &&
                    filteredCountries.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute z-50 top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
                      >
                        {filteredCountries.map((country) => (
                          <button
                            key={country}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
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
        </CardContent>
      </Card>

      {/* Section 4: Invoice */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader
            icon={FileText}
            title="Invoice Details"
            subtitle="Billing and currency information"
          />
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input
                value={invoiceNumber}
                disabled
                className="bg-muted font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                data-ocid="booking.invoice_date.input"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger data-ocid="booking.currency.select">
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
        </CardContent>
      </Card>

      {/* Section 5: Boxes */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader
            icon={BoxIcon}
            title="Box Details"
            subtitle="Physical dimensions of each box"
          />
          <div className="space-y-4">
            {boxes.map((box, idx) => {
              const volWt = calcVolumeWeight(box.length, box.width, box.height);
              return (
                <motion.div
                  key={box.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative"
                >
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-sm">Box #{idx + 1}</p>
                      {boxes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveBox(box.id)}
                          data-ocid={`booking.box.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Gross Weight (kg)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={box.grossWeight}
                          onChange={(e) =>
                            handleBoxChange(
                              box.id,
                              "grossWeight",
                              e.target.value,
                            )
                          }
                          data-ocid={`booking.box_weight.input.${idx + 1}`}
                        />
                      </div>
                      <div className="space-y-1.5">
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
                          data-ocid={`booking.box_length.input.${idx + 1}`}
                        />
                      </div>
                      <div className="space-y-1.5">
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
                          data-ocid={`booking.box_width.input.${idx + 1}`}
                        />
                      </div>
                      <div className="space-y-1.5">
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
                          data-ocid={`booking.box_height.input.${idx + 1}`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Vol. Weight (auto)</Label>
                        <Input
                          value={volWt > 0 ? volWt.toFixed(3) : "—"}
                          disabled
                          className="bg-muted font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddBox}
              className="w-full border-dashed"
              data-ocid="booking.add_box.button"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Another Box
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Box Items */}
      <Card>
        <CardContent className="pt-6">
          <SectionHeader
            icon={List}
            title="Box Items"
            subtitle="Itemized contents with HS codes"
          />

          <div className="space-y-4">
            <div className="rounded-lg border border-border overflow-visible">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Box #</TableHead>
                    <TableHead className="min-w-48">Description</TableHead>
                    <TableHead className="w-28">HS Code</TableHead>
                    <TableHead className="w-20">Qty</TableHead>
                    <TableHead className="w-28">Rate ({currency})</TableHead>
                    <TableHead className="w-28">Total</TableHead>
                    <TableHead className="w-12" />
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
                        data-ocid={`booking.item.${idx + 1}`}
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
                            data-ocid={`booking.item_description.input.${idx + 1}`}
                          />
                          <AnimatePresence>
                            {item.showSuggestions && suggestions.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-lg max-h-48 overflow-y-auto"
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
                              handleItemChange(
                                item.id,
                                "hsCode",
                                e.target.value,
                              )
                            }
                            className="h-8 text-sm font-mono text-foreground"
                            data-ocid={`booking.item_hscode.input.${idx + 1}`}
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
                            data-ocid={`booking.item_qty.input.${idx + 1}`}
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
                            data-ocid={`booking.item_rate.input.${idx + 1}`}
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
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveItem(item.id)}
                              data-ocid={`booking.item.delete_button.${idx + 1}`}
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
              className="border-dashed"
              data-ocid="booking.add_item.button"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Item Row
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grand Total */}
      <div className="flex justify-end">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Grand Total</p>
          <p className="font-display text-2xl font-bold text-primary">
            {currency}{" "}
            {boxItems
              .reduce(
                (acc, item) =>
                  acc +
                  (Number.parseInt(item.quantity) || 0) *
                    (Number.parseFloat(item.rate) || 0),
                0,
              )
              .toFixed(2)}
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pb-8">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-10 font-semibold"
          data-ocid="booking.submit_button"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Package className="mr-2 h-4 w-4" />
          )}
          Submit Booking
        </Button>
      </div>
    </div>
  );
}
