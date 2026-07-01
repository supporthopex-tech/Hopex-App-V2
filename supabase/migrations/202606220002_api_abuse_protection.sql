create table if not exists public.api_rate_limits (
  key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.api_idempotency_keys (
  key text primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.api_rate_limits enable row level security;
alter table public.api_idempotency_keys enable row level security;
revoke all on public.api_rate_limits, public.api_idempotency_keys from anon, authenticated;

create or replace function public.consume_api_rate_limit(
  target_key text,
  window_seconds integer,
  maximum_requests integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare current_count integer;
begin
  if window_seconds < 1 or maximum_requests < 1 then raise exception 'Invalid rate limit configuration'; end if;
  insert into public.api_rate_limits as limits (key,window_started_at,request_count,updated_at)
  values (target_key,now(),1,now())
  on conflict (key) do update set
    window_started_at = case when limits.window_started_at + make_interval(secs => window_seconds) <= now() then now() else limits.window_started_at end,
    request_count = case when limits.window_started_at + make_interval(secs => window_seconds) <= now() then 1 else limits.request_count + 1 end,
    updated_at = now()
  returning request_count into current_count;
  return current_count <= maximum_requests;
end;
$$;

create or replace function public.reserve_api_idempotency_key(target_key text, ttl_seconds integer)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare inserted_count integer;
begin
  delete from public.api_idempotency_keys where key = target_key and expires_at <= now();
  insert into public.api_idempotency_keys (key,expires_at)
  values (target_key,now() + make_interval(secs => greatest(ttl_seconds,1)))
  on conflict do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count = 1;
end;
$$;

revoke execute on function public.consume_api_rate_limit(text,integer,integer) from public, anon, authenticated;
revoke execute on function public.reserve_api_idempotency_key(text,integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text,integer,integer) to service_role;
grant execute on function public.reserve_api_idempotency_key(text,integer) to service_role;

create index if not exists api_idempotency_expiry_idx on public.api_idempotency_keys(expires_at);
