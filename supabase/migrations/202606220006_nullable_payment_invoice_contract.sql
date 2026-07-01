drop function if exists public.post_payment_transaction(uuid,text,text,uuid,numeric,text,text,date,text);
drop function if exists public.post_payment_transaction(uuid,text,text,text,numeric,text,text,date,text);

create or replace function public.post_payment_transaction(
  target_company_id uuid,
  target_payment_number text,
  target_payment_type text,
  target_invoice_id text,
  target_amount numeric,
  target_currency text,
  target_payment_method text,
  target_payment_date date,
  target_reference text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  payment_id uuid;
  journal_id uuid;
  bank_id uuid;
  counterparty_id uuid;
  invoice_row public.invoices%rowtype;
  invoice_uuid uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if not public.is_company_member(target_company_id) then raise exception 'Company membership required' using errcode = '42501'; end if;
  if not (public.user_has_permission(target_company_id, 'payments.create') or public.user_has_permission(target_company_id, 'accounting.manage')) then raise exception 'Payment permission required' using errcode = '42501'; end if;
  if target_amount <= 0 then raise exception 'Payment amount must be positive'; end if;
  invoice_uuid := nullif(target_invoice_id,'')::uuid;
  if invoice_uuid is not null then
    select * into invoice_row from public.invoices where id = invoice_uuid and company_id = target_company_id for update;
    if invoice_row.id is null then raise exception 'Invoice not found for this company'; end if;
  end if;
  select
    (max(id::text) filter (where account_code = '1010'))::uuid,
    (max(id::text) filter (where account_code = case when target_payment_type = 'supplier' then '2000' else '1100' end))::uuid
  into bank_id, counterparty_id
  from public.chart_of_accounts where company_id = target_company_id and is_active = true;
  if bank_id is null or counterparty_id is null then raise exception 'Required payment accounts are missing'; end if;

  insert into public.payments (company_id,payment_number,payment_type,invoice_id,amount,currency,payment_method,payment_date,status,reference,created_by)
  values (target_company_id,target_payment_number,target_payment_type,invoice_uuid,target_amount,target_currency,target_payment_method,target_payment_date,'posted',target_reference,auth.uid())
  returning id into payment_id;
  insert into public.journal_entries (company_id,entry_number,entry_date,description,reference_module,reference_id,status,created_by)
  values (target_company_id,'JE-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),target_payment_date,'[' || target_currency || '] Payment ' || target_payment_number,'payments',payment_id,'draft',auth.uid())
  returning id into journal_id;
  if target_payment_type = 'supplier' then
    insert into public.journal_entry_lines (company_id,journal_entry_id,account_id,debit,credit,created_by) values
      (target_company_id,journal_id,counterparty_id,target_amount,0,auth.uid()),(target_company_id,journal_id,bank_id,0,target_amount,auth.uid());
  else
    insert into public.journal_entry_lines (company_id,journal_entry_id,account_id,debit,credit,created_by) values
      (target_company_id,journal_id,bank_id,target_amount,0,auth.uid()),(target_company_id,journal_id,counterparty_id,0,target_amount,auth.uid());
  end if;
  perform public.post_journal_entry(journal_id);
  update public.payments set journal_entry_id = journal_id where id = payment_id and company_id = target_company_id;
  if invoice_uuid is not null then
    insert into public.payment_allocations (company_id,payment_id,invoice_id,amount,created_by) values (target_company_id,payment_id,invoice_uuid,target_amount,auth.uid());
    update public.invoices set paid_amount = least(total_amount,paid_amount + target_amount), balance_due = greatest(0,total_amount - paid_amount - target_amount), status = case when paid_amount + target_amount >= total_amount then 'paid' else 'partially_paid' end where id = invoice_uuid and company_id = target_company_id;
  end if;
  insert into public.audit_logs (company_id,actor_id,action,table_name,record_id,created_by) values (target_company_id,auth.uid(),'payment.created','payments',payment_id,auth.uid());
  return payment_id;
end;
$$;

grant execute on function public.post_payment_transaction(uuid,text,text,text,numeric,text,text,date,text) to authenticated;
revoke execute on function public.post_payment_transaction(uuid,text,text,text,numeric,text,text,date,text) from anon, public;

