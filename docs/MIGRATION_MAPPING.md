# Hopex Old App to Hopex App V2 Migration Mapping

Sprint: Sprint 3 Dry Run Migration
Last updated: 2026-07-01

This document maps the old live Hopex Base44-style app into the new Naro-based Hopex App V2 schema.

## Safety Rules

- Source Hopex production database is read-only.
- Target is the new Hopex Supabase project only.
- No live domain switch until preview testing is complete.
- Migration scripts must be idempotent.
- Validation must run after every dry run and after any future approved import.
- Passwords and provider secrets must not be migrated.

## Known Source Shape

The old Hopex app stores operational records in `public.app_records` using:

- `id`
- `entity_name`
- `data` JSON/JSONB
- `created_by`
- `created_at`
- `updated_at`

Confirmed source project: `exnxwhqolekycrblqchp` (`hopex-cargo`).

Confirmed source tables:

- `public.app_records`: 227 rows
- `public.profiles`: 3 rows

Confirmed target project: `ozgeatgwgnpcfnzjhqit` (`Hopex-App-V2`), with 83 public tables and 10 storage buckets.

Target Hopex company id:

- `6d19adf9-570f-46c3-8476-dfab624248b3`

## Column-Level Mapping

### Customers

| Source | Target | Transform | Required | Reject / Review Rule |
| --- | --- | --- | --- | --- |
| `Customer.old_id` | migration log `source_old_id` | Preserve old id. | Yes | Reject if missing from export. |
| `data->>'full_name'` | `customers.full_name` | Prefer full name. | Conditional | Use fallback below. |
| `data->>'customer_name'` | `customers.full_name` | Fallback if `full_name` missing. | Conditional | Reject if no name/email/phone. |
| `data->>'company_name'` | `customers.company_name` | Copy null-normalized text. | No | None. |
| `data->>'email'` | `customers.email` | Lowercase and trim. | No | Duplicate report if repeated. |
| `data->>'phone'` | `customers.phone` | Trim. | No | Duplicate report if repeated. |
| `data->>'address'` | `customers.address` | Trim. | No | None. |
| `data->>'city'` | `customers.city` | Trim. | No | None. |
| `data->>'country'` | `customers.country` | Trim. | No | None. |
| `data->>'customer_code'` | `customers.metadata.customer_code` | Preserve in metadata if no dedicated column. | No | None. |
| `data->>'total_shipments'` | derived/report only | Do not trust as source of truth. | No | Recompute after import. |
| `data->>'total_revenue_usd'` | derived/report only | Do not trust as source of truth. | No | Recompute after import. |

### Shipments

| Source | Target | Transform | Required | Reject / Review Rule |
| --- | --- | --- | --- | --- |
| `Shipment.old_id` | migration log `source_old_id` | Preserve old id. | Yes | Reject if missing from export. |
| `data->>'tracking_number'` | `shipments.tracking_number` | Prefer explicit tracking number. | Yes | Reject if missing and no fallback. |
| `data->>'shipment_tracking'` | `shipments.tracking_number` | Fallback tracking number. | Yes | Duplicate report by `company_id, tracking_number`. |
| `data->>'customer_name'` | customer link staging | Match existing/imported customer by normalized name/email/phone. | No | Leave `customer_id` null if unresolved; report. |
| `data->>'origin'` | `shipments.origin` / route fields | Copy, trim. | Yes | Review if blank. |
| `data->>'destination'` | `shipments.destination` / route fields | Copy, trim. | Yes | Review if blank. |
| `data->>'status'` | `shipments.status` | Normalize through status dictionary. | Yes | Reject/review unknown status. |
| `data->>'weight_kg'` | `shipments.weight_kg` or metadata | Safe numeric cast. | No | Reject invalid numeric for production import. |
| `data->>'volume_cbm'` | `shipments.volume_cbm` or metadata | Safe numeric cast. | No | Reject invalid numeric for production import. |
| `data->>'pieces'` | `shipment_items.quantity` or metadata | Safe integer cast. | No | Reject invalid integer for production import. |
| `data->>'cargo_type'` | `shipment_items.item_name` or `shipments.cargo_type` | Copy or default item description. | No | Review if itemization is needed. |
| `data->>'price'`, `data->>'amount'` | `shipment_pricing` / invoice staging | Safe numeric cast. | No | Preserve source currency; no FX conversion. |
| `data->>'payment_status'` | invoice/payment staging | Normalize only when invoice/payment import approved. | No | Review partial/paid semantics. |
| activity/status fields | `shipment_tracking`, `shipment_status_logs`, `shipment_events` | Derive latest and historical events. | No | Unlinked history goes to reject/archive list. |

### Shipment Items and Tracking

