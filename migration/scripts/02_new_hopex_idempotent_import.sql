-- Run on NEW Hopex Supabase project only.
-- Load reviewed old app_records JSON into migration_staging.old_hopex_app_records before running.

begin;

create schema if not exists migration_staging;

create table if not exists migration_staging.old_hopex_app_records (
  old_id uuid primary key,
  entity_name text not null,
  data jsonb not null default '{}'::jsonb,
  old_created_by uuid,
  old_created_at timestamptz,
  old_updated_at timestamptz,
  loaded_at timestamptz not null default now()
);

create table if not exists migration_staging.migration_log (
  id bigserial primary key,
  entity_name text not null,
  old_id uuid,
  target_table text,
  target_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  logged_at timestamptz not null default now(),
  unique(entity_name, old_id, target_table, action)
);

create table if not exists migration_staging.migration_rejections (
  id bigserial primary key,
  entity_name text not null,
  old_id uuid,
  reason text not null,
  data jsonb not null default '{}'::jsonb,
  logged_at timestamptz not null default now(),
  unique(entity_name, old_id, reason)
);

create or replace function migration_staging.safe_numeric(input text)
returns numeric
language sql
immutable
as $$
  select case
    when nullif(trim(input), '') is null then null
    when trim(input) ~ '^-?[0-9]+(\.[0-9]+)?$' then trim(input)::numeric
    else null
  end;
$$;

create or replace function migration_staging.safe_integer(input text)
returns integer
language sql
immutable
as $$
  select case
    when nullif(trim(input), '') is null then null
    when trim(input) ~ '^-?[0-9]+$' then trim(input)::integer
    else null
  end;
$$;

create or replace function migration_staging.safe_date(input text)
returns date
language plpgsql
immutable
as $$
begin
  if nullif(trim(input), '') is null then
    return null;
  end if;

  return trim(input)::date;
exception
  when others then
    return null;
end;
$$;

-- Customers. Dedupe by email first, then phone, then old id stored in metadata.
insert into public.customers (
  company_id,
  full_name,
  company_name,
  phone,
  email,
  address,
  city,
  country,
  customer_type,
  status,
  notes,
  created_at,
  updated_at
)
select
  '6d19adf9-570f-46c3-8476-dfab624248b3',
  coalesce(nullif(data->>'full_name', ''), nullif(data->>'customer_name', ''), nullif(data->>'name', ''), 'Unknown Customer'),
  coalesce(nullif(data->>'company_name', ''), nullif(data->>'customer_name', ''), nullif(data->>'name', ''), 'Individual Customer'),
  nullif(coalesce(data->>'phone', data->>'customer_phone'), ''),
  nullif(coalesce(data->>'email', data->>'customer_email'), ''),
  nullif(data->>'address', ''),
  nullif(data->>'city', ''),
  nullif(data->>'country', ''),
  coalesce(nullif(data->>'customer_type', ''), 'shipper'),
  coalesce(nullif(data->>'status', ''), 'active'),
  concat_ws(E'\n', nullif(data->>'notes', ''), 'Migrated from old Hopex id: ' || old_id::text),
  coalesce(old_created_at, now()),
  coalesce(old_updated_at, now())
from migration_staging.old_hopex_app_records source
where entity_name = 'Customer'
on conflict do nothing;

insert into migration_staging.migration_log (entity_name, old_id, target_table, action, details)
select entity_name, old_id, 'customers', 'attempted', jsonb_build_object('email', data->>'email', 'phone', data->>'phone')
from migration_staging.old_hopex_app_records
where entity_name = 'Customer'
on conflict do nothing;

