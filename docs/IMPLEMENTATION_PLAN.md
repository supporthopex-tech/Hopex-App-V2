# Implementation Plan

## Phase 1: Foundation

- Scaffold Next.js App Router with TypeScript and Tailwind.
- Add local shadcn-style primitives, theme tokens, dark mode, app shell, and responsive navigation.
- Add Supabase SSR/client helpers and production-safe authentication handling.

## Phase 2: Database and Security

- Create all required ERP tables.
- Keep `company_id`, `created_by`, `created_at`, and `updated_at` on business tables for ownership and audit.
- Enforce exactly one company per Supabase project while retaining RLS and staff RBAC.
- Add RBAC tables, audit logs, and storage buckets.

## Phase 3: Account Lifecycle

- Implement staff login using Supabase Auth.
- Provision the company and initial owner as part of each deployment.
- Disable public company registration and SaaS subscription gating.

## Phase 4: ERP Modules

- Implement dashboard metrics, date filters, revenue chart, shipment status summary, and recent activity.
- Add module pages for shipments, quotes, customers, staff, tasks, accounting, invoices, payments, expenses, approvals, email, WhatsApp, reports, and settings.
- Add create/detail flows for primary modules.

## Phase 5: Dedicated Deployment

- Create a separate Vercel and Supabase project for every customer.
- Configure `APP_COMPANY_ID`, the app URL, and the customer's allowed website origins.
- Connect public tracking and quote APIs to the customer's website.
- Verify lint and production build.

## Remaining Production Hardening

- Replace placeholder data calls with fully typed Supabase queries after the project is linked.
- Add server actions for all create/update/delete forms.
- Add PDF generation, email provider calls, WhatsApp provider calls, and QR image generation.
- Add unit/e2e tests and Supabase RLS tests against a linked project.
