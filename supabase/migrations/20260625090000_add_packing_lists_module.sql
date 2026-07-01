create table if not exists public.packing_lists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  packing_list_number text not null,
  dispatch_date date not null,
  destination text not null default '',
  prepared_by uuid references auth.users(id) on delete set null,
  prepared_by_name text not null default '',
  status text not null default 'draft' check (status in ('draft','ready','dispatched')),
  total_boxes integer not null default 0,
  total_customers integer not null default 0,
  total_items numeric(12,2) not null default 0,
  total_weight numeric(12,2) not null default 0,
  remarks text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  dispatched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, packing_list_number)
);

create table if not exists public.packing_list_boxes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  packing_list_id uuid not null references public.packing_lists(id) on delete cascade,
  box_number text not null,
  barcode_value text not null,
  remarks text not null default '',
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(packing_list_id, box_number)
);

create table if not exists public.packing_list_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  packing_list_id uuid not null references public.packing_lists(id) on delete cascade,
  box_id uuid not null references public.packing_list_boxes(id) on delete cascade,
  shipment_id uuid references public.shipments(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null default '',
  tracking_number text not null default '',
  item_description text not null default '',
  quantity numeric(12,2) not null default 1,
  quantity_label text not null default '',
  weight numeric(12,2) not null default 0,
  remarks text not null default '',
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists packing_lists_company_dispatch_date_idx on public.packing_lists (company_id, dispatch_date desc);
create index if not exists packing_lists_status_idx on public.packing_lists (company_id, status);
create index if not exists packing_list_boxes_list_idx on public.packing_list_boxes (packing_list_id, sort_order, box_number);
create index if not exists packing_list_items_list_box_idx on public.packing_list_items (packing_list_id, box_id, sort_order);
create index if not exists packing_list_items_tracking_idx on public.packing_list_items (company_id, tracking_number);
create index if not exists packing_list_items_customer_idx on public.packing_list_items (company_id, customer_name);

drop trigger if exists packing_lists_updated_at on public.packing_lists;
create trigger packing_lists_updated_at before update on public.packing_lists for each row execute function public.set_updated_at();

drop trigger if exists packing_list_boxes_updated_at on public.packing_list_boxes;
create trigger packing_list_boxes_updated_at before update on public.packing_list_boxes for each row execute function public.set_updated_at();

drop trigger if exists packing_list_items_updated_at on public.packing_list_items;
create trigger packing_list_items_updated_at before update on public.packing_list_items for each row execute function public.set_updated_at();

alter table public.packing_lists enable row level security;
alter table public.packing_list_boxes enable row level security;
alter table public.packing_list_items enable row level security;

drop policy if exists "packing_lists permission select" on public.packing_lists;
drop policy if exists "packing_lists permission insert" on public.packing_lists;
drop policy if exists "packing_lists permission update" on public.packing_lists;
drop policy if exists "packing_lists permission delete" on public.packing_lists;
create policy "packing_lists permission select" on public.packing_lists for select to authenticated using (
  public.is_company_member(company_id) and public.user_has_permission(company_id,'packing_lists.view')
);
create policy "packing_lists permission insert" on public.packing_lists for insert to authenticated with check (
  public.is_company_member(company_id) and created_by = auth.uid() and public.user_has_permission(company_id,'packing_lists.create')
);
create policy "packing_lists permission update" on public.packing_lists for update to authenticated using (
  public.is_company_member(company_id) and public.user_has_permission(company_id,'packing_lists.update')
) with check (
  public.is_company_member(company_id) and public.user_has_permission(company_id,'packing_lists.update')
);
create policy "packing_lists permission delete" on public.packing_lists for delete to authenticated using (
  public.is_company_member(company_id) and public.user_has_permission(company_id,'packing_lists.delete')
);

drop policy if exists "packing_list_boxes permission select" on public.packing_list_boxes;
drop policy if exists "packing_list_boxes permission insert" on public.packing_list_boxes;
drop policy if exists "packing_list_boxes permission update" on public.packing_list_boxes;
drop policy if exists "packing_list_boxes permission delete" on public.packing_list_boxes;
create policy "packing_list_boxes permission select" on public.packing_list_boxes for select to authenticated using (
  public.is_company_member(company_id) and public.user_has_permission(company_id,'packing_lists.view')
);
create policy "packing_list_boxes permission insert" on public.packing_list_boxes for insert to authenticated with check (
  public.is_company_member(company_id) and created_by = auth.uid() and public.user_has_permission(company_id,'packing_lists.create')
);
create policy "packing_list_boxes permission update" on public.packing_list_boxes for update to authenticated using (
  public.is_company_member(company_id) and public.user_has_permission(company_id,'packing_lists.update')
) with check (
  public.is_company_member(company_id) and public.user_has_permission(company_id,'packing_lists.update')
);
create policy "packing_list_boxes permission delete" on public.packing_list_boxes for delete to authenticated using (
  public.is_company_member(company_id) and (
    public.user_has_permission(company_id,'packing_lists.update') or public.user_has_permission(company_id,'packing_lists.delete')
  )
);

drop policy if exists "packing_list_items permission select" on public.packing_list_items;
drop policy if exists "packing_list_items permission insert" on public.packing_list_items;
drop policy if exists "packing_list_items permission update" on public.packing_list_items;
drop policy if exists "packing_list_items permission delete" on public.packing_list_items;
create policy "packing_list_items permission select" on public.packing_list_items for select to authenticated using (
  public.is_company_member(company_id) and public.user_has_permission(company_id,'packing_lists.view')
);
create policy "packing_list_items permission insert" on public.packing_list_items for insert to authenticated with check (
  public.is_company_member(company_id) and created_by = auth.uid() and public.user_has_permission(company_id,'packing_lists.create')
);
create policy "packing_list_items permission update" on public.packing_list_items for update to authenticated using (
  public.is_company_member(company_id) and public.user_has_permission(company_id,'packing_lists.update')
) with check (
  public.is_company_member(company_id) and public.user_has_permission(company_id,'packing_lists.update')
);
create policy "packing_list_items permission delete" on public.packing_list_items for delete to authenticated using (
  public.is_company_member(company_id) and (
    public.user_has_permission(company_id,'packing_lists.update') or public.user_has_permission(company_id,'packing_lists.delete')
  )
);

insert into public.permissions (key, description)
values
  ('packing_lists.view', 'View daily dispatch packing lists'),
  ('packing_lists.create', 'Create daily dispatch packing lists'),
  ('packing_lists.update', 'Update daily dispatch packing lists'),
  ('packing_lists.delete', 'Delete daily dispatch packing lists'),
  ('packing_lists.export', 'Print and export daily dispatch packing lists')
on conflict (key) do update set description = excluded.description;

insert into public.role_permissions (company_id, role_id, permission_id)
select roles.company_id, roles.id, permissions.id
from public.roles
cross join public.permissions
where roles.name in ('Super Admin', 'Owner', 'Admin')
  and permissions.key in (
    'packing_lists.view',
    'packing_lists.create',
    'packing_lists.update',
    'packing_lists.delete',
    'packing_lists.export'
  )
on conflict (role_id, permission_id) do nothing;