| Source | Target | Transform | Required | Reject / Review Rule |
| --- | --- | --- | --- | --- |
| `Shipment.data->'items'` | `shipment_items` | Expand array when present. | No | Reject item rows missing quantity/item name. |
| `Shipment.data->>'pieces'` | `shipment_items.quantity` | Create one summary item if no items array exists. | No | Review if pieces is missing. |
| `Shipment.data->>'cargo_type'` | `shipment_items.item_name` | Use as summary item name. | No | Default to `Cargo` only with approval. |
| `Shipment.data->>'status'` | `shipment_tracking.status` | Create latest tracking row. | Yes for tracking import | Unknown status requires mapping. |
| `ActivityLog` linked by tracking/id | `shipment_status_logs` | Convert linked status changes. | No | Reject unlinked activity rows. |

### Quote Requests and Quotes

| Source | Target | Transform | Required | Reject / Review Rule |
| --- | --- | --- | --- | --- |
| `QuoteRequest.old_id` | migration log `source_old_id` | Preserve old id. | Yes | Reject if missing from export. |
| `data->>'name'` | `quote_requests.contact_name` | Copy. | Yes | Reject if no contact name/email/phone. |
| `data->>'email'` | `quote_requests.contact_email` | Lowercase. | No | Review invalid email. |
| `data->>'phone'` | `quote_requests.contact_phone` | Trim. | No | None. |
| `data->>'origin'` | `quote_requests.origin` | Copy. | Yes | Review if blank. |
| `data->>'destination'` | `quote_requests.destination` | Copy. | Yes | Review if blank. |
| `data->>'cargo_type'` | `quote_items.description` | Create item row when useful. | No | None. |
| `data->>'weight_kg'` | `quote_items.weight_kg` | Safe numeric cast. | No | Reject invalid numeric. |
| dimensions | `quote_items.metadata.dimensions` | Preserve as metadata unless target has dedicated columns. | No | None. |

### Invoices and Payments

| Source | Target | Transform | Required | Reject / Review Rule |
| --- | --- | --- | --- | --- |
| `CargoInvoice.old_id` | migration log `source_old_id` | Preserve old id. | Yes | Reject if missing from export. |
| `data->>'invoice_number'` | `invoices.invoice_number` | Copy as-is. | Yes | Reject if blank; duplicate report by company. |
| `data->>'shipment_tracking'` | `invoices.shipment_id` | Resolve by imported shipment tracking number. | No | Report unresolved links. |
| `data->>'customer_name'` | `invoices.customer_id` | Resolve by customer map. | No | Report unresolved links. |
| `data->'line_items'` | `invoice_items` | Expand JSON array. | No | Report invoices with no lines. |
| `data->>'amount'` | `invoices.subtotal` or total fallback | Safe numeric cast. | No | Reject invalid numeric. |
| `data->>'grand_total'` | `invoices.total_amount` | Prefer grand total. | Yes | Reject invalid/missing total if invoice import approved. |
| `data->>'currency'` | `invoices.currency` | Preserve; default only with approval. | Yes | No automatic FX conversion. |
| `data->>'status'` | `invoices.status` | Normalize status. | Yes | Unknown status requires mapping. |
| `paid_date` / paid status | `payments`, `payment_allocations` | Create payment only when old record is clearly paid. | Conditional | Requires owner approval for partials. |

### Accounting

| Source | Target | Transform | Required | Reject / Review Rule |
| --- | --- | --- | --- | --- |
| `AccountingAccount.data->>'code'` | `chart_of_accounts.account_code` | Copy; upsert by company/code. | Yes | Reject blank code. |
| `AccountingAccount.data->>'name'` | `chart_of_accounts.account_name` | Copy. | Yes | Reject blank name. |
| `AccountingAccount.data->>'type'` | `chart_of_accounts.account_type` | Normalize account type. | Yes | Unknown type requires mapping. |
| `AccountingAccount.data->>'is_active'` | `chart_of_accounts.is_active` | Boolean cast. | No | Default true only with approval. |
| `BankAccount.data` | `bank_accounts` | Copy bank/account fields. | Yes for bank import | Duplicate review by account number. |
| `Expense.data` | `expenses` | Map vendor/category/date/amount/currency. | Yes for expense import | Reject invalid amount/date. |
| `JournalEntry.data->>'entry_number'` | `journal_entries.entry_number` | Copy. | Yes | Reject blank/duplicate. |
| `JournalEntry.data->'lines'` | `journal_entry_lines` | Expand array and resolve accounts. | Yes | Reject missing lines/accounts. |
| `total_debit`, `total_credit` | validation | Safe numeric cast and compare. | Yes | Reject unbalanced journals. |

### Staff, Auth, Roles, Permissions

