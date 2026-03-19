# CargoTrack

## Current State
Full cargo management app with admin/franchise portals, booking system, tracking, and an Accounts section with tabs: Invoices, Statement, Expenses, Income, Reports (Ledger, P&L, Trial Balance). Data is stored in localStorage on the frontend.

## Requested Changes (Diff)

### Add
- New "GST Bills" tab in the Accounts section (admin only)
- GST bill form with:
  - GST Bill Number (manual text input)
  - Date (date picker)
  - Shipper Name (text input with autocomplete from previously saved shipper names)
  - Shipper GSTIN (text input)
  - Worldyfly GSTIN (pre-filled: "32CWHPB3468A1Z3", editable)
  - Tax type selector: CGST+SGST (intrastate Kerala) or IGST (interstate/international)
  - Services table: multiple rows, each with service name (dropdown suggestions: Air Cargo, TSP Clearance, Documentation, Handling Charges, Packaging, Custom Clearance, Other + manual entry) and taxable amount (INR)
  - Add/remove service rows
  - GST rate fixed at 18%
  - Auto-calculated: CGST 9% + SGST 9% (if intrastate) OR IGST 18% (if interstate), Grand Total
- GST bill list view showing all created bills
- Print/download GST bill as PDF (opens in new tab like other print pages) with:
  - Worldyfly header with logo and address
  - Both GSTINs
  - Itemized services table
  - GST breakdown (taxable, CGST/SGST or IGST, grand total)
  - Amount in words

### Modify
- AccountsPage.tsx: add GST Bills tab (admin only) alongside existing tabs
- App.tsx: add route /print/gst-bill/:gstBillId
- PrintPage.tsx or new GstBillPrint.tsx: handle docType "gst-bill"

### Remove
- Nothing removed

## Implementation Plan
1. Add GstBill type and storage to useLocalStore (frontend localStorage)
2. Add GST Bills tab UI to AccountsPage.tsx with form and list
3. Create print route and GstBillPrint component
4. Wire up print button to open /print/gst-bill/:id in new tab
5. Validate and build
