# App Readiness Audit

Sprint: 4 - Application Readiness
Status: Critical fixes complete in repository, not applied to production
Date: 2026-07-01

## Scope and Guardrails

- No production data migration was performed.
- No production database writes were performed.
- No live domain changes were made.
- Existing features were preserved.
- Supabase checks were read-only metadata, inventory, advisor, and row-count validation.

## Verification Summary

| Check | Result |
| --- | --- |
| `npm.cmd run lint` before Sprint 4 fix | Passed |
| `npm.cmd run build` before Sprint 4 fix | Passed |
| App routes inspected | Passed |
| Server actions authorization scan | Passed with notes |
| Protected API authorization scan | Passed with notes |
| Supabase public/auth/storage inventory | Passed with risks |
| Storage bucket inventory | Passed |
| Critical fix implemented in repo | Passed |
| Production database modified | No |

## Supabase Read-Only Findings

| Area | Result |
| --- | --- |
| Auth users | 0 users in target V2 |
| Public tables | 83 |
| Auth tables | 23 |
| Storage tables | 8 |
| Seed data | 1 company, 3 roles, 140 permissions, 178 role permissions |
| Business data | Empty, expected before final migration |
| RLS tables without policies | `api_idempotency_keys`, `api_rate_limits` |
| Critical advisor finding | `public.rls_auto_enable()` is `SECURITY DEFINER` and executable by `anon` and `authenticated` |
| Broad Data API grants | `anon` and `authenticated` have table grants on 81 public tables; safety depends on RLS policies |

## Storage Inventory

| Bucket | Public | Objects | Readiness |
| --- | --- | ---: | --- |
| `company-assets` | Yes | 0 | Ready, pending migrated assets |
| `company-logos` | Yes | 0 | Ready, pending migrated assets |
| `profile-images` | Yes | 0 | Ready, pending migrated assets |
| `profile-photos` | Yes | 0 | Ready, pending migrated assets |
| `email-attachments` | No | 0 | Ready, pending migrated assets |
| `quote-documents` | No | 0 | Ready, pending migrated assets |
| `settings-assets` | No | 0 | Ready, pending migrated assets |
| `shipment-documents` | No | 0 | Ready, pending migrated assets |
| `staff-documents` | No | 0 | Ready, pending migrated assets |
| `task-attachments` | No | 0 | Ready, pending migrated assets |

## Module Readiness