| Source | Target | Transform | Required | Reject / Review Rule |
| --- | --- | --- | --- | --- |
| old `auth.users.email` | V2 Auth user | Create/invite separately in V2. | Yes | Never copy password hashes. |
| `profiles` | `profiles` | Create/update profile after V2 Auth user exists. | Conditional | Do not create orphan profiles. |
| `Staff.data->>'email'` | `staff.user_id`, `company_users.user_id` | Match to V2 Auth by email. | Yes | Reject if no V2 Auth user. |
| `Staff_Member.data->>'email'` | `staff.user_id`, `company_users.user_id` | Match to V2 Auth by email. | Yes | Reject if no V2 Auth user. |
| `data->>'full_name'`, `name` | `staff.full_name`, `profiles.full_name` | Copy. | Yes | Review blank names. |
| `data->>'role'`, `portal_role` | `roles`, `company_users.role_id` | Map to Administrator, Operations Staff, Accounting, or custom role. | Yes | Admin privileges require human approval. |
| `modules`, `module_permissions`, `permissions` | `staff_permissions` | Convert to permission keys. | Conditional | Unknown keys rejected for review. |

### Optional History

| Source | Target | Default Decision | Notes |
| --- | --- | --- | --- |
| `ActivityLog` | `audit_logs`, `shipment_status_logs`, `customer_activity_logs` | Conditional | Import only linked records; archive unlinked logs. |
| `Notification` | `notifications` | Archive by default | Old notifications may be stale. |
| `Task` | `tasks`, child task tables | Archive by default | Import only active/useful tasks. |
| `UserPresence` | none | Do not import | Ephemeral session state. |
| `WhatsAppLog` | `whatsapp_logs` | Archive by default | Do not copy provider secrets. |

## Required Target Constraints to Respect

| Target Area | Constraint / Index Requirement | Migration Impact |
| --- | --- | --- |
| `companies` | single Hopex company seed | All imported business rows use company id `6d19adf9-570f-46c3-8476-dfab624248b3`. |
| `shipments` | unique `company_id, tracking_number` | Duplicates must be rejected or resolved before Sprint 4. |
| `invoices` | unique `company_id, invoice_number` | Preserve old invoice numbers; duplicates require manual decision. |
| `company_users` | unique `company_id, user_id` | Staff import cannot create duplicate memberships. |
| `roles` | unique `company_id, name` | Role mapping must reuse seeded roles unless custom role is approved. |
| `role_permissions` / `staff_permissions` | unique role/staff permission pairs | Permission import must dedupe. |
| Child tables | FKs to parent rows | Import order must load parents before children. |

## Row-Count Mapping

| Source Entity | Source Rows | Target Table(s) | Expected Dry-Run Count Evidence |
| --- | ---: | --- | --- |
| `AccountingAccount` | 25 | `chart_of_accounts` | candidate, accepted, duplicate/review counts |
| `ActivityLog` | 119 | `audit_logs`, `shipment_status_logs` | linked, unlinked, archive counts |
| `BankAccount` | 1 | `bank_accounts` | candidate and duplicate counts |
| `CargoInvoice` | 7 | `invoices`, `invoice_items`, `payments` | header, line item, paid-only counts |
| `Customer` | 20 | `customers`, `customer_contacts` | accepted/rejected/duplicate counts |
| `Expense` | 1 | `expenses` | accepted/rejected counts |
| `JournalEntry` | 2 | `journal_entries`, `journal_entry_lines` | balanced/rejected and line counts |
| `Notification` | 5 | `notifications` | import/archive decision count |
| `QuoteRequest` | 1 | `quote_requests`, `quote_items` | accepted/rejected and item counts |
| `Shipment` | 35 | `shipments`, `shipment_items`, `shipment_tracking` | accepted/rejected/duplicate and item/tracking counts |
| `Staff` | 1 | `staff`, `company_users`, `profiles` | matched/missing V2 Auth counts |
| `Staff_Member` | 2 | `staff`, `company_users`, `staff_permissions` | matched/missing V2 Auth counts |
| `Task` | 2 | `tasks` | import/archive decision count |
| `UserPresence` | 3 | none | excluded count |
| `WhatsAppLog` | 3 | `whatsapp_logs` | import/archive decision count |

## Open Items Before Sprint 4

- Confirm read-only credentials/access procedure for source export execution.
- Export representative JSON samples for every entity.
- Confirm whether historical notifications, tasks, WhatsApp logs, and activity logs migrate or remain archive-only.
- Confirm production sender domains for Resend/email and WhatsApp provider settings.
- Confirm first admin user email in the new Supabase Auth project.
- Confirm target V2 Auth users for all staff records before staff import.
- Confirm whether old `uploads` bucket files must be copied to V2 storage.
- Confirm currency treatment for USD/TZS fields.
