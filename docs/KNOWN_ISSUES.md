# Known Issues

Date: 2026-07-01  
Scope: Post-Sprint 6 application readiness before final migration

## Open Issues

| ID | Priority | Area | Issue | Recommended Next Action |
| --- | --- | --- | --- | --- |
| UAT-6-002 | Medium | Expenses | Expense edit/delete and receipt upload are not first-class workflows. | Decide accounting lock policy, then add controlled edit/delete/attachment support if required. |
| UAT-6-003 | Medium | Payments | Payment reversal/delete/export/search are limited. | Add reversal workflow and operational filters/exports if finance requires them before go-live. |
| UAT-6-004 | Medium | Email | Email module needs real-device mobile UAT with production-size inbox data. | Test inbox/detail/compose with seeded V2 email records and verified Resend sender. |
| UAT-6-005 | Medium | Validation | Some workflows use HTML validation plus database constraints instead of shared server schemas. | Add schema validation for customers, quotes, shipments, payments, expenses, and settings. |
| UAT-6-006 | Low | Live UAT | Full live authenticated UAT is pending approved auth provisioning and approved test data. | Run after CTO approves non-production UAT dataset or final migration rehearsal. |

## Closed During Sprint 6

| ID | Priority | Area | Issue | Resolution |
| --- | --- | --- | --- | --- |
| UAT-6-001 | High | Shipment items | Shipment item table existed but no app workflow created, edited, read, or displayed item rows. | Shipment items are now captured, persisted, replaced on edit, shown in staff/public UI, and included in public tracking JSON. |

## Guardrails Still Active

- Do not migrate production data until CTO approval.
- Do not modify the production database until final migration approval.
- Do not connect the live domain until cutover approval.
- Do not push Sprint 6 commit until CTO approval.
