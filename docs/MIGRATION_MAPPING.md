# Hopex Old App to Hopex App V2 Migration Mapping

This document maps the old live Hopex Base44-style app into the new Naro-based Hopex App V2 schema.

Safety rules:

- Source Hopex production database is read-only.
- Target is the new Hopex Supabase project only.
- No live domain switch until preview testing is complete.
- Migration scripts must be idempotent and validation must run after every import.

## Known Source Shape

The old Hopex app stores operational records in `public.app_records` using:

- `entity_name`
- `data` JSON/JSONB
- `created_by`
- `created_at`
- `updated_at`

Known source entities from prior inspection include `Shipment`, `CargoInvoice`, `Customer`, `QuoteRequest`, `ActivityLog`, `AccountingAccount`, `BankAccount`, `Expense`, `JournalEntry`, `Notification`, `Staff_Member`, `StaffMember`, and `UserPresence`.

## Mapping

| Old Hopex table/entity | New Hopex table | Old column/path | New column | Transformation needed | Risk | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `app_records` / `Shipment` | `shipments` | `data->>'shipment_tracking'`, `data->>'tracking_number'` | `tracking_number` | Prefer explicit tracking number, fallback to old shipment tracking. | Medium | Unique by `company_id, tracking_number`; duplicates are skipped. |
| `app_records` / `Shipment` | `shipments` | `data->>'origin'`, `data->>'destination'` | `origin`, `destination` | Copy text, fallback to empty known labels where missing. | Low | Required fields in target. |
| `app_records` / `Shipment` | `shipments` | `data->>'status'` | `status` | Normalize old status values to target statuses. | Medium | Needs status dictionary during dry run. |
| `app_records` / `Shipment` | `shipments` | `data->>'weight_kg'`, `data->>'pieces'`, `data->>'cargo_type'` | shipment detail fields | Numeric casting with null-on-invalid. | Medium | Validate casting errors before production import. |
| `app_records` / `Shipment` | `shipment_status_logs` / `shipment_events` | `data` history fields if present | status/event rows | Expand arrays into child rows. | High | Old records may store history in free text or activity logs. |
| `app_records` / `ActivityLog` | `shipment_status_logs`, `audit_logs` | `data->>'action'`, `data->>'notes'` | `action`, `notes`, status log fields | Link by tracking/base44 id where possible. | High | Some activity logs are not shipment-specific. |
| `app_records` / `Customer` | `customers` | `data->>'customer_name'`, `data->>'full_name'` | `full_name` | Prefer `full_name`, fallback to customer/company name. | Low | Upsert by normalized email/phone/name. |
| `app_records` / `Customer` | `customers` | `data->>'phone'`, `data->>'email'`, `data->>'address'` | same semantic fields | Copy and normalize blanks to null. | Low | Phone can be primary dedupe key if email absent. |
| `app_records` / `QuoteRequest` | `quote_requests` | `data` | quote request columns | Map route, cargo, contact, expected date, notes. | Medium | Some records may be public website requests. |
| `app_records` / quote-like records | `quotes`, `quote_items`, `quote_status_logs` | `data` | quote module fields | Convert draft/approved quote data into normalized quote rows. | High | Requires source samples before final transform. |
| `app_records` / `CargoInvoice` | `invoices` | `data->>'invoice_number'` | `invoice_number` | Copy as-is; upsert by company and invoice number. | Low | Use old invoice number to preserve references. |
| `app_records` / `CargoInvoice` | `invoice_items` | `data->'line_items'` | item rows | Expand JSON array into item rows. | Medium | Validate quantities/rates/amounts. |
| `app_records` / `CargoInvoice` | `invoices` | `data->>'amount'`, `data->>'grand_total'` | `total_amount` | Numeric casting; prefer grand total. | Medium | Currency conversion not automatic. |
| `app_records` / payment-like records | `payments`, `payment_allocations` | `data` | payment rows | Upsert by old receipt/reference id where present. | High | Need source entity names from dry run. |
| `app_records` / `Expense` | `expenses` | `data` | expense fields | Map category, amount, date, vendor, notes. | Medium | Validate account/category references. |
| `app_records` / `AccountingAccount` | `chart_of_accounts` | `data` | account fields | Preserve code/name/type when present. | Medium | New schema may already seed default accounts. |
| `app_records` / `JournalEntry` | `journal_entries`, `journal_entry_lines` | `data` | journal entry fields | Expand lines and balance debit/credit. | High | Reject unbalanced entries into review table. |
| `app_records` / `Staff_Member`, `StaffMember` | `staff`, `company_users`, `profiles` | `data->>'email'`, `data->>'user_id'`, `data->>'role'` | staff/profile/company membership | Match by email to `auth.users`; create staff record only after user exists. | High | Never migrate passwords. Auth users are provisioned separately. |
| Old auth users | Supabase Auth | email only | auth.users | Create/invite users in new project; do not copy password hashes. | High | Use Supabase Auth admin/manual invite. |
| Old roles/modules | `roles`, `permissions`, `role_permissions`, `staff_permissions` | `data->'modules'`, `data->'permissions'` | permission rows | Convert module names to permission keys. | High | Requires human review for admin privileges. |
| Company profile/config | `companies`, `company_settings`, `branding_settings`, `invoice_settings` | old app config / manual Hopex details | company/config rows | Seed Hopex V2 settings and update from verified old values. | Medium | Initial seed exists in migration `202607010001_seed_hopex_v2_company.sql`. |
| Logo/assets | Supabase Storage / `public/company-logo.svg` | old storage/file URLs | storage object paths / logo URLs | Download from old storage read-only, upload to target storage. | Medium | Keep source files untouched. |
| Shipment documents/files | `shipment_documents`, storage buckets | old file URLs / data arrays | document rows and storage objects | Copy files from old storage to new storage and preserve old URL in notes. | High | Requires signed/read access from source. |
| Settings/templates | `company_settings`, `email_accounts`, `whatsapp_templates` | old settings/template entities | settings/template rows | Seed baseline, then merge verified templates. | Medium | Avoid copying provider secrets without approval. |
| Notifications | `notifications` | `Notification` | notification rows | Optional historical import. | Low | Can be skipped for clean launch. |

## Open Items Before Final Migration

- Confirm the old source project/ref and read-only access method.
- Export representative JSON samples for every entity.
- Confirm whether historical notifications and activity logs should migrate or remain archived only.
- Confirm production sender domains for Resend/email and WhatsApp provider settings.
- Confirm first admin user email in the new Supabase Auth project.
