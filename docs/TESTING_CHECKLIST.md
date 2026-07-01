# Hopex V2 Testing Checklist

Use the Vercel preview URL and the new Supabase project first. Do not connect the official Hopex domain until these checks pass.

## Auth and Access

- Login with a new Hopex V2 Supabase Auth user.
- Confirm logout clears session.
- Confirm staff user can only see the Hopex company workspace.
- Confirm CEO/admin can open staff management and assign roles/modules.
- Confirm restricted staff cannot access unauthorized modules by direct URL.

## Core Operations

- Dashboard loads live metrics without console/server errors.
- Customers: create, edit, search, view activity.
- Shipments: create shipment, add cargo details/items, upload documents, update status.
- Tracking page returns a shipment by tracking number.
- Quotes: create, edit, approve, convert where supported.
- Invoices: create, mark sent/paid where supported, generate PDF/export.
- Payments: record payment and verify accounting impact.
- Expenses: create expense and verify accounting impact.
- Accounting: create/post journal entries, inspect customer ledger and reports.
- Documents/PDF generation: invoice, quote, receipt, shipment documents, packing list if enabled.
- Notifications: create/read/update notification state.
- Email templates use Hopex Express Cargo sender/branding.
- WhatsApp templates use Hopex Express Cargo wording.

## UI/Device

- Light mode and dark mode render clearly.
- Desktop layout: dashboard, tables, forms, modals.
- Mobile layout: login, dashboard navigation, shipment create/update, public tracking.
- Logo renders on login and document/PDF surfaces.

## Migration Validation

- Run `migration/scripts/03_validate_new_hopex.sql` after staged import.
- Confirm migrated counts match approved source export counts.
- Review `migration_staging.migration_log`.
- Review `migration_staging.migration_rejections`; staff rejections are expected until new Auth users are linked.
- Re-run import script and confirm counts do not duplicate.
