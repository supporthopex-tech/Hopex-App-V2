alter table public.customers
  add column if not exists full_name text,
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists customer_type text not null default 'standard',
  add column if not exists status text not null default 'active',
  add column if not exists is_vip boolean not null default false,
  add column if not exists notes text;

update public.customers
set full_name = coalesce(full_name, contact_name, company_name),
    status = coalesce(status, 'active')
where true;

alter table public.tasks
  add column if not exists completed_at timestamptz,
  add column if not exists notes text;

update public.tasks
set status = 'pending'
where status = 'open';

update public.tasks
set status = 'completed'
where status = 'done';

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  origin text,
  destination text,
  cargo_description text,
  cargo_type text,
  estimated_weight numeric(12,2),
  estimated_pieces integer,
  estimated_volume numeric(12,3),
  requested_date date,
  quoted_amount numeric(12,2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'new',
  notes text,
  converted_shipment_id uuid references public.shipments(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_status_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  from_status text,
  to_status text not null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size integer,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  position text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  note text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  activity_type text not null,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  comment text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size integer,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_status_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  from_status text,
  to_status text not null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quote_requests_company_status_idx on public.quote_requests(company_id, status);
create index if not exists customers_company_status_idx on public.customers(company_id, status);
create index if not exists customers_company_vip_idx on public.customers(company_id, is_vip);
create index if not exists tasks_company_status_idx on public.tasks(company_id, status);
create index if not exists tasks_company_assignee_idx on public.tasks(company_id, assignee_id);

insert into public.permissions (key, description)
values
  ('quotes.view', 'View quote requests'),
  ('quotes.create', 'Create quote requests'),
  ('quotes.edit', 'Edit quote requests'),
  ('quotes.delete', 'Delete quote requests'),
  ('quotes.convert', 'Convert quotes to shipments'),
  ('customers.view', 'View customers'),
  ('customers.create', 'Create customers'),
  ('customers.edit', 'Edit customers'),
  ('customers.delete', 'Delete customers'),
  ('customers.export', 'Export customers'),
  ('tasks.view', 'View tasks'),
  ('tasks.create', 'Create tasks'),
  ('tasks.edit', 'Edit tasks'),
  ('tasks.delete', 'Delete tasks'),
  ('tasks.assign', 'Assign tasks'),
  ('tasks.complete', 'Complete tasks')
on conflict (key) do update set description = excluded.description;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'quote_requests','quote_items','quote_status_logs','quote_documents',
    'customer_contacts','customer_notes','customer_activity_logs',
    'task_comments','task_attachments','task_status_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', target_table);
    if not exists (select 1 from pg_trigger where tgname = format('set_%s_updated_at', target_table)) then
      execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', target_table, target_table);
    end if;
  end loop;
end $$;

drop policy if exists "customers tenant select" on public.customers;
drop policy if exists "customers tenant insert" on public.customers;
drop policy if exists "customers tenant update" on public.customers;
drop policy if exists "customers tenant delete" on public.customers;
drop policy if exists "tasks tenant select" on public.tasks;
drop policy if exists "tasks tenant insert" on public.tasks;
drop policy if exists "tasks tenant update" on public.tasks;
drop policy if exists "tasks tenant delete" on public.tasks;

create policy "customers permission select" on public.customers for select using (public.user_has_permission(company_id, 'customers.view') or public.is_company_member(company_id));
create policy "customers permission insert" on public.customers for insert with check (public.user_has_permission(company_id, 'customers.create') and created_by = auth.uid());
create policy "customers permission update" on public.customers for update using (public.user_has_permission(company_id, 'customers.edit')) with check (public.user_has_permission(company_id, 'customers.edit'));
create policy "customers permission delete" on public.customers for delete using (public.user_has_permission(company_id, 'customers.delete'));

create policy "tasks permission select" on public.tasks for select using (public.user_has_permission(company_id, 'tasks.view') or public.is_company_member(company_id));
create policy "tasks permission insert" on public.tasks for insert with check (public.user_has_permission(company_id, 'tasks.create') and created_by = auth.uid());
create policy "tasks permission update" on public.tasks for update using (public.user_has_permission(company_id, 'tasks.edit') or public.user_has_permission(company_id, 'tasks.complete') or public.user_has_permission(company_id, 'tasks.assign')) with check (public.user_has_permission(company_id, 'tasks.edit') or public.user_has_permission(company_id, 'tasks.complete') or public.user_has_permission(company_id, 'tasks.assign'));
create policy "tasks permission delete" on public.tasks for delete using (public.user_has_permission(company_id, 'tasks.delete'));

do $$
declare
  target_table text;
  permission_prefix text;
begin
  foreach target_table in array array['quote_requests','quote_items','quote_status_logs','quote_documents']
  loop
    execute format('create policy "%I permission select" on public.%I for select using (public.user_has_permission(company_id, ''quotes.view'') or public.is_company_member(company_id))', target_table, target_table);
    execute format('create policy "%I permission insert" on public.%I for insert with check (public.user_has_permission(company_id, ''quotes.create'') and created_by = auth.uid())', target_table, target_table);
    execute format('create policy "%I permission update" on public.%I for update using (public.user_has_permission(company_id, ''quotes.edit'') or public.user_has_permission(company_id, ''quotes.convert'')) with check (public.user_has_permission(company_id, ''quotes.edit'') or public.user_has_permission(company_id, ''quotes.convert''))', target_table, target_table);
    execute format('create policy "%I permission delete" on public.%I for delete using (public.user_has_permission(company_id, ''quotes.delete''))', target_table, target_table);
  end loop;
  foreach target_table in array array['customer_contacts','customer_notes','customer_activity_logs']
  loop
    execute format('create policy "%I permission select" on public.%I for select using (public.user_has_permission(company_id, ''customers.view'') or public.is_company_member(company_id))', target_table, target_table);
    execute format('create policy "%I permission insert" on public.%I for insert with check (public.user_has_permission(company_id, ''customers.edit'') and created_by = auth.uid())', target_table, target_table);
    execute format('create policy "%I permission update" on public.%I for update using (public.user_has_permission(company_id, ''customers.edit'')) with check (public.user_has_permission(company_id, ''customers.edit''))', target_table, target_table);
    execute format('create policy "%I permission delete" on public.%I for delete using (public.user_has_permission(company_id, ''customers.delete''))', target_table, target_table);
  end loop;
  foreach target_table in array array['task_comments','task_attachments','task_status_logs']
  loop
    execute format('create policy "%I permission select" on public.%I for select using (public.user_has_permission(company_id, ''tasks.view'') or public.is_company_member(company_id))', target_table, target_table);
    execute format('create policy "%I permission insert" on public.%I for insert with check (public.user_has_permission(company_id, ''tasks.edit'') and created_by = auth.uid())', target_table, target_table);
    execute format('create policy "%I permission update" on public.%I for update using (public.user_has_permission(company_id, ''tasks.edit'')) with check (public.user_has_permission(company_id, ''tasks.edit''))', target_table, target_table);
    execute format('create policy "%I permission delete" on public.%I for delete using (public.user_has_permission(company_id, ''tasks.delete''))', target_table, target_table);
  end loop;
end $$;

grant select, insert, update, delete on public.quote_requests, public.quote_items, public.quote_status_logs, public.quote_documents to authenticated;
grant select, insert, update, delete on public.customers, public.customer_contacts, public.customer_notes, public.customer_activity_logs to authenticated;
grant select, insert, update, delete on public.tasks, public.task_comments, public.task_attachments, public.task_status_logs to authenticated;

insert into storage.buckets (id, name, public)
values
  ('quote-documents', 'quote-documents', false),
  ('task-attachments', 'task-attachments', false)
on conflict (id) do nothing;

drop policy if exists "quote documents storage read" on storage.objects;
create policy "quote documents storage read" on storage.objects
for select using (bucket_id = 'quote-documents' and auth.role() = 'authenticated');
drop policy if exists "quote documents storage write" on storage.objects;
create policy "quote documents storage write" on storage.objects
for insert with check (bucket_id = 'quote-documents' and auth.role() = 'authenticated');

drop policy if exists "task attachments storage read" on storage.objects;
create policy "task attachments storage read" on storage.objects
for select using (bucket_id = 'task-attachments' and auth.role() = 'authenticated');
drop policy if exists "task attachments storage write" on storage.objects;
create policy "task attachments storage write" on storage.objects
for insert with check (bucket_id = 'task-attachments' and auth.role() = 'authenticated');
