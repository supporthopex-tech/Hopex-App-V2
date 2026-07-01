# Hopex App V2

Hopex Express Cargo / Hopex Delivery operations platform built from the Naro application base. This repository is the new Hopex V2 project only. The old live Hopex app and production database must remain read-only during migration and must not be modified by this codebase.

The application includes authentication, dashboard analytics, staff management, roles and permissions, customers, shipments, shipment documents, tracking updates, quotes, invoices, payments, expenses, accounting, reports, settings, notifications, public tracking, email templates, WhatsApp templates, and website quote requests.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Local shadcn-style UI primitives in `src/components/ui`
- Supabase Auth, PostgreSQL, Storage, RLS
- Dedicated Vercel project and Supabase project for Hopex V2

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env.local
```

3. Fill in the Hopex V2 Supabase values, the company ID, app URL, and allowed company website origins in `.env.local`.

4. Apply the database migrations to the new Hopex V2 Supabase project only:

```bash
supabase start
supabase db reset
```

5. Run the app:

```bash
npm run dev
```

Supabase keys are required. Without valid Supabase configuration, staff authentication is disabled.

## Supabase

The original schema migration is:

```text
supabase/migrations/202606160001_initial_multi_tenant_erp.sql
```

Later migrations enforce the dedicated deployment model. In particular, `20260622072729_enforce_single_company_deployment.sql` prevents a second company from being inserted and removes authenticated company creation. `company_id` remains on business records for ownership, audit, roles, and RLS; it does not mean this project should share data with the old Hopex production database.

After linking a real project, generate live database types:

```bash
npm run supabase:types
```

Then merge `database.generated.ts` into `src/lib/types/database.ts` or switch imports to the generated file.

## Hopex provisioning

Provision exactly one Hopex company row in `public.companies`, then configure:

```text
APP_COMPANY_ID
NEXT_PUBLIC_APP_URL
COMPANY_WEBSITE_ORIGINS
```

`APP_COMPANY_ID` is server-only and must match the Hopex company row in the new database. `COMPANY_WEBSITE_ORIGINS` is a comma-separated allowlist for websites that may call the public tracking and quote APIs.

The customer website can use:

```text
GET /api/public/track/{trackingNumber}
POST /api/public/quote-requests
```

Quote requests no longer accept or require a company slug; the deployment identifies the company.

## Resend email setup

Hopex V2 should use a verified Hopex Resend domain and API key. Configure these variables in `.env.local` and in the Hopex V2 Vercel project:

```text
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_FROM_NAME
COMPANY_NAME
COMPANY_LOGO_URL
COMPANY_PRIMARY_COLOR
```

The API key is server-only. `RESEND_FROM_EMAIL` must be a sender address from a verified Resend domain for production sending.

## Deployment

Deploy to Vercel as a standard Next.js project. Add all variables from `.env.example` to the Hopex V2 Vercel project and point only the new Supabase auth redirect URLs at the preview/production deployment. Do not connect the official Hopex domain until testing is complete.

## Verification

Current checks:

```bash
npm run lint
npm run build
```