| Module | Status | Evidence | Priority |
| --- | --- | --- | --- |
| Authentication | Needs improvement | Login/register/reset routes build; tenant context validates Supabase user and company membership. Target V2 has 0 auth users, and a live security-definer RPC exposure was found. | Critical |
| Dashboard | Working correctly | `/dashboard` builds and reads tenant-scoped KPI, audit, shipment, and accounting summaries. | Low |
| Staff | Needs improvement | Staff CRUD/invite actions are permission-gated, but target auth/staff data is empty until migration. | High |
| Customers | Working correctly | Customer list/detail/create/edit/delete and export routes are present and permission-gated. | Low |
| Shipments | Working correctly | Shipment CRUD, status events, labels, documents, invoices, quotes, import/export, and notifications are wired and permission-gated. | Low |
| Shipment Tracking | Working correctly | Public tracking route and API exist; internal shipment timeline is built. | Low |
| Quotes | Working correctly | Quote CRUD, public quote request, PDF/export, and conversion to shipment are present and permission-gated. | Low |
| Pricing | Working correctly | Shipment pricing calculator is used by create/edit flows and preview UI. | Low |
| Accounting | Working correctly | Chart accounts, journals, invoices, payments, expenses, and reports build; transactional posting functions are protected in app code. | Medium |
| Expenses | Working correctly | Expense create/approve/pay flows are present through accounting actions with permission gates. | Low |
| Payments | Working correctly | Payment creation and posting flows are present with permission gates. | Low |
| Reports | Working correctly | Reports page and protected PDF export route build and authorize `reports.view`. | Low |
| Notifications | Needs improvement | Notification inserts are wired for shipment, quote, task, staff, and settings actions; production delivery behavior still needs UAT with migrated users. | Medium |
| Documents | Needs improvement | Shipment documents and storage buckets are present; target storage has 0 objects until migration. | Medium |
| Storage | Needs improvement | Buckets exist and hardened policy migrations are present; live validation should be repeated after the critical RPC revocation is applied. | High |
| Search | Needs improvement | Module-level search exists for shipments, customers, quotes, tasks, packing lists, and email; app-shell global search input is visual only. | Medium |
| Settings | Working correctly | Company, invoicing, appearance, notifications, invite-users, language, roles, and permissions routes build; sensitive actions are permission-gated. | Low |
| User Roles | Working correctly | Role management routes/actions exist and require `settings.manage_users`. | Low |
| Permissions | Needs improvement | Permission matrix is present and seeded; broad Data API table grants require continued RLS verification before final migration. | High |
| Audit Logs | Working correctly | Audit inserts are wired across operational actions and dashboard reads recent audit activity. | Low |
| Email | Needs improvement | Email compose/logs/templates and Resend integration are present; production readiness depends on verified `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. | High |

## Prioritized Issues

| ID | Priority | Status | Issue | Resolution |
| --- | --- | --- | --- | --- |
| SEC-001 | Critical | Fixed in repo | Live V2 exposes `public.rls_auto_enable()` as a zero-argument `SECURITY DEFINER` function executable by `anon` and `authenticated`. | Added `supabase/migrations/202607010006_revoke_public_rls_auto_enable_execute.sql` to revoke public, anon, and authenticated execute grants and keep service-role execution only. Not applied to production. |
| AUTH-001 | High | Open | Target V2 has 0 Auth users and 0 company users, so real login cannot be production-validated until final auth migration or controlled user provisioning. | Execute approved auth migration plan in final migration window. |
| SEC-002 | High | Open | `anon` and `authenticated` have broad grants on 81 public tables. This can be acceptable with strict RLS but increases validation burden. | Re-run Supabase advisors and RLS policy audit after applying SEC-001 and before final migration. |
| EMAIL-001 | High | Open | Resend email delivery requires verified production `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. | Validate Vercel production env and verified sender before go-live. |
| STORAGE-001 | High | Open | Storage buckets exist but contain 0 objects; document/avatar/logo behavior needs post-migration UAT. | Run storage migration and signed/public URL verification in Sprint 4 UAT. |
| SEARCH-001 | Medium | Open | Global app-shell search input has no routed global search behavior. | Either wire global search or intentionally scope Sprint 4 search readiness to module-level search. |
| API-001 | Medium | Open | `api_idempotency_keys` and `api_rate_limits` have RLS enabled with no policies. They are intended service-role tables, but advisor flags them. | Confirm service-role-only function usage and document accepted risk or add explicit restrictive policies. |
| NOTIFY-001 | Medium | Open | Notifications are recorded but not fully end-to-end validated with real migrated recipients. | Validate with migrated staff/users in UAT. |
| DX-001 | Low | Open | Protected API routes duplicate auth checks after `authorizeApi()`. | Clean up after readiness if desired; no behavioral blocker. |

## Critical Fix Verification Plan

The Critical fix is intentionally a migration artifact only. It has not been applied to the remote database because Sprint 4 forbids production database writes.

After an approved database-change window, apply the migration and verify:

```sql
select n.nspname as schema_name,
       p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as args,
       p.prosecdef as security_definer,
       array_agg(distinct r.rolname order by r.rolname)
         filter (where has_function_privilege(r.oid, p.oid, 'EXECUTE')) as executable_by
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
left join pg_roles r on r.rolname in ('anon','authenticated','service_role','postgres')
where n.nspname = 'public' and p.proname = 'rls_auto_enable'
group by n.nspname, p.proname, p.oid, p.prosecdef;
```

Expected result: `anon` and `authenticated` are absent from `executable_by`.

## Sprint 4 Acceptance Criteria

- Lint passes after Critical fixes.
- Build passes after Critical fixes.
- No production database writes are performed during readiness audit.
- `docs/APP_READINESS_AUDIT.md` records module-by-module status.
- All Critical issues are either fixed in repository artifacts or explicitly blocked by no-production-write guardrails.
- High/Medium/Low issues remain documented for Sprint 4 UAT and Sprint 5 final migration readiness.

## Sprint 4 Readiness Decision

Sprint 4 can proceed to UAT after the Critical migration artifact is reviewed. The application code builds and core modules are wired, but final production readiness still depends on approved application of the security migration, auth/user migration, email environment validation, storage object migration, and post-migration UAT.
