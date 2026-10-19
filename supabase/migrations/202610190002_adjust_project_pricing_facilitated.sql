-- ET-11B: implantação à vista e implantação facilitada.
-- Migration incremental: a ET-11/ET-11A já foi aplicada remotamente.
-- Não execute automaticamente; revisar e aplicar manualmente no SQL Editor.

-- Não converte licenças antigas silenciosamente. Em caso de registros license,
-- a transação falha antes de alterar a tabela e exige decisão administrativa.
do $$
begin
  if exists (select 1 from public.project_pricing where pricing_type = 'license') then
    raise exception 'ET-11B interrompida: existem registros license em project_pricing. Preserve ou remova-os mediante decisão explícita antes de aplicar esta migration.';
  end if;
end;
$$;

alter table public.project_pricing
  add column if not exists introductory_monthly_price numeric(12,2),
  add column if not exists introductory_months integer,
  add column if not exists standard_monthly_price numeric(12,2);

alter table public.project_pricing drop constraint if exists project_pricing_type_check;
alter table public.project_pricing drop constraint if exists project_pricing_prices_check;
alter table public.project_pricing drop constraint if exists project_pricing_billing_type_check;
alter table public.project_pricing drop constraint if exists project_pricing_interval_check;
alter table public.project_pricing drop constraint if exists project_pricing_billing_consistency;

alter table public.project_pricing
  add constraint project_pricing_type_check check (pricing_type in ('implementation', 'facilitated_implementation')),
  add constraint project_pricing_prices_check check (
    coalesce(setup_price, 0) >= 0
    and coalesce(recurring_price, 0) >= 0
    and coalesce(license_price, 0) >= 0
    and coalesce(introductory_monthly_price, 0) >= 0
    and coalesce(standard_monthly_price, 0) >= 0
  ),
  add constraint project_pricing_introductory_months_check check (introductory_months is null or introductory_months between 1 and 60),
  add constraint project_pricing_commercial_fields_check check (
    (pricing_type = 'implementation'
      and license_price is null
      and billing_type is null
      and billing_interval is null
      and introductory_monthly_price is null
      and introductory_months is null
      and standard_monthly_price is null)
    or
    (pricing_type = 'facilitated_implementation'
      and setup_price is null
      and recurring_price is null
      and license_price is null
      and billing_type is null
      and billing_interval is null)
  );

-- A assinatura RETURNS TABLE mudou. DROP + CREATE ocorre dentro da mesma
-- transação da migration, sem uma janela pública entre as versões.
drop function if exists public.get_public_project_pricing(uuid);

create function public.get_public_project_pricing(p_project_id uuid)
returns table (
  id uuid,
  project_id uuid,
  pricing_type text,
  title text,
  description text,
  setup_price numeric(12,2),
  recurring_price numeric(12,2),
  introductory_monthly_price numeric(12,2),
  introductory_months integer,
  standard_monthly_price numeric(12,2),
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
    case when pp.show_price then pp.introductory_monthly_price else null end,
    case when pp.show_price then pp.introductory_months else null end,
    case when pp.show_price then pp.standard_monthly_price else null end,
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

-- Reversão manual: remover os constraints desta migration, restaurar a função
-- anterior e remover as três colunas adicionadas, somente após validar dados.
