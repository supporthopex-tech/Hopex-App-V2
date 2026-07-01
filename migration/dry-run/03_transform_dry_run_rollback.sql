-- Sprint 3 target transformation dry run.
-- Run on NEW Hopex V2 target project only: ozgeatgwgnpcfnzjhqit.
-- Prerequisite: reviewed source export is loaded into migration_staging.old_hopex_app_records.
-- This script intentionally ends with ROLLBACK so no business data persists.

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

create temporary table dry_run_rejections (
  entity_name text not null,
  old_id uuid,
  target_table text,
  reason text not null,
  details jsonb not null default '{}'::jsonb
) on commit drop;

create temporary table dry_run_counts (
  source_entity text not null,
  target_table text not null,
  candidate_count bigint not null,
  accepted_count bigint not null,
  rejected_count bigint not null
) on commit drop;

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

create or replace function migration_staging.safe_timestamptz(input text)
returns timestamptz
language plpgsql
immutable
as $$
begin
  if nullif(trim(input), '') is null then
    return null;
  end if;

  return trim(input)::timestamptz;
exception
  when others then
    return null;
end;
$$;

create temporary table dry_run_entity_targets (
  source_entity text not null,
  target_table text not null,
  import_policy text not null
) on commit drop;

insert into dry_run_entity_targets (source_entity, target_table, import_policy)
values
  ('AccountingAccount', 'chart_of_accounts', 'conditional_merge'),
  ('ActivityLog', 'audit_logs', 'optional_or_linked_history'),
  ('ActivityLog', 'shipment_status_logs', 'optional_or_linked_history'),
  ('BankAccount', 'bank_accounts', 'conditional_merge'),
  ('CargoInvoice', 'invoices', 'import'),
  ('CargoInvoice', 'invoice_items', 'import_child_rows'),
  ('CargoInvoice', 'payments', 'conditional_paid_only'),
  ('Customer', 'customers', 'import'),
  ('Customer', 'customer_contacts', 'optional_child_rows'),
  ('Expense', 'expenses', 'import'),
  ('JournalEntry', 'journal_entries', 'import_if_balanced'),
  ('JournalEntry', 'journal_entry_lines', 'import_child_rows_if_balanced'),
  ('Notification', 'notifications', 'optional_archive_or_import'),
  ('QuoteRequest', 'quote_requests', 'import'),
  ('QuoteRequest', 'quote_items', 'optional_child_rows'),
  ('Shipment', 'shipments', 'import'),
  ('Shipment', 'shipment_items', 'derive_from_pieces_or_items'),
  ('Shipment', 'shipment_tracking', 'derive_latest_tracking'),
  ('Shipment', 'shipment_status_logs', 'derive_from_status_or_activity'),
  ('Staff', 'staff', 'requires_v2_auth_user'),
  ('Staff', 'company_users', 'requires_v2_auth_user'),
  ('Staff_Member', 'staff', 'requires_v2_auth_user'),
  ('Staff_Member', 'company_users', 'requires_v2_auth_user'),
  ('Staff_Member', 'staff_permissions', 'requires_permission_review'),
  ('Task', 'tasks', 'optional_archive_or_import'),
  ('Task', 'task_status_logs', 'optional_child_rows'),
  ('UserPresence', 'none', 'do_not_import_ephemeral'),
  ('WhatsAppLog', 'whatsapp_logs', 'optional_archive_or_import');

-- Candidate normalized views. These do not insert into application tables.
create temporary table dry_run_customers as
select
  old_id,
  '6d19adf9-570f-46c3-8476-dfab624248b3'::uuid as company_id,
  nullif(coalesce(data->>'full_name', data->>'customer_name', data->>'name', data->>'company_name'), '') as full_name,
  nullif(data->>'company_name', '') as company_name,
  lower(nullif(data->>'email', '')) as email,
  nullif(data->>'phone', '') as phone,
  nullif(data->>'address', '') as address,
  nullif(data->>'city', '') as city,
  nullif(data->>'country', '') as country,
  data
from migration_staging.old_hopex_app_records
where entity_name = 'Customer';

create temporary table dry_run_shipments as
select
  old_id,
  '6d19adf9-570f-46c3-8476-dfab624248b3'::uuid as company_id,
  nullif(coalesce(data->>'tracking_number', data->>'shipment_tracking'), '') as tracking_number,
  nullif(data->>'customer_name', '') as customer_name,
  nullif(data->>'origin', '') as origin,
  nullif(data->>'destination', '') as destination,
  coalesce(nullif(data->>'status', ''), 'pending') as old_status,
  migration_staging.safe_numeric(data->>'weight_kg') as weight_kg,
  migration_staging.safe_numeric(data->>'volume_cbm') as volume_cbm,
  migration_staging.safe_integer(data->>'pieces') as pieces,
  migration_staging.safe_numeric(coalesce(data->>'price', data->>'amount', data->>'total_amount')) as quoted_amount,
  data
