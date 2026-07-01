-- Sprint 4 critical hardening: rls_auto_enable() is a SECURITY DEFINER helper and
-- must not be exposed through PostgREST RPC to browser-facing roles.

revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;

grant execute on function public.rls_auto_enable() to service_role;

notify pgrst, 'reload schema';
