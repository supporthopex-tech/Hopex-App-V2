# Hopex V2 Bug Fix Report

## Fixed in This Setup Pass

- Cloned the empty Hopex App V2 repository and populated it with the Naro-based application without touching the old Hopex app.
- Added Hopex V2 environment configuration using the new Supabase project URL and publishable key.
- Rebranded core app metadata, login copy, logo asset, email defaults, and public API fallback email values for Hopex Express Cargo.
- Added Hopex company seed migration with roles, permissions, settings, invoice prefixes, branding, email templates, and WhatsApp templates.
- Added hardened storage policy migration using explicit `TO authenticated` policies.
- Added safe migration scripts with read-only source export, staging import, logs, rejections, and validation.
- Hardened old JSON numeric/date conversion in the migration import script so malformed legacy values do not crash the whole import.
- Aligned the import script with the actual Naro schema columns for customers, shipments, and invoices.
- Removed non-existent permission keys from Hopex role provisioning and mapped Operations/Accounting roles to real permissions.

## Known Blockers / Not Yet Applied Live

- Hosted Supabase SQL changes were not applied from this session because the currently available SQL tool returned a permission error. A service role key, direct database connection string, or refreshed Supabase MCP SQL permission is required.
- Vercel environment variables still need to be added to the Hopex App V2 project in Vercel before preview deployment. The current Vercel CLI session is authenticated to a different visible scope and could not access `supporthopex-4571s-projects`.
- Full functional QA requires valid Hopex V2 Auth users in the new Supabase project.

## Safety Confirmation

No old Hopex production files, production deployment settings, production domain, or old production database writes are part of this setup pass.
