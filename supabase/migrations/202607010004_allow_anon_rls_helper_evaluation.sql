-- Allows anon REST requests to evaluate tenant RLS helper predicates safely.
-- The helpers return empty/false when auth.uid() is null, so anon users do not gain data access.

grant usage on schema private to anon;
grant execute on function private.current_company_ids() to anon;
grant execute on function private.is_company_member(uuid) to anon;
grant execute on function private.user_has_permission(uuid,text) to anon;
grant execute on function public.current_company_ids() to anon;
grant execute on function public.is_company_member(uuid) to anon;
grant execute on function public.user_has_permission(uuid,text) to anon;

notify pgrst, 'reload schema';
