# CargoTrack

## Current State

- Full cargo/courier management app using localStorage for all data persistence
- Admin and franchise portals with login, bookings, tracking, AWB/invoice printing
- Existing Accounts page (AccountsPage.tsx) shows bookings with expandable charge panels (freight, customs duty, packaging, etc.)
- Charges stored in `cargotrack_charges` localStorage key via `store.ts`
- Excel export of bookings exists in `excelExport.ts`
- Accounts invoice PDF print view exists (`AccountsInvoiceDocument.tsx`)
- No payment tracking, no expense tracking, no income tracking, no ledger/P&L/trial balance

## Requested Changes (Diff)

### Add

**Data layer (store.ts)**
- `StoredPayment`: payment recorded against a booking invoice (bookingId, amount, paymentDate, paymentMethod, reference, notes)
- `StoredExpense`: company expense (id, date, category, description, amount, createdAt)
- `StoredIncomeEntry`: standalone income entry separate from invoice payments (id, date, source, description, amount, createdAt)
- STORAGE_KEYS for payments, expenses, income entries
- CRUD functions for all three new types
- Storage events: `cargotrack:payments`, `cargotrack:expenses`, `cargotrack:income`

**useLocalStore.ts hooks**
- `usePaymentsByBooking(bookingId)` — reactive list of payments for a booking
- `useAllPayments()` — all payments
- `useAddPayment()`, `useDeletePayment()`
- `useAllExpenses()`, `useAddExpense()`, `useDeleteExpense()`
- `useAllIncomeEntries()`, `useAddIncomeEntry()`, `useDeleteIncomeEntry()`

**New pages / sections inside Accounts**

The Accounts section becomes a tabbed area with these tabs (admin only sees all; franchise sees only their statement tab):

1. **Invoices tab** (existing charges panel, enhanced)
   - Show per-booking invoiced amount (sum of charges), amount paid, balance due
   - Admin can record payment per booking (amount, date, method, reference)
   - Payment history shown per booking
   - Print accounts invoice button

2. **Statement tab** (franchise sees only this for their own bookings; admin sees all or filtered by franchise)
   - Running ledger: Date | Description | Debit (invoice raised) | Credit (payment received) | Balance
   - Export as Excel with auto-filter headers
   - Franchise filter dropdown (admin only)

3. **Expenses tab** (admin only)
   - Add expense: date, category (Rent / Salaries / Fuel / Office Supplies / Customs Duty / Miscellaneous / Custom), description, amount (INR)
   - List of expenses with delete
   - Daily summary: total expenses for selected date
   - Export as Excel

4. **Income tab** (admin only)
   - Separate income entries: date, source (Cash / Bank Transfer / Other), description, amount (INR)
   - Note: franchise invoice payments are NOT listed here — they are in the Statement tab
   - List of entries with delete
   - Daily summary for selected date
   - Export as Excel

5. **Reports tab** (admin only) — three sub-views toggled by buttons:
   - **Ledger**: All transactions (invoice charges, payments received, expenses, income entries) in date order with running balance
   - **P&L Account**: Income (invoice payments + income entries) vs Expenses, grouped by category, net profit/loss
   - **Trial Balance**: All accounts with debit/credit totals and balance

### Modify

- `AccountsPage.tsx` — replace current single-view with tabbed layout; franchise users see only Statement tab; admin sees all tabs
- `store.ts` — add new storage keys and CRUD for payments, expenses, income entries
- `useLocalStore.ts` — add hooks for new data types
- `excelExport.ts` — add `exportStatement()`, `exportExpenses()`, `exportIncome()` functions

### Remove

Nothing removed. Existing charge management preserved inside Invoices tab.

## Implementation Plan

1. Extend `store.ts`:
   - Add `StoredPayment`, `StoredExpense`, `StoredIncomeEntry` types
   - Add storage keys (`PAYMENTS`, `EXPENSES`, `INCOME`)
   - Add read/write helpers and CRUD functions for all three

2. Extend `useLocalStore.ts`:
   - Add hooks for payments, expenses, income entries

3. Extend `excelExport.ts`:
   - `exportStatement(entries, franchiseName?)` — franchise statement Excel
   - `exportExpenses(expenses)` — expenses Excel
   - `exportIncome(incomeEntries)` — income Excel

4. Rebuild `AccountsPage.tsx`:
   - Tabs: Invoices | Statement | Expenses | Income | Reports
   - Admin sees all tabs; franchise sees only Statement tab
   - Invoices tab: existing charges panel + payment recording per booking
   - Statement tab: running ledger, franchise filter (admin), Excel export
   - Expenses tab: add/list/delete expenses, daily summary, Excel export
   - Income tab: add/list/delete income entries, daily summary, Excel export
   - Reports tab: Ledger view, P&L view, Trial Balance view (toggle buttons)

5. Validate and deploy
