-- Sprint 3 dry-run validation.
-- Run on NEW Hopex V2 target project only.
-- This script is read-only and does not migrate data.

begin read only;

select 'target_company_exists' as check_name, count(*)::bigint as count
from public.companies
where id = '6d19adf9-570f-46c3-8476-dfab624248b3';

select 'target_business_rows_before_import' as check_name, sum(row_count)::bigint as count
from (
  select count(*) as row_count from public.company_users
  union all select count(*) from public.profiles
  union all select count(*) from public.staff
  union all select count(*) from public.staff_permissions
  union all select count(*) from public.customers
  union all select count(*) from public.customer_contacts
  union all select count(*) from public.customer_notes
  union all select count(*) from public.customer_activity_logs
  union all select count(*) from public.shipments
  union all select count(*) from public.shipment_items
  union all select count(*) from public.shipment_tracking
  union all select count(*) from public.shipment_events
  union all select count(*) from public.shipment_status_logs
  union all select count(*) from public.shipment_documents
  union all select count(*) from public.quote_requests
  union all select count(*) from public.quote_items
  union all select count(*) from public.quote_status_logs
  union all select count(*) from public.quote_documents
  union all select count(*) from public.quotes
  union all select count(*) from public.invoices
  union all select count(*) from public.invoice_items
  union all select count(*) from public.payments
  union all select count(*) from public.payment_allocations
  union all select count(*) from public.expenses
  union all select count(*) from public.journal_entries
  union all select count(*) from public.journal_entry_lines
  union all select count(*) from public.tasks
  union all select count(*) from public.task_comments
  union all select count(*) from public.task_attachments
  union all select count(*) from public.task_status_logs
  union all select count(*) from public.notifications
  union all select count(*) from public.whatsapp_logs
) business_counts;

select
  table_name,
  row_count
from (
  select 'company_users' as table_name, count(*)::bigint as row_count from public.company_users
  union all select 'profiles', count(*) from public.profiles
  union all select 'staff', count(*) from public.staff
  union all select 'staff_permissions', count(*) from public.staff_permissions
  union all select 'customers', count(*) from public.customers
  union all select 'shipments', count(*) from public.shipments
  union all select 'shipment_items', count(*) from public.shipment_items
  union all select 'shipment_tracking', count(*) from public.shipment_tracking
  union all select 'shipment_events', count(*) from public.shipment_events
  union all select 'shipment_status_logs', count(*) from public.shipment_status_logs
  union all select 'quote_requests', count(*) from public.quote_requests
  union all select 'quote_items', count(*) from public.quote_items
  union all select 'quotes', count(*) from public.quotes
  union all select 'invoices', count(*) from public.invoices
  union all select 'invoice_items', count(*) from public.invoice_items
  union all select 'payments', count(*) from public.payments
  union all select 'payment_allocations', count(*) from public.payment_allocations
  union all select 'expenses', count(*) from public.expenses
  union all select 'journal_entries', count(*) from public.journal_entries
  union all select 'journal_entry_lines', count(*) from public.journal_entry_lines
  union all select 'tasks', count(*) from public.tasks
  union all select 'notifications', count(*) from public.notifications
  union all select 'whatsapp_logs', count(*) from public.whatsapp_logs
) counts
order by table_name;

select 'public_tables_without_rls' as check_name, count(*)::bigint as count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and not c.relrowsecurity;

select
  'required_storage_buckets' as check_name,
  count(*)::bigint as count
from storage.buckets
where id in (
  'company-assets',
  'company-logos',
  'email-attachments',
  'profile-images',
  'profile-photos',
  'quote-documents',
  'settings-assets',
  'shipment-documents',
  'staff-documents',
  'task-attachments'
);

select
  id as bucket_id,
  public,
  count(o.id)::bigint as object_count,
  coalesce(sum((o.metadata->>'size')::bigint), 0)::bigint as total_bytes
from storage.buckets b
left join storage.objects o on o.bucket_id = b.id
group by b.id, b.public
order by b.id;

select 'roles' as check_name, count(*)::bigint as count
from public.roles
where company_id = '6d19adf9-570f-46c3-8476-dfab624248b3';

select 'permissions' as check_name, count(*)::bigint as count
from public.permissions;

select 'role_permissions' as check_name, count(*)::bigint as count
from public.role_permissions
where company_id = '6d19adf9-570f-46c3-8476-dfab624248b3';

select
  'missing_required_indexes' as check_name,
  count(*)::bigint as count
from (
  values
    ('shipments_company_tracking_idx'),
    ('shipment_items_company_shipment_idx'),
    ('shipment_tracking_company_shipment_idx'),
    ('shipment_tracking_number_idx'),
    ('customers_company_status_idx'),
    ('invoices_company_status_idx'),
    ('tasks_company_status_idx'),
    ('staff_company_user_idx')
) expected(index_name)
where not exists (
  select 1
  from pg_indexes i
  where i.schemaname = 'public'
    and i.indexname = expected.index_name
);

select
  'missing_required_foreign_keys' as check_name,
  count(*)::bigint as count
from (
  values
    ('shipments', 'customer_id'),
    ('shipment_items', 'shipment_id'),
    ('shipment_tracking', 'shipment_id'),
    ('shipment_events', 'shipment_id'),
    ('shipment_status_logs', 'shipment_id'),
    ('invoices', 'customer_id'),
    ('invoices', 'shipment_id'),
    ('invoice_items', 'invoice_id'),
    ('payments', 'invoice_id'),
    ('payment_allocations', 'payment_id'),
    ('payment_allocations', 'invoice_id'),
    ('journal_entry_lines', 'journal_entry_id'),
    ('journal_entry_lines', 'account_id'),
    ('company_users', 'user_id'),
    ('staff', 'user_id')
) expected(table_name, column_name)
where not exists (
  select 1
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on kcu.constraint_schema = tc.constraint_schema
   and kcu.constraint_name = tc.constraint_name
   and kcu.table_schema = tc.table_schema
   and kcu.table_name = tc.table_name
  where tc.table_schema = 'public'
    and tc.constraint_type = 'FOREIGN KEY'
    and tc.table_name = expected.table_name
    and kcu.column_name = expected.column_name
);

select
  'rls_policies_using_auth_role' as check_name,
  count(*)::bigint as count
from pg_policies
where schemaname = 'public'
  and (
    coalesce(qual, '') ilike '%auth.role()%'
    or coalesce(with_check, '') ilike '%auth.role()%'
  );

commit;
