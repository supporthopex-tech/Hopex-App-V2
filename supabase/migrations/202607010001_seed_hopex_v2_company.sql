-- Hopex App V2 provisioning seed.
-- Target only: the new Hopex Supabase project. Do not run this against the old live Hopex database.

begin;

insert into public.companies (
  id,
  name,
  slug,
  logo_url,
  theme_color,
  primary_color,
  currency,
  timezone,
  address,
  email,
  phone,
  website,
  country,
  city,
  slogan,
  tracking_prefix,
  business_type,
  company_size
)
values (
  '6d19adf9-570f-46c3-8476-dfab624248b3',
  'Hopex Express Cargo',
  'hopex-express-cargo',
  '/company-logo.svg',
  '#0f766e',
  '#0f766e',
  'TZS',
  'Africa/Dar_es_Salaam',
  'Zanzibar, Tanzania',
  'support@hopexgroup.co.tz',
  '+255',
  'https://hopexgroup.co.tz',
  'Tanzania',
  'Zanzibar',
  'Hopex Delivery operations for cargo, logistics, tracking, and customer service.',
  'HEX',
  'Cargo and logistics',
  'small'
)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  logo_url = excluded.logo_url,
  theme_color = excluded.theme_color,
  primary_color = excluded.primary_color,
  currency = excluded.currency,
  timezone = excluded.timezone,
  address = excluded.address,
  email = excluded.email,
  phone = excluded.phone,
  website = excluded.website,
  country = excluded.country,
  city = excluded.city,
  slogan = excluded.slogan,
  tracking_prefix = excluded.tracking_prefix,
  business_type = excluded.business_type,
  company_size = excluded.company_size,
  updated_at = now();

insert into public.company_settings (
  company_id,
  email_templates,
  whatsapp_templates,
  integrations,
  company_email,
  company_phone,
  notification_preferences,
  language_preferences,
  onboarding_state,
  business_information,
  billing_preferences
)
values (
  '6d19adf9-570f-46c3-8476-dfab624248b3',
  jsonb_build_array(
    jsonb_build_object(
      'name', 'Shipment booked',
      'subject', 'Hopex shipment {{tracking_number}} has been booked',
      'body', 'Hello {{customer_name}}, your Hopex Express Cargo shipment {{tracking_number}} has been booked. We will notify you as it moves through delivery.'
    ),
    jsonb_build_object(
      'name', 'Invoice issued',
      'subject', 'Hopex invoice {{invoice_number}}',
      'body', 'Hello {{customer_name}}, Hopex Express Cargo has issued invoice {{invoice_number}} for {{amount}}.'
    )
  ),
  jsonb_build_array(
    jsonb_build_object(
      'name', 'Tracking update',
      'body', 'Hopex update: shipment {{tracking_number}} is now {{status}} at {{location}}.'
    ),
    jsonb_build_object(
      'name', 'Payment received',
      'body', 'Thank you. Hopex has received payment {{receipt_number}} for {{amount}}.'
    )
  ),
  '{}'::jsonb,
  'support@hopexgroup.co.tz',
  '+255',
  '{"email":true,"whatsapp":true,"shipments":true,"payments":true}'::jsonb,
  '{"language":"en","date_format":"dd/MM/yyyy","number_format":"1,234.56","currency_format":"symbol"}'::jsonb,
  '{"completed":false}'::jsonb,
  '{"industry":"Cargo and logistics","brand":"Hopex Express Cargo"}'::jsonb,
  '{}'::jsonb
)
on conflict (company_id) do update
set
  email_templates = excluded.email_templates,
  whatsapp_templates = excluded.whatsapp_templates,
  company_email = excluded.company_email,
  company_phone = excluded.company_phone,
  notification_preferences = excluded.notification_preferences,
  language_preferences = excluded.language_preferences,
  onboarding_state = excluded.onboarding_state,
  business_information = excluded.business_information,
  billing_preferences = excluded.billing_preferences,
  updated_at = now();

