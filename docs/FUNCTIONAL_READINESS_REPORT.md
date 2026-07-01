# Functional Readiness Report

Sprint: 4B - Functional Readiness Audit
Status: Audit complete; no Critical application-code fixes required
Date: 2026-07-01

## Guardrails

- No data migration was performed.
- No production database writes were performed.
- No live domain or production configuration changes were made.
- Audit scope was local source inspection, route/action/API review, and build verification.
- Existing Sprint 4 critical security migration remains a repository artifact only and was not applied remotely.

## Legend

- Yes: supported in the current app.
- Partial: supported with limits, configuration dependency, or post-migration validation required.
- No: not implemented as a first-class capability for that module.
- N/A: not applicable for the module.

## Functional Matrix

| Module | Create | Read | Update | Delete | UI Complete | Validation Complete | Permissions Correct | Reports Working | Export Working | Search Working | Mobile Responsive |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Login | N/A | Yes | Partial | N/A | Yes | Yes | Yes | N/A | N/A | N/A | Yes |
| Dashboard | N/A | Yes | N/A | N/A | Yes | N/A | Yes | Partial | N/A | N/A | Yes |
| Staff | Yes | Yes | Yes | Yes | Yes | Partial | Partial | N/A | Yes | Yes | Yes |
| Customers | Yes | Yes | Yes | Yes | Yes | Partial | Yes | Partial | Yes | Yes | Yes |
| Shipments | Yes | Yes | Yes | Yes | Yes | Partial | Yes | Partial | Yes | Yes | Yes |
| Shipment Tracking | N/A | Yes | Partial | N/A | Yes | Partial | Yes | N/A | Label only | Yes | Yes |
| Pricing | Yes | Yes | Yes | N/A | Yes | Partial | Yes | N/A | N/A | N/A | Yes |
| Quotes | Yes | Yes | Yes | Yes | Yes | Partial | Yes | Partial | Yes | Yes | Yes |
| Accounting | Yes | Yes | Yes | Partial | Yes | Yes | Yes | Yes | Report PDF | Partial | Yes |
| Expenses | Yes | Yes | Partial | No | Yes | Partial | Yes | Yes | Via reports | No | Yes |
| Payments | Yes | Yes | No | No | Yes | Partial | Yes | Yes | Via reports | No | Yes |
| Reports | N/A | Yes | N/A | N/A | Yes | N/A | Yes | Yes | PDF/print | Date filter | Yes |
| Documents | Yes | Yes | Partial | No | Partial | Yes | Yes | N/A | Label/PDF only | No | Yes |
| Notifications | Yes | Partial | Via settings | No | Partial | N/A | Yes | N/A | No | No | Yes |
| Email | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Logs | No CSV | Yes | Partial |
| Settings | Yes | Yes | Yes | N/A | Yes | Partial | Yes | N/A | N/A | N/A | Yes |
| User Roles | Yes | Yes | Partial | Yes | Yes | Partial | Yes | N/A | N/A | Yes | Yes |
| Permissions | Yes | Yes | Yes | Partial | Yes | Partial | Partial | N/A | N/A | Yes | Yes |

## Module Findings

### Login

- Login, forgot-password, reset-password, and auth callback flows are present.
- Password reset validates email input and reset password strength.
- Portal access checks require an active `company_users` row and reject suspended/rejected staff states.
- Production validation is blocked until Auth users are migrated or provisioned in V2.

Priority: High for post-migration login UAT, no Critical code issue.

### Dashboard

- Reads live tenant-scoped shipments, invoices, payments, expenses, staff, tasks, and audit logs.
- UI includes KPIs, revenue chart, shipment status summary, and recent activity.
- Mobile layout uses responsive grids.
- No create/update/delete actions are expected.

Priority: Low.

### Staff

- Create, read, update, suspend/activate, invite, reset password, delete, export, search, and mobile cards are present.
- Staff actions are server-side permission gated.
- Validation is mostly HTML/server presence checks; richer business validation is limited.
- Permission shortcut map assigns some keys such as `shipments.update`, `quotes.update`, `tasks.update`, and `reports.read`, while core app actions/routes expect `shipments.edit`, `quotes.edit`, `tasks.edit`, and `reports.view`.

