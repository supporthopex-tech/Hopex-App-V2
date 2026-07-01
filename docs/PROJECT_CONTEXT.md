# Hopex App V2 Project Context

Hopex App V2 is the new Naro-based operations platform for Hopex Express Cargo / Hopex Delivery.

## Current Status

- Sprint 1 completed: infrastructure, GitHub, Vercel, Supabase connection, local install, local build, and local runtime verification.
- Sprint 2 completed: new Supabase database schema, RLS, roles, permissions, storage buckets, settings, and Hopex company seed.
- Current sprint: Sprint 3 Dry Run Migration.
- The old Hopex production database is a read-only source.
- The new Hopex V2 Supabase project is the target.
- No final production business-data migration has been run.
- No live Hopex domain has been connected.

## Safety Boundary

Do not modify the old Hopex production application or database. Any destructive action requires explicit approval, a written rollback plan, and verification that the target is the new Hopex V2 project.
