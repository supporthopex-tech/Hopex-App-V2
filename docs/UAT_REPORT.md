# Sprint 6 UAT Report

Sprint: 6 - Feature Completion and User Acceptance Testing  
Status: Completed locally; ready for CTO review  
Date: 2026-07-01

## Guardrails

- No production data migration was performed.
- No production database writes were performed.
- No live domain was connected.
- UAT was performed through source inspection, route/action/API review, permission verification, schema alignment review, and local lint/build verification.
- Live authenticated user testing remains blocked until approved V2 auth provisioning and approved test data are available.

## Verification Summary

| Check | Result |
| --- | --- |
| `npm.cmd run lint` | Passed |
| `npm.cmd run build` | Passed |
| Production migration | Not run |
| Production database writes | Not performed |
| Live domain changes | Not performed |

## Workflow Matrix

| Workflow | Status | Database Interaction | Permissions | UI | Validation | Error Handling | Mobile |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Customer registration | Working correctly | Customers create/update/list/export routes and shipment auto-save customer flow verified. | `customers.*` and tenant context checks present. | Internal customer forms and public quote/contact entry points present. | Required names/email inputs and server normalization present; richer phone validation remains Medium. | Server actions return form states or protected errors. | Responsive grids/cards present. |
| Quote creation | Working correctly | `quote_requests`, quote items/documents, PDF/export paths verified. | `quotes.create` required. | Internal quote form and public quote page present. | Amount/status fields normalized; lifecycle constraints remain Medium. | Action states and route errors present. | Responsive forms/lists present. |
| Quote approval | Working correctly | Status update action writes quote status and audit-style events. | `quotes.edit` or `quotes.create` accepted. | Detail/status controls present. | Allowed statuses are constrained. | Invalid status rejected. | Responsive detail layout present. |
| Shipment creation | Working correctly | `shipments`, `shipment_pricing`, documents, notifications, invoice draft creation, and customer auto-save verified. | `shipments.create` required. | Create shipment form complete. | Required parties, route, pricing, status, and item validation present. | Create action returns validation messages. | Responsive form cards present. |
| Shipment items | Working correctly after Sprint 6 fix | `shipment_items` rows now created, replaced on edit, fetched for staff/public detail. | `shipments.create` for insert, `shipments.edit` for update/delete item replacement. | Itemized cargo editor added to create/edit; item list added to detail/tracking. | At least one item required; item name/quantity/numeric fields validated. | Missing item name returns/throws validation error. | Item editor and item cards use responsive grids. |
| Shipment tracking updates | Working correctly | Status RPC, logs, events, notifications, and optional customer email verified. | `shipments.edit` currently gates status update. | Detail status form and public tracking page present. | Status is allow-listed. | Invalid statuses rejected. | Responsive status/timeline cards present. |
| Packing list generation | Working correctly | `packing_lists` actions and PDF route verified. | `packing_lists.create/update/delete` checks present. | List, create, detail/update/status UI present. | Required fields and JSON item parsing present. | Action states for create/update present. | Responsive layouts present. |
| Label printing and QR codes | Working correctly | Protected label API reads shipment and generates printable label/QR. | Protected shipment access through app route. | Print label action present on shipment detail. | Tracking number/id required by route. | Not-found behavior present. | Label is print-focused; app controls responsive. |
| Invoice generation | Working correctly | Shipment invoice generation and accounting invoice CRUD/posting verified. | `invoices.create`, `shipments.edit`, or accounting permissions required. | Shipment detail and accounting invoice UI present. | Invoice totals and posting checks present. | Post/update errors surfaced through server actions. | Responsive accounting tables use horizontal overflow. |
| Payment recording | Working correctly | Payment creation and posting RPC verified. | `payments.create` or `accounting.manage` required. | Accounting payment form/list present. | Basic amount/date/method validation present. | Server action returns create failures. | Table overflow pattern present. |
| Expense recording | Needs improvement | Expense create/approve/pay verified. | `expenses.create/approve` or `accounting.manage` required. | Expense form/list present. | Basic numeric validation present. | Action states present. | Table overflow pattern present. |
| Accounting journals | Working correctly | Manual journal create/post and balanced-entry validation verified. | `journal_entries.*` or `accounting.manage` required. | Accounting journals UI present. | Debit/credit balance is enforced. | Unbalanced entries rejected. | Responsive table overflow present. |
| Dashboard statistics | Working correctly | Tenant-scoped dashboard reads shipments, invoices, payments, expenses, staff, tasks, audit logs. | Dashboard route protected. | KPI/charts/recent activity present. | Read-only workflow. | Empty state returns zeros when Supabase is not configured. | Responsive metric grid present. |
| Reports and PDF export | Working correctly | Report service and `/api/reports/[type]/pdf` verified. | `reports.view` required. | Reports page present. | Date/type handling present. | Unsupported report types handled. | Responsive report controls present. |
| Documents upload/download | Working correctly | Shipment/quote document center, upload/delete, and protected download route verified. | `shipments.manage_documents`, `shipments.view`, or `quotes.edit` checks present by source/action. | Central Documents module present. | File presence/source validation present. | Missing config/file errors surfaced. | Responsive document list present. |
| Notifications | Working correctly | Notification list/read/unread/delete and workflow notification writes verified. | Authenticated tenant context; nav requires dashboard access. | Standalone notifications workflow present. | Read/delete ids required. | Action errors throw on failed update/delete. | Responsive list/filter UI present. |
| Email sending | Needs improvement | Email compose/send/logs verified; Resend integration prepared. | Email routes protected by `email.view` and action contexts. | Full email module present. | Email address parsing and attachment limits present. | Missing Resend configuration returns controlled failure. | Three-pane layout still needs real-device UAT with real messages. |
| Search | Working correctly | Global search service queries tenant-scoped shipments, customers, quotes, staff, documents. | Results are permission-filtered. | App-shell search and `/search` results page present. | Empty query handled. | Returns empty safely when Supabase is not configured. | Search page responsive. |
| Staff permissions | Working correctly | Permission aliases and role catalog alignment from Sprint 5 verified. | Canonical/alias permission checks present in tenant and authorization helpers. | Roles/permissions/staff UI present. | Role assignment validation present. | Permission denials redirect/block. | Responsive settings/staff UI present. |
| Settings | Working correctly | Company, invoice, notification, account, language, role/permission settings verified. | Settings actions permission gated. | Settings sections present. | Partial but sufficient for Sprint 6; richer URL/phone validation remains Medium. | Action errors present. | Responsive settings pages present. |

