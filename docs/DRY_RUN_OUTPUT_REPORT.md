# Sprint 3B Dry-Run Output Report

Date: 2026-07-01
Status: IN REVIEW

## Execution Boundary

- Source project inspected read-only: `exnxwhqolekycrblqchp` (`hopex-cargo`)
- Target project inspected read-only: `ozgeatgwgnpcfnzjhqit` (`Hopex-App-V2`)
- No production migration was performed.
- No old production writes were performed.
- No target V2 business rows were inserted.
- No storage objects were copied.
- No live domain was connected.
- No commit or push was performed.

## Execution Timings

| Step | Mode | Result | Observed Runtime |
| --- | --- | --- | ---: |
| Source aggregate inventory | `begin read only` | Passed | 2.78s |
| Target aggregate inventory and validation | `begin read only` | Passed | 4.59s |
| Target transform rollback script | Not executed | Blocked by no-insert rule and no reviewed staging export | n/a |

## Tables Inspected

| Project | Public Base Tables | RLS-Enabled Tables | Policies | Indexes | Constraints | Foreign Keys |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Old source | 2 | 2 | 9 | 15 | 16 | 2 |
| New target | 83 | 83 | 315 | 148 | 1051 | 249 |

## Rows Discovered

### Source Tables

| Table | Rows |
| --- | ---: |
| `public.app_records` | 227 |
| `public.profiles` | 3 |

### Source Entities

| Entity | Rows | Mapping Status |
| --- | ---: | --- |
| `AccountingAccount` | 25 | Candidate mapping ready; merge review required against seeded chart accounts. |
| `ActivityLog` | 119 | Mapping unresolved; optional history/linking decision required. |
| `BankAccount` | 1 | Candidate mapping ready; duplicate review required. |
| `CargoInvoice` | 7 | Candidate mapping ready; payment semantics require review. |
| `Customer` | 20 | Candidate mapping ready. |
| `Expense` | 1 | Candidate mapping ready; account/category review required. |
| `JournalEntry` | 2 | Candidate mapping ready; balanced validation passed. |
| `Notification` | 5 | Optional/archive decision required. |
| `QuoteRequest` | 1 | Candidate mapping ready. |
| `Shipment` | 35 | Candidate mapping ready. |
| `Staff` | 1 | Blocked until V2 Auth users exist. |
| `Staff_Member` | 2 | Blocked until V2 Auth users exist. |
| `Task` | 2 | Optional/archive decision required. |
| `UserPresence` | 3 | Excluded by default. |
| `WhatsAppLog` | 3 | Optional/archive decision required. |

### Target Baseline Rows

| Table / Area | Rows |
| --- | ---: |
| `companies` | 1 |
| `roles` | 3 |
| `permissions` | 140 |
| `role_permissions` | 178 |
| `chart_of_accounts` | 23 |
| `bank_accounts` | 1 |
| `company_settings` | 1 |
| `branding_settings` | 1 |
| `invoice_settings` | 1 |
| `notification_settings` | 1 |
| Target Auth users | 0 |
| Target company users | 0 |
| Target staff | 0 |
| Target business data tables | 0 |

## Mapping Success

| Area | Result |
| --- | --- |
| Customers | 20 source rows have required identity data; no missing name/email/phone violations. |
| Shipments | 35 source rows have tracking numbers, origins, and destinations. |
| Cargo invoices | 7 source rows have invoice numbers and valid totals. |
| Quote requests | 1 source row has contact data. |
| Journal entries | 2 source rows have line arrays and balanced totals. |
| Numeric validation | No invalid shipment weight, piece count, or invoice total values found. |
| Duplicate detection | No duplicate customer emails, customer phones, invoice numbers, or shipment tracking numbers found. |
| Shipment enum mapping | Source shipment statuses match the target `shipments_status_check` allowed values. |

## Mapping Failures / Holds

