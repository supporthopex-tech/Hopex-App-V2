-- Sprint 3 target schema snapshot.
-- Run on NEW Hopex V2 target project only: ozgeatgwgnpcfnzjhqit.
-- Read-only inspection. This script does not modify target data.

begin read only;

select 'target_project_ref' as item, 'ozgeatgwgnpcfnzjhqit' as value;
select 'target_company_id' as item, '6d19adf9-570f-46c3-8476-dfab624248b3' as value;

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
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_schema, table_name;

-- 03. Column-by-column target schema.
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

-- 07. Required migration target row counts.
select 'companies' as table_name, count(*)::bigint as row_count from public.companies
union all select 'company_users', count(*) from public.company_users
union all select 'profiles', count(*) from public.profiles
union all select 'staff', count(*) from public.staff
union all select 'staff_permissions', count(*) from public.staff_permissions
union all select 'customers', count(*) from public.customers
union all select 'customer_contacts', count(*) from public.customer_contacts
union all select 'customer_notes', count(*) from public.customer_notes
union all select 'customer_activity_logs', count(*) from public.customer_activity_logs
union all select 'shipments', count(*) from public.shipments
union all select 'shipment_items', count(*) from public.shipment_items
union all select 'shipment_tracking', count(*) from public.shipment_tracking
union all select 'shipment_events', count(*) from public.shipment_events
union all select 'shipment_status_logs', count(*) from public.shipment_status_logs
union all select 'shipment_documents', count(*) from public.shipment_documents
union all select 'quote_requests', count(*) from public.quote_requests
union all select 'quote_items', count(*) from public.quote_items
union all select 'quote_status_logs', count(*) from public.quote_status_logs
union all select 'quote_documents', count(*) from public.quote_documents
union all select 'quotes', count(*) from public.quotes
union all select 'invoices', count(*) from public.invoices
union all select 'invoice_items', count(*) from public.invoice_items
union all select 'payments', count(*) from public.payments
union all select 'payment_allocations', count(*) from public.payment_allocations
union all select 'expenses', count(*) from public.expenses
union all select 'chart_of_accounts', count(*) from public.chart_of_accounts
union all select 'bank_accounts', count(*) from public.bank_accounts
union all select 'journal_entries', count(*) from public.journal_entries
union all select 'journal_entry_lines', count(*) from public.journal_entry_lines
union all select 'tasks', count(*) from public.tasks
union all select 'task_comments', count(*) from public.task_comments
union all select 'task_attachments', count(*) from public.task_attachments
union all select 'task_status_logs', count(*) from public.task_status_logs
union all select 'notifications', count(*) from public.notifications
union all select 'whatsapp_logs', count(*) from public.whatsapp_logs
union all select 'audit_logs', count(*) from public.audit_logs
union all select 'roles', count(*) from public.roles
union all select 'permissions', count(*) from public.permissions
union all select 'role_permissions', count(*) from public.role_permissions
order by table_name;

-- 08. Storage inventory.
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

commit;
