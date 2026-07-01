# Sprint 3B Dry-Run Errors and Warnings

Date: 2026-07-01
Status: IN REVIEW

## Errors

No read-only source or target aggregate inspection query failed.

## Controlled Non-Execution

| Item | Severity | Reason | Next Action |
| --- | --- | --- | --- |
| `migration/dry-run/03_transform_dry_run_rollback.sql` | Blocker for complete transform proof | Sprint 3B explicitly disallowed inserts into V2, and this script uses transaction-scoped staging/temp inserts. Also, no reviewed source export has been loaded into staging. | After approval, load a reviewed source export into target staging and run the script inside its rollback transaction. |

## Warnings

| Warning | Severity | Evidence | Required Action |
| --- | --- | --- | --- |
| Target V2 Auth users missing | High | Target Auth users: 0; source staff records: 3; distinct staff emails: 2. | Create/invite V2 users and approve role mapping before staff migration. |
| Optional history policy pending | Medium | `ActivityLog` 119, `Notification` 5, `Task` 2, `WhatsAppLog` 3, `UserPresence` 3. | Decide import vs archive vs exclude. |
| Payment semantics pending | Medium | 7 old `CargoInvoice` rows include statuses `cancelled`, `paid`, `pending`. | Approve rules for creating payments/payment allocations. |
| Missing expected invoice status index name | Low | Check for `invoices_company_status_idx` returned missing, although `invoices` has indexes. | Review whether Sprint 4 needs this index or the validation should check the actual existing index name. |
| Transform row-count proof incomplete | Medium | Read-only mapping counts exist, but no staged rollback transform ran. | Run transform script only after staging export and insert-scope approval. |

## Validation Results With Zero Findings

- Duplicate shipment tracking numbers: 0.
- Duplicate customer emails: 0.
- Duplicate customer phones: 0.
- Duplicate invoice numbers: 0.
- Critical nullable violations: 0.
- Invalid shipment weight values: 0.
- Invalid shipment piece counts: 0.
- Invalid invoice totals: 0.
- Unbalanced journal entries: 0.
- Missing required target foreign keys: 0.
- Public target tables without RLS: 0.
- Target policies using `auth.role()`: 0.
