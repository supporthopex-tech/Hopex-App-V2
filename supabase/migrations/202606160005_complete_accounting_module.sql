alter table public.company_settings
  add column if not exists accounting_settings jsonb not null default '{"invoice_prefix":"INV","tax_enabled":true,"default_tax_rate":5,"auto_invoice_shipments":true}';

alter table public.invoices
  add column if not exists quote_id uuid references public.quote_requests(id) on delete set null,
  add column if not exists issue_date date not null default current_date,
  add column if not exists currency text not null default 'USD',
  add column if not exists subtotal numeric(12,2) not null default 0,
  add column if not exists tax_amount numeric(12,2) not null default 0,
  add column if not exists discount_amount numeric(12,2) not null default 0,
  add column if not exists total_amount numeric(12,2) not null default 0,
  add column if not exists paid_amount numeric(12,2) not null default 0,
  add column if not exists balance_due numeric(12,2) not null default 0,
  add column if not exists posted_at timestamptz,
  add column if not exists journal_entry_id uuid;

update public.invoices
set total_amount = case when total_amount = 0 then amount else total_amount end,
    subtotal = case when subtotal = 0 then amount else subtotal end,
    balance_due = case when balance_due = 0 then greatest(coalesce(amount, 0) - coalesce(paid_amount, 0), 0) else balance_due end
where true;

alter table public.payments
  add column if not exists payment_number text,
  add column if not exists payment_type text not null default 'customer',
  add column if not exists customer_id uuid references public.customers(id) on delete set null,
  add column if not exists supplier_id uuid,
  add column if not exists currency text not null default 'USD',
  add column if not exists payment_method text,
  add column if not exists bank_account_id uuid,
  add column if not exists payment_date date not null default current_date,
  add column if not exists reversed_at timestamptz,
  add column if not exists journal_entry_id uuid;

update public.payments
set payment_method = coalesce(payment_method, method),
    payment_number = coalesce(payment_number, 'PAY-' || substring(id::text from 1 for 8))
where true;

alter table public.expenses
  add column if not exists expense_number text,
  add column if not exists supplier_id uuid,
  add column if not exists expense_category_id uuid,
  add column if not exists description text,
  add column if not exists currency text not null default 'USD',
  add column if not exists tax_amount numeric(12,2) not null default 0,
  add column if not exists total_amount numeric(12,2) not null default 0,
  add column if not exists payment_method text,
  add column if not exists bank_account_id uuid,
  add column if not exists receipt_url text,
  add column if not exists approved_at timestamptz,
  add column if not exists journal_entry_id uuid;

update public.expenses
set expense_number = coalesce(expense_number, 'EXP-' || substring(id::text from 1 for 8)),
    total_amount = case when total_amount = 0 then amount + coalesce(tax_amount, 0) else total_amount end,
    status = case when status = 'pending' then 'submitted' else status end
where true;

create table if not exists public.chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  account_code text not null,
  account_name text not null,
  account_type text not null,
  normal_balance text not null check (normal_balance in ('debit','credit')),
  parent_account_id uuid references public.chart_of_accounts(id) on delete set null,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, account_code)
);

create table if not exists public.accounting_periods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'open',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  entry_number text not null,
  entry_date date not null default current_date,
  description text not null,
  status text not null default 'draft',
  reference_module text,
  reference_id uuid,
  posted_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, entry_number)
);