from migration_staging.old_hopex_app_records
where entity_name = 'Shipment';

create temporary table dry_run_invoices as
select
  old_id,
  '6d19adf9-570f-46c3-8476-dfab624248b3'::uuid as company_id,
  nullif(data->>'invoice_number', '') as invoice_number,
  nullif(coalesce(data->>'shipment_tracking', data->>'tracking_number'), '') as tracking_number,
  nullif(data->>'customer_name', '') as customer_name,
  migration_staging.safe_numeric(coalesce(data->>'grand_total', data->>'amount', data->>'total_amount')) as total_amount,
  coalesce(nullif(data->>'currency', ''), 'TZS') as currency,
  coalesce(nullif(data->>'status', ''), 'draft') as old_status,
  jsonb_typeof(data->'line_items') = 'array' as has_line_items,
  data
from migration_staging.old_hopex_app_records
where entity_name = 'CargoInvoice';

create temporary table dry_run_staff as
select
  old_id,
  entity_name,
  '6d19adf9-570f-46c3-8476-dfab624248b3'::uuid as company_id,
  lower(nullif(coalesce(data->>'email', data->>'user_email'), '')) as email,
  nullif(coalesce(data->>'full_name', data->>'name', data->>'user_name'), '') as full_name,
  nullif(data->>'role', '') as old_role,
  nullif(data->>'department', '') as department,
  data
from migration_staging.old_hopex_app_records
where entity_name in ('Staff', 'Staff_Member');

create temporary table dry_run_journals as
select
  old_id,
  '6d19adf9-570f-46c3-8476-dfab624248b3'::uuid as company_id,
  nullif(data->>'entry_number', '') as entry_number,
  migration_staging.safe_timestamptz(data->>'date') as entry_date,
  migration_staging.safe_numeric(data->>'total_debit') as total_debit,
  migration_staging.safe_numeric(data->>'total_credit') as total_credit,
  jsonb_typeof(data->'lines') = 'array' as has_lines,
  data
from migration_staging.old_hopex_app_records
where entity_name = 'JournalEntry';

-- Rejections and decision flags.
insert into dry_run_rejections (entity_name, old_id, target_table, reason, details)
select
  entity_name,
  old_id,
  null,
  'sample_row_requires_owner_decision',
  jsonb_build_object('keys', (select coalesce(jsonb_agg(key order by key), '[]'::jsonb) from jsonb_object_keys(data) as key))
from migration_staging.old_hopex_app_records
where data->>'is_sample' = 'true';

insert into dry_run_rejections (entity_name, old_id, target_table, reason, details)
select 'Customer', old_id, 'customers', 'customer_missing_name_email_and_phone', data
from dry_run_customers
where full_name is null
  and email is null
  and phone is null;

insert into dry_run_rejections (entity_name, old_id, target_table, reason, details)
select 'Shipment', old_id, 'shipments', 'shipment_missing_tracking_number', data
from dry_run_shipments
where tracking_number is null;

insert into dry_run_rejections (entity_name, old_id, target_table, reason, details)
select 'Shipment', old_id, 'shipments', 'shipment_invalid_weight_kg', data
from dry_run_shipments
where nullif(data->>'weight_kg', '') is not null
  and weight_kg is null;

insert into dry_run_rejections (entity_name, old_id, target_table, reason, details)
select 'Shipment', old_id, 'shipments', 'shipment_invalid_piece_count', data
from dry_run_shipments
where nullif(data->>'pieces', '') is not null
  and pieces is null;

insert into dry_run_rejections (entity_name, old_id, target_table, reason, details)
select 'CargoInvoice', old_id, 'invoices', 'invoice_missing_invoice_number', data
from dry_run_invoices
where invoice_number is null;

insert into dry_run_rejections (entity_name, old_id, target_table, reason, details)
select 'CargoInvoice', old_id, 'invoices', 'invoice_invalid_total_amount', data
from dry_run_invoices
where nullif(coalesce(data->>'grand_total', data->>'amount', data->>'total_amount'), '') is not null
  and total_amount is null;

insert into dry_run_rejections (entity_name, old_id, target_table, reason, details)
select entity_name, old_id, 'staff', 'staff_missing_email', data
from dry_run_staff
where email is null;

