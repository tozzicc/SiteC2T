-- ET-13: credenciais públicas e intencionalmente exclusivas de demonstração.
-- Não executar automaticamente: revisar e aplicar manualmente no SQL Editor.
-- A URL da demonstração continua sendo reutilizada de public.projects.demo_url.

create table if not exists public.project_demos (
  project_id uuid primary key references public.projects(id) on delete cascade,
  demo_username text not null,
  demo_password text not null,
  is_enabled boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_demos_username_length check (char_length(btrim(demo_username)) between 1 and 160),
  constraint project_demos_password_length check (char_length(demo_password) between 1 and 160)
);

create or replace function public.set_project_demos_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_project_demos_updated_at on public.project_demos;
create trigger set_project_demos_updated_at
before update on public.project_demos
for each row execute function public.set_project_demos_updated_at();

alter table public.project_demos enable row level security;

revoke all on table public.project_demos from anon, authenticated;
grant select on table public.project_demos to anon, authenticated;
grant insert, update, delete on table public.project_demos to authenticated;

drop policy if exists "Anyone can read enabled published demos" on public.project_demos;
create policy "Anyone can read enabled published demos"
  on public.project_demos
  for select
  to anon, authenticated
  using (
    is_enabled
    and exists (
      select 1 from public.projects
      where public.projects.id = project_demos.project_id
        and public.projects.status = 'published'
    )
  );

drop policy if exists "Authorized admins can read all demos" on public.project_demos;
create policy "Authorized admins can read all demos"
  on public.project_demos
  for select
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

drop policy if exists "Authorized admins can create demos" on public.project_demos;
create policy "Authorized admins can create demos"
  on public.project_demos
  for insert
  to authenticated
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

drop policy if exists "Authorized admins can update demos" on public.project_demos;
create policy "Authorized admins can update demos"
  on public.project_demos
  for update
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
  with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

drop policy if exists "Authorized admins can delete demos" on public.project_demos;
create policy "Authorized admins can delete demos"
  on public.project_demos
  for delete
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
