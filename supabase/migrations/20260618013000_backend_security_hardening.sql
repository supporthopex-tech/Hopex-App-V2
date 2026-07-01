revoke execute on function public.current_company_ids() from public;
revoke execute on function public.is_company_member(uuid) from public;
revoke execute on function public.user_has_permission(uuid, text) from public;
revoke execute on function public.post_journal_entry(uuid) from public;

grant execute on function public.current_company_ids() to authenticated;
grant execute on function public.is_company_member(uuid) to authenticated;
grant execute on function public.user_has_permission(uuid, text) to authenticated;
grant execute on function public.post_journal_entry(uuid) to authenticated;

alter function public.set_updated_at() set search_path = public;
alter function public.set_contact_submissions_updated_at() set search_path = public;

drop policy if exists "permissions authenticated select" on public.permissions;
create policy "permissions authenticated select"
on public.permissions
for select
to authenticated
using (true);
