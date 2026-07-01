alter table public.companies
  add column if not exists slogan text,
  add column if not exists primary_color text;

update public.companies
set primary_color = coalesce(primary_color, theme_color, '#2563eb')
where primary_color is null;

alter table public.profiles
  add column if not exists company_id uuid references public.companies(id) on delete cascade,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.staff
  add column if not exists profile_photo_url text,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_by uuid references auth.users(id) on delete set null,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text;

alter table public.shipments
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null,
  add column if not exists tracking_access_count integer not null default 0,
  add column if not exists last_tracked_at timestamptz;

create table if not exists public.approval_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  approval_id uuid references public.approvals(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  action text not null check (action in ('submitted','approved','rejected')),
  reason text,
  actor_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_tracking_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  shipment_id uuid references public.shipments(id) on delete cascade,
  tracking_number text not null,
  visitor_ip text,
  user_agent text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.password_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.permissions (key, description)
values
  ('approvals.view', 'View staff account approvals'),
  ('approvals.approve', 'Approve staff accounts'),
  ('approvals.reject', 'Reject staff accounts'),
  ('settings.manage_branding', 'Manage company branding'),
  ('settings.manage_profile', 'Manage own profile'),
  ('auth.change_password', 'Change own password'),
  ('website.track', 'Use public shipment tracking API'),
  ('website.quote_request', 'Create public quote requests')
on conflict (key) do update set description = excluded.description;

do $$
declare
  target_table text;
begin
  foreach target_table in array array['approval_history','website_tracking_events','password_audit_logs']
  loop
    execute format('alter table public.%I enable row level security', target_table);
    if not exists (select 1 from pg_trigger where tgname = format('set_%s_updated_at', target_table)) then
      execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', target_table, target_table);
    end if;
  end loop;
end $$;

drop policy if exists "approval_history tenant select" on public.approval_history;
drop policy if exists "approval_history tenant insert" on public.approval_history;
drop policy if exists "approval_history tenant update" on public.approval_history;
drop policy if exists "approval_history tenant delete" on public.approval_history;

create policy "approval history permission select" on public.approval_history
for select using (public.user_has_permission(company_id, 'approvals.view') or public.is_company_member(company_id));
create policy "approval history permission insert" on public.approval_history
for insert with check ((public.user_has_permission(company_id, 'approvals.approve') or public.user_has_permission(company_id, 'approvals.reject') or public.user_has_permission(company_id, 'staff.create')) and created_by = auth.uid());
create policy "approval history permission update" on public.approval_history
for update using (false) with check (false);
create policy "approval history permission delete" on public.approval_history
for delete using (false);

drop policy if exists "website tracking tenant select" on public.website_tracking_events;
drop policy if exists "website tracking tenant insert" on public.website_tracking_events;

create policy "website tracking member select" on public.website_tracking_events
for select using (company_id is not null and public.is_company_member(company_id));
create policy "website tracking public insert" on public.website_tracking_events
for insert with check (true);

drop policy if exists "password audit tenant select" on public.password_audit_logs;
drop policy if exists "password audit tenant insert" on public.password_audit_logs;

create policy "password audit own select" on public.password_audit_logs
for select using (user_id = auth.uid() or (company_id is not null and public.is_company_member(company_id)));
create policy "password audit own insert" on public.password_audit_logs
for insert with check (user_id = auth.uid() and created_by = auth.uid());

drop policy if exists "profile images read" on storage.objects;
create policy "profile images read" on storage.objects
for select using (bucket_id in ('profile-images','company-assets'));

drop policy if exists "profile images write" on storage.objects;
create policy "profile images write" on storage.objects
for insert with check (bucket_id in ('profile-images','company-assets') and auth.role() = 'authenticated');

drop policy if exists "profile images update" on storage.objects;
create policy "profile images update" on storage.objects
for update using (bucket_id in ('profile-images','company-assets') and auth.role() = 'authenticated')
with check (bucket_id in ('profile-images','company-assets') and auth.role() = 'authenticated');

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

grant select, insert, update, delete on public.approval_history to authenticated;
grant select, insert on public.website_tracking_events to anon, authenticated;
grant select, insert on public.password_audit_logs to authenticated;
