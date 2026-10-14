-- ET-09: uma única linha de configurações institucionais públicas.
-- Esta migration deve ser revisada e executada manualmente no SQL Editor.
create table if not exists public.site_settings (
  id integer primary key,
  company_name text not null,
  tagline text,
  company_description text,
  contact_email text,
  whatsapp_number text,
  linkedin_url text,
  instagram_url text,
  form_endpoint text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint site_settings_singleton check (id = 1),
  constraint site_settings_company_name_length check (char_length(btrim(company_name)) between 1 and 160),
  constraint site_settings_tagline_length check (tagline is null or char_length(tagline) <= 240),
  constraint site_settings_description_length check (company_description is null or char_length(company_description) <= 2000),
  constraint site_settings_email_check check (contact_email is null or contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint site_settings_whatsapp_check check (whatsapp_number is null or whatsapp_number ~ '^[1-9][0-9]{7,14}$'),
  constraint site_settings_linkedin_check check (linkedin_url is null or (char_length(linkedin_url) <= 2048 and linkedin_url ~ '^https://[^[:space:]]+$')),
  constraint site_settings_instagram_check check (instagram_url is null or (char_length(instagram_url) <= 2048 and instagram_url ~ '^https://[^[:space:]]+$')),
  constraint site_settings_form_endpoint_check check (form_endpoint is null or (char_length(form_endpoint) <= 2048 and form_endpoint ~ '^https://[^[:space:]]+$'))
);

create or replace function public.set_site_settings_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at before update on public.site_settings for each row execute function public.set_site_settings_updated_at();

insert into public.site_settings (id, company_name, tagline)
values (1, 'C2T Tecnologia', 'Tecnologia que simplifica')
on conflict (id) do nothing;

alter table public.site_settings enable row level security;
revoke all on table public.site_settings from anon, authenticated;
grant select on table public.site_settings to anon, authenticated;
grant insert, update on table public.site_settings to authenticated;

drop policy if exists "Anyone can read site settings" on public.site_settings;
create policy "Anyone can read site settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Authorized admins can read site settings" on public.site_settings;
create policy "Authorized admins can read site settings" on public.site_settings for select to authenticated using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
drop policy if exists "Authorized admins can create site settings" on public.site_settings;
create policy "Authorized admins can create site settings" on public.site_settings for insert to authenticated with check (id = 1 and exists (select 1 from public.admin_users where user_id = (select auth.uid())));
drop policy if exists "Authorized admins can update site settings" on public.site_settings;
create policy "Authorized admins can update site settings" on public.site_settings for update to authenticated using (id = 1 and exists (select 1 from public.admin_users where user_id = (select auth.uid()))) with check (id = 1 and exists (select 1 from public.admin_users where user_id = (select auth.uid())));
