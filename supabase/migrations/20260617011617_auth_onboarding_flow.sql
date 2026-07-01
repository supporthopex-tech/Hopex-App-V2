alter table public.companies
  add column if not exists business_type text,
  add column if not exists company_size text,
  add column if not exists onboarding_completed_at timestamptz;

alter table public.company_settings
  add column if not exists onboarding_state jsonb not null default '{}',
  add column if not exists business_information jsonb not null default '{}',
  add column if not exists billing_preferences jsonb not null default '{}';

create table if not exists public.onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  current_step text not null default 'company',
  completed_steps jsonb not null default '[]',
  draft_data jsonb not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, user_id)
);

do $$
begin
  alter table public.onboarding_progress enable row level security;
  if not exists (select 1 from pg_trigger where tgname = 'set_onboarding_progress_updated_at') then
    create trigger set_onboarding_progress_updated_at before update on public.onboarding_progress for each row execute function public.set_updated_at();
  end if;
end $$;

drop policy if exists "onboarding own company select" on public.onboarding_progress;
drop policy if exists "onboarding own company insert" on public.onboarding_progress;
drop policy if exists "onboarding own company update" on public.onboarding_progress;
drop policy if exists "onboarding own company delete" on public.onboarding_progress;

create policy "onboarding own company select" on public.onboarding_progress
for select using (user_id = auth.uid() and public.is_company_member(company_id));

create policy "onboarding own company insert" on public.onboarding_progress
for insert with check (user_id = auth.uid() and created_by = auth.uid() and public.is_company_member(company_id));

create policy "onboarding own company update" on public.onboarding_progress
for update using (user_id = auth.uid() and public.is_company_member(company_id))
with check (user_id = auth.uid() and public.is_company_member(company_id));

create policy "onboarding own company delete" on public.onboarding_progress
for delete using (user_id = auth.uid() and public.is_company_member(company_id));

insert into storage.buckets (id, name, public)
values
  ('company-logos', 'company-logos', true),
  ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

drop policy if exists "onboarding public logo reads" on storage.objects;
create policy "onboarding public logo reads" on storage.objects
for select using (bucket_id in ('company-logos','profile-photos'));

drop policy if exists "onboarding authenticated logo writes" on storage.objects;
create policy "onboarding authenticated logo writes" on storage.objects
for insert with check (bucket_id in ('company-logos','profile-photos') and auth.role() = 'authenticated');

drop policy if exists "onboarding authenticated logo updates" on storage.objects;
create policy "onboarding authenticated logo updates" on storage.objects
for update using (bucket_id in ('company-logos','profile-photos') and auth.role() = 'authenticated')
with check (bucket_id in ('company-logos','profile-photos') and auth.role() = 'authenticated');

grant select, insert, update, delete on public.onboarding_progress to authenticated;