insert into dry_run_rejections (entity_name, old_id, target_table, reason, details)
select entity_name, old_id, 'staff', 'staff_requires_v2_auth_user_match_before_import', jsonb_build_object('email', email)
from dry_run_staff s
where email is not null
  and not exists (
    select 1
    from auth.users u
    where lower(u.email) = s.email
  );

insert into dry_run_rejections (entity_name, old_id, target_table, reason, details)
select 'JournalEntry', old_id, 'journal_entries', 'journal_entry_not_balanced', data
from dry_run_journals
where coalesce(total_debit, 0) <> coalesce(total_credit, 0);

insert into dry_run_rejections (entity_name, old_id, target_table, reason, details)
select 'JournalEntry', old_id, 'journal_entry_lines', 'journal_entry_missing_lines_array', data
from dry_run_journals
where not has_lines;

-- Row-count comparison by source entity and target table.
insert into dry_run_counts (source_entity, target_table, candidate_count, accepted_count, rejected_count)
select
  t.source_entity,
  t.target_table,
  count(s.old_id) as candidate_count,
  count(s.old_id) filter (
    where not exists (
      select 1
      from dry_run_rejections r
      where r.entity_name = s.entity_name
        and r.old_id = s.old_id
        and (r.target_table = t.target_table or r.target_table is null)
    )
  ) as accepted_count,
  count(s.old_id) filter (
    where exists (
      select 1
      from dry_run_rejections r
      where r.entity_name = s.entity_name
        and r.old_id = s.old_id
        and (r.target_table = t.target_table or r.target_table is null)
    )
  ) as rejected_count
from dry_run_entity_targets t
left join migration_staging.old_hopex_app_records s
  on s.entity_name = t.source_entity
where t.target_table <> 'none'
group by t.source_entity, t.target_table
order by t.source_entity, t.target_table;

select
  source_entity,
  target_table,
  candidate_count,
  accepted_count,
  rejected_count
from dry_run_counts
order by source_entity, target_table;

select
  entity_name,
  target_table,
  reason,
  count(*)::bigint as rejected_count
from dry_run_rejections
group by entity_name, target_table, reason
order by rejected_count desc, entity_name, target_table, reason;

-- Duplicate checks.
select
  'shipment_tracking_number_duplicates' as check_name,
  tracking_number,
  count(*)::bigint as duplicate_count
from dry_run_shipments
where tracking_number is not null
group by tracking_number
having count(*) > 1
order by duplicate_count desc, tracking_number;

select
  'customer_email_duplicates' as check_name,
  email,
  count(*)::bigint as duplicate_count
from dry_run_customers
where email is not null
group by email
having count(*) > 1
order by duplicate_count desc, email;

select
  'customer_phone_duplicates' as check_name,
  phone,
  count(*)::bigint as duplicate_count
from dry_run_customers
where phone is not null
group by phone
having count(*) > 1
order by duplicate_count desc, phone;

select
  'invoice_number_duplicates' as check_name,
  invoice_number,
  count(*)::bigint as duplicate_count
from dry_run_invoices
where invoice_number is not null
group by invoice_number
having count(*) > 1
order by duplicate_count desc, invoice_number;

-- Target collision checks against existing V2 data.
select
  'target_shipment_tracking_collisions' as check_name,
  s.tracking_number,
  count(*)::bigint as source_count
from dry_run_shipments s
where exists (
  select 1
  from public.shipments target
  where target.company_id = s.company_id
    and target.tracking_number = s.tracking_number
)
group by s.tracking_number
order by s.tracking_number;

select
  'target_invoice_number_collisions' as check_name,
  i.invoice_number,
  count(*)::bigint as source_count
from dry_run_invoices i
where exists (
  select 1
  from public.invoices target
  where target.company_id = i.company_id
    and target.invoice_number = i.invoice_number
)
group by i.invoice_number
order by i.invoice_number;

-- Line item expansion readiness.
select
  'invoice_line_item_candidates' as metric,
  count(*)::bigint as line_item_count
from dry_run_invoices i
cross join lateral jsonb_array_elements(coalesce(i.data->'line_items', '[]'::jsonb)) item
where i.has_line_items;

select
  'journal_line_candidates' as metric,
  count(*)::bigint as line_count
from dry_run_journals j
cross join lateral jsonb_array_elements(coalesce(j.data->'lines', '[]'::jsonb)) line
where j.has_lines;

-- No persistence in Sprint 3.
rollback;
