# Hopex App V2 Database Verification Report

Date: 2026-07-01
Target Supabase project: `ozgeatgwgnpcfnzjhqit`
Scope: New Hopex V2 database only.

## Safety Confirmation

- Old Hopex production application was not touched.
- Old Hopex production database was not touched.
- No production shipment, customer, invoice, payment, expense, journal, notification, staff, or company user data was migrated.
- No live domain was connected.

## Migration Review

Reviewed and applied repository migrations in order. Two additional Sprint 2 schema-hardening migrations were added after verification:

- `202607010003_add_shipment_items_tracking_compatibility.sql`
- `202607010004_allow_anon_rls_helper_evaluation.sql`
- `202607010005_harden_remaining_profile_storage_policies.sql`

Migration history is recorded in `supabase_migrations.schema_migrations`.

Result:

- Migration history rows: 26
- Public tables without RLS: 0
- Public RLS policies: 315
- Policies using `auth.role()`: 0
- Public indexes: 148
- Public triggers: 81
- App functions in `public` / `private`: 16
- Storage buckets: 10
- Public enum values: 0

## Required Tables

Verified present with RLS:

- `companies`
- `company_users`
- `staff`
- `customers`
- `shipments`
- `shipment_items`
- `shipment_tracking`
- `shipment_events`
- `shipment_status_logs`
- `shipment_documents`
- `quotes`
- `quote_requests`
- `quote_items`
- `invoices`
- `payments`
- `expenses`
- `chart_of_accounts`
- `accounting_periods`
- `journal_entries`
- `journal_entry_lines`
- `notifications`
- `company_settings`
- `branding_settings`
- `invoice_settings`
- `notification_settings`
- `roles`
- `permissions`
- `role_permissions`
- `profiles`
- `staff_permissions`
- `invitation_tokens`
- `onboarding_progress`

## Storage Buckets

Verified:

- `company-assets` public
- `company-logos` public
- `profile-images` public
- `profile-photos` public
- `shipment-documents` private
- `staff-documents` private
- `quote-documents` private
- `task-attachments` private
- `email-attachments` private
- `settings-assets` private

## Seeded Minimum Records

Seeded only structural/system records:

- Hopex company: `Hopex Express Cargo`
- Company slug: `hopex-express-cargo`
- Currency: `TZS`
- Timezone: `Africa/Dar_es_Salaam`
- System roles: `Administrator`, `Operations Staff`, `Accounting`
- Permissions: 140
- Hopex role permissions: 178
- Company settings: 1
- Branding settings: 1
- Invoice settings: 1
- Notification settings: 1
- System chart of accounts: 23

## Business Data Counts

Confirmed zero migrated business records:

- Customers: 0
- Shipments: 0
- Shipment items: 0
- Shipment tracking: 0
- Invoices: 0
- Payments: 0
- Expenses: 0
- Journal entries: 0
- Journal entry lines: 0
- Notifications: 0
- Company users: 0
- Staff: 0

## REST API Verification

REST API checks using the configured publishable key returned `200` for:

- `companies`
- `roles`
- `permissions`
- `customers`
- `shipments`
- `shipment_items`
- `shipment_tracking`
- `invoices`
- `payments`
- `expenses`
- `journal_entries`
- `notifications`
- `company_settings`

RLS returns empty sets to anon users where appropriate.

## Auth Verification

- Supabase Auth settings endpoint returned `200`.
- Password grant endpoint responded correctly with `400 invalid_credentials` for intentionally invalid credentials.
- Full user login should be tested after creating/inviting Hopex V2 Auth users and linking them to `company_users` / `staff`.

## Build Verification

After database preparation:

- `npm run lint` passed.
- `npm run build` passed.

## Notes

- `shipment_items` and `shipment_tracking` were added as compatibility tables because the app currently uses `shipment_pricing`, `shipment_events`, and `shipment_status_logs`, while the migration readiness checklist explicitly requires itemized shipment and tracking tables.
- Supabase security advisors through the Codex app connector returned a permission error, so manual RLS/policy/index/function checks were used.

## Status

The new Hopex V2 Supabase database is structurally prepared and ready for the next phase: creating real Auth users and then performing a controlled production data migration.
