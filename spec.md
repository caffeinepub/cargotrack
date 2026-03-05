# CargoTrack

## Current State
- Full cargo/courier management app with admin and franchise portals
- Booking form with shipper/consignee details, boxes, box items, HS codes
- Admin can assign AWB and approve bookings
- Tracking milestones managed by admin
- Public tracking by AWB number
- Invoice print view exists (`InvoicePrintView.tsx`) but uses a generic modern layout -- not matching the customer's reference format
- No AWB print document exists

## Requested Changes (Diff)

### Add
- `InvoiceDocument.tsx`: New invoice print component matching the exact format from the reference image (Screenshot_20260306_024209.jpg):
  - Title: "INVOICE" centered at top
  - Bordered table layout with labeled cells
  - Top-left: Exporter block (shipper name, address, KYC number)
  - Top-right grid: Invoice No. and Date | Exporter Ref. | Buyer's order no. and date | Other Reference(s) | Buyer(if other has consignee)
  - Below: Country of origin of goods (INDIA fixed) | Country of final destination | Pre-Carriage by | Place of Receipt by pre-carrier | Terms of delivery & Payment | Actual Weight | Vessel/Flight No. | Port of Loading | Dimension
  - Items table: BOX | DESCRIPTION | HSN | QTY | RATE | AMOUNT(INR/EUR/USD)
  - Footer: Total row, Amount chargeable in words, Declaration text, Signature/Date/Co stamp block
  - Company header: Worldyfly logo + name + address (11/423H, Second Floor, St Joseph Building, Akapparambu Junction, Opposite Cochin International Airport, Nedumbasserry - 686583) + phone (+91 95263 69141) + email (info@worldyfly.com)

- `AWBDocument.tsx`: New AWB print component matching the exact format from the reference image (Screenshot_20260306_024329.jpg):
  - Two identical copies on one page: "ACCOUNT COPY" and "SHIPPER COPY"
  - Each copy has:
    - Header: Worldyfly logo (left) + company name + address + "Track your Shipment: www.worldyfly.com" (center) + copy label + barcode graphic + AWB/Ref number (right)
    - Row: DATE | ORIGIN | REF NO. | DESTINATION
    - Row: SHIPPER (CONTACT/COMPANY NAME) | CONSIGNEE (CONTACT/COMPANY NAME)
    - ADDRESS rows for shipper and consignee (multi-line)
    - KYC DETAILS row: label + type + number
    - Row: CITY | ZIPCODE | COUNTRY (shipper side) | CITY | ZIPCODE | COUNTRY (consignee side)
    - Row: TEL NO. (shipper) | TEL NO. (consignee) | SERVICE
    - Row: SHIPMENT TYPE | DECLARED VALUE | NO OF PKG | DESCRIPTION OF GOODS | (service value continued)
    - Row: ACTUAL WEIGHT | DIMENSIONS | VOL WEIGHT | PICK UP
    - SHIPPER AGREEMENT text block
    - NAME | SIGN | DATE | TIME fields (shipper side) + RECEIVED IN GOOD CONDITION block (consignee side) with NAME | SIGN | DATE | TIME
  - Barcode rendered as a visual barcode-like pattern using CSS stripes (no external lib needed)

### Modify
- `InvoicePrintView.tsx`: Replace the existing generic layout entirely with the new `InvoiceDocument` component
- `AdminBookings.tsx`: Add "Print AWB" button alongside the existing "Download Invoice" button for approved bookings in the booking detail modal
- `FranchiseBookings.tsx`: Same -- add "Print AWB" button for approved bookings

### Remove
- Nothing removed

## Implementation Plan
1. Generate Worldyfly logo image asset
2. Create `InvoiceDocument.tsx` with exact bordered-table layout matching reference
3. Create `AWBDocument.tsx` with two-copy layout, barcode strip, all fields matching reference
4. Update `InvoicePrintView.tsx` to use `InvoiceDocument`
5. Add "Print AWB" button in `AdminBookings.tsx` booking detail modal
6. Add "Print AWB" button in `FranchiseBookings.tsx` booking detail modal
7. Validate (typecheck + lint + build)
