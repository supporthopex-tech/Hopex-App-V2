# Decision Log

| Date | Decision | Rationale | Status |
|---|---|---|---|
| 2026-07-01 | Use Naro-based app as Hopex App V2 base | Faster delivery while preserving cargo/ERP workflows already present in the app | Accepted |
| 2026-07-01 | Keep old Hopex production database read-only | Prevent accidental damage during migration | Accepted |
| 2026-07-01 | Use new Supabase project as migration target | Isolates V2 preparation from production | Accepted |
| 2026-07-01 | Seed only system records before migration | Avoid mixing setup with production business data | Accepted |
| 2026-07-01 | Delay live domain connection | Preview and UAT must pass first | Accepted |

## Pending Decisions

- Final production migration window.
- Staff/admin user creation and permission assignment.
- Live domain cutover date.
- Rollback owner and approval chain.
