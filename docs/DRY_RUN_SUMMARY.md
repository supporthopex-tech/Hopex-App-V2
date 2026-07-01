# Sprint 3B Dry-Run Summary

Date: 2026-07-01
Status: IN REVIEW

## Summary

Sprint 3B read-only database inspection was completed against the old Hopex production source and the new Hopex App V2 target. The run validated schema shape, source row counts, target baseline state, storage buckets, auth readiness, duplicates, nullable violations, basic value casting risk, and critical FK/index/RLS gates.

No production migration was performed.

## Readiness Snapshot

| Area | Status | Notes |
| --- | --- | --- |
| Source metadata export | Passed | Source counts and entity inventory captured read-only. |
| Target metadata export | Passed | Target schema, row baseline, RLS, storage, and FK checks captured read-only. |
| Mapping validation | Partial pass | Core entities map cleanly; staff/auth and optional history remain blocked/pending. |
| Duplicate validation | Passed | No duplicate customer email/phone, invoice number, or shipment tracking number found. |
| Nullable validation | Passed | No critical missing values found in inspected source rows. |
| Numeric validation | Passed | No invalid shipment weight/pieces or invoice totals found. |
| FK validation | Passed | Required target FK checks returned no missing relationships. |
| Storage validation | Passed | Buckets exist; no source or target storage objects currently found. |
| Auth validation | Blocked | Target has 0 Auth users; staff migration cannot proceed. |
| Transform dry run | Not run | Blocked by no-insert rule and missing reviewed staging export. |

## Key Counts

- Source public tables: 2
- Source `app_records`: 227
- Source profiles: 3
- Source Auth users: 3
- Target public tables: 83
- Target Auth users: 0
- Target business rows: 0
- Target storage buckets: 10
- Target storage objects: 0

## Core Import Candidates

| Entity | Candidate Rows | Current Decision |
| --- | ---: | --- |
| Customers | 20 | Ready for staged transform. |
| Shipments | 35 | Ready for staged transform. |
| Cargo invoices | 7 | Ready for staged transform; payment semantics pending. |
| Quote requests | 1 | Ready for staged transform. |
| Expenses | 1 | Ready for staged transform with accounting review. |
| Journal entries | 2 | Ready for staged transform; balanced validation passed. |
| Accounting accounts | 25 | Merge review required against target seeded accounts. |
| Bank accounts | 1 | Duplicate review required. |
| Staff records | 3 | Blocked until V2 Auth users exist. |

## Sprint 4 Gate Status

Sprint 4 is not ready yet.

Required before Sprint 4:

- Create/invite V2 Auth users.
- Approve staff role and permission mapping.
- Decide optional-history policy for activity logs, notifications, tasks, WhatsApp logs, and presence.
- Approve payment creation rules from old invoice statuses.
- Decide currency treatment.
- Prepare reviewed staging export outside Git.
- Run transform rollback script after staging export exists and after approval for transaction-scoped staging inserts.
- Resolve or waive the invoice status index warning.
