# Sprint 3 Migration Inventory

Date: 2026-07-01
Sprint: Sprint 3 Dry Run Migration
Status: In progress, planning and dry-run evidence only

## Safety Boundary

- Old Hopex production project is read-only source: `exnxwhqolekycrblqchp` (`hopex-cargo`).
- New Hopex App V2 project is target: `ozgeatgwgnpcfnzjhqit` (`Hopex-App-V2`).
- No production migration was executed.
- No production data was modified.
- No live domain was connected.
- Exported production data must stay outside Git in a secure local staging folder.

## Reviewed Inputs

- `docs/PROJECT_CONTEXT.md`
- `docs/ROADMAP.md`
- `docs/DEVELOPMENT_RULES.md`
- `docs/SPRINT_STATUS.md`
- `docs/DATABASE_VERIFICATION_REPORT.md`
- `CHANGELOG.md`
- `docs/MIGRATION_MAPPING.md`
- `docs/MIGRATION_RISK_REPORT.md`
- `docs/MIGRATION_ROLLBACK_PLAN.md`
- `docs/MIGRATION_EXECUTION_ORDER.md`
- `docs/MIGRATION_VERIFICATION_CHECKLIST.md`
- `migration/dry-run/`
- `migration/scripts/`
- `supabase/migrations/`
- `src/lib/types/database.ts`

## Source Database Inventory

Old project: `hopex-cargo`

| Area | Count / Shape | Verification Source |
| --- | ---: | --- |
| Public tables | 2 | Prior Supabase metadata inspection |
| Public RLS-enabled tables | 2 | Prior Supabase metadata inspection |
| Public policies | 9 | Prior Supabase metadata inspection |
| Public indexes | 15 | Prior Supabase metadata inspection |
| Public triggers | 2 | Prior Supabase metadata inspection |
| Public functions | 3 | Prior Supabase metadata inspection |
| Storage buckets | 1 | Prior Supabase metadata inspection |
| Auth users | 3 | Prior Supabase metadata inspection |
| Profiles | 3 | Prior Supabase metadata inspection |

### Source Tables

| Table | Rows | Role |
| --- | ---: | --- |
| `public.app_records` | 227 | Base44-style JSON record store for business data. |
| `public.profiles` | 3 | Legacy user profile rows linked to old auth users. |

### Source Entity Row Counts

| Entity | Count | First Created | Last Updated | Default Migration Decision |
| --- | ---: | --- | --- | --- |
| `AccountingAccount` | 25 | 2026-06-15 | 2026-06-15 | Conditional merge into chart of accounts. |
| `ActivityLog` | 119 | 2026-05-09 | 2026-06-30 | Link into audit/status history where possible; otherwise archive. |
| `BankAccount` | 1 | 2026-06-16 | 2026-06-16 | Conditional merge after duplicate review. |
| `CargoInvoice` | 7 | 2026-05-09 | 2026-06-22 | Import invoices and line items; payments only if paid semantics are verified. |
| `Customer` | 20 | 2026-05-09 | 2026-06-11 | Import. |
| `Expense` | 1 | 2026-06-25 | 2026-06-25 | Import after account/category validation. |
| `JournalEntry` | 2 | 2026-06-22 | 2026-06-25 | Import only if balanced and line accounts resolve. |
| `Notification` | 5 | 2026-06-11 | 2026-06-13 | Archive by default unless approved. |
| `QuoteRequest` | 1 | 2026-06-23 | 2026-06-23 | Import. |
| `Shipment` | 35 | 2026-05-09 | 2026-06-11 | Import with items/tracking derivation. |
| `Staff` | 1 | 2026-06-11 | 2026-06-13 | Import only after matching V2 Auth user exists. |
| `Staff_Member` | 2 | 2026-06-30 | 2026-06-30 | Import only after matching V2 Auth user exists. |
| `Task` | 2 | 2026-05-11 | 2026-06-11 | Archive by default unless still operational. |
| `UserPresence` | 3 | 2026-06-11 | 2026-06-30 | Do not import. |
| `WhatsAppLog` | 3 | 2026-05-09 | 2026-06-11 | Archive by default unless approved. |

## Target Database Inventory

New project: `Hopex-App-V2`

