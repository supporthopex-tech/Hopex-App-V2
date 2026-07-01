# Release Checklist

## Before Preview Release

- Confirm GitHub branch is clean.
- Confirm Vercel preview deploy succeeds.
- Confirm required environment variables are set in Vercel.
- Confirm Supabase Auth works.
- Confirm seeded Hopex company exists.
- Confirm admin user is linked to `company_users` and `staff`.
- Run smoke tests for login, dashboard, staff, shipments, customers, invoices, reports, and settings.

## Before Production Migration

- Complete Sprint 3 dry-run migration.
- Review migration reject report.
- Confirm old database backup/read-only export.
- Confirm rollback plan.
- Get explicit approval.

## Before Live Domain Cutover

- Complete UAT.
- Verify Vercel production deployment.
- Verify Supabase redirect URLs.
- Confirm DNS rollback plan.
- Confirm support contacts and monitoring plan.
