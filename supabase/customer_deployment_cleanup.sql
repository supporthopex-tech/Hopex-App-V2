-- Customer deployment cleanup script.
-- Run manually in the target Supabase SQL editor after setting exactly one
-- administrator to keep. This deletes operational/sample data only; it does
-- not alter schema, roles, permissions, module settings, integrations, or app
-- configuration tables.
--
-- REQUIRED: replace one of these values before running.
-- Example:
--   select set_config('hopex.keep_admin_email', 'admin@customer.com', false);
--   select set_config('hopex.keep_admin_user_id', '', false);

begin;

select set_config('hopex.keep_admin_email', 'REPLACE_WITH_ADMIN_EMAIL', false);
select set_config('hopex.keep_admin_user_id', '', false);

create temp table cleanup_keep_admin as
select u.id
from auth.users u
where (
    nullif(current_setting('hopex.keep_admin_user_id', true), '') is not null
    and u.id = nullif(current_setting('hopex.keep_admin_user_id', true), '')::uuid
  )
  or lower(u.email) = lower(nullif(current_setting('hopex.keep_admin_email', true), ''));

do $$
begin
  if (select count(*) from cleanup_keep_admin) <> 1 then
    raise exception 'Cleanup aborted: exactly one administrator must match keep_admin_email or keep_admin_user_id.';
  end if;
end $$;

create or replace function pg_temp.cleanup_delete_all(table_name text)
returns void
language plpgsql
as $$
begin
  if to_regclass('public.' || table_name) is not null then
    execute format('delete from public.%I', table_name);
  end if;
end $$;

-- Documents, attachments, logs, tracking history, and child records.
select pg_temp.cleanup_delete_all('packing_list_items');
select pg_temp.cleanup_delete_all('packing_list_boxes');
select pg_temp.cleanup_delete_all('packing_lists');
select pg_temp.cleanup_delete_all('shipment_documents');
select pg_temp.cleanup_delete_all('shipment_status_logs');
select pg_temp.cleanup_delete_all('shipment_events');
select pg_temp.cleanup_delete_all('shipment_pricing');
select pg_temp.cleanup_delete_all('quote_documents');
select pg_temp.cleanup_delete_all('quote_status_logs');
select pg_temp.cleanup_delete_all('quote_items');
select pg_temp.cleanup_delete_all('customer_activity_logs');
select pg_temp.cleanup_delete_all('customer_notes');
select pg_temp.cleanup_delete_all('customer_contacts');
select pg_temp.cleanup_delete_all('task_attachments');
select pg_temp.cleanup_delete_all('task_comments');
select pg_temp.cleanup_delete_all('task_status_logs');
select pg_temp.cleanup_delete_all('approval_history');
select pg_temp.cleanup_delete_all('notifications');
select pg_temp.cleanup_delete_all('audit_logs');
select pg_temp.cleanup_delete_all('website_tracking_events');
select pg_temp.cleanup_delete_all('password_audit_logs');
select pg_temp.cleanup_delete_all('api_rate_limits');
select pg_temp.cleanup_delete_all('api_idempotency_keys');

-- Communications operational records. Account/template/settings tables are
-- preserved as configuration.
select pg_temp.cleanup_delete_all('email_attachments');
select pg_temp.cleanup_delete_all('email_logs');
select pg_temp.cleanup_delete_all('email_messages');
select pg_temp.cleanup_delete_all('whatsapp_logs');
select pg_temp.cleanup_delete_all('whatsapp_messages');
select pg_temp.cleanup_delete_all('customer_messages');
select pg_temp.cleanup_delete_all('quote_requests');
select pg_temp.cleanup_delete_all('invitation_tokens');

-- Accounting transactional records. Configuration such as chart_of_accounts,
-- accounting_settings, tax_rates, bank/cash account setup, and automation
-- rules is intentionally preserved.
select pg_temp.cleanup_delete_all('payment_allocations');
select pg_temp.cleanup_delete_all('invoice_items');
select pg_temp.cleanup_delete_all('journal_entry_lines');
select pg_temp.cleanup_delete_all('journal_entries');
select pg_temp.cleanup_delete_all('customer_ledger');
select pg_temp.cleanup_delete_all('supplier_ledger');
select pg_temp.cleanup_delete_all('tax_transactions');
select pg_temp.cleanup_delete_all('petty_cash_transactions');
select pg_temp.cleanup_delete_all('bank_reconciliation');
select pg_temp.cleanup_delete_all('supplier_bills');
select pg_temp.cleanup_delete_all('payments');
select pg_temp.cleanup_delete_all('invoices');
select pg_temp.cleanup_delete_all('expenses');
select pg_temp.cleanup_delete_all('reports');
select pg_temp.cleanup_delete_all('approvals');

-- Core operational modules.
select pg_temp.cleanup_delete_all('tasks');
select pg_temp.cleanup_delete_all('quotes');
select pg_temp.cleanup_delete_all('shipments');
select pg_temp.cleanup_delete_all('customers');

-- Remove demo staff and user-level preferences while retaining exactly one
-- administrator account.
delete from public.staff_permissions
where staff_id not in (select id from public.staff where user_id in (select id from cleanup_keep_admin));

delete from public.staff
where user_id is null or user_id not in (select id from cleanup_keep_admin);

delete from public.notification_settings
where user_id not in (select id from cleanup_keep_admin);

delete from public.user_settings
where user_id not in (select id from cleanup_keep_admin);

delete from public.onboarding_progress
where user_id not in (select id from cleanup_keep_admin);

delete from public.company_users
where user_id not in (select id from cleanup_keep_admin);

delete from public.profiles
where id not in (select id from cleanup_keep_admin);

delete from auth.users
where id not in (select id from cleanup_keep_admin);

commit;
