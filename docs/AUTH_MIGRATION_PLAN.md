# Auth Migration Plan

Sprint: Sprint 3 Dry Run Migration
Status: Planning only

## Safety Rules

- Do not copy old password hashes.
- Do not export old auth secrets.
- Do not create production V2 users until the owner approves the staff list and roles.
- Staff business records may migrate only after a matching V2 Auth user exists.
- Administrator permissions require explicit approval.

## Known Old Auth Shape

Old source project: `exnxwhqolekycrblqchp`

| Source | Known Count | Migration Use |
| --- | ---: | --- |
| `auth.users` | 3 | Email/id inventory only. Passwords are not migrated. |
| `public.profiles` | 3 | Profile metadata reference only. |
| `app_records` / `Staff` | 1 | Staff metadata candidate. |
| `app_records` / `Staff_Member` | 2 | Staff metadata and permission candidate. |

## Target Auth Shape

New target project: `ozgeatgwgnpcfnzjhqit`

| Target Area | Purpose |
| --- | --- |
| Supabase Auth `auth.users` | Login identity. Must be created/invited in V2. |
| `public.profiles` | User profile metadata. |
| `public.company_users` | Membership in Hopex company. |
| `public.staff` | Staff business record. |
| `public.roles` | Role assignment. |
| `public.staff_permissions` | Optional per-staff permission overrides. |

## Migration Method

1. Export old auth inventory as email/id only.
2. Export old staff records from `app_records`.
3. Normalize staff emails to lowercase.
4. Ask owner to approve the final staff list and role mapping.
5. Create or invite users in V2 Supabase Auth.
6. Require password setup/reset through Supabase Auth email flow.
7. Match old staff rows to V2 Auth users by email.
8. Create/update `profiles`, `company_users`, and `staff` rows only for matched users.
9. Apply roles and permission overrides only after review.
10. Reject unmatched staff rows into the migration review report.

## Role Mapping Draft

| Old Role / Signal | Proposed V2 Role | Approval Needed |
| --- | --- | --- |
| `admin`, `administrator`, `ceo`, full module access | `Administrator` | Yes |
| operations, cargo, shipment, delivery modules | `Operations Staff` | Yes |
| accounting, finance, invoice, payment modules | `Accounting` | Yes |
| unknown role or mixed permissions | Manual review | Yes |

## Permission Mapping Rules

- Prefer seeded V2 role permissions over custom overrides.
- Use `staff_permissions` only for explicit exceptions.
- Unknown old module names must be rejected for review.
- No user gets Administrator by inference alone.
- Deactivated/disabled old users should not be invited unless the owner approves.

## Dry-Run Evidence Required

- Old auth users listed by email and old id.
- Old profile rows counted and reviewed.
- Old staff rows counted from `Staff` and `Staff_Member`.
- V2 Auth match report:
  - matched staff
  - missing V2 Auth user
  - duplicate email
  - role requires approval
- No password/hash output in any exported artifact.

## Sprint 4 Preconditions

- Owner-approved staff list.
- Owner-approved first administrator.
- V2 Auth users created or invited.
- Password reset/invite flow tested.
- Role mapping approved.
- Permission overrides approved.
- Staff dry-run has zero unresolved required-user rejects, or rejects are explicitly accepted.
