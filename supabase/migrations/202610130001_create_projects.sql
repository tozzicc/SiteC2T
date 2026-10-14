-- ET-07: projetos administrativos, separados do catalogo publico estatico.
-- Esta migration deve ser revisada e executada manualmente no SQL Editor.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  short_description text not null,
  description text not null,
  category text not null,
  technologies text[] not null default '{}',
  features text[] not null default '{}',
  demo_url text,
  repository_url text,
  status text not null default 'draft',
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz,
  constraint projects_slug_format check (
    char_length(slug) between 1 and 120
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  constraint projects_title_length check (char_length(btrim(title)) between 1 and 160),
  constraint projects_subtitle_length check (subtitle is null or char_length(subtitle) <= 240),
  constraint projects_short_description_length check (char_length(btrim(short_description)) between 1 and 500),
  constraint projects_description_length check (char_length(btrim(description)) between 1 and 10000),
  constraint projects_category_length check (char_length(btrim(category)) between 1 and 100),
  constraint projects_status_check check (status in ('draft', 'published', 'archived')),
  constraint projects_display_order_check check (display_order >= 0),
  constraint projects_demo_url_check check (demo_url is null or (char_length(demo_url) <= 2048 and demo_url ~ '^https://[^[:space:]]+$')),
  constraint projects_repository_url_check check (repository_url is null or (char_length(repository_url) <= 2048 and repository_url ~ '^https://[^[:space:]]+$')),
  constraint projects_published_at_check check (status <> 'published' or published_at is not null)
);

create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_display_order_idx on public.projects (display_order, title);

create or replace function public.set_projects_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  if new.status = 'published' and new.published_at is null then
    new.published_at = case
      when tg_op = 'UPDATE' then coalesce(old.published_at, timezone('utc', now()))
      else timezone('utc', now())
    end;
  elsif tg_op = 'UPDATE' and new.status in ('draft', 'archived') and old.published_at is not null then
    new.published_at = old.published_at;
  end if;
  return new;
end;
$$;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before insert or update on public.projects
for each row execute function public.set_projects_updated_at();

alter table public.projects enable row level security;

revoke all on table public.projects from anon, authenticated;
grant select on table public.projects to anon, authenticated;
grant insert, update, delete on table public.projects to authenticated;

drop policy if exists "Anyone can read published projects" on public.projects;
create policy "Anyone can read published projects"
  on public.projects
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Authorized admins can read all projects" on public.projects;
create policy "Authorized admins can read all projects"
  on public.projects
  for select
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

drop policy if exists "Authorized admins can create projects" on public.projects;
create policy "Authorized admins can create projects"
  on public.projects
  for insert
  to authenticated
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

drop policy if exists "Authorized admins can update projects" on public.projects;
create policy "Authorized admins can update projects"
  on public.projects
  for update
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

drop policy if exists "Authorized admins can delete projects" on public.projects;
create policy "Authorized admins can delete projects"
  on public.projects
  for delete
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
