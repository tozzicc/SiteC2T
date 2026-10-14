-- ET-08: metadados das imagens administrativas dos projetos.
-- Esta migration deve ser revisada e executada manualmente no SQL Editor.
create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  alt_text text not null,
  image_type text not null default 'gallery',
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_images_storage_path_length check (char_length(btrim(storage_path)) between 1 and 500),
  constraint project_images_storage_path_project_check check (
    storage_path ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/[^/]+$'
    and split_part(storage_path, '/', 1) = project_id::text
  ),
  constraint project_images_alt_text_length check (char_length(btrim(alt_text)) between 1 and 240),
  constraint project_images_type_check check (image_type in ('cover', 'gallery')),
  constraint project_images_display_order_check check (display_order >= 0)
);

create unique index if not exists project_images_one_cover_per_project_idx
  on public.project_images (project_id)
  where image_type = 'cover';
create index if not exists project_images_project_order_idx
  on public.project_images (project_id, display_order, created_at);
create unique index if not exists project_images_storage_path_idx
  on public.project_images (storage_path);

create or replace function public.set_project_images_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_project_images_updated_at on public.project_images;
create trigger set_project_images_updated_at
before update on public.project_images
for each row execute function public.set_project_images_updated_at();

alter table public.project_images enable row level security;

revoke all on table public.project_images from anon, authenticated;
grant select on table public.project_images to anon, authenticated;
grant insert, update, delete on table public.project_images to authenticated;

drop policy if exists "Public can read images of published projects" on public.project_images;
create policy "Public can read images of published projects"
  on public.project_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = project_images.project_id
        and projects.status = 'published'
    )
  );

drop policy if exists "Authorized admins can read all project images" on public.project_images;
create policy "Authorized admins can read all project images"
  on public.project_images
  for select
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

drop policy if exists "Authorized admins can create project images" on public.project_images;
create policy "Authorized admins can create project images"
  on public.project_images
  for insert
  to authenticated
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

drop policy if exists "Authorized admins can update project images" on public.project_images;
create policy "Authorized admins can update project images"
  on public.project_images
  for update
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

drop policy if exists "Authorized admins can delete project images" on public.project_images;
create policy "Authorized admins can delete project images"
  on public.project_images
  for delete
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
