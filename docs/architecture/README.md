# Architecture Notes

Architecture documentation for Hopex App V2.

Current architecture:

- Next.js application hosted on Vercel.
- Supabase Auth, Postgres, Storage, and RLS.
- Single Hopex company deployment model.
- Old Hopex database remains read-only source for migration.

See `adr/` for accepted architecture decisions.
