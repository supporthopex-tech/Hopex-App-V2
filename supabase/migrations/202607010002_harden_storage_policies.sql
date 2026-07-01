-- Hardens storage policies for the Hopex V2 project.
-- Uses explicit TO authenticated clauses instead of auth.role() checks.

drop policy if exists "company asset reads" on storage.objects;
create policy "company asset reads"
on storage.objects
for select
using (bucket_id in ('company-assets', 'company-logos'));

drop policy if exists "company asset writes" on storage.objects;
create policy "company asset writes"
on storage.objects
for insert
to authenticated
with check (bucket_id in ('company-assets', 'company-logos'));

drop policy if exists "company asset updates" on storage.objects;
create policy "company asset updates"
on storage.objects
for update
to authenticated
using (bucket_id in ('company-assets', 'company-logos'))
with check (bucket_id in ('company-assets', 'company-logos'));

drop policy if exists "shipment documents storage read" on storage.objects;
create policy "shipment documents storage read"
on storage.objects
for select
to authenticated
using (bucket_id = 'shipment-documents');

drop policy if exists "shipment documents storage write" on storage.objects;
create policy "shipment documents storage write"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'shipment-documents');

drop policy if exists "shipment documents storage update" on storage.objects;
create policy "shipment documents storage update"
on storage.objects
for update
to authenticated
using (bucket_id = 'shipment-documents')
with check (bucket_id = 'shipment-documents');

drop policy if exists "staff documents storage read" on storage.objects;
create policy "staff documents storage read"
on storage.objects
for select
to authenticated
using (bucket_id = 'staff-documents');

drop policy if exists "staff documents storage write" on storage.objects;
create policy "staff documents storage write"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'staff-documents');

drop policy if exists "staff documents storage update" on storage.objects;
create policy "staff documents storage update"
on storage.objects
for update
to authenticated
using (bucket_id = 'staff-documents')
with check (bucket_id = 'staff-documents');

drop policy if exists "quote documents storage read" on storage.objects;
create policy "quote documents storage read"
on storage.objects
for select
to authenticated
using (bucket_id = 'quote-documents');

drop policy if exists "quote documents storage write" on storage.objects;
create policy "quote documents storage write"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'quote-documents');

drop policy if exists "quote documents storage update" on storage.objects;
create policy "quote documents storage update"
on storage.objects
for update
to authenticated
using (bucket_id = 'quote-documents')
with check (bucket_id = 'quote-documents');

drop policy if exists "task attachments storage read" on storage.objects;
create policy "task attachments storage read"
on storage.objects
for select
to authenticated
using (bucket_id = 'task-attachments');

drop policy if exists "task attachments storage write" on storage.objects;
create policy "task attachments storage write"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'task-attachments');

drop policy if exists "task attachments storage update" on storage.objects;
create policy "task attachments storage update"
on storage.objects
for update
to authenticated
using (bucket_id = 'task-attachments')
with check (bucket_id = 'task-attachments');

drop policy if exists "email attachments storage read" on storage.objects;
create policy "email attachments storage read"
on storage.objects
for select
to authenticated
using (bucket_id = 'email-attachments');

drop policy if exists "email attachments storage write" on storage.objects;
create policy "email attachments storage write"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'email-attachments');

drop policy if exists "email attachments storage update" on storage.objects;
create policy "email attachments storage update"
on storage.objects
for update
to authenticated
using (bucket_id = 'email-attachments')
with check (bucket_id = 'email-attachments');

drop policy if exists "settings assets storage read" on storage.objects;
create policy "settings assets storage read"
on storage.objects
for select
to authenticated
using (bucket_id = 'settings-assets');

drop policy if exists "settings assets storage write" on storage.objects;
create policy "settings assets storage write"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'settings-assets');

drop policy if exists "settings assets storage update" on storage.objects;
create policy "settings assets storage update"
on storage.objects
for update
to authenticated
using (bucket_id = 'settings-assets')
with check (bucket_id = 'settings-assets');

drop policy if exists "onboarding authenticated logo writes" on storage.objects;
create policy "onboarding authenticated logo writes"
on storage.objects
for insert
to authenticated
with check (bucket_id in ('company-logos', 'profile-photos'));

drop policy if exists "onboarding authenticated logo updates" on storage.objects;
create policy "onboarding authenticated logo updates"
on storage.objects
for update
to authenticated
using (bucket_id in ('company-logos', 'profile-photos'))
with check (bucket_id in ('company-logos', 'profile-photos'));

drop policy if exists "system assets storage write" on storage.objects;
create policy "system assets storage write"
on storage.objects
for insert
to authenticated
with check (bucket_id in ('profile-images', 'company-assets'));

drop policy if exists "system assets storage update" on storage.objects;
create policy "system assets storage update"
on storage.objects
for update
to authenticated
using (bucket_id in ('profile-images', 'company-assets'))
with check (bucket_id in ('profile-images', 'company-assets'));