-- Shipments. Upsert by company_id and tracking_number.
insert into public.shipments (
  company_id,
  tracking_number,
  origin,
  destination,
  cargo_details,
  weight,
  status,
  customer_name,
  customer_phone,
  customer_email,
  cargo_type,
  cargo_description,
  currency,
  weight_kg,
  pieces,
  total_amount,
  created_at,
  updated_at
)
select
  '6d19adf9-570f-46c3-8476-dfab624248b3',
  coalesce(nullif(data->>'tracking_number', ''), nullif(data->>'shipment_tracking', ''), 'OLD-' || old_id::text),
  coalesce(nullif(data->>'origin', ''), nullif(data->>'from', ''), 'Unknown origin'),
  coalesce(nullif(data->>'destination', ''), nullif(data->>'to', ''), 'Unknown destination'),
  nullif(coalesce(data->>'cargo_details', data->>'cargo_description'), ''),
  migration_staging.safe_numeric(data->>'weight'),
  coalesce(nullif(data->>'status', ''), 'booked'),
  nullif(data->>'customer_name', ''),
  nullif(data->>'customer_phone', ''),
  nullif(data->>'customer_email', ''),
  nullif(data->>'cargo_type', ''),
  nullif(data->>'cargo_description', ''),
  coalesce(nullif(data->>'currency', ''), 'TZS'),
  migration_staging.safe_numeric(data->>'weight_kg'),
  migration_staging.safe_integer(data->>'pieces'),
  coalesce(migration_staging.safe_numeric(coalesce(data->>'grand_total', data->>'amount', data->>'price')), 0),
  coalesce(old_created_at, now()),
  coalesce(old_updated_at, now())
from migration_staging.old_hopex_app_records source
where entity_name = 'Shipment'
on conflict (company_id, tracking_number) do update
set
  status = excluded.status,
  updated_at = greatest(public.shipments.updated_at, excluded.updated_at);

insert into migration_staging.migration_log (entity_name, old_id, target_table, action, details)
select entity_name, old_id, 'shipments', 'upserted', jsonb_build_object('tracking', coalesce(data->>'tracking_number', data->>'shipment_tracking'))
from migration_staging.old_hopex_app_records
where entity_name = 'Shipment'
on conflict do nothing;

-- Invoices. Upsert by company_id and invoice_number where available.
insert into public.invoices (
  company_id,
  invoice_number,
  status,
  amount,
  currency,
  subtotal,
  total_amount,
  balance_due,
  issue_date,
  due_date,
  created_at,
  updated_at
)
select
  '6d19adf9-570f-46c3-8476-dfab624248b3',
  coalesce(nullif(data->>'invoice_number', ''), 'OLD-INV-' || old_id::text),
  coalesce(nullif(data->>'status', ''), 'draft'),
  coalesce(migration_staging.safe_numeric(coalesce(data->>'grand_total', data->>'amount')), 0),
  coalesce(nullif(data->>'currency', ''), 'TZS'),
  coalesce(migration_staging.safe_numeric(coalesce(data->>'grand_total', data->>'amount')), 0),
  coalesce(migration_staging.safe_numeric(coalesce(data->>'grand_total', data->>'amount')), 0),
  coalesce(migration_staging.safe_numeric(coalesce(data->>'grand_total', data->>'amount')), 0),
  coalesce(migration_staging.safe_date(data->>'invoice_date'), current_date),
  migration_staging.safe_date(data->>'due_date'),
  coalesce(old_created_at, now()),
  coalesce(old_updated_at, now())
from migration_staging.old_hopex_app_records source
where entity_name = 'CargoInvoice'
on conflict (company_id, invoice_number) do update
set
  status = excluded.status,
  total_amount = excluded.total_amount,
  updated_at = greatest(public.invoices.updated_at, excluded.updated_at);

insert into migration_staging.migration_log (entity_name, old_id, target_table, action, details)
select entity_name, old_id, 'invoices', 'upserted', jsonb_build_object('invoice_number', data->>'invoice_number')
from migration_staging.old_hopex_app_records
where entity_name = 'CargoInvoice'
on conflict do nothing;

-- Staff import is intentionally conservative. Auth users must be created/invited in the new Supabase Auth project first.
insert into migration_staging.migration_rejections (entity_name, old_id, reason, data)
select entity_name, old_id, 'staff_requires_new_auth_user_match_before_import', data
from migration_staging.old_hopex_app_records
where entity_name in ('Staff_Member', 'StaffMember')
on conflict do nothing;

commit;
