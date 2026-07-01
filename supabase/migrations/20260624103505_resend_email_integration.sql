alter table public.email_logs
  add column if not exists recipient text,
  add column if not exists subject text,
  add column if not exists sent_by uuid references auth.users(id) on delete set null,
  add column if not exists related_customer_id uuid references public.customers(id) on delete set null,
  add column if not exists related_shipment_id uuid references public.shipments(id) on delete set null,
  add column if not exists resend_message_id text,
  add column if not exists error_message text,
  add column if not exists sent_at timestamptz;

alter table public.email_messages
  add column if not exists resend_message_id text;

create index if not exists email_logs_company_created_at_idx on public.email_logs (company_id, created_at desc);
create index if not exists email_logs_status_idx on public.email_logs (company_id, status);
create index if not exists email_logs_resend_message_id_idx on public.email_logs (resend_message_id) where resend_message_id is not null;

insert into public.email_templates (company_id, template_name, subject, body, module)
select c.id, template_name, subject, body, module
from public.companies c
cross join (
  values
    (
      'General message',
      'Message from {{company_name}}',
      'Hello {{customer_name}},

{{message}}

Regards,
{{company_name}}',
      'email'
    ),
    (
      'Quote email',
      'Your quote from {{company_name}}',
      'Hello {{customer_name}},

Your cargo quote is ready.

Route: {{origin}} to {{destination}}
Cargo: {{cargo_description}}
Amount: {{quote_amount}}

{{message}}

Regards,
{{company_name}}',
      'quotes'
    ),
    (
      'Shipment status update',
      'Shipment {{tracking_number}} is {{shipment_status}}',
      'Hello {{customer_name}},

Your shipment {{tracking_number}} is now {{shipment_status}}.

Origin: {{origin}}
Destination: {{destination}}
Estimated delivery: {{estimated_delivery}}
Tracking link: {{tracking_link}}

{{message}}

Regards,
{{company_name}}',
      'shipments'
    ),
    (
      'Invoice/payment email',
      'Invoice update from {{company_name}}',
      'Hello {{customer_name}},

Invoice: {{invoice_number}}
Amount due: {{amount_due}}
Due date: {{due_date}}
Payment link: {{payment_link}}

{{message}}

Regards,
{{company_name}}',
      'invoices'
    ),
    (
      'Welcome/customer registration',
      'Welcome to {{company_name}}',
      'Hello {{customer_name}},

Welcome to {{company_name}}. We are happy to support your cargo and logistics needs.

{{message}}

Regards,
{{company_name}}',
      'customers'
    ),
    (
      'Staff approval notification',
      'Approval notification from {{company_name}}',
      'Hello,

Approval: {{approval_title}}
Status: {{approval_status}}
Updated by: {{actor_name}}

{{message}}

Regards,
{{company_name}}',
      'approvals'
    )
) as templates(template_name, subject, body, module)
where not exists (
  select 1
  from public.email_templates existing
  where existing.company_id = c.id
    and existing.template_name = templates.template_name
);

comment on column public.email_logs.resend_message_id is 'Provider message id returned by Resend after a successful send.';
comment on column public.email_logs.error_message is 'Human-readable provider or validation error captured when sending fails.';
