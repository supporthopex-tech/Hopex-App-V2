# Sprint 3 Acceptance Criteria

Sprint: Sprint 3 Dry Run Migration
Status: Planning and dry-run evidence only

## Required Deliverables

- [ ] Source schema inventory captured from `exnxwhqolekycrblqchp` using read-only SQL.
- [ ] Target schema snapshot captured from `ozgeatgwgnpcfnzjhqit` using read-only SQL.
- [ ] Table-by-table comparison documented.
- [ ] Column-by-column inventory available for source and target.
- [ ] Index comparison available for source and target.
- [ ] Constraint comparison available for source and target.
- [ ] Foreign-key comparison available for source and target.
- [ ] Row-count comparison produced by source entity and target table.
- [ ] Column-level migration mapping reviewed.
- [ ] Storage bucket and object inventory captured.
- [ ] Auth migration plan reviewed.
- [ ] Dry-run transformation script run only against target staging and rolled back.
- [ ] Reject report reviewed.
- [ ] Duplicate report reviewed.
- [ ] Target collision report reviewed.
- [ ] Rollback plan reviewed.
- [ ] Sprint 4 blockers listed.

## Safety Acceptance

- [ ] No production migration performed.
- [ ] No old production writes performed.
- [ ] No source DDL performed.
- [ ] No source storage objects modified.
- [ ] No live domain connected.
- [ ] No secrets committed.
- [ ] No exported production data committed.
- [ ] No commit or push performed during Sprint 3 documentation work unless separately approved.

## Sprint 4 Gate

Sprint 4 can be considered only after:

- Dry-run output is complete and reviewed.
- Owner approves optional history policy.
- Owner approves auth/staff role mapping.
- Owner approves storage migration scope.
- Owner approves currency treatment.
- Production migration window is approved.
- Rollback SQL is prepared from a real batch id design.
