create or replace function public.post_invoice_transaction(target_invoice_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  invoice_row public.invoices%rowtype;
  journal_id uuid;
  ar_id uuid;
  revenue_id uuid;
  vat_id uuid;
  revenue_amount numeric(12,2);
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into invoice_row from public.invoices where id = target_invoice_id for update;
  if invoice_row.id is null then raise exception 'Invoice not found' using errcode = 'P0002'; end if;
  if not public.is_company_member(invoice_row.company_id) then raise exception 'Invoice belongs to another company' using errcode = '42501'; end if;
  if not (public.user_has_permission(invoice_row.company_id, 'invoices.post') or public.user_has_permission(invoice_row.company_id, 'accounting.manage')) then
    raise exception 'Invoice posting permission required' using errcode = '42501';
  end if;
  if invoice_row.journal_entry_id is not null then return invoice_row.journal_entry_id; end if;
  if invoice_row.total_amount <= 0 then raise exception 'Invoice total must be positive'; end if;

  select
    (max(id::text) filter (where account_code = '1100'))::uuid,
    (max(id::text) filter (where account_code = '4000'))::uuid,
    (max(id::text) filter (where account_code in ('2110','2100')))::uuid
  into ar_id, revenue_id, vat_id
  from public.chart_of_accounts
  where company_id = invoice_row.company_id and is_active = true;
  if ar_id is null or revenue_id is null or (invoice_row.tax_amount > 0 and vat_id is null) then raise exception 'Required invoice accounts are missing'; end if;

  revenue_amount := invoice_row.total_amount - invoice_row.tax_amount;
  insert into public.journal_entries (company_id,entry_number,entry_date,description,reference_module,reference_id,status,created_by)
  values (invoice_row.company_id,'JE-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),current_date,'Invoice ' || invoice_row.invoice_number || ' posted','invoices',invoice_row.id,'draft',auth.uid())
  returning id into journal_id;
  insert into public.journal_entry_lines (company_id,journal_entry_id,account_id,description,debit,credit,created_by)
  values
    (invoice_row.company_id,journal_id,ar_id,'Invoice receivable',invoice_row.total_amount,0,auth.uid()),
    (invoice_row.company_id,journal_id,revenue_id,'Shipment revenue',0,revenue_amount,auth.uid());
  if invoice_row.tax_amount > 0 then
    insert into public.journal_entry_lines (company_id,journal_entry_id,account_id,description,debit,credit,created_by)
    values (invoice_row.company_id,journal_id,vat_id,'VAT payable',0,invoice_row.tax_amount,auth.uid());
  end if;
  perform public.post_journal_entry(journal_id);
  update public.invoices set status = 'sent', posted_at = now(), journal_entry_id = journal_id where id = invoice_row.id and company_id = invoice_row.company_id;
  insert into public.customer_ledger (company_id,customer_id,transaction_type,reference_module,reference_id,debit,credit,balance,created_by)
  values (invoice_row.company_id,invoice_row.customer_id,'invoice','invoices',invoice_row.id,invoice_row.total_amount,0,invoice_row.total_amount,auth.uid());
  insert into public.audit_logs (company_id,actor_id,action,table_name,record_id,created_by)
  values (invoice_row.company_id,auth.uid(),'invoice.posted','invoices',invoice_row.id,auth.uid());
  return journal_id;
end;
$$;

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

create or replace function public.post_expense_transaction(target_expense_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  expense_row public.expenses%rowtype;
  journal_id uuid;
  bank_id uuid;
  expense_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into expense_row from public.expenses where id = target_expense_id for update;
  if expense_row.id is null then raise exception 'Expense not found' using errcode = 'P0002'; end if;
  if not public.is_company_member(expense_row.company_id) then raise exception 'Expense belongs to another company' using errcode = '42501'; end if;
  if not (public.user_has_permission(expense_row.company_id, 'expenses.approve') or public.user_has_permission(expense_row.company_id, 'accounting.manage')) then raise exception 'Expense posting permission required' using errcode = '42501'; end if;
  if expense_row.journal_entry_id is not null then return expense_row.journal_entry_id; end if;
  if expense_row.total_amount <= 0 then raise exception 'Expense total must be positive'; end if;
  select (max(id::text) filter (where account_code = '1010'))::uuid, (max(id::text) filter (where account_code in ('5090','5000')))::uuid into bank_id, expense_id from public.chart_of_accounts where company_id = expense_row.company_id and is_active = true;
  if bank_id is null or expense_id is null then raise exception 'Required expense accounts are missing'; end if;
  insert into public.journal_entries (company_id,entry_number,entry_date,description,reference_module,reference_id,status,created_by)
  values (expense_row.company_id,'JE-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),current_date,'[' || expense_row.currency || '] Expense ' || expense_row.expense_number || ' paid','expenses',expense_row.id,'draft',auth.uid()) returning id into journal_id;
  insert into public.journal_entry_lines (company_id,journal_entry_id,account_id,debit,credit,created_by) values
    (expense_row.company_id,journal_id,expense_id,expense_row.total_amount,0,auth.uid()),(expense_row.company_id,journal_id,bank_id,0,expense_row.total_amount,auth.uid());
  perform public.post_journal_entry(journal_id);
  update public.expenses set status = 'paid',paid_at = now(),journal_entry_id = journal_id where id = expense_row.id and company_id = expense_row.company_id;
  insert into public.audit_logs (company_id,actor_id,action,table_name,record_id,created_by) values (expense_row.company_id,auth.uid(),'expense.paid','expenses',expense_row.id,auth.uid());
  return journal_id;
end;
$$;
