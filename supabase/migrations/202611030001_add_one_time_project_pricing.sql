-- ET-14: modalidade inequívoca de compra única.
-- Aplicar manualmente no Supabase após revisar os valores a cadastrar.

alter table public.project_pricing
  add column if not exists one_time_price numeric(12,2);

-- Pré-validação transacional: qualquer resultado incompatível interrompe a
-- migration antes de remover constraints ou substituir a RPC existente.
do $$
begin
  if exists (select 1 from public.project_pricing where pricing_type = 'license') then
    raise exception 'ET-14A interrompida: existem registros license em project_pricing. Preserve-os mediante decisão administrativa antes de aplicar esta migration.';
  end if;

  if exists (
    select 1 from public.project_pricing
    where pricing_type not in ('implementation', 'facilitated_implementation')
  ) then
    raise exception 'ET-14A interrompida: existem pricing_type desconhecidos em project_pricing.';
  end if;

  if exists (
    select 1 from public.project_pricing
    where pricing_type = 'implementation'
      and (license_price is not null or billing_type is not null or billing_interval is not null
        or introductory_monthly_price is not null or introductory_months is not null
        or standard_monthly_price is not null)
  ) then
    raise exception 'ET-14A interrompida: registros implementation possuem campos de outra modalidade.';
  end if;

  if exists (
    select 1 from public.project_pricing
    where pricing_type = 'facilitated_implementation'
      and (setup_price is not null or recurring_price is not null or license_price is not null
        or billing_type is not null or billing_interval is not null)
  ) then
    raise exception 'ET-14A interrompida: registros facilitated_implementation possuem campos de outra modalidade.';
  end if;

  if exists (
    select 1 from public.project_pricing
    where coalesce(setup_price, 0) < 0 or coalesce(recurring_price, 0) < 0
      or coalesce(license_price, 0) < 0 or coalesce(introductory_monthly_price, 0) < 0
      or coalesce(standard_monthly_price, 0) < 0
  ) then
    raise exception 'ET-14A interrompida: existem preços negativos em project_pricing.';
  end if;
end;
$$;

alter table public.project_pricing drop constraint if exists project_pricing_type_check;
alter table public.project_pricing drop constraint if exists project_pricing_prices_check;
alter table public.project_pricing drop constraint if exists project_pricing_commercial_fields_check;

alter table public.project_pricing
  add constraint project_pricing_type_check check (pricing_type in ('one_time', 'implementation', 'facilitated_implementation')),
  add constraint project_pricing_prices_check check (
    coalesce(setup_price, 0) >= 0
    and coalesce(recurring_price, 0) >= 0
    and coalesce(license_price, 0) >= 0
    and coalesce(introductory_monthly_price, 0) >= 0
    and coalesce(standard_monthly_price, 0) >= 0
    and coalesce(one_time_price, 0) >= 0
  ),
  add constraint project_pricing_commercial_fields_check check (
    (pricing_type = 'one_time'
      and one_time_price is not null
      and setup_price is null
      and recurring_price is null
      and license_price is null
      and billing_type is null
      and billing_interval is null
      and introductory_monthly_price is null
      and introductory_months is null
      and standard_monthly_price is null)
    or
    (pricing_type = 'implementation'
      and one_time_price is null
      and license_price is null
      and billing_type is null
      and billing_interval is null
      and introductory_monthly_price is null
      and introductory_months is null
      and standard_monthly_price is null)
    or
    (pricing_type = 'facilitated_implementation'
      and one_time_price is null
      and setup_price is null
      and recurring_price is null
      and license_price is null
      and billing_type is null
      and billing_interval is null)
  );

-- CREATE OR REPLACE não pode alterar o tipo de retorno da função. A remoção
-- sem CASCADE é deliberada: dependências SQL devem ser identificadas e
-- tratadas antes da aplicação, nunca descartadas implicitamente.
do $$
begin
  if exists (
    select 1
    from pg_depend d
    where d.refobjid = 'public.get_public_project_pricing(uuid)'::regprocedure
      and d.deptype = 'n'
  ) then
    raise exception 'ET-14A interrompida: existem objetos SQL dependentes de public.get_public_project_pricing(uuid). Trate-os antes de recriar a RPC.';
  end if;
end;
$$;

drop function public.get_public_project_pricing(uuid);

create function public.get_public_project_pricing(p_project_id uuid)
returns table (
  id uuid, project_id uuid, pricing_type text, title text, description text,
  setup_price numeric(12,2), recurring_price numeric(12,2),
  introductory_monthly_price numeric(12,2), introductory_months integer,
  standard_monthly_price numeric(12,2), one_time_price numeric(12,2),
  included_features text[], commercial_terms text, support_terms text,
  cta_label text, is_active boolean, show_price boolean, display_order integer
)
language sql security definer set search_path = pg_catalog, public
as $$
  select pp.id, pp.project_id, pp.pricing_type, pp.title, pp.description,
    case when pp.show_price then pp.setup_price else null end,
    case when pp.show_price then pp.recurring_price else null end,
    case when pp.show_price then pp.introductory_monthly_price else null end,
    case when pp.show_price then pp.introductory_months else null end,
    case when pp.show_price then pp.standard_monthly_price else null end,
    case when pp.show_price then pp.one_time_price else null end,
    pp.included_features, pp.commercial_terms, pp.support_terms, pp.cta_label,
    true, pp.show_price, pp.display_order
  from public.project_pricing pp
  inner join public.projects p on p.id = pp.project_id
  where pp.project_id = p_project_id
    and pp.is_active = true
    and p.status = 'published'
  order by pp.display_order, pp.pricing_type;
$$;

revoke all on function public.get_public_project_pricing(uuid) from public;
grant execute on function public.get_public_project_pricing(uuid) to anon, authenticated;