## Critical And High Issues

| ID | Priority | Status | Workflow | Finding | Resolution |
| --- | --- | --- | --- | --- | --- |
| UAT-6-001 | High | Fixed | Shipment items | `shipment_items` existed in the schema but the app did not create, read, update, or display itemized shipment rows. | Added item editor to shipment create/edit, server parsing/persistence, staff/public display, public tracking API item payload, and RLS migration alignment for item replacement. |

## Medium And Low Issues

| ID | Priority | Status | Workflow | Finding |
| --- | --- | --- | --- | --- |
| UAT-6-002 | Medium | Open | Expenses | Expense edit/delete and receipt upload remain limited; create/approve/pay are available. |
| UAT-6-003 | Medium | Open | Payments | Payment reversal/delete/export/search remain limited; create/read/post are available. |
| UAT-6-004 | Medium | Open | Email | Real-device mobile UAT with production-size inbox data is still needed. |
| UAT-6-005 | Medium | Open | Validation | Several workflows rely on HTML controls and database constraints rather than shared server schemas. |
| UAT-6-006 | Low | Open | Live UAT | End-to-end live user testing is pending approved V2 auth provisioning and approved non-production test data. |

## Sprint 6 Fixes Applied

- Added `ShipmentItem` domain type and mapped `shipment_items` in shipment service reads.
- Added itemized cargo editor for shipment create and edit flows.
- Persisted itemized shipment rows through create/update server actions.
- Displayed shipment items in staff shipment detail and public tracking.
- Included shipment items in the public tracking API response.
- Updated the shipment item delete RLS migration artifact so shipment editors can replace item rows during edits.

## Acceptance Criteria

- Core workflows reviewed end to end by route/action/API/source path.
- Critical and High issues found during Sprint 6 fixed.
- Required UAT reports generated.
- Lint passed.
- Production build passed.
- No production migration, production database write, live domain change, push, or deployment performed.
