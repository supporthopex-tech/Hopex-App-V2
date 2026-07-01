alter table public.staff
  add column if not exists staff_id text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists position text,
  add column if not exists location text,
  add column if not exists join_date date,
  add column if not exists account_status text not null default 'not_invited',
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists notes text;

update public.staff
set staff_id = coalesce(staff_id, 'STF-' || substring(id::text from 1 for 8)),
    account_status = coalesce(account_status, 'not_invited')
where true;

create unique index if not exists staff_company_staff_id_idx on public.staff(company_id, staff_id);
create index if not exists staff_company_role_idx on public.staff(company_id, role_id);
create index if not exists staff_company_status_idx on public.staff(company_id, status);
create index if not exists staff_company_user_idx on public.staff(company_id, user_id);

alter table public.permissions
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.staff_permissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  enabled boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(staff_id, permission_id)
);

create or replace function public.user_has_permission(target_company_id uuid, permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_users cu
    join public.role_permissions rp on rp.role_id = cu.role_id and rp.company_id = cu.company_id
    join public.permissions p on p.id = rp.permission_id
    where cu.company_id = target_company_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
      and p.key = permission_key
  )
  or exists (
    select 1
    from public.staff s
    join public.staff_permissions sp on sp.staff_id = s.id and sp.company_id = s.company_id
    join public.permissions p on p.id = sp.permission_id
    where s.company_id = target_company_id
      and s.user_id = auth.uid()
      and s.status = 'active'
      and sp.enabled = true
      and p.key = permission_key
  )
$$;

insert into public.permissions (key, description)
values
  ('staff.view', 'View staff records'),
  ('staff.create', 'Create staff records'),
  ('staff.edit', 'Edit staff records'),
  ('staff.delete', 'Delete staff records'),
  ('staff.suspend', 'Suspend staff'),
  ('staff.activate', 'Activate staff'),
  ('staff.invite', 'Invite staff users'),
  ('staff.reset_password', 'Reset staff passwords'),
  ('staff.export', 'Export staff data'),
  ('roles.view', 'View roles and permissions'),
  ('roles.create', 'Create roles'),
  ('roles.edit', 'Edit roles'),
  ('roles.delete', 'Delete roles'),
  ('roles.assign_permissions', 'Assign role permissions')
on conflict (key) do update set description = excluded.description;

insert into public.permissions (key, description)
select resource || '.' || action, initcap(resource) || ' ' || action || ' permission'
from unnest(array[
  'dashboard','shipments','quotes','staff','customers','tasks','accounting','reports','settings','email','whatsapp','approvals'
]) as resource
cross join unnest(array['create','read','update','delete','approve','export']) as action
on conflict (key) do update set description = excluded.description;

do $$
declare
  target_table text;
begin
  foreach target_table in array array['staff_permissions']
  loop
    execute format('alter table public.%I enable row level security', target_table);
    if not exists (
      select 1 from pg_trigger where tgname = format('set_%s_updated_at', target_table)
    ) then
      execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', target_table, target_table);
    end if;
  end loop;
end $$;

drop policy if exists "staff tenant select" on public.staff;
drop policy if exists "staff tenant insert" on public.staff;
drop policy if exists "staff tenant update" on public.staff;
drop policy if exists "staff tenant delete" on public.staff;

create policy "staff permission select" on public.staff
for select using (
  public.user_has_permission(company_id, 'staff.view')
  or public.is_company_member(company_id)
);

create policy "staff permission insert" on public.staff
for insert with check (
  public.user_has_permission(company_id, 'staff.create')
  and created_by = auth.uid()
);

create policy "staff permission update" on public.staff
for update using (
  public.user_has_permission(company_id, 'staff.edit')
  or public.user_has_permission(company_id, 'staff.suspend')
  or public.user_has_permission(company_id, 'staff.activate')
) with check (
  public.user_has_permission(company_id, 'staff.edit')
  or public.user_has_permission(company_id, 'staff.suspend')
  or public.user_has_permission(company_id, 'staff.activate')
);

create policy "staff permission delete" on public.staff
for delete using (public.user_has_permission(company_id, 'staff.delete'));

drop policy if exists "staff_permissions tenant select" on public.staff_permissions;
drop policy if exists "staff_permissions tenant insert" on public.staff_permissions;
drop policy if exists "staff_permissions tenant update" on public.staff_permissions;
drop policy if exists "staff_permissions tenant delete" on public.staff_permissions;

create policy "staff permissions permission select" on public.staff_permissions
for select using (public.user_has_permission(company_id, 'staff.view'));
create policy "staff permissions permission insert" on public.staff_permissions
for insert with check (public.user_has_permission(company_id, 'staff.edit') and created_by = auth.uid());
create policy "staff permissions permission update" on public.staff_permissions
for update using (public.user_has_permission(company_id, 'staff.edit'))
with check (public.user_has_permission(company_id, 'staff.edit'));
create policy "staff permissions permission delete" on public.staff_permissions
for delete using (public.user_has_permission(company_id, 'staff.edit'));

drop policy if exists "roles tenant select" on public.roles;
drop policy if exists "roles tenant insert" on public.roles;
drop policy if exists "roles tenant update" on public.roles;
drop policy if exists "roles tenant delete" on public.roles;

create policy "roles permission select" on public.roles
for select using (public.user_has_permission(company_id, 'roles.view') or public.is_company_member(company_id));
create policy "roles permission insert" on public.roles
for insert with check (public.user_has_permission(company_id, 'roles.create') and created_by = auth.uid());
create policy "roles permission update" on public.roles
for update using (public.user_has_permission(company_id, 'roles.edit'))
with check (public.user_has_permission(company_id, 'roles.edit'));
create policy "roles permission delete" on public.roles
for delete using (public.user_has_permission(company_id, 'roles.delete') and is_system = false);

drop policy if exists "role_permissions tenant select" on public.role_permissions;
drop policy if exists "role_permissions tenant insert" on public.role_permissions;
drop policy if exists "role_permissions tenant update" on public.role_permissions;
drop policy if exists "role_permissions tenant delete" on public.role_permissions;

create policy "role permissions permission select" on public.role_permissions
for select using (public.user_has_permission(company_id, 'roles.view') or public.is_company_member(company_id));
create policy "role permissions permission insert" on public.role_permissions
for insert with check (public.user_has_permission(company_id, 'roles.assign_permissions') and created_by = auth.uid());
create policy "role permissions permission update" on public.role_permissions
for update using (public.user_has_permission(company_id, 'roles.assign_permissions'))
with check (public.user_has_permission(company_id, 'roles.assign_permissions'));
create policy "role permissions permission delete" on public.role_permissions
for delete using (public.user_has_permission(company_id, 'roles.assign_permissions'));

grant select, insert, update, delete on public.staff_permissions to authenticated;
grant select, insert, update, delete on public.role_permissions to authenticated;
grant select on public.permissions to authenticated;

insert into storage.buckets (id, name, public)
values ('staff-documents', 'staff-documents', false)
on conflict (id) do nothing;

drop policy if exists "staff documents storage read" on storage.objects;
create policy "staff documents storage read" on storage.objects
for select using (bucket_id = 'staff-documents' and auth.role() = 'authenticated');

drop policy if exists "staff documents storage write" on storage.objects;
create policy "staff documents storage write" on storage.objects
for insert with check (bucket_id = 'staff-documents' and auth.role() = 'authenticated');
