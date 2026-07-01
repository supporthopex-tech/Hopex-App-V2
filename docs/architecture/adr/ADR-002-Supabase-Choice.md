# ADR-002: Supabase Choice

## Status

Accepted

## Context

Hopex App V2 requires authentication, relational data, row-level security, storage buckets, and a migration-friendly SQL database.

## Decision

Use Supabase for Auth, Postgres, Storage, RLS policies, database functions, and migration target infrastructure.

## Consequences

- RLS becomes a required security gate.
- Storage policies must be verified separately from table policies.
- Environment variables must never expose service role keys to the browser.
- The old Hopex database remains a read-only source; new Supabase is the write target.