Priority: High.

### Customers

- Create, read, update, VIP toggle, delete, export, search, and responsive card UI are present.
- Actions require `customers.create`, `customers.edit`, or `customers.delete`.
- Validation is partial: required name/company and email input type exist, but phone/country/customer type normalization is light.

Priority: Medium.

### Shipments

- Create, read, update, soft delete, status updates, labels, quote/invoice generation, import/export, document uploads, search, filters, and mobile cards are present.
- Pricing preview and server-side pricing calculations are integrated.
- Delete is soft-delete via `deleted_at`, which is appropriate for operations.
- Validation is partial: critical required fields exist, numeric constraints exist in UI, but business date/status transition rules are not fully enforced.

Priority: Medium.

### Shipment Tracking

- Public tracking page and public tracking API exist.
- Internal status updates and shipment events are present.
- Label/QR generation works through a protected API route.
- Public tracking writes tracking analytics via service role; this should be UAT-verified after production hardening.

Priority: Medium.

### Pricing

- Pricing is embedded in shipment create/edit flows.
- Supports pieces, weight, volume, fees, tax, discount, cost, margin, chargeable weight, and preview.
- No standalone pricing table/rate-card management UI was found.

Priority: Medium.

### Quotes

- Create, read, update, delete, status changes, convert to shipment, PDF, email/WhatsApp shortcuts, export, search, and mobile cards are present.
- Actions require quote permissions and conversion requires quote edit or shipment create permission.
- Validation is partial for amount/status normalization and full quote lifecycle rules.

Priority: Medium.

### Accounting

- Chart of accounts, manual journals, balanced journal validation, invoice create/update/post, payment posting, expense create/approve/pay, and audit notifications are present.
- Reports are driven by posted accounting data.
- Export is report/PDF-print oriented rather than CSV for ledgers.
- Delete/reversal workflows are intentionally limited.

Priority: Medium.

### Expenses

- Create, read, approve, and pay workflows are present.
- No first-class edit/delete expense workflow was found.
- Receipt attachment UI is mentioned but no dedicated expense receipt upload path was found.

Priority: Medium.

### Payments

- Create/read/post payment flow is present through transactional RPC.
- Reversal/delete UI was not found, despite payment descriptions mentioning reversals.
- Search/filter and export are not first-class on the payments page.

Priority: Medium.

### Reports

- Financial reports page is present.
- Protected report PDF/print route supports profit and loss, balance sheet, cash flow, trial balance, AR/AP aging, revenue by shipment, and expense report.
- Date filters are present.
- Depends on posted journal/accounting data.

Priority: Low.

### Documents

- Shipment document upload is present.
- Email attachments are present with MIME and size validation.
- Company logo/profile uploads are present.
- Dedicated document center, document search, and document delete/replace UX were not found.

Priority: Medium.

### Notifications

- Notifications are inserted by shipment, quote, task, staff, settings, accounting, and email actions.
- Notification settings UI exists.
- Dedicated notification inbox, search, read/unread, delete, or export UI was not found.

Priority: Medium.

### Email

- Compose, templates, drafts, sent, inbox, spam, trash, detail view, read/unread, move to trash, delete, attachments, logs, and search are present.
- Sending depends on Resend production environment variables and verified sender.
- Email module has responsive grid behavior, but three-pane mail layout should be manually checked on small mobile devices with real data.

Priority: High for production configuration/UAT, no Critical code issue.

### Settings

- Company, invoicing, my account, appearance, notifications, invite users, and language settings are present.
- Actions are permission gated where company-wide settings are modified.
- My-account and language updates correctly require authenticated tenant context.
- Validation is partial for URLs, phone, timezone, role ID, and invitation permissions.

Priority: Medium.

### User Roles

- Create role, delete role, and assign permissions are present.
- Role edit is limited to permission changes; role name/description edit UI was not found.
- System role deletion is disabled in UI.

Priority: Medium.

### Permissions

- Permission matrix and role assignment UI are present.
- Canonical seed migrations include action-specific permissions such as `shipments.edit`, `quotes.edit`, `customers.edit`, `tasks.edit`, `accounting.manage`, and `reports.view`.
- UI catalog also generates generic `*.read` and `*.update` keys that do not always match action checks.

