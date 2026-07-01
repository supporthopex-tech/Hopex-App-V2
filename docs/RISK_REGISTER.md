# Risk Register

| Risk | Impact | Likelihood | Mitigation | Owner |
|---|---:|---:|---|---|
| Accidental write to old production database | High | Low | Treat old DB as read-only; use separate credentials and scripts | Migration lead |
| Duplicate records during migration | High | Medium | Use idempotent imports and validation queries | Migration lead |
| Missing staff/user links after Auth creation | Medium | Medium | Verify `auth.users`, `company_users`, and `staff` together | App lead |
| RLS blocks valid users | High | Medium | Test role permissions with real users before UAT | App lead |
| RLS exposes data unexpectedly | High | Low | Verify policies and anon REST results | App lead |
| Live domain connected too early | High | Low | Require release checklist approval | Project owner |
| Migration mapping mismatch | Medium | Medium | Run dry-run migration and review rejects | Migration lead |
| Missing rollback plan | High | Low | Document rollback before production migration | Project owner |
