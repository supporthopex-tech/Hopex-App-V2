-- Removes remaining auth.role() checks from profile/company asset storage policies.

drop policy if exists "profile images write" on storage.objects;
create policy "profile images write"
on storage.objects
for insert
to authenticated
with check (bucket_id in ('profile-images', 'company-assets'));

drop policy if exists "profile images update" on storage.objects;
create policy "profile images update"
on storage.objects
for update
to authenticated
using (bucket_id in ('profile-images', 'company-assets'))
with check (bucket_id in ('profile-images', 'company-assets'));

notify pgrst, 'reload schema';