create table if not exists public.journal_entry_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  description text,
  debit numeric(12,2) not null default 0,
  credit numeric(12,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (debit >= 0 and credit >= 0 and not (debit > 0 and credit > 0))
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  tax_rate numeric(6,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  amount numeric(12,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  account_id uuid references public.chart_of_accounts(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, name)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  supplier_name text not null,
  phone text,
  email text,
  address text,
  status text not null default 'active',
  balance numeric(12,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_bills (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  bill_number text not null,
  bill_date date not null default current_date,
  due_date date,
  currency text not null default 'USD',
  subtotal numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  balance_due numeric(12,2) not null default 0,
  status text not null default 'draft',
  journal_entry_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, bill_number)
);

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  account_name text not null,
  bank_name text,
  account_number text,
  currency text not null default 'USD',
  opening_balance numeric(12,2) not null default 0,
  current_balance numeric(12,2) not null default 0,
  chart_account_id uuid references public.chart_of_accounts(id) on delete set null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cash_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  account_name text not null,
  currency text not null default 'USD',
  opening_balance numeric(12,2) not null default 0,
  current_balance numeric(12,2) not null default 0,
  chart_account_id uuid references public.chart_of_accounts(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.petty_cash_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  cash_account_id uuid references public.cash_accounts(id) on delete set null,
  transaction_type text not null,
  amount numeric(12,2) not null default 0,
  description text,
  status text not null default 'draft',
  reconciled_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_rates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  rate numeric(6,2) not null default 0,
  tax_account_id uuid references public.chart_of_accounts(id) on delete set null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tax_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tax_rate_id uuid references public.tax_rates(id) on delete set null,
  reference_module text,
  reference_id uuid,
  taxable_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  transaction_type text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_ledger (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  transaction_date date not null default current_date,
  transaction_type text not null,
  reference_module text,
  reference_id uuid,
  debit numeric(12,2) not null default 0,
  credit numeric(12,2) not null default 0,
  balance numeric(12,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_ledger (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  transaction_date date not null default current_date,
  transaction_type text not null,
  reference_module text,
  reference_id uuid,
  debit numeric(12,2) not null default 0,
  credit numeric(12,2) not null default 0,
  balance numeric(12,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounting_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  invoice_prefix text not null default 'INV',
  payment_prefix text not null default 'PAY',
  expense_prefix text not null default 'EXP',
  journal_prefix text not null default 'JE',
  default_currency text not null default 'USD',
  tax_enabled boolean not null default true,
  default_tax_rate numeric(6,2) not null default 5,
  auto_invoice_shipments boolean not null default true,
  auto_post_invoice boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  rule_name text not null,
  rule_type text not null,
  is_enabled boolean not null default true,
  configuration jsonb not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.approval_workflows (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  workflow_name text not null,
  workflow_type text not null,
  threshold_amount numeric(12,2) not null default 0,
  approver_role_id uuid references public.roles(id) on delete set null,
  is_enabled boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bank_reconciliation (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  bank_account_id uuid references public.bank_accounts(id) on delete set null,
  statement_date date not null,
  statement_balance numeric(12,2) not null default 0,
  system_balance numeric(12,2) not null default 0,
  status text not null default 'draft',
  matched_transactions jsonb not null default '[]',
  unreconciled_transactions jsonb not null default '[]',
  reconciled_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.post_journal_entry(target_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  debit_total numeric(12,2);
  credit_total numeric(12,2);
begin
  select coalesce(sum(debit), 0), coalesce(sum(credit), 0)
  into debit_total, credit_total
  from public.journal_entry_lines
  where journal_entry_id = target_entry_id;

  if debit_total = 0 and credit_total = 0 then
    raise exception 'Journal entry has no lines';
  end if;

  if debit_total <> credit_total then
    raise exception 'Unbalanced journal entry: debits % credits %', debit_total, credit_total;
  end if;

  update public.journal_entries
  set status = 'posted', posted_at = now()
  where id = target_entry_id;
end;
$$;

insert into public.permissions (key, description)
values
  ('accounting.view', 'View accounting dashboard'),
  ('accounting.manage', 'Manage accounting settings'),
  ('chart_of_accounts.view', 'View chart of accounts'),
  ('chart_of_accounts.manage', 'Manage chart of accounts'),
  ('journal_entries.view', 'View journal entries'),
  ('journal_entries.create', 'Create journal entries'),
  ('journal_entries.post', 'Post journal entries'),
  ('invoices.view', 'View invoices'),
  ('invoices.create', 'Create invoices'),
  ('invoices.edit', 'Edit invoices'),
  ('invoices.delete', 'Delete invoices'),
  ('invoices.post', 'Post invoices'),
  ('payments.view', 'View payments'),
  ('payments.create', 'Create payments'),
  ('payments.reverse', 'Reverse payments'),
  ('expenses.view', 'View expenses'),
  ('expenses.create', 'Create expenses'),
  ('expenses.approve', 'Approve expenses'),
  ('reports.view', 'View financial reports'),
  ('bank_reconciliation.manage', 'Manage bank reconciliation')
on conflict (key) do update set description = excluded.description;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'chart_of_accounts','accounting_periods','journal_entries','journal_entry_lines','invoice_items',
    'payment_allocations','expense_categories','suppliers','supplier_bills','bank_accounts','cash_accounts',
    'petty_cash_transactions','tax_rates','tax_transactions','customer_ledger','supplier_ledger',
    'accounting_settings','automation_rules','approval_workflows','bank_reconciliation'
  ]
  loop
    execute format('alter table public.%I enable row level security', target_table);
    if not exists (select 1 from pg_trigger where tgname = format('set_%s_updated_at', target_table)) then
      execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', target_table, target_table);
    end if;
    execute format('drop policy if exists "%I accounting select" on public.%I', target_table, target_table);
    execute format('drop policy if exists "%I accounting insert" on public.%I', target_table, target_table);
    execute format('drop policy if exists "%I accounting update" on public.%I', target_table, target_table);
    execute format('drop policy if exists "%I accounting delete" on public.%I', target_table, target_table);
    execute format('create policy "%I accounting select" on public.%I for select using (public.user_has_permission(company_id, ''accounting.view'') or public.is_company_member(company_id))', target_table, target_table);
    execute format('create policy "%I accounting insert" on public.%I for insert with check (public.user_has_permission(company_id, ''accounting.manage'') and created_by = auth.uid())', target_table, target_table);
    execute format('create policy "%I accounting update" on public.%I for update using (public.user_has_permission(company_id, ''accounting.manage'')) with check (public.user_has_permission(company_id, ''accounting.manage''))', target_table, target_table);
    execute format('create policy "%I accounting delete" on public.%I for delete using (public.user_has_permission(company_id, ''accounting.manage''))', target_table, target_table);
  end loop;
end $$;

grant select, insert, update, delete on
  public.chart_of_accounts, public.accounting_periods, public.journal_entries, public.journal_entry_lines,
  public.invoice_items, public.payment_allocations, public.expense_categories, public.suppliers,
  public.supplier_bills, public.bank_accounts, public.cash_accounts, public.petty_cash_transactions,
  public.tax_rates, public.tax_transactions, public.customer_ledger, public.supplier_ledger,
  public.accounting_settings, public.automation_rules, public.approval_workflows, public.bank_reconciliation
to authenticated;

insert into public.chart_of_accounts (company_id, account_code, account_name, account_type, normal_balance, is_system)
select '10000000-0000-0000-0000-000000000001', code, name, type, normal, true
from (values
  ('1000','Cash','asset','debit'), ('1010','Bank','asset','debit'), ('1100','Accounts Receivable','asset','debit'),
  ('1200','Petty Cash','asset','debit'), ('1300','Inventory / Cargo Assets','asset','debit'),
  ('2000','Accounts Payable','liability','credit'), ('2100','Tax Payable','liability','credit'),
  ('2110','VAT Payable','liability','credit'), ('2200','Customer Deposits','liability','credit'),
  ('3000','Owner Equity','equity','credit'), ('3100','Retained Earnings','equity','credit'),
  ('4000','Shipment Revenue','income','credit'), ('4010','Service Revenue','income','credit'),
  ('4020','Delivery Revenue','income','credit'), ('4030','Handling Fee Income','income','credit'),
  ('5000','Fuel Expense','expense','debit'), ('5010','Salary Expense','expense','debit'),
  ('5020','Rent Expense','expense','debit'), ('5030','Customs Expense','expense','debit'),
  ('5040','Warehouse Expense','expense','debit'), ('5050','Transport Expense','expense','debit'),
  ('5060','Bank Charges','expense','debit'), ('5090','General Expense','expense','debit')
) as defaults(code, name, type, normal)
on conflict (company_id, account_code) do update set account_name = excluded.account_name, account_type = excluded.account_type;

insert into public.accounting_settings (company_id, invoice_prefix, payment_prefix, expense_prefix, journal_prefix, default_currency)
values ('10000000-0000-0000-0000-000000000001', 'INV', 'PAY', 'EXP', 'JE', 'USD')
on conflict (company_id) do update set default_currency = excluded.default_currency;

insert into public.bank_accounts (company_id, account_name, bank_name, currency, current_balance, chart_account_id)
select '10000000-0000-0000-0000-000000000001', 'Main Bank', 'Company Bank', 'USD', 0, id
from public.chart_of_accounts
where company_id = '10000000-0000-0000-0000-000000000001' and account_code = '1010'
on conflict do nothing;

insert into public.tax_rates (company_id, name, rate, tax_account_id)
select '10000000-0000-0000-0000-000000000001', 'VAT 5%', 5, id
from public.chart_of_accounts
where company_id = '10000000-0000-0000-0000-000000000001' and account_code = '2110'
on conflict do nothing;
