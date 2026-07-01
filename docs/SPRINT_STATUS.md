# Sprint Status

## Completed

### Sprint 1: Infrastructure and App Setup

- GitHub repository connected.
- Vercel project connected.
- `.env.local` configured for local verification.
- `npm install`, `npm run lint`, and `npm run build` passed.
- Local runtime verified.

### Sprint 2: Database Schema Preparation

- Migrations applied to the new Supabase project only.
- Core tables, RLS, permissions, roles, storage buckets, indexes, triggers, and functions verified.
- Hopex company seed and initial system settings created.
- Production business data remains unmigrated.

### Sprint 3A: Planning and Static Validation

- Status: Completed.
- Existing migration planning docs and dry-run scripts were completed and improved.
- No production migration was executed.
- No old production writes were performed.

### Sprint 3B: Dry Run Execution

- Status: Completed.
- Read-only source and target aggregate inspection completed.
- Source rows, schema shape, mappings, storage, auth readiness, duplicate checks, nullable checks, enum/status checks, and FK validation were reviewed.
- Target transform rollback script was not executed because Sprint 3B explicitly disallowed inserting data into V2 and no reviewed staging export has been loaded.

### Sprint 3: Dry Run Migration

- Status: Completed.
- Sprint 3A and Sprint 3B approved.
- Dry-run planning, static validation, read-only database inspection, and CTO reports completed.
- No final production business-data migration was executed.
- No old production writes were performed.
- No live domain was connected.

## Current

- Sprint 5 high priority readiness fixes are completed locally and pending approval to push.
- Sprint 4 and Sprint 4B were completed and pushed to GitHub.
- Sprint 5 completed permission alignment, auth provisioning preparation, email readiness documentation, central documents, standalone notifications, and functional global search.
- `npm.cmd run lint` and `npm.cmd run build` passed after Sprint 5 fixes.

## Blocked / Not Started

- Final production data migration.
- Live domain connection.
- Production cutover.
