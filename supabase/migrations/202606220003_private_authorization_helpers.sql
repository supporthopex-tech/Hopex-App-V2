create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_company_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select company_id from public.company_users where user_id = auth.uid() and status = 'active'
$$;

create or replace function private.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.company_users where user_id = auth.uid() and company_id = target_company_id and status = 'active')
$$;

create or replace function private.user_has_permission(target_company_id uuid, permission_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.company_users cu
    join public.role_permissions rp on rp.role_id = cu.role_id and rp.company_id = cu.company_id
    join public.permissions p on p.id = rp.permission_id
    where cu.company_id = target_company_id and cu.user_id = auth.uid() and cu.status = 'active' and p.key = permission_key
  ) or exists (
    select 1 from public.staff s
    join public.staff_permissions sp on sp.staff_id = s.id and sp.company_id = s.company_id
    join public.permissions p on p.id = sp.permission_id
    where s.company_id = target_company_id and s.user_id = auth.uid() and s.status = 'active' and sp.enabled = true and p.key = permission_key
  )
$$;

create or replace function public.current_company_ids()
returns setof uuid language sql stable security invoker set search_path = ''
as $$ select * from private.current_company_ids() $$;

create or replace function public.is_company_member(target_company_id uuid)
returns boolean language sql stable security invoker set search_path = ''
as $$ select private.is_company_member(target_company_id) $$;

create or replace function public.user_has_permission(target_company_id uuid, permission_key text)
returns boolean language sql stable security invoker set search_path = ''
as $$ select private.user_has_permission(target_company_id, permission_key) $$;

revoke execute on all functions in schema private from public, anon;
grant execute on function private.current_company_ids() to authenticated;
grant execute on function private.is_company_member(uuid) to authenticated;
grant execute on function private.user_has_permission(uuid,text) to authenticated;
grant execute on function public.current_company_ids() to authenticated;
grant execute on function public.is_company_member(uuid) to authenticated;
grant execute on function public.user_has_permission(uuid,text) to authenticated;

drop policy if exists "website tracking public insert" on public.website_tracking_events;
