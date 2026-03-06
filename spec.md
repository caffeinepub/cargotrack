# CargoTrack

## Current State
- Admin bookings page shows all bookings with status filter tabs and search
- Franchise bookings page shows bookings for that franchise only
- No Excel export functionality exists
- Admin cannot filter bookings by franchise
- Bookings table columns: Booking ID, AWB, Shipper, Destination, Status, Created, Actions

## Requested Changes (Diff)

### Add
- Excel download button on Admin Bookings page (downloads all currently filtered/visible bookings)
- Excel download button on Franchise Bookings page (downloads that franchise's bookings)
- Franchise filter dropdown in Admin Bookings (filter by specific franchise or "All Franchises")
- Excel columns: AWB Number, Booking ID, Date, Agent/Franchise, Shipper Name, Consignee Name, Total PCS (sum of box item quantities), Total Weight (sum of gross weights), Current Status (latest tracking milestone label or "Pending" if none)

### Modify
- AdminBookings: add franchise filter select dropdown alongside the search bar; apply filter to booking list
- AdminBookings: add "Download Excel" button near the top
- FranchiseBookings: add "Download Excel" button near the top

### Remove
- Nothing removed

## Implementation Plan
1. Create a utility function `exportToExcel` in `src/frontend/src/lib/excelExport.ts` that takes a list of bookings + tracking data and generates a CSV download (no external library needed; use CSV with .xlsx extension or use a simple blob approach)
2. In AdminBookings: add franchise filter dropdown using the `useAllFranchises` hook; filter `filteredBookings` by selected franchise; add Download Excel button
3. In FranchiseBookings: add Download Excel button
4. The export uses current tracking data from localStorage to determine current status per booking
5. Use `getTrackingByAWB` from the store directly in the export utility to get latest status per booking
