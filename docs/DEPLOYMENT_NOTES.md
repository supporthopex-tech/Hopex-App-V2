# Hopex App V2 Deployment Notes

New GitHub repository:

```text
https://github.com/supporthopex-tech/Hopex-App-V2.git
```

New Vercel project:

```text
https://vercel.com/supporthopex-4571s-projects/hopex-app-v2
```

## Vercel Environment Variables

Add these to Preview and Production environments before deploying:

```text
NEXT_PUBLIC_SUPABASE_URL=https://ozgeatgwgnpcfnzjhqit.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_0ACSZ26ieSH6OwuKbHD7rQ_CWpzLDK6
APP_COMPANY_ID=6d19adf9-570f-46c3-8476-dfab624248b3
NEXT_PUBLIC_APP_URL=<vercel-preview-or-production-url>
COMPANY_WEBSITE_ORIGINS=<allowed-preview-and-website-origins>
NEXT_PUBLIC_COMPANY_SLUG=hopex-express-cargo
COMPANY_SLUG=hopex-express-cargo
COMPANY_NAME=Hopex Express Cargo
COMPANY_LOGO_URL=/company-logo.svg
COMPANY_PRIMARY_COLOR=#0f766e
RESEND_API_KEY=<hopex-resend-api-key>
RESEND_FROM_EMAIL=support@hopexgroup.co.tz
RESEND_FROM_NAME=Hopex Express Cargo
SUPABASE_SERVICE_ROLE_KEY=<new-hopex-v2-service-role-key>
```

Do not add old Hopex production database credentials to this project.

## Deployment Order

1. Apply migrations to the new Hopex V2 Supabase project only.
2. Create/invite admin and staff users in the new Supabase Auth project.
3. Link users to `company_users` and `staff`.
4. Add Vercel environment variables.
5. Push to GitHub.
6. Deploy Vercel preview.
7. Complete `docs/TESTING_CHECKLIST.md`.
8. Only after approval, consider production promotion.

## Current Vercel Access Status

The local Vercel CLI session is authenticated, but it currently lists only the `twiga-cargo-s-projects` team. It cannot access the requested `supporthopex-4571s-projects` scope from this machine/session yet.

Required next action: authenticate Vercel CLI with an account that has access to `supporthopex-4571s-projects`, then run:

```bash
npx vercel link --yes --project hopex-app-v2 --scope supporthopex-4571s-projects
```

## Domain Rule

Do not connect the official Hopex domain yet. Use the Vercel preview URL for testing.

## Local Verification Commands

```bash
npm install
npm run lint
npm run build
npm run dev
```
