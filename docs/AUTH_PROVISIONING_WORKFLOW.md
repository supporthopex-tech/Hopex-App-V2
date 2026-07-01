# Auth Provisioning Workflow

Sprint: 5 - High Priority Readiness Fixes
Date: 2026-07-01

## Guardrails

- Do not migrate passwords.
- Do not export password hashes.
- Do not insert users directly into production Auth during Sprint 5.
- Do not modify the production database.
- Use invite and reset-password flows only after final approval.

## Supported Provisioning Paths

### 1. Admin-Created Staff Invite

Use this for new or migrated staff who need portal access.

1. Confirm the staff record has a valid email address.
2. Assign a reviewed V2 role.
3. Assign any explicit staff permission overrides only when needed.
4. Use the staff invite action from Staff Management.
5. Supabase sends an invite or recovery-style link through the approved auth flow.
6. Staff member sets their own password.
7. Staff remains pending approval until an administrator activates the account.

### 2. Password Reset for Existing Auth User

Use this when a V2 Auth user exists but must set a fresh password.

1. Confirm the user belongs to the Hopex V2 company.
2. Use staff password reset or forgot-password flow.
3. Generate a time-limited Supabase recovery link.
4. Send the branded reset email through Resend.
5. User sets a new password.
6. Confirm login and company membership.

### 3. Controlled Admin Provisioning

Use this only for the first approved production administrator.

1. Create or invite the admin identity through Supabase Auth approved tooling.
2. Link `auth.users.id` to `company_users.user_id`.
3. Link the same user to the staff row when applicable.
4. Assign the Administrator or Super Admin role after owner approval.
5. Require immediate password setup through invite or reset link.

## Required Data Links

| Area | Required Link |
| --- | --- |
| Auth | `auth.users.id` |
| Company membership | `company_users.user_id`, `company_users.company_id`, active status |
| Staff profile | `staff.user_id`, active status, account status |
| Role | `company_users.role_id` |
| Overrides | `staff_permissions.staff_id`, reviewed permission IDs |

## Reset and Invite Flow

- Staff invite uses Supabase Auth invitation and stores the created user id on the staff row when available.
- Staff reset generates a Supabase recovery link and sends it by Resend.
- Forgot password generates a Supabase recovery link and sends it by Resend.
- All password creation is user-driven. No old password is copied into V2.

## Validation Checklist

- Auth user exists.
- `company_users.status = active` before login is considered ready.
- Staff status is not `pending_approval`, `rejected`, or `suspended`.
- Login succeeds at `/login`.
- User lands on `/dashboard`.
- User sees only allowed navigation.
- User can access expected modules.
- Password reset email is logged in `email_logs`.

## Rollback

- Suspend `company_users.status`.
- Suspend staff `status` and `account_status`.
- Revoke role or permission overrides.
- Do not delete users unless explicitly approved by the owner.
