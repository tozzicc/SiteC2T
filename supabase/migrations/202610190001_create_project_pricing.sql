-- ET-11: modalidades comerciais por projeto.
-- Não execute automaticamente: revisar e aplicar manualmente no SQL Editor.
create table if not exists public.project_pricing (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  pricing_type text not null,
  title text not null,
  description text,
  setup_price numeric(12,2),
  recurring_price numeric(12,2),
  license_price numeric(12,2),
  billing_type text,
  billing_interval text,
  included_features text[] not null default '{}',
  commercial_terms text,
  support_terms text,
  cta_label text not null default 'Solicitar orçamento',
  is_active boolean not null default false,
  show_price boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_pricing_unique_type unique (project_id, pricing_type),
  constraint project_pricing_type_check check (pricing_type in ('implementation', 'license')),
  constraint project_pricing_prices_check check (coalesce(setup_price, 0) >= 0 and coalesce(recurring_price, 0) >= 0 and coalesce(license_price, 0) >= 0),
  constraint project_pricing_billing_type_check check (billing_type is null or billing_type in ('one_time', 'recurring')),
  constraint project_pricing_interval_check check (billing_interval is null or billing_interval in ('monthly', 'quarterly', 'yearly')),
  constraint project_pricing_billing_consistency check (pricing_type = 'implementation' and billing_type is null and billing_interval is null or pricing_type = 'license' and billing_type is not null and (billing_type = 'one_time' and billing_interval is null or billing_type = 'recurring' and billing_interval is not null)),
  constraint project_pricing_order_check check (display_order >= 0),
  constraint project_pricing_title_check check (char_length(btrim(title)) between 1 and 160),
  constraint project_pricing_cta_check check (char_length(btrim(cta_label)) between 1 and 100)
);

create index if not exists project_pricing_project_idx on public.project_pricing (project_id, is_active, display_order);
create or replace function public.set_project_pricing_updated_at() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = timezone('utc', now()); return new; end; $$;
drop trigger if exists set_project_pricing_updated_at on public.project_pricing;
create trigger set_project_pricing_updated_at before update on public.project_pricing for each row execute function public.set_project_pricing_updated_at();

alter table public.project_pricing enable row level security;
revoke all on table public.project_pricing from anon, authenticated;
grant select, insert, update, delete on table public.project_pricing to authenticated;
drop policy if exists "Authorized admins can read all pricing" on public.project_pricing;
create policy "Authorized admins can read all pricing" on public.project_pricing for select to authenticated using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
drop policy if exists "Authorized admins can create pricing" on public.project_pricing;
create policy "Authorized admins can create pricing" on public.project_pricing for insert to authenticated with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
drop policy if exists "Authorized admins can update pricing" on public.project_pricing;
create policy "Authorized admins can update pricing" on public.project_pricing for update to authenticated using (exists (select 1 from public.admin_users where user_id = (select auth.uid()))) with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));
drop policy if exists "Authorized admins can delete pricing" on public.project_pricing;
create policy "Authorized admins can delete pricing" on public.project_pricing for delete to authenticated using (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

-- Interface pública segura: usuários públicos nunca recebem acesso direto à tabela.
-- Preços ficam NULL quando show_price=false, mesmo que existam no registro administrativo.
create or replace function public.get_public_project_pricing(p_project_id uuid)
returns table (
  id uuid,
  project_id uuid,
  pricing_type text,
  title text,
  description text,
  setup_price numeric(12,2),
  recurring_price numeric(12,2),
  license_price numeric(12,2),
  billing_type text,
  billing_interval text,
  included_features text[],
  commercial_terms text,
  support_terms text,
  cta_label text,
  is_active boolean,
  show_price boolean,
  display_order integer
)
language sql
security definer
set search_path = pg_catalog, public
as $$
  select
    pp.id,
    pp.project_id,
    pp.pricing_type,
    pp.title,
    pp.description,
    case when pp.show_price then pp.setup_price else null end,
    case when pp.show_price then pp.recurring_price else null end,
    case when pp.show_price then pp.license_price else null end,
    pp.billing_type,
    pp.billing_interval,
    pp.included_features,
    pp.commercial_terms,
    pp.support_terms,
    pp.cta_label,
    true,
    pp.show_price,
    pp.display_order
  from public.project_pricing as pp
  inner join public.projects as p on p.id = pp.project_id
  where pp.project_id = p_project_id
    and pp.is_active = true
    and p.status = 'published'
  order by pp.display_order, pp.pricing_type;
$$;

revoke all on function public.get_public_project_pricing(uuid) from public;
grant execute on function public.get_public_project_pricing(uuid) to anon, authenticated;

-- Reversão manual, se necessário:
-- drop table if exists public.project_pricing;
