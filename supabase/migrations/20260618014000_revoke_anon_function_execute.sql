revoke execute on function public.current_company_ids() from anon;
revoke execute on function public.is_company_member(uuid) from anon;
revoke execute on function public.user_has_permission(uuid, text) from anon;
revoke execute on function public.post_journal_entry(uuid) from anon;