insert into public.branding_settings (
  company_id,
  theme_mode,
  primary_color,
  sidebar_style,
  compact_mode,
  logo_url
)
values (
  '6d19adf9-570f-46c3-8476-dfab624248b3',
  'system',
  '#0f766e',
  'default',
  false,
  '/company-logo.svg'
)
on conflict (company_id) do update
set
  theme_mode = excluded.theme_mode,
  primary_color = excluded.primary_color,
  sidebar_style = excluded.sidebar_style,
  compact_mode = excluded.compact_mode,
  logo_url = excluded.logo_url,
  updated_at = now();

insert into public.invoice_settings (
  company_id,
  invoice_prefix,
  next_invoice_number,
  quote_prefix,
  payment_receipt_prefix,
  default_tax_rate,
  payment_terms,
  footer_notes,
  bank_details,
  invoice_logo_url
)
values (
  '6d19adf9-570f-46c3-8476-dfab624248b3',
  'HEX-INV',
  1,
  'HEX-QT',
  'HEX-RCPT',
  0,
  'Payment due on receipt unless agreed otherwise.',
  'Thank you for choosing Hopex Express Cargo.',
  '',
  '/company-logo.svg'
)
on conflict (company_id) do update
set
  invoice_prefix = excluded.invoice_prefix,
  quote_prefix = excluded.quote_prefix,
  payment_receipt_prefix = excluded.payment_receipt_prefix,
  default_tax_rate = excluded.default_tax_rate,
  payment_terms = excluded.payment_terms,
  footer_notes = excluded.footer_notes,
  bank_details = excluded.bank_details,
  invoice_logo_url = excluded.invoice_logo_url,
  updated_at = now();

insert into public.notification_settings (company_id)
values ('6d19adf9-570f-46c3-8476-dfab624248b3')
on conflict (company_id) do nothing;

insert into public.roles (company_id, name, description, is_system)
values
  ('6d19adf9-570f-46c3-8476-dfab624248b3', 'Administrator', 'Full access to Hopex App V2.', true),
  ('6d19adf9-570f-46c3-8476-dfab624248b3', 'Operations Staff', 'Operational access for shipments, customers, quotes, invoices, and tracking.', true),
  ('6d19adf9-570f-46c3-8476-dfab624248b3', 'Accounting', 'Finance access for invoices, payments, expenses, journals, and reports.', true)
on conflict (company_id, name) do update
set
  description = excluded.description,
  is_system = excluded.is_system,
  updated_at = now();

insert into public.role_permissions (company_id, role_id, permission_id)
select
  '6d19adf9-570f-46c3-8476-dfab624248b3'::uuid,
  r.id,
  p.id
from public.roles r
cross join public.permissions p
where r.company_id = '6d19adf9-570f-46c3-8476-dfab624248b3'
  and r.name = 'Administrator'
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (company_id, role_id, permission_id)
select
  '6d19adf9-570f-46c3-8476-dfab624248b3'::uuid,
  r.id,
  p.id
from public.roles r
join public.permissions p on p.key in (
  'shipments.view',
  'shipments.create',
  'shipments.edit',
  'shipments.update_status',
  'shipments.manage_documents',
  'customers.view',
  'customers.create',
  'customers.edit',
  'quotes.view',
  'quotes.create',
  'quotes.edit',
  'quotes.convert',
  'invoices.view',
  'invoices.create',
  'tasks.view',
  'tasks.create',
  'tasks.edit',
  'reports.view',
  'whatsapp.view',
  'whatsapp.send',
  'email.view'
)
where r.company_id = '6d19adf9-570f-46c3-8476-dfab624248b3'
  and r.name = 'Operations Staff'
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (company_id, role_id, permission_id)
select
  '6d19adf9-570f-46c3-8476-dfab624248b3'::uuid,
  r.id,
  p.id
from public.roles r
join public.permissions p on p.key in (
  'accounting.view',
  'accounting.manage',
  'reports.view',
  'invoices.view',
  'invoices.create',
  'invoices.edit',
  'invoices.post',
  'payments.view',
  'payments.create',
  'payments.reverse',
  'expenses.view',
  'expenses.create',
  'expenses.approve',
  'journal_entries.view',
  'journal_entries.create',
  'journal_entries.post',
  'email.view'
)
where r.company_id = '6d19adf9-570f-46c3-8476-dfab624248b3'
  and r.name = 'Accounting'
on conflict (role_id, permission_id) do nothing;

commit;
