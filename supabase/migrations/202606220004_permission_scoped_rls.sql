drop policy if exists "company users manageable by members" on public.company_users;
drop policy if exists "company members can update companies" on public.companies;

create policy "company users managed with permission" on public.company_users
for all to authenticated
using (public.is_company_member(company_id) and public.user_has_permission(company_id,'settings.manage_users'))
with check (public.is_company_member(company_id) and public.user_has_permission(company_id,'settings.manage_users'));

create policy "companies updated with permission" on public.companies
for update to authenticated
using (public.is_company_member(id) and public.user_has_permission(id,'settings.manage_company'))
with check (public.is_company_member(id) and public.user_has_permission(id,'settings.manage_company'));

do $$
declare
  rule record;
begin
  for rule in select * from (values
    ('roles','settings.manage_users','settings.manage_users','settings.manage_users'),
    ('role_permissions','settings.manage_users','settings.manage_users','settings.manage_users'),
    ('subscriptions','settings.manage_company','settings.manage_company','settings.manage_company'),
    ('customers','customers.create','customers.edit','customers.delete'),
    ('staff','staff.create','staff.edit','staff.delete'),
    ('shipments','shipments.create','shipments.edit','shipments.delete'),
    ('shipment_events','shipments.edit','shipments.edit','shipments.delete'),
    ('quotes','quotes.create','quotes.edit','quotes.delete'),
    ('invoices','invoices.create','invoices.edit','invoices.delete'),
    ('payments','payments.create','payments.reverse','payments.reverse'),
    ('expenses','expenses.create','expenses.approve','accounting.manage'),
    ('tasks','tasks.create','tasks.edit','tasks.delete'),
    ('approvals','approvals.manage','approvals.manage','approvals.manage'),
    ('company_settings','settings.manage_company','settings.manage_company','settings.manage_company'),
    ('email_messages','email.send','email.manage','email.manage'),
    ('whatsapp_messages','whatsapp.send','whatsapp.manage_templates','whatsapp.manage_templates'),
    ('reports','accounting.manage','accounting.manage','accounting.manage')
  ) as rules(table_name,insert_permission,update_permission,delete_permission)
  loop
    execute format('drop policy if exists %I on public.%I', rule.table_name || ' tenant insert', rule.table_name);
    execute format('drop policy if exists %I on public.%I', rule.table_name || ' tenant update', rule.table_name);
    execute format('drop policy if exists %I on public.%I', rule.table_name || ' tenant delete', rule.table_name);
    execute format('drop policy if exists %I on public.%I', rule.table_name || ' permission insert', rule.table_name);
    execute format('drop policy if exists %I on public.%I', rule.table_name || ' permission update', rule.table_name);
    execute format('drop policy if exists %I on public.%I', rule.table_name || ' permission delete', rule.table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_company_member(company_id) and created_by = auth.uid() and public.user_has_permission(company_id,%L))', rule.table_name || ' permission insert', rule.table_name, rule.insert_permission);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_company_member(company_id) and public.user_has_permission(company_id,%L)) with check (public.is_company_member(company_id) and public.user_has_permission(company_id,%L))', rule.table_name || ' permission update', rule.table_name, rule.update_permission, rule.update_permission);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_company_member(company_id) and public.user_has_permission(company_id,%L))', rule.table_name || ' permission delete', rule.table_name, rule.delete_permission);
  end loop;
end $$;

drop policy if exists "customers permission insert" on public.customers;
create policy "customers permission insert" on public.customers for insert to authenticated with check (
  public.is_company_member(company_id) and created_by = auth.uid() and (
    public.user_has_permission(company_id,'customers.create') or public.user_has_permission(company_id,'shipments.create')));

drop policy if exists "staff permission update" on public.staff;
create policy "staff permission update" on public.staff for update to authenticated using (
  public.is_company_member(company_id) and (
    public.user_has_permission(company_id,'staff.edit') or public.user_has_permission(company_id,'staff.suspend') or public.user_has_permission(company_id,'staff.activate') or public.user_has_permission(company_id,'staff.invite')))
with check (public.is_company_member(company_id));

drop policy if exists "quotes permission insert" on public.quotes;
create policy "quotes permission insert" on public.quotes for insert to authenticated with check (
  public.is_company_member(company_id) and created_by = auth.uid() and (
    public.user_has_permission(company_id,'quotes.create') or public.user_has_permission(company_id,'shipments.edit')));

drop policy if exists "invoices permission insert" on public.invoices;
drop policy if exists "invoices permission update" on public.invoices;
create policy "invoices permission insert" on public.invoices for insert to authenticated with check (
  public.is_company_member(company_id) and created_by = auth.uid() and (
    public.user_has_permission(company_id,'invoices.create') or public.user_has_permission(company_id,'shipments.edit')));
create policy "invoices permission update" on public.invoices for update to authenticated using (
  public.is_company_member(company_id) and (
    public.user_has_permission(company_id,'invoices.edit') or public.user_has_permission(company_id,'invoices.post') or public.user_has_permission(company_id,'payments.create')))
with check (public.is_company_member(company_id));

drop policy if exists "payments permission update" on public.payments;
create policy "payments permission update" on public.payments for update to authenticated using (
  public.is_company_member(company_id) and (
    public.user_has_permission(company_id,'payments.create') or public.user_has_permission(company_id,'payments.reverse') or public.user_has_permission(company_id,'accounting.manage')))
with check (public.is_company_member(company_id));

drop policy if exists "expenses permission update" on public.expenses;
create policy "expenses permission update" on public.expenses for update to authenticated using (
  public.is_company_member(company_id) and (
    public.user_has_permission(company_id,'expenses.approve') or public.user_has_permission(company_id,'accounting.manage')))
with check (public.is_company_member(company_id));

drop policy if exists "notifications tenant insert" on public.notifications;
drop policy if exists "notifications tenant update" on public.notifications;
drop policy if exists "notifications tenant delete" on public.notifications;
create policy "notifications own insert" on public.notifications for insert to authenticated with check (
  public.is_company_member(company_id) and created_by = auth.uid() and (user_id is null or user_id = auth.uid()));
create policy "notifications own update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications own delete" on public.notifications for delete to authenticated using (user_id = auth.uid());

drop policy if exists "audit_logs tenant insert" on public.audit_logs;
drop policy if exists "audit_logs tenant update" on public.audit_logs;
drop policy if exists "audit_logs tenant delete" on public.audit_logs;
create policy "audit logs append only" on public.audit_logs for insert to authenticated with check (
  public.is_company_member(company_id) and created_by = auth.uid() and actor_id = auth.uid());
