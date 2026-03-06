# CargoTrack

## Current State
- Admin and Franchise layouts exist with sidebar navigation
- No Settings page exists for either role
- InvoiceDocument.tsx includes company logo and address header at top of the PDF
- Accounts invoice (AccountsInvoiceDocument.tsx) also has company branding
- App uses localStorage for all data (session, bookings, franchises, etc.)
- Theme is currently fixed (no theme toggle)

## Requested Changes (Diff)

### Add
- Settings page accessible from both Admin and Franchise sidebars
- Settings for Admin:
  - Change username (updates session + admin credentials in store)
  - Change password (requires current password confirmation)
  - Theme selector: Light / Dark / System default
- Settings for Franchise:
  - Change username (updates session + franchise credentials in store)
  - Change password (requires current password confirmation)
  - Theme selector: Light / Dark / System default
- Theme persistence in localStorage (key: `cargotrack_theme`)
- Theme applied at app root via class on `<html>` element
- Settings nav item in Admin sidebar (Settings icon, `/admin/settings`)
- Settings nav item in Franchise sidebar (Settings icon, `/franchise/settings`)
- New route `/admin/settings` and `/franchise/settings` both pointing to `SettingsPage`

### Modify
- `InvoiceDocument.tsx`: Remove the company logo + address header block entirely from the invoice PDF. The invoice should start directly with the "INVOICE" title bar, then the table layout (Exporter, Consignee, etc.)
- `AdminLayout.tsx`: Add Settings nav item, apply theme class from localStorage on mount
- `FranchiseLayout.tsx`: Add Settings nav item, apply theme class from localStorage on mount
- `App.tsx`: Add `/admin/settings` and `/franchise/settings` routes
- `store.ts`: Add helper functions for changing username/password for admin and franchise users
- `useLocalStore.ts`: Add hooks for settings mutations

### Remove
- Company logo and address block from InvoiceDocument.tsx (the header section with the `<img>` tag and COMPANY name/address/phone/email/website)

## Implementation Plan
1. Update `store.ts` to add `changeAdminUsername`, `changeAdminPassword`, `changeFranchiseUsername`, `changeFranchisePassword`, and theme storage helpers
2. Update `useLocalStore.ts` to add `useChangePassword`, `useChangeUsername` hooks and theme hook
3. Create `SettingsPage.tsx` with tabs: Profile (username change), Security (password change), Appearance (theme toggle)
4. Add `/admin/settings` and `/franchise/settings` routes to `App.tsx`
5. Add Settings nav items to `AdminLayout.tsx` and `FranchiseLayout.tsx`
6. Apply theme class logic to both layouts and root
7. Remove logo + address header from `InvoiceDocument.tsx` - start with INVOICE title directly
