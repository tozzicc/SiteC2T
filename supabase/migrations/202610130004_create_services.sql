-- ET-09: serviços administrativos, separados do catálogo público estático.
-- Esta migration deve ser revisada e executada manualmente no SQL Editor.
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text not null,
  description text not null,
  icon_name text,
  features text[] not null default '{}',
  status text not null default 'draft',
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz,
  constraint services_slug_format check (char_length(slug) between 1 and 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint services_title_length check (char_length(btrim(title)) between 1 and 160),
  constraint services_short_description_length check (char_length(btrim(short_description)) between 1 and 500),
  constraint services_description_length check (char_length(btrim(description)) between 1 and 10000),
  constraint services_icon_length check (icon_name is null or char_length(btrim(icon_name)) between 1 and 60),
  constraint services_status_check check (status in ('draft', 'published', 'archived')),
  constraint services_display_order_check check (display_order >= 0),
  constraint services_published_at_check check (status <> 'published' or published_at is not null)
);

create index if not exists services_status_idx on public.services (status);
create index if not exists services_display_order_idx on public.services (display_order, title);

create or replace function public.set_services_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = timezone('utc', now());
  if new.status = 'published' and new.published_at is null then
    new.published_at = case when tg_op = 'UPDATE' then coalesce(old.published_at, timezone('utc', now())) else timezone('utc', now()) end;
  elsif tg_op = 'UPDATE' and new.status in ('draft', 'archived') and old.published_at is not null then
    new.published_at = old.published_at;
  end if;
  return new;
end;
$$;

drop trigger if exists set_services_updated_at on public.services;
create trigger set_services_updated_at before insert or update on public.services for each row execute function public.set_services_updated_at();

alter table public.services enable row level security;
revoke all on table public.services from anon, authenticated;
grant select on table public.services to anon, authenticated;
grant insert, update, delete on table public.services to authenticated;

drop policy if exists "Anyone can read published services" on public.services;
create policy "Anyone can read published services" on public.services for select to anon, authenticated using (status = 'published');
drop policy if exists "Authorized admins can read all services" on public.services;
create policy "Authorized admins can read all services" on public.services for select to authenticated using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
drop policy if exists "Authorized admins can create services" on public.services;
create policy "Authorized admins can create services" on public.services for insert to authenticated with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
drop policy if exists "Authorized admins can update services" on public.services;
create policy "Authorized admins can update services" on public.services for update to authenticated using (exists (select 1 from public.admin_users where user_id = (select auth.uid()))) with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
drop policy if exists "Authorized admins can delete services" on public.services;
create policy "Authorized admins can delete services" on public.services for delete to authenticated using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
