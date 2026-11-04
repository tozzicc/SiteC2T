-- ET-14A: consultas somente leitura para executar antes da migration.
-- Resultado esperado: todas as consultas retornam 0 linhas.

-- Registros legados que impedem a nova semântica.
select id, project_id, pricing_type
from public.project_pricing
where pricing_type = 'license';

select id, project_id, pricing_type
from public.project_pricing
where pricing_type not in ('implementation', 'facilitated_implementation');

-- Campos incompatíveis com implementation.
select id, project_id, pricing_type, license_price, billing_type, billing_interval,
       introductory_monthly_price, introductory_months, standard_monthly_price
from public.project_pricing
where pricing_type = 'implementation'
  and (license_price is not null or billing_type is not null or billing_interval is not null
    or introductory_monthly_price is not null or introductory_months is not null
    or standard_monthly_price is not null);

-- Campos incompatíveis com facilitated_implementation.
select id, project_id, pricing_type, setup_price, recurring_price, license_price,
       billing_type, billing_interval
from public.project_pricing
where pricing_type = 'facilitated_implementation'
  and (setup_price is not null or recurring_price is not null or license_price is not null
    or billing_type is not null or billing_interval is not null);

-- Valores negativos, que impediriam a recriação da constraint.
select id, project_id, pricing_type, setup_price, recurring_price, license_price,
       introductory_monthly_price, standard_monthly_price
from public.project_pricing
where coalesce(setup_price, 0) < 0 or coalesce(recurring_price, 0) < 0
   or coalesce(license_price, 0) < 0
   or coalesce(introductory_monthly_price, 0) < 0
   or coalesce(standard_monthly_price, 0) < 0;

-- Dependências SQL da RPC que exigiriam tratamento antes do DROP/CREATE.
select d.classid::regclass as dependent_catalog,
       d.objid as dependent_object_id,
       d.deptype
from pg_depend d
where d.refobjid = 'public.get_public_project_pricing(uuid)'::regprocedure
  and d.deptype = 'n';
