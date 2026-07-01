-- Run on NEW Hopex Supabase project after import.

select 'companies' as check_name, count(*) as count
from public.companies
where id = '6d19adf9-570f-46c3-8476-dfab624248b3';

select 'company_users' as check_name, count(*) as count
from public.company_users
where company_id = '6d19adf9-570f-46c3-8476-dfab624248b3';

select 'staff' as check_name, count(*) as count
from public.staff
where company_id = '6d19adf9-570f-46c3-8476-dfab624248b3';

select 'customers' as check_name, count(*) as count
from public.customers
where company_id = '6d19adf9-570f-46c3-8476-dfab624248b3';

select 'shipments' as check_name, count(*) as count
from public.shipments
where company_id = '6d19adf9-570f-46c3-8476-dfab624248b3';

select 'invoices' as check_name, count(*) as count
from public.invoices
where company_id = '6d19adf9-570f-46c3-8476-dfab624248b3';

select 'migration_log' as check_name, count(*) as count
from migration_staging.migration_log;

select 'migration_rejections' as check_name, count(*) as count
from migration_staging.migration_rejections;

select entity_name, reason, count(*) as rejected_count
from migration_staging.migration_rejections
group by entity_name, reason
order by rejected_count desc;