Priority: High.

## Prioritized Issues

| ID | Priority | Status | Issue | Recommendation |
| --- | --- | --- | --- | --- |
| NONE | Critical | Not found | No Critical functional code issue was found during static Sprint 4B audit. | No automatic Critical fix applied. |
| PERM-4B-001 | High | Open | Staff permission shortcut map and role catalog contain keys that do not always match server action/API checks (`*.update` vs `*.edit`, `reports.read` vs `reports.view`). | Normalize permission catalog and staff shortcut mapping in a dedicated permissions hardening task. |
| AUTH-4B-001 | High | Open | V2 has no migrated/provisioned Auth users, so login cannot be end-to-end verified with real staff. | Validate immediately after approved auth migration or controlled admin provisioning. |
| EMAIL-4B-001 | High | Open | Email send/password reset/staff reset depend on `RESEND_API_KEY` and verified sender configuration. | Verify production env and sender before go-live. |
| MOBILE-4B-001 | Medium | Open | Email three-pane layout is responsive in CSS but needs real-device small-screen UAT with real message data. | Add mobile UAT checklist for email inbox/detail/compose. |
| DOC-4B-001 | Medium | Open | Documents exist as shipment/email/settings attachments, but there is no central Documents module with search/delete/export. | Decide whether Sprint 4 requires central document workspace or accepts embedded document management. |
| NOTIFY-4B-001 | Medium | Open | Notification writes/settings exist, but no notification inbox/read/delete/search workflow was found. | Add notification center or document that notifications are audit/system events only. |
| PAY-4B-001 | Medium | Open | Payments page does not expose reversal/delete/search/export controls. | Add reversal/search/export if required for finance operations. |
| EXP-4B-001 | Medium | Open | Expenses page does not expose edit/delete or receipt upload despite operational expectations. | Add controlled edit/delete/attachment workflow or document accounting lock policy. |
| SEARCH-4B-001 | Medium | Open | Global search inputs in app shell/mobile nav are visual only; module search exists in key modules. | Wire global search or remove visual affordance until implemented. |
| VALID-4B-001 | Medium | Open | Several forms rely on basic HTML validation and database constraints rather than shared server schemas. | Introduce zod schemas for high-risk create/update flows after Critical work. |
| EXPORT-4B-001 | Low | Open | Exports are strong for Staff, Customers, Shipments, Quotes, Reports; not first-class for Email, Notifications, Documents, Payments, Expenses. | Add exports based on operational need. |

## Critical Fixes Applied

No Critical Sprint 4B functional issues were found, so no application code was modified beyond this report.

## Verification Commands

Run after report generation:

```powershell
npm.cmd run lint
npm.cmd run build
```

## Readiness Decision

Sprint 4B is functionally ready for UAT, not final production launch. The application has broad CRUD/report/export/search/mobile coverage, but final readiness depends on resolving High permission alignment, verifying Auth users after migration/provisioning, validating Resend email delivery, and making product decisions on central Documents and Notifications workflows.

## Sprint 5 Resolution Notes

- `PERM-4B-001`: Fixed locally in Sprint 5. App permission checks now tolerate read/view and edit/update equivalents, while staff shortcut permissions and the role catalog use canonical V2 permission keys.
- `AUTH-4B-001`: Prepared in Sprint 5. See `docs/AUTH_PROVISIONING_WORKFLOW.md`; no passwords are migrated and no production Auth writes were performed.
- `EMAIL-4B-001`: Prepared in Sprint 5. See `docs/EMAIL_PRODUCTION_READINESS.md`; only variable names and sender requirements are documented.
- `DOC-4B-001`: Fixed locally in Sprint 5 with a central `/documents` module over existing shipment, quote, and email attachment tables.
- `NOTIFY-4B-001`: Fixed locally in Sprint 5 with a standalone `/notifications` inbox and read/unread/delete workflow.
- `SEARCH-4B-001`: Fixed locally in Sprint 5 with functional `/search` results and wired app-shell/mobile search forms.
