# ADR-001: Single-Tenant Architecture

## Status

Accepted

## Context

Hopex App V2 is intended to run as a dedicated deployment for Hopex Express Cargo. Although tables include `company_id`, the current production target is a single Hopex company deployment.

## Decision

Use a single-tenant deployment model with one Hopex company row and company-scoped records.

## Consequences

- Simpler operational isolation.
- Lower risk of cross-company data exposure.
- Migrations can target one company ID.
- `company_id` remains useful for RLS, audit, and future flexibility.
