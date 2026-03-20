# CargoTrack - Accounts Expansion

## Current State
Accounts section has 6 tabs (Admin only):
- Invoices: booking-linked invoices with payment tracking
- Statement: franchise ledger
- Expenses: business expense entries
- Income: standalone income entries
- Reports: P&L, Ledger, Trial Balance
- GST Bills: manual GST bills with CGST/SGST or IGST split, PDF download

GST Bills currently accepts manually typed shipper name and service descriptions.

## Requested Changes (Diff)

### Add
- **Customers tab** (Admin): Save customer (name, phone, address, GSTIN). View list, purchase history from Billing and GST Bills, credit/due balance based on unpaid bills.
- **Products & Services tab** (Admin): Catalog of service items with name, price, GST%, HSN/SAC code, unit. Predefined defaults: Air Cargo, Documentation, TSP Clearance, Handling Charges. Items usable in Billing and GST Bills.
- **Billing tab** (Admin): Standalone bill creator (GST and non-GST). Pick customer from saved Customers list. Add service rows from Products catalog (with manual override). Auto-calculate subtotal, discount, GST, grand total. Payment method (Cash/UPI/Card/Bank Transfer). Mark as Paid/Unpaid. Partial payment tracking (record partial amounts). Print/PDF download.
- Backend APIs: CRUD for customers, products/services, billing records, payment records.

### Modify
- **GST Bills tab**: Add customer picker (dropdown from saved Customers). Add service picker (from Products catalog, with override). Customer name/GSTIN auto-filled when customer selected.
- **Reports tab**: Add Daily/Monthly sales report (from Billing). Add Pending Payments report (unpaid/partial bills). Add GST Report export as Excel/CSV and PDF.

### Remove
- Nothing removed.

## Implementation Plan
1. Add backend types and CRUD: Customer, Product, BillingRecord, PaymentRecord
2. Add getCustomers, createCustomer, updateCustomer, deleteCustomer (admin only)
3. Add getProducts, createProduct, updateProduct, deleteProduct (admin only)
4. Add getBillingRecords, createBillingRecord, updateBillingRecord, deleteBillingRecord (admin only)
5. Add recordPayment, getPaymentsForBill (admin only)
6. Frontend: Add Customers tab with customer form and list
7. Frontend: Add Products & Services tab with catalog management
8. Frontend: Add Billing tab with bill creation form, customer/service pickers, payment tracking
9. Frontend: Upgrade GST Bills to use customer picker and product picker
10. Frontend: Add Daily/Monthly sales report, Pending Payments report, GST export (CSV and PDF) to Reports tab