| Area | Count / Shape | Verification Source |
| --- | ---: | --- |
| Public tables | 83 | `docs/DATABASE_VERIFICATION_REPORT.md` |
| Public RLS-enabled tables | 83 | `docs/DATABASE_VERIFICATION_REPORT.md` |
| Public policies | 315 | `docs/DATABASE_VERIFICATION_REPORT.md` |
| Policies using `auth.role()` | 0 | `docs/DATABASE_VERIFICATION_REPORT.md` |
| Public indexes | 148 | `docs/DATABASE_VERIFICATION_REPORT.md` |
| Public triggers | 81 | `docs/DATABASE_VERIFICATION_REPORT.md` |
| App functions in `public` / `private` | 16 | `docs/DATABASE_VERIFICATION_REPORT.md` |
| Storage buckets | 10 | `docs/DATABASE_VERIFICATION_REPORT.md` |

### Seeded Structural Rows

| Table | Rows |
| --- | ---: |
| `companies` | 1 |
| `roles` | 3 |
| `permissions` | 140 |
| `role_permissions` | 178 |
| `chart_of_accounts` | 23 |
| `company_settings` | 1 |
| `branding_settings` | 1 |
| `invoice_settings` | 1 |
| `notification_settings` | 1 |
| `accounting_settings` | 1 |
| Business data tables | 0 |

## Complete Schema Comparison Plan

The source and target are not directly comparable table-by-table because the old app uses a generic JSON store while V2 uses normalized relational tables. Sprint 3 therefore captures both:

1. Physical source schema: source tables, columns, indexes, constraints, foreign keys, RLS, policies, and storage.
2. Physical target schema: target tables, columns, indexes, constraints, foreign keys, RLS, policies, and storage.
3. Logical comparison: old `entity_name` values mapped to V2 target tables and child tables.

The scripts that produce the complete comparison evidence are:

- `migration/dry-run/01_source_readonly_inventory.sql`
- `migration/dry-run/02_target_schema_snapshot.sql`

Both scripts now output:

- table-by-table row counts
- column-by-column metadata
- index definitions
- constraints
- foreign keys
- RLS status
- policy definitions
- storage bucket metadata
- storage object counts

## Logical Table Comparison

| Old Source Table / Entity | Old Shape | V2 Target Tables | Comparison Result |
| --- | --- | --- | --- |
| `public.app_records` / `AccountingAccount` | JSON rows | `chart_of_accounts` | Normalize code/name/type/is_active/is_system; merge against seeded accounts by `company_id, account_code`. |
| `public.app_records` / `ActivityLog` | JSON rows | `audit_logs`, `shipment_status_logs`, `customer_activity_logs` | Link resolution required by old entity id, tracking number, or free-text reference. |
| `public.app_records` / `BankAccount` | JSON rows | `bank_accounts` | Merge by account number/name; avoid duplicate seeded/default account. |
| `public.app_records` / `CargoInvoice` | JSON rows plus line item arrays | `invoices`, `invoice_items`, `payments`, `payment_allocations` | Header/line split required; paid status semantics require approval. |
| `public.app_records` / `Customer` | JSON rows | `customers`, `customer_contacts`, `customer_activity_logs` | Customer identity must dedupe by email, phone, then old id/name fallback. |
| `public.app_records` / `Expense` | JSON rows | `expenses`, `journal_entries`, `journal_entry_lines` | Validate category/account and amount before import. |
| `public.app_records` / `JournalEntry` | JSON rows plus line arrays | `journal_entries`, `journal_entry_lines` | Must balance debit/credit and resolve account codes. |
| `public.app_records` / `Notification` | JSON rows | `notifications` | Optional history; likely archive-only. |
| `public.app_records` / `QuoteRequest` | JSON rows | `quote_requests`, `quote_items`, `quote_status_logs` | Import request; child rows only when source arrays exist. |
| `public.app_records` / `Shipment` | JSON rows | `shipments`, `shipment_items`, `shipment_tracking`, `shipment_events`, `shipment_status_logs` | Required transform; tracking number is the key business identifier. |
| `public.app_records` / `Staff` | JSON rows | `profiles`, `company_users`, `staff` | Requires V2 Auth users first; passwords are never migrated. |
| `public.app_records` / `Staff_Member` | JSON rows | `profiles`, `company_users`, `staff`, `staff_permissions` | Requires V2 Auth users and permission review. |
| `public.app_records` / `Task` | JSON rows | `tasks`, `task_comments`, `task_status_logs`, `task_attachments` | Optional; archive by default unless still active. |
| `public.app_records` / `UserPresence` | JSON rows | None | Do not migrate ephemeral state. |
| `public.app_records` / `WhatsAppLog` | JSON rows | `whatsapp_logs` | Optional history; provider secrets must not migrate. |
| `public.profiles` | Relational profile rows | `auth.users`, `profiles` | Match by email only; do not copy auth password hashes. |

