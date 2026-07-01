create table if not exists public.customer_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  subject text,
  message text not null,
  source text not null default 'website',
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived', 'spam')),
  visitor_ip text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  replied_at timestamptz
);

create index if not exists customer_messages_company_created_idx
  on public.customer_messages(company_id, created_at desc);

create index if not exists customer_messages_company_status_idx
  on public.customer_messages(company_id, status);

alter table public.customer_messages enable row level security;

drop policy if exists "customer messages member select" on public.customer_messages;
drop policy if exists "customer messages member update" on public.customer_messages;
drop policy if exists "customer messages member delete" on public.customer_messages;

create policy "customer messages member select"
  on public.customer_messages
  for select
  to authenticated
  using (
    public.is_company_member(company_id)
    and (
      public.user_has_permission(company_id, 'customers.view')
      or public.user_has_permission(company_id, 'email.manage')
      or public.user_has_permission(company_id, 'settings.manage')
    )
  );

create policy "customer messages member update"
  on public.customer_messages
  for update
  to authenticated
  using (
    public.is_company_member(company_id)
    and (
      public.user_has_permission(company_id, 'customers.update')
      or public.user_has_permission(company_id, 'email.manage')
      or public.user_has_permission(company_id, 'settings.manage')
    )
  )
  with check (
    public.is_company_member(company_id)
    and (
      public.user_has_permission(company_id, 'customers.update')
      or public.user_has_permission(company_id, 'email.manage')
      or public.user_has_permission(company_id, 'settings.manage')
    )
  );

create policy "customer messages member delete"
  on public.customer_messages
  for delete
  to authenticated
  using (
    public.is_company_member(company_id)
    and (
      public.user_has_permission(company_id, 'customers.delete')
      or public.user_has_permission(company_id, 'settings.manage')
    )
  );

grant select, update, delete on public.customer_messages to authenticated;
grant select, insert, update, delete on public.customer_messages to service_role;
