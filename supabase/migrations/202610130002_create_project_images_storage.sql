-- ET-08: bucket publico para imagens de projetos.
-- Esta migration deve ser revisada e executada manualmente no SQL Editor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read project images" on storage.objects;
create policy "Public can read project images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'project-images');

drop policy if exists "Authorized admins can read all project images" on storage.objects;
create policy "Authorized admins can read all project images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'project-images'
    and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );

drop policy if exists "Authorized admins can upload project images" on storage.objects;
create policy "Authorized admins can upload project images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'project-images'
    and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );

drop policy if exists "Authorized admins can update project images" on storage.objects;
create policy "Authorized admins can update project images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'project-images'
    and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  )
  with check (
    bucket_id = 'project-images'
    and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );

drop policy if exists "Authorized admins can delete project images" on storage.objects;
create policy "Authorized admins can delete project images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'project-images'
    and exists (select 1 from public.admin_users where user_id = (select auth.uid()))
  );
