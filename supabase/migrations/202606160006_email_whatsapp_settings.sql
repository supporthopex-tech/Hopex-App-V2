alter table public.companies
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists country text,
  add column if not exists city text,
  add column if not exists tax_registration_number text;

alter table public.company_settings
  add column if not exists company_email text,
  add column if not exists company_phone text,
  add column if not exists notification_preferences jsonb not null default '{}',
  add column if not exists language_preferences jsonb not null default '{"language":"en","date_format":"dd/MM/yyyy","number_format":"1,234.56","currency_format":"symbol"}';

alter table public.email_messages
  add column if not exists account_id uuid,
  add column if not exists folder text not null default 'inbox',
  add column if not exists from_email text,
  add column if not exists to_email text,
  add column if not exists cc text,
  add column if not exists bcc text,
  add column if not exists is_read boolean not null default false,
  add column if not exists received_at timestamptz,
  add column if not exists related_customer_id uuid references public.customers(id) on delete set null,
  add column if not exists related_shipment_id uuid references public.shipments(id) on delete set null,
  add column if not exists related_quote_id uuid references public.quote_requests(id) on delete set null,
  add column if not exists related_invoice_id uuid references public.invoices(id) on delete set null;

update public.email_messages
set to_email = coalesce(to_email, recipient),
    folder = coalesce(folder, case when status = 'draft' then 'drafts' when status = 'sent' then 'sent' else 'inbox' end)
where true;

alter table public.whatsapp_messages
  add column if not exists shipment_id uuid references public.shipments(id) on delete set null,
  add column if not exists message_type text,
  add column if not exists message_body text,
  add column if not exists sent_by uuid references auth.users(id) on delete set null;

update public.whatsapp_messages
set message_body = coalesce(message_body, message),
    message_type = coalesce(message_type, template_name, 'Custom Message')
where true;

create table if not exists public.email_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  account_name text not null,
  email_address text not null,
  provider text not null default 'smtp',
  smtp_host text,
  smtp_port integer,
  smtp_username text,
  smtp_secure boolean not null default true,
  imap_host text,
  imap_port integer,
  is_default boolean not null default false,
  status text not null default 'connected',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, email_address)
);

create table if not exists public.email_folders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  account_id uuid references public.email_accounts(id) on delete cascade,
  folder_name text not null,
  folder_key text not null,
  unread_count integer not null default 0,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, folder_key)
);

create table if not exists public.email_attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email_message_id uuid not null references public.email_messages(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size integer,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  template_name text not null,
  subject text not null,
  body text not null,
  module text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email_message_id uuid references public.email_messages(id) on delete set null,
  event_type text not null,
  status text not null default 'logged',
  metadata jsonb not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  template_name text not null,
  message_type text not null,
  body text not null,
  variables jsonb not null default '[]',
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  whatsapp_message_id uuid references public.whatsapp_messages(id) on delete set null,
  event_type text not null,
  status text not null default 'logged',
  metadata jsonb not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  default_country_code text not null default '+971',
  business_phone text,
  provider text not null default 'link',
  api_ready boolean not null default false,
  configuration jsonb not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  phone text,
  profile_photo_url text,
  preferences jsonb not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, user_id)
);

