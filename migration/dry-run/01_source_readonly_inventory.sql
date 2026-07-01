-- Sprint 3 source inventory.
-- Run on OLD Hopex production project only: exnxwhqolekycrblqchp.
-- This script is read-only. It must not update, delete, insert, truncate, alter, or copy data.

begin read only;

select 'source_project_ref' as item, 'exnxwhqolekycrblqchp' as value;

-- 01. Database object summary.
select
  'public_tables' as metric,
  count(*)::bigint as count
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
union all
select 'public_rls_enabled_tables', count(*)
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity
union all
select 'public_policies', count(*)
from pg_policies
where schemaname = 'public'
union all
select 'public_indexes', count(*)
from pg_indexes
where schemaname = 'public'
union all
select 'public_triggers', count(*)
from information_schema.triggers
where trigger_schema = 'public'
union all
select 'public_functions', count(*)
from information_schema.routines
where routine_schema = 'public'
union all
select 'storage_buckets', count(*)
from storage.buckets;

-- 02. Table-by-table row counts.
select
  table_schema,
  table_name,
  (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text::bigint as row_count
from information_schema.tables
where table_schema in ('public')
  and table_type = 'BASE TABLE'
order by table_schema, table_name;

-- 03. Column-by-column source schema.
select
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default,
  character_maximum_length,
  numeric_precision,
  numeric_scale,
  datetime_precision
from information_schema.columns
where table_schema = 'public'
order by table_schema, table_name, ordinal_position;

-- 04. Index inventory.
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

-- 05. Constraints, including primary keys, unique constraints, checks, and foreign keys.
select
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' order by kcu.ordinal_position) as columns,
  cc.check_clause
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on kcu.constraint_schema = tc.constraint_schema
 and kcu.constraint_name = tc.constraint_name
 and kcu.table_schema = tc.table_schema
 and kcu.table_name = tc.table_name
left join information_schema.check_constraints cc
  on cc.constraint_schema = tc.constraint_schema
 and cc.constraint_name = tc.constraint_name
where tc.table_schema = 'public'
group by tc.table_schema, tc.table_name, tc.constraint_name, tc.constraint_type, cc.check_clause
order by tc.table_name, tc.constraint_type, tc.constraint_name;

select
  tc.constraint_name,
  tc.table_schema as source_schema,
  tc.table_name as source_table,
  kcu.column_name as source_column,
  ccu.table_schema as referenced_schema,
  ccu.table_name as referenced_table,
  ccu.column_name as referenced_column,
  rc.update_rule,
  rc.delete_rule
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on kcu.constraint_schema = tc.constraint_schema
 and kcu.constraint_name = tc.constraint_name
join information_schema.constraint_column_usage ccu
  on ccu.constraint_schema = tc.constraint_schema
 and ccu.constraint_name = tc.constraint_name
join information_schema.referential_constraints rc
  on rc.constraint_schema = tc.constraint_schema
 and rc.constraint_name = tc.constraint_name
where tc.table_schema = 'public'
  and tc.constraint_type = 'FOREIGN KEY'
order by tc.table_name, tc.constraint_name, kcu.ordinal_position;

-- 06. RLS and policy inventory.
select
  n.nspname as table_schema,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 07. Base44 entity counts and row windows.
select
  entity_name,
  count(*)::bigint as record_count,
  min(created_at) as first_created_at,
  max(updated_at) as last_updated_at
from public.app_records
group by entity_name
order by entity_name;

-- 08. JSON key inventory with observed types.
with pairs as (
  select
    entity_name,
    key,
    jsonb_typeof(value) as value_type
  from public.app_records
  cross join lateral jsonb_each(data)
)
select
  entity_name,
  key,
  array_agg(distinct value_type order by value_type) as observed_json_types,
  count(*)::bigint as rows_with_key
from pairs
group by entity_name, key
order by entity_name, key;

-- 09. Candidate duplicate identifiers.
select
  'shipment_tracking_number' as check_name,
  coalesce(data->>'tracking_number', data->>'shipment_tracking') as identifier,
  count(*)::bigint as duplicate_count
from public.app_records
where entity_name = 'Shipment'
  and nullif(coalesce(data->>'tracking_number', data->>'shipment_tracking'), '') is not null
group by coalesce(data->>'tracking_number', data->>'shipment_tracking')
having count(*) > 1
order by duplicate_count desc, identifier;

select
  'customer_email' as check_name,
  lower(nullif(data->>'email', '')) as identifier,
  count(*)::bigint as duplicate_count
from public.app_records
where entity_name = 'Customer'
  and nullif(data->>'email', '') is not null
group by lower(nullif(data->>'email', ''))
having count(*) > 1
order by duplicate_count desc, identifier;

select
  'invoice_number' as check_name,
  nullif(data->>'invoice_number', '') as identifier,
  count(*)::bigint as duplicate_count
from public.app_records
where entity_name = 'CargoInvoice'
  and nullif(data->>'invoice_number', '') is not null
group by nullif(data->>'invoice_number', '')
having count(*) > 1
order by duplicate_count desc, identifier;

-- 10. Storage inventory. Object-level rows can be exported to secure local staging if needed.
select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
from storage.buckets
order by id;

select
  bucket_id,
  count(*)::bigint as object_count,
  coalesce(sum((metadata->>'size')::bigint), 0)::bigint as total_bytes,
  min(created_at) as first_created_at,
  max(updated_at) as last_updated_at
from storage.objects
group by bucket_id
order by bucket_id;

select
  bucket_id,
  name,
  owner,
  metadata->>'mimetype' as mime_type,
  (metadata->>'size')::bigint as size_bytes,
  created_at,
  updated_at
from storage.objects
order by bucket_id, name;

-- 11. Auth/profile counts only. Password hashes are never exported or migrated.
select 'auth_users' as metric, count(*)::bigint as count
from auth.users
union all
select 'profiles', count(*)
from public.profiles;

select
  lower(u.email) as email,
  u.id as old_auth_user_id,
  u.created_at as auth_created_at,
  p.id as profile_id,
  p.created_at as profile_created_at
from auth.users u
left join public.profiles p on p.id = u.id
order by lower(u.email);

commit;