| Area | Rows | Reason |
| --- | ---: | --- |
| Staff/Auth | 3 staff records | Target has 0 Auth users, so staff/company-user/profile import cannot proceed. |
| Activity logs | 119 rows | Need link mapping by old id/tracking number or archive decision. |
| Notifications | 5 rows | Optional history; owner decision needed. |
| Tasks | 2 rows | Optional history; owner decision needed. |
| WhatsApp logs | 3 rows | Optional history; owner decision needed. |
| User presence | 3 rows | Ephemeral; excluded by default. |
| Payments from invoices | Up to 7 invoice-linked candidates | Paid/partial semantics need sample review before creating payments. |

## FK Validation

- Required FK validation on the target passed for the checked migration-critical relationships.
- Missing required FK count: 0.
- Parent-before-child import order remains mandatory for Sprint 4.

## Duplicate Detection

| Check | Result |
| --- | --- |
| Shipment tracking numbers | 0 duplicates |
| Customer emails | 0 duplicates |
| Customer phones | 0 duplicates |
| Invoice numbers | 0 duplicates |

## Nullable Violations

| Check | Violations |
| --- | ---: |
| Customers missing name/email/phone | 0 |
| Shipments missing tracking number | 0 |
| Shipments missing origin | 0 |
| Shipments missing destination | 0 |
| Invoices missing invoice number | 0 |
| Quote requests missing contact | 0 |
| Staff missing email | 0 |
| Journal entries missing lines array | 0 |

## Enum / Status Mismatches

| Source Field | Source Values | Result |
| --- | --- | --- |
| `Shipment.status` | `customs_clearance`, `delivered`, `in_transit`, `out_for_delivery`, `picked_up` | No mismatch against target shipment status check. |
| `CargoInvoice.status` | `cancelled`, `paid`, `pending` | Requires V2 invoice status review; no target enum/check failure detected in static validation. |
| `JournalEntry.status` | `posted` | Requires V2 journal status review; no target enum/check failure detected in static validation. |
| `Task.status` | `pending` | Optional task migration; review only if tasks are imported. |
| Staff roles | `admin`, `staff` | Must map to approved V2 roles; no automatic admin assignment. |

## Storage Inventory

### Source

| Bucket | Public | Objects | Total Bytes |
| --- | --- | ---: | ---: |
| `uploads` | true | 0 | 0 |

### Target

| Bucket | Public | Objects | Total Bytes |
| --- | --- | ---: | ---: |
| `company-assets` | true | 0 | 0 |
| `company-logos` | true | 0 | 0 |
| `email-attachments` | false | 0 | 0 |
| `profile-images` | true | 0 | 0 |
| `profile-photos` | true | 0 | 0 |
| `quote-documents` | false | 0 | 0 |
| `settings-assets` | false | 0 | 0 |
| `shipment-documents` | false | 0 | 0 |
| `staff-documents` | false | 0 | 0 |
| `task-attachments` | false | 0 | 0 |

## Auth Validation

| Check | Result |
| --- | ---: |
| Source auth users | 3 |
| Source profiles | 3 |
| Source staff records | 3 |
| Source distinct staff emails | 2 |
| Target auth users | 0 |
| Target profiles | 0 |
| Target company users | 0 |
| Target staff | 0 |
| Staff records ready for import | 0 |

Auth migration is blocked until V2 users are created or invited and role mapping is approved.

## Target Static Validation Notes

- Target company exists.
- All public target tables have RLS enabled.
- No target public policies using `auth.role()` were found.
- All 10 required storage buckets exist.
- Required FK check passed.
- Warning: expected index name `invoices_company_status_idx` was not found. The `invoices` table has indexes, but Sprint 4 should review whether an invoice status index is needed or whether the expected-name check is too strict.

## Non-Executed Step

`migration/dry-run/03_transform_dry_run_rollback.sql` was not executed because Sprint 3B explicitly disallowed inserting data into V2. That script performs transaction-scoped staging/temp inserts and requires a reviewed source export loaded into `migration_staging.old_hopex_app_records`. No reviewed staging export exists yet.