create table if not exists public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  email_notifications boolean not null default true,
  whatsapp_notifications boolean not null default true,
  shipment_notifications boolean not null default true,
  payment_notifications boolean not null default true,
  task_notifications boolean not null default true,
  approval_notifications boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invitation_tokens (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role_id uuid references public.roles(id) on delete set null,
  permissions jsonb not null default '[]',
  token text not null unique,
  status text not null default 'pending',
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.branding_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  theme_mode text not null default 'dark',
  primary_color text not null default '#2563eb',
  sidebar_style text not null default 'default',
  compact_mode boolean not null default false,
  logo_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  invoice_prefix text not null default 'INV',
  next_invoice_number integer not null default 1,
  quote_prefix text not null default 'QT',
  payment_receipt_prefix text not null default 'PAY',
  default_tax_rate numeric(6,2) not null default 5,
  payment_terms text,
  footer_notes text,
  bank_details text,
  invoice_logo_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.permissions (key, description)
values
  ('email.view', 'View email messages'),
  ('email.send', 'Send email messages'),
  ('email.manage', 'Manage email settings'),
  ('whatsapp.view', 'View WhatsApp messages'),
  ('whatsapp.send', 'Send WhatsApp messages'),
  ('whatsapp.manage_templates', 'Manage WhatsApp templates'),
  ('settings.view', 'View settings'),
  ('settings.manage_company', 'Manage company settings'),
  ('settings.manage_invoicing', 'Manage invoicing settings'),
  ('settings.manage_users', 'Invite and manage users'),
  ('settings.manage_branding', 'Manage branding settings')
on conflict (key) do update set description = excluded.description;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'email_accounts','email_folders','email_attachments','email_templates','email_logs',
    'whatsapp_templates','whatsapp_logs','whatsapp_settings',
    'user_settings','notification_settings','invitation_tokens','branding_settings','invoice_settings'
  ]
  loop
    execute format('alter table public.%I enable row level security', target_table);
    if not exists (select 1 from pg_trigger where tgname = format('set_%s_updated_at', target_table)) then
      execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', target_table, target_table);
    end if;
  end loop;
end $$;

drop policy if exists "email_messages tenant select" on public.email_messages;
drop policy if exists "email_messages tenant insert" on public.email_messages;
drop policy if exists "email_messages tenant update" on public.email_messages;
drop policy if exists "email_messages tenant delete" on public.email_messages;
drop policy if exists "whatsapp_messages tenant select" on public.whatsapp_messages;
drop policy if exists "whatsapp_messages tenant insert" on public.whatsapp_messages;
drop policy if exists "whatsapp_messages tenant update" on public.whatsapp_messages;
drop policy if exists "whatsapp_messages tenant delete" on public.whatsapp_messages;

create policy "email messages permission select" on public.email_messages for select using (public.user_has_permission(company_id, 'email.view') or public.is_company_member(company_id));
create policy "email messages permission insert" on public.email_messages for insert with check (public.user_has_permission(company_id, 'email.send') and created_by = auth.uid());
create policy "email messages permission update" on public.email_messages for update using (public.user_has_permission(company_id, 'email.send') or public.user_has_permission(company_id, 'email.manage')) with check (public.user_has_permission(company_id, 'email.send') or public.user_has_permission(company_id, 'email.manage'));
create policy "email messages permission delete" on public.email_messages for delete using (public.user_has_permission(company_id, 'email.manage'));

create policy "whatsapp messages permission select" on public.whatsapp_messages for select using (public.user_has_permission(company_id, 'whatsapp.view') or public.is_company_member(company_id));
create policy "whatsapp messages permission insert" on public.whatsapp_messages for insert with check (public.user_has_permission(company_id, 'whatsapp.send') and created_by = auth.uid());
create policy "whatsapp messages permission update" on public.whatsapp_messages for update using (public.user_has_permission(company_id, 'whatsapp.send') or public.user_has_permission(company_id, 'whatsapp.manage_templates')) with check (public.user_has_permission(company_id, 'whatsapp.send') or public.user_has_permission(company_id, 'whatsapp.manage_templates'));
create policy "whatsapp messages permission delete" on public.whatsapp_messages for delete using (public.user_has_permission(company_id, 'whatsapp.manage_templates'));

do $$
declare
  target_table text;
  view_permission text;
  manage_permission text;