## Row-Count Comparison Baseline

| Source Entity | Source Rows | Primary Target Tables | Target Baseline Rows | Expected Dry-Run Outcome |
| --- | ---: | --- | ---: | --- |
| `AccountingAccount` | 25 | `chart_of_accounts` | 23 seeded | Accepted or duplicate/review counts. |
| `ActivityLog` | 119 | `audit_logs`, `shipment_status_logs` | 0 | Linked vs rejected/archive counts. |
| `BankAccount` | 1 | `bank_accounts` | seeded/check required | Accepted or duplicate count. |
| `CargoInvoice` | 7 | `invoices`, `invoice_items`, `payments` | 0 | 7 candidate invoice headers plus line/payment counts. |
| `Customer` | 20 | `customers`, `customer_contacts` | 0 | 20 candidate customers minus rejects/duplicates. |
| `Expense` | 1 | `expenses` | 0 | 1 candidate expense. |
| `JournalEntry` | 2 | `journal_entries`, `journal_entry_lines` | 0 | 2 candidates if balanced. |
| `Notification` | 5 | `notifications` | 0 | Optional/archive decision count. |
| `QuoteRequest` | 1 | `quote_requests`, `quote_items` | 0 | 1 candidate quote request. |
| `Shipment` | 35 | `shipments`, `shipment_items`, `shipment_tracking` | 0 | 35 candidate shipments minus tracking rejects/duplicates. |
| `Staff` | 1 | `staff`, `company_users` | 0 | Accepted only when matching V2 Auth user exists. |
| `Staff_Member` | 2 | `staff`, `company_users`, `staff_permissions` | 0 | Accepted only when matching V2 Auth user exists. |
| `Task` | 2 | `tasks` | 0 | Optional/archive decision count. |
| `UserPresence` | 3 | none | n/a | Not imported. |
| `WhatsAppLog` | 3 | `whatsapp_logs` | 0 | Optional/archive decision count. |

The row-count evidence must be regenerated during dry run using `03_transform_dry_run_rollback.sql` after reviewed source export data is loaded into staging.

## Storage Inventory

### Source Storage

| Bucket | Public | Known Use | Sprint 3 Requirement |
| --- | --- | --- | --- |
| `uploads` | true | Legacy uploaded files | Capture object-level inventory: path, size, MIME type, owner, created/updated timestamps. |

### Target Storage

| Bucket | Public | Intended Migration Use | Import Decision |
| --- | --- | --- | --- |
| `company-assets` | true | Public company assets | Copy only approved public assets. |
| `company-logos` | true | Company logo files | Copy only approved logos. |
| `profile-images` | true | Profile images | Copy only after staff/auth match. |
| `profile-photos` | true | Staff/user photos | Copy only after staff/auth match. |
| `shipment-documents` | false | Shipment documents | Copy approved shipment files; create `shipment_documents`. |
| `staff-documents` | false | Staff documents | Copy only with explicit approval due PII. |
| `quote-documents` | false | Quote documents | Copy approved quote files. |
| `task-attachments` | false | Task attachments | Copy only if tasks migrate. |
| `email-attachments` | false | Email attachments | Do not copy provider/system artifacts by default. |
| `settings-assets` | false | Internal settings assets | Copy only approved settings assets. |

## Inventory Gaps

- No production export files have been generated in this Sprint 3 session.
- No reviewed sample payload set has been loaded into target staging.
- Object-level source storage inventory must be captured from `storage.objects`.
- V2 Auth users for staff migration are not yet confirmed.
- Owner decision is still needed for `ActivityLog`, `Notification`, `Task`, `UserPresence`, and `WhatsAppLog`.
- Currency handling for old USD/TZS fields requires approval before Sprint 4.
