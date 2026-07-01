-- Each Supabase project backs exactly one independently deployed company app.
-- company_id remains on business records for ownership, audit, and RLS clarity.

create or replace function private.enforce_single_company()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.companies where id <> new.id) then
    raise exception 'This database is configured for a single company deployment';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_single_company on public.companies;
create trigger enforce_single_company
before insert on public.companies
for each row execute function private.enforce_single_company();

-- The unique constant index is the concurrency-safe invariant. The trigger
-- above provides a clearer error before the constraint is reached.
create unique index if not exists companies_singleton_idx
on public.companies ((true));

-- Companies are provisioned with the deployment, never by public sign-up.
drop policy if exists "authenticated users can create companies" on public.companies;

revoke execute on function private.enforce_single_company() from public, anon, authenticated;

comment on table public.companies is
  'Single row company configuration for this dedicated deployment.';
comment on function private.enforce_single_company() is
  'Prevents a dedicated company database from accepting a second company.';
