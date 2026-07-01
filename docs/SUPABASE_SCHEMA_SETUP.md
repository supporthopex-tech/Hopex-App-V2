# Hopex V2 Supabase Schema Setup

Target project only: `ozgeatgwgnpcfnzjhqit`

Do not run these migrations against the old Hopex production database.

## Required Environment

```text
NEXT_PUBLIC_SUPABASE_URL=https://ozgeatgwgnpcfnzjhqit.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_0ACSZ26ieSH6OwuKbHD7rQ_CWpzLDK6
APP_COMPANY_ID=6d19adf9-570f-46c3-8476-dfab624248b3
COMPANY_SLUG=hopex-express-cargo
COMPANY_NAME=Hopex Express Cargo
```

## Schema Coverage

The committed migrations provide:

- Companies / dedicated Hopex company record
- Profiles, company users, staff, roles, permissions, role permissions
- Customers and customer communications
- Shipments, shipment pricing, shipment status logs, shipment events, shipment documents
- Quotes, quote items, quote status logs, quote documents
- Invoices, payments, expenses, accounting periods, journal entries, journal lines, customer ledger
- Reports, tasks, approvals, notifications, audit logs
- Company settings, branding settings, invoice settings, email settings, WhatsApp settings
- Storage buckets for company assets, shipment documents, quote documents, staff documents, task attachments, email attachments, settings assets, onboarding/profile assets
- RLS policies and authenticated grants for app tables

## Apply Order

Run all files in `supabase/migrations` against the new Hopex V2 project in timestamp order.

The Hopex-specific additions are:

```text
202607010001_seed_hopex_v2_company.sql
202607010002_harden_storage_policies.sql
```

## Current Access Note

The project publishable key is configured locally and the Auth settings endpoint responds successfully. Applying SQL to the hosted project requires a service role key, database connection string, or working Supabase MCP SQL permission for the target project.

## Post-Apply Validation

Run:

```sql
select id, name, slug from public.companies where slug = 'hopex-express-cargo';
select name from public.roles where company_id = '6d19adf9-570f-46c3-8476-dfab624248b3';
select id, name, public from storage.buckets order by id;
```

Then invite/create Hopex users in the new Supabase Auth project and link them through `company_users` and `staff`.