begin
  foreach target_table in array array['email_accounts','email_folders','email_attachments','email_templates','email_logs']
  loop
    execute format('create policy "%I email select" on public.%I for select using (public.user_has_permission(company_id, ''email.view'') or public.is_company_member(company_id))', target_table, target_table);
    execute format('create policy "%I email insert" on public.%I for insert with check ((public.user_has_permission(company_id, ''email.send'') or public.user_has_permission(company_id, ''email.manage'')) and created_by = auth.uid())', target_table, target_table);
    execute format('create policy "%I email update" on public.%I for update using (public.user_has_permission(company_id, ''email.manage'') or public.user_has_permission(company_id, ''email.send'')) with check (public.user_has_permission(company_id, ''email.manage'') or public.user_has_permission(company_id, ''email.send''))', target_table, target_table);
    execute format('create policy "%I email delete" on public.%I for delete using (public.user_has_permission(company_id, ''email.manage''))', target_table, target_table);
  end loop;
  foreach target_table in array array['whatsapp_templates','whatsapp_logs','whatsapp_settings']
  loop
    execute format('create policy "%I whatsapp select" on public.%I for select using (public.user_has_permission(company_id, ''whatsapp.view'') or public.is_company_member(company_id))', target_table, target_table);
    execute format('create policy "%I whatsapp insert" on public.%I for insert with check ((public.user_has_permission(company_id, ''whatsapp.send'') or public.user_has_permission(company_id, ''whatsapp.manage_templates'')) and created_by = auth.uid())', target_table, target_table);
    execute format('create policy "%I whatsapp update" on public.%I for update using (public.user_has_permission(company_id, ''whatsapp.manage_templates'') or public.user_has_permission(company_id, ''whatsapp.send'')) with check (public.user_has_permission(company_id, ''whatsapp.manage_templates'') or public.user_has_permission(company_id, ''whatsapp.send''))', target_table, target_table);
    execute format('create policy "%I whatsapp delete" on public.%I for delete using (public.user_has_permission(company_id, ''whatsapp.manage_templates''))', target_table, target_table);
  end loop;
  foreach target_table in array array['user_settings','notification_settings','invitation_tokens','branding_settings','invoice_settings']
  loop
    execute format('create policy "%I settings select" on public.%I for select using (public.user_has_permission(company_id, ''settings.view'') or public.is_company_member(company_id))', target_table, target_table);
    execute format('create policy "%I settings insert" on public.%I for insert with check ((public.user_has_permission(company_id, ''settings.manage_company'') or public.user_has_permission(company_id, ''settings.manage_users'') or public.user_has_permission(company_id, ''settings.manage_branding'')) and created_by = auth.uid())', target_table, target_table);
    execute format('create policy "%I settings update" on public.%I for update using (public.user_has_permission(company_id, ''settings.manage_company'') or public.user_has_permission(company_id, ''settings.manage_users'') or public.user_has_permission(company_id, ''settings.manage_branding'')) with check (public.user_has_permission(company_id, ''settings.manage_company'') or public.user_has_permission(company_id, ''settings.manage_users'') or public.user_has_permission(company_id, ''settings.manage_branding''))', target_table, target_table);
    execute format('create policy "%I settings delete" on public.%I for delete using (public.user_has_permission(company_id, ''settings.manage_users'') or public.user_has_permission(company_id, ''settings.manage_company''))', target_table, target_table);
  end loop;
end $$;

grant select, insert, update, delete on
  public.email_accounts, public.email_folders, public.email_messages, public.email_attachments, public.email_templates, public.email_logs,
  public.whatsapp_messages, public.whatsapp_templates, public.whatsapp_logs, public.whatsapp_settings,
  public.user_settings, public.notification_settings, public.invitation_tokens, public.branding_settings, public.invoice_settings
to authenticated;

insert into storage.buckets (id, name, public)
values
  ('email-attachments', 'email-attachments', false),
  ('settings-assets', 'settings-assets', false)
on conflict (id) do nothing;

drop policy if exists "email attachments storage read" on storage.objects;
create policy "email attachments storage read" on storage.objects for select using (bucket_id = 'email-attachments' and auth.role() = 'authenticated');
drop policy if exists "email attachments storage write" on storage.objects;
create policy "email attachments storage write" on storage.objects for insert with check (bucket_id = 'email-attachments' and auth.role() = 'authenticated');
drop policy if exists "settings assets storage read" on storage.objects;
create policy "settings assets storage read" on storage.objects for select using (bucket_id = 'settings-assets' and auth.role() = 'authenticated');
drop policy if exists "settings assets storage write" on storage.objects;
create policy "settings assets storage write" on storage.objects for insert with check (bucket_id = 'settings-assets' and auth.role() = 'authenticated');
