create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  theme_color text not null default '#2563eb',
  currency text not null default 'USD',
  timezone text not null default 'UTC',
  address text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, name)
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(role_id, permission_id)
);

create table public.company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid references public.roles(id) on delete set null,
  status text not null default 'active' check (status in ('invited','active','suspended','removed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, user_id)
);

create or replace function public.current_company_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.company_users
  where user_id = auth.uid()
    and status = 'active'
$$;

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_users
    where user_id = auth.uid()
      and company_id = target_company_id
      and status = 'active'
  )
$$;

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  monthly_price numeric(12,2) not null default 0,
  currency text not null default 'USD',
  stripe_price_id text,
  features jsonb not null default '[]',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  status text not null default 'trial' check (status in ('trial','active','past_due','cancelled','expired')),
  provider text not null default 'stripe',
  provider_customer_id text,
  provider_subscription_id text,
  current_period_end timestamptz,
  monthly_price numeric(12,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  company_name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  balance numeric(12,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  department text,
  role_id uuid references public.roles(id) on delete set null,
  status text not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  tracking_number text not null,
  origin text not null,
  destination text not null,
  cargo_details text,
  weight numeric(12,2),
  dimensions jsonb not null default '{}',
  price numeric(12,2) not null default 0,
  status text not null default 'booked',
  documents jsonb not null default '[]',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, tracking_number)
);

create table public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  event_type text not null,
  status text,
  notes text,
  location text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  origin text,
  destination text,
  amount numeric(12,2) not null default 0,
  status text not null default 'draft',
  pdf_url text,
  converted_shipment_id uuid references public.shipments(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  shipment_id uuid references public.shipments(id) on delete set null,
  invoice_number text not null,
  amount numeric(12,2) not null default 0,
  status text not null default 'draft',
  due_date date,
  pdf_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, invoice_number)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  amount numeric(12,2) not null default 0,
  method text,
  reference text,
  status text not null default 'pending',
  paid_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  vendor text not null,
  category text,
  amount numeric(12,2) not null default 0,
  status text not null default 'pending',
  paid_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  assignee_id uuid references public.staff(id) on delete set null,
  priority text not null default 'medium',
  due_date date,
  status text not null default 'open',
  comments jsonb not null default '[]',
  attachments jsonb not null default '[]',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  approval_type text not null,
  reference_table text,
  reference_id uuid,
  status text not null default 'pending',
  comments jsonb not null default '[]',
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  before jsonb,
  after jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  email_templates jsonb not null default '[]',
  whatsapp_templates jsonb not null default '[]',
  integrations jsonb not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.email_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  recipient text not null,
  subject text not null,
  body text,
  status text not null default 'draft',
  provider_message_id text,
  sent_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  phone text not null,
  template_name text,
  message text,
  status text not null default 'queued',
  provider_message_id text,
  sent_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  report_type text not null,
  filters jsonb not null default '{}',
  data jsonb not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.company_users(user_id, company_id);
create index on public.shipments(company_id, status);
create index on public.quotes(company_id, status);
create index on public.invoices(company_id, status);
create index on public.tasks(company_id, status);

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'companies','profiles','roles','permissions','role_permissions','company_users','plans','subscriptions',
    'customers','staff','shipments','shipment_events','quotes','invoices','payments','expenses','tasks',
    'approvals','notifications','audit_logs','company_settings','email_messages','whatsapp_messages','reports'
  ]
  loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', target_table, target_table);
    execute format('alter table public.%I enable row level security', target_table);
  end loop;
end $$;

create policy "profiles own record" on public.profiles
for all using (id = auth.uid()) with check (id = auth.uid());

create policy "company members can read companies" on public.companies
for select using (public.is_company_member(id));
create policy "authenticated users can create companies" on public.companies
for insert with check (auth.uid() = created_by);
create policy "company members can update companies" on public.companies
for update using (public.is_company_member(id)) with check (public.is_company_member(id));

create policy "company users visible to members" on public.company_users
for select using (public.is_company_member(company_id));
create policy "company users manageable by members" on public.company_users
for all using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));

create policy "plans readable" on public.plans for select using (true);

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'roles','role_permissions','subscriptions','customers','staff','shipments','shipment_events','quotes',
    'invoices','payments','expenses','tasks','approvals','notifications','audit_logs','company_settings',
    'email_messages','whatsapp_messages','reports'
  ]
  loop
    execute format('create policy "%I tenant select" on public.%I for select using (public.is_company_member(company_id))', target_table, target_table);
    execute format('create policy "%I tenant insert" on public.%I for insert with check (public.is_company_member(company_id) and created_by = auth.uid())', target_table, target_table);
    execute format('create policy "%I tenant update" on public.%I for update using (public.is_company_member(company_id)) with check (public.is_company_member(company_id))', target_table, target_table);
    execute format('create policy "%I tenant delete" on public.%I for delete using (public.is_company_member(company_id))', target_table, target_table);
  end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant select on public.plans to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

insert into public.plans (name, slug, monthly_price, currency, features)
values
  ('Starter', 'starter', 99, 'USD', '["Shipments","Quotes","Customers"]'),
  ('Growth', 'growth', 249, 'USD', '["ERP accounting","Approvals","Reports","Email","WhatsApp"]'),
  ('Enterprise', 'enterprise', 499, 'USD', '["Custom pricing","Dedicated integrations","Advanced controls"]')
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public)
values ('company-assets', 'company-assets', true),
       ('shipment-documents', 'shipment-documents', false)
on conflict (id) do nothing;

create policy "company asset reads" on storage.objects
for select using (bucket_id in ('company-assets', 'shipment-documents'));

create policy "company asset writes" on storage.objects
for insert with check (
  bucket_id in ('company-assets', 'shipment-documents')
  and auth.role() = 'authenticated'
);
