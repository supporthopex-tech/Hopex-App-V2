# Sprint Prompt Template

Use this template to start a controlled Hopex App V2 sprint.

```text
Act as a Senior Full-Stack Engineer for Hopex App V2.

Sprint:
Objective:
Scope:
Out of scope:

Safety:
- Do not touch old Hopex production app.
- Do not write to old Hopex production database.
- Do not connect live domain.
- Stop before destructive actions and provide rollback plan.

Required verification:
- npm run lint
- npm run build
- Local runtime check
- Supabase/RLS checks if database is touched

Deliverables:
- Summary
- Files changed
- Tests run
- Remaining blockers
```
