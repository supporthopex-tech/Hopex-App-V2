alter table public.companies
  add column if not exists tracking_prefix text not null default 'CGO';

alter table public.shipments
  add column if not exists reference_number text,
  add column if not exists barcode_value text,
  add column if not exists qr_code_value text,
  add column if not exists supplier_name text,
  add column if not exists supplier_phone text,
  add column if not exists supplier_email text,
  add column if not exists supplier_location text,
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists customer_email text,
  add column if not exists customer_destination text,
  add column if not exists route text,
  add column if not exists cargo_type text,
  add column if not exists cargo_category text,
  add column if not exists cargo_description text,
  add column if not exists currency text not null default 'USD',
  add column if not exists weight_kg numeric(12,2),
  add column if not exists pieces integer,
  add column if not exists volume_cbm numeric(12,3),
  add column if not exists length numeric(12,2),
  add column if not exists width numeric(12,2),
  add column if not exists height numeric(12,2),
  add column if not exists rate_per_kg numeric(12,2) not null default 0,
  add column if not exists rate_per_cbm numeric(12,2) not null default 0,
  add column if not exists handling_fee numeric(12,2) not null default 0,
  add column if not exists customs_fee numeric(12,2) not null default 0,
  add column if not exists insurance_fee numeric(12,2) not null default 0,
  add column if not exists subtotal numeric(12,2) not null default 0,
  add column if not exists tax numeric(12,2) not null default 0,
  add column if not exists discount numeric(12,2) not null default 0,
  add column if not exists total_amount numeric(12,2) not null default 0,
  add column if not exists cost_amount numeric(12,2) not null default 0,
  add column if not exists profit_margin numeric(12,2) not null default 0,
  add column if not exists chargeable_weight numeric(12,2),
  add column if not exists volumetric_weight numeric(12,2),
  add column if not exists estimated_delivery date,
  add column if not exists actual_delivery date,
  add column if not exists assigned_staff_id uuid references public.staff(id) on delete set null,
  add column if not exists assigned_driver text,
  add column if not exists receiver_name text,
  add column if not exists receiver_signature_url text,
  add column if not exists delivery_notes text,
  add column if not exists notes text;

update public.shipments
set weight_kg = coalesce(weight_kg, weight),
    cargo_description = coalesce(cargo_description, cargo_details),
    total_amount = case when total_amount = 0 then price else total_amount end,
    route = coalesce(route, origin || ' -> ' || destination)
where true;

alter table public.shipments
  alter column origin drop not null,
  alter column destination drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'shipments_status_check'
      and conrelid = 'public.shipments'::regclass
  ) then
    alter table public.shipments
      add constraint shipments_status_check
      check (status in (
        'pending',
        'picked_up',
        'in_warehouse',
        'in_transit',
        'customs_clearance',
        'out_for_delivery',
        'delivered',
        'completed',
        'on_hold',
        'returned',
        'cancelled',
        'lost',
        'damaged',
        'booked',
        'customs'
      ));
  end if;
end $$;

