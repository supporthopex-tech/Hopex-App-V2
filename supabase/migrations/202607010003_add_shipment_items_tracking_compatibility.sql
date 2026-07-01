-- Hopex V2 compatibility tables for itemized shipment migration and tracking history.
-- These tables are structural only; they do not seed production business data.

create table if not exists public.shipment_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  item_name text not null,
  description text,
  quantity integer not null default 1 check (quantity > 0),
  weight_kg numeric(12,2),
  volume_cbm numeric(12,3),
  declared_value numeric(12,2),
  currency text not null default 'TZS',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipment_tracking (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  tracking_number text not null,
  status text not null,
  location text,
  notes text,
  public_note text,
  event_time timestamptz not null default now(),
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shipment_items_company_shipment_idx
  on public.shipment_items(company_id, shipment_id);

create index if not exists shipment_tracking_company_shipment_idx
  on public.shipment_tracking(company_id, shipment_id, event_time desc);

create index if not exists shipment_tracking_number_idx
  on public.shipment_tracking(company_id, tracking_number);

alter table public.shipment_items enable row level security;
alter table public.shipment_tracking enable row level security;

drop policy if exists "shipment_items permission select" on public.shipment_items;
create policy "shipment_items permission select"
on public.shipment_items
for select
to authenticated
using (public.user_has_permission(company_id, 'shipments.view') or public.is_company_member(company_id));

drop policy if exists "shipment_items permission insert" on public.shipment_items;
create policy "shipment_items permission insert"
on public.shipment_items
for insert
to authenticated
with check (public.user_has_permission(company_id, 'shipments.create') and created_by = auth.uid());

drop policy if exists "shipment_items permission update" on public.shipment_items;
create policy "shipment_items permission update"
on public.shipment_items
for update
to authenticated
using (public.user_has_permission(company_id, 'shipments.edit'))
with check (public.user_has_permission(company_id, 'shipments.edit'));

drop policy if exists "shipment_items permission delete" on public.shipment_items;
create policy "shipment_items permission delete"
on public.shipment_items
for delete
to authenticated
using (public.user_has_permission(company_id, 'shipments.delete'));

drop policy if exists "shipment_tracking permission select" on public.shipment_tracking;
create policy "shipment_tracking permission select"
on public.shipment_tracking
for select
to authenticated
using (public.user_has_permission(company_id, 'shipments.track') or public.user_has_permission(company_id, 'shipments.view') or public.is_company_member(company_id));

drop policy if exists "shipment_tracking permission insert" on public.shipment_tracking;
create policy "shipment_tracking permission insert"
on public.shipment_tracking
for insert
to authenticated
with check (public.user_has_permission(company_id, 'shipments.update_status') and created_by = auth.uid());

drop policy if exists "shipment_tracking permission update" on public.shipment_tracking;
create policy "shipment_tracking permission update"
on public.shipment_tracking
for update
to authenticated
using (public.user_has_permission(company_id, 'shipments.update_status'))
with check (public.user_has_permission(company_id, 'shipments.update_status'));

drop policy if exists "shipment_tracking permission delete" on public.shipment_tracking;
create policy "shipment_tracking permission delete"
on public.shipment_tracking
for delete
to authenticated
using (public.user_has_permission(company_id, 'shipments.delete'));

drop trigger if exists set_shipment_items_updated_at on public.shipment_items;
create trigger set_shipment_items_updated_at
before update on public.shipment_items
for each row execute function public.set_updated_at();

drop trigger if exists set_shipment_tracking_updated_at on public.shipment_tracking;
create trigger set_shipment_tracking_updated_at
before update on public.shipment_tracking
for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.shipment_items to authenticated;
grant select, insert, update, delete on public.shipment_tracking to authenticated;

notify pgrst, 'reload schema';