create table if not exists public.shipment_pricing (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  shipment_id uuid not null unique references public.shipments(id) on delete cascade,
  use_balance_weight boolean not null default false,
  use_pieces boolean not null default false,
  use_volume boolean not null default false,
  weight_kg numeric(12,2) not null default 0,
  pieces integer not null default 0,
  volume_cbm numeric(12,3) not null default 0,
  length numeric(12,2) not null default 0,
  width numeric(12,2) not null default 0,
  height numeric(12,2) not null default 0,
  volumetric_weight numeric(12,2) not null default 0,
  chargeable_weight numeric(12,2) not null default 0,
  rate_per_kg numeric(12,2) not null default 0,
  rate_per_cbm numeric(12,2) not null default 0,
  handling_fee numeric(12,2) not null default 0,
  customs_fee numeric(12,2) not null default 0,
  insurance_fee numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  cost_amount numeric(12,2) not null default 0,
  profit_margin numeric(12,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipment_status_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  from_status text,
  to_status text not null,
  location text,
  notes text,
  public_note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipment_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  document_type text not null check (document_type in (
    'cargo_image',
    'invoice_document',
    'packing_list',
    'bill_of_lading',
    'customs_document',
    'receiver_signature',
    'other'
  )),
  file_name text not null,
  file_path text not null,
  mime_type text,
  size_bytes bigint,
  is_public boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shipments_company_tracking_idx on public.shipments(company_id, tracking_number);
create index if not exists shipments_company_status_idx on public.shipments(company_id, status);
create index if not exists shipments_company_route_idx on public.shipments(company_id, route);
create index if not exists shipments_company_estimated_delivery_idx on public.shipments(company_id, estimated_delivery);
create index if not exists shipment_documents_company_shipment_idx on public.shipment_documents(company_id, shipment_id);
create index if not exists shipment_status_logs_company_shipment_idx on public.shipment_status_logs(company_id, shipment_id);

do $$
declare
  target_table text;
begin
  foreach target_table in array array['shipment_pricing','shipment_status_logs','shipment_documents']
  loop
    execute format('alter table public.%I enable row level security', target_table);

    if not exists (
      select 1 from pg_trigger
      where tgname = format('set_%s_updated_at', target_table)
    ) then
      execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', target_table, target_table);
    end if;

    execute format('drop policy if exists "%I tenant select" on public.%I', target_table, target_table);
    execute format('drop policy if exists "%I tenant insert" on public.%I', target_table, target_table);
    execute format('drop policy if exists "%I tenant update" on public.%I', target_table, target_table);
    execute format('drop policy if exists "%I tenant delete" on public.%I', target_table, target_table);

    execute format('create policy "%I tenant select" on public.%I for select using (public.is_company_member(company_id))', target_table, target_table);
    execute format('create policy "%I tenant insert" on public.%I for insert with check (public.is_company_member(company_id) and created_by = auth.uid())', target_table, target_table);
    execute format('create policy "%I tenant update" on public.%I for update using (public.is_company_member(company_id)) with check (public.is_company_member(company_id))', target_table, target_table);
    execute format('create policy "%I tenant delete" on public.%I for delete using (public.is_company_member(company_id))', target_table, target_table);
  end loop;
end $$;

insert into public.permissions (key, description)
values
  ('shipments.view', 'View company shipments'),
  ('shipments.create', 'Create shipments'),
  ('shipments.edit', 'Edit shipments'),
  ('shipments.delete', 'Delete shipments'),
  ('shipments.export', 'Export shipment data'),
  ('shipments.track', 'Access tracking tools'),
  ('shipments.update_status', 'Update shipment status'),
  ('shipments.assign_staff', 'Assign shipment staff'),
  ('shipments.manage_documents', 'Manage shipment documents')
on conflict (key) do update set description = excluded.description;

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
$$;

drop policy if exists "shipments tenant select" on public.shipments;
drop policy if exists "shipments tenant insert" on public.shipments;
drop policy if exists "shipments tenant update" on public.shipments;
drop policy if exists "shipments tenant delete" on public.shipments;

create policy "shipments permission select" on public.shipments
for select using (
  public.user_has_permission(company_id, 'shipments.view')
  or public.user_has_permission(company_id, 'shipments.track')
);

create policy "shipments permission insert" on public.shipments
for insert with check (
  public.user_has_permission(company_id, 'shipments.create')
  and created_by = auth.uid()
);

create policy "shipments permission update" on public.shipments
for update using (
  public.user_has_permission(company_id, 'shipments.edit')
  or public.user_has_permission(company_id, 'shipments.update_status')
) with check (
  public.user_has_permission(company_id, 'shipments.edit')
  or public.user_has_permission(company_id, 'shipments.update_status')
);

create policy "shipments permission delete" on public.shipments
for delete using (public.user_has_permission(company_id, 'shipments.delete'));

drop policy if exists "shipment_events tenant select" on public.shipment_events;
drop policy if exists "shipment_events tenant insert" on public.shipment_events;
drop policy if exists "shipment_events tenant update" on public.shipment_events;
drop policy if exists "shipment_events tenant delete" on public.shipment_events;

create policy "shipment events permission select" on public.shipment_events
for select using (public.user_has_permission(company_id, 'shipments.view'));
create policy "shipment events permission insert" on public.shipment_events
for insert with check (public.user_has_permission(company_id, 'shipments.update_status') and created_by = auth.uid());
create policy "shipment events permission update" on public.shipment_events
for update using (public.user_has_permission(company_id, 'shipments.update_status'))
with check (public.user_has_permission(company_id, 'shipments.update_status'));
create policy "shipment events permission delete" on public.shipment_events
for delete using (public.user_has_permission(company_id, 'shipments.delete'));

drop policy if exists "shipment_pricing tenant select" on public.shipment_pricing;
drop policy if exists "shipment_pricing tenant insert" on public.shipment_pricing;
drop policy if exists "shipment_pricing tenant update" on public.shipment_pricing;
drop policy if exists "shipment_pricing tenant delete" on public.shipment_pricing;

create policy "shipment pricing permission select" on public.shipment_pricing
for select using (public.user_has_permission(company_id, 'shipments.view'));
create policy "shipment pricing permission insert" on public.shipment_pricing
for insert with check (public.user_has_permission(company_id, 'shipments.create') and created_by = auth.uid());
create policy "shipment pricing permission update" on public.shipment_pricing
for update using (public.user_has_permission(company_id, 'shipments.edit'))
with check (public.user_has_permission(company_id, 'shipments.edit'));
create policy "shipment pricing permission delete" on public.shipment_pricing
for delete using (public.user_has_permission(company_id, 'shipments.delete'));

drop policy if exists "shipment_status_logs tenant select" on public.shipment_status_logs;
drop policy if exists "shipment_status_logs tenant insert" on public.shipment_status_logs;
drop policy if exists "shipment_status_logs tenant update" on public.shipment_status_logs;
drop policy if exists "shipment_status_logs tenant delete" on public.shipment_status_logs;

create policy "shipment status logs permission select" on public.shipment_status_logs
for select using (public.user_has_permission(company_id, 'shipments.view'));
create policy "shipment status logs permission insert" on public.shipment_status_logs
for insert with check (public.user_has_permission(company_id, 'shipments.update_status') and created_by = auth.uid());
create policy "shipment status logs permission update" on public.shipment_status_logs
for update using (public.user_has_permission(company_id, 'shipments.update_status'))
with check (public.user_has_permission(company_id, 'shipments.update_status'));
create policy "shipment status logs permission delete" on public.shipment_status_logs
for delete using (public.user_has_permission(company_id, 'shipments.delete'));

drop policy if exists "shipment_documents tenant select" on public.shipment_documents;
drop policy if exists "shipment_documents tenant insert" on public.shipment_documents;
drop policy if exists "shipment_documents tenant update" on public.shipment_documents;
drop policy if exists "shipment_documents tenant delete" on public.shipment_documents;

create policy "shipment documents permission select" on public.shipment_documents
for select using (public.user_has_permission(company_id, 'shipments.view'));
create policy "shipment documents permission insert" on public.shipment_documents
for insert with check (public.user_has_permission(company_id, 'shipments.manage_documents') and created_by = auth.uid());
create policy "shipment documents permission update" on public.shipment_documents
for update using (public.user_has_permission(company_id, 'shipments.manage_documents'))
with check (public.user_has_permission(company_id, 'shipments.manage_documents'));
create policy "shipment documents permission delete" on public.shipment_documents
for delete using (public.user_has_permission(company_id, 'shipments.manage_documents'));

grant select, insert, update, delete on public.shipment_pricing to authenticated;
grant select, insert, update, delete on public.shipment_status_logs to authenticated;
grant select, insert, update, delete on public.shipment_documents to authenticated;

drop policy if exists "shipment documents storage read" on storage.objects;
create policy "shipment documents storage read" on storage.objects
for select using (
  bucket_id = 'shipment-documents'
  and auth.role() = 'authenticated'
);

drop policy if exists "shipment documents storage write" on storage.objects;
create policy "shipment documents storage write" on storage.objects
for insert with check (
  bucket_id = 'shipment-documents'
  and auth.role() = 'authenticated'
);
