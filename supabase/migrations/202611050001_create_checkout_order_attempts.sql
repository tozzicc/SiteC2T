-- ET-15A: rastreia tentativas de Checkout Pro sem duplicar a estrutura comercial.
-- Aplicar manualmente no Supabase; esta migration não é executada por este projeto.
create table if not exists public.checkout_order_attempts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  pricing_id uuid not null references public.project_pricing(id),
  buyer_email text not null,
  amount numeric(12,2) not null check (amount > 0),
  idempotency_key uuid not null unique,
  external_reference text not null unique,
  mercadopago_order_id text,
  checkout_url text,
  status text not null default 'creating' check (status in ('creating', 'created', 'failed', 'unknown')),
  failure_code text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists checkout_order_attempts_rate_idx
  on public.checkout_order_attempts (created_at desc);

create index if not exists checkout_order_attempts_order_idx
  on public.checkout_order_attempts (mercadopago_order_id)
  where mercadopago_order_id is not null;

create or replace function public.set_checkout_order_attempt_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_checkout_order_attempt_updated_at on public.checkout_order_attempts;
create trigger set_checkout_order_attempt_updated_at
before update on public.checkout_order_attempts
for each row execute function public.set_checkout_order_attempt_updated_at();

-- Reserva a tentativa, valida a oferta e aplica um limite global atômico.
-- O lock é apenas transacional e não persiste IP ou outro identificador pessoal.
create or replace function public.reserve_checkout_order_attempt(
  p_project_id uuid,
  p_buyer_email text,
  p_idempotency_key uuid,
  p_external_reference text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  existing public.checkout_order_attempts;
  offer record;
  attempt public.checkout_order_attempts;
  recent_attempts integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('c2t-checkout-global-rate-v1', 0));

  select * into existing
    from public.checkout_order_attempts
   where idempotency_key = p_idempotency_key
   for update;

  if found then
    if existing.status = 'created' then
      if existing.checkout_url is null then
        return jsonb_build_object('code', 'unknown', 'attempt_id', existing.id);
      end if;
      return jsonb_build_object('code', 'created', 'attempt_id', existing.id, 'amount', existing.amount, 'external_reference', existing.external_reference, 'order_id', existing.mercadopago_order_id, 'checkout_url', existing.checkout_url);
    end if;
    if existing.status = 'creating' and existing.updated_at > timezone('utc', now()) - interval '10 minutes' then
      return jsonb_build_object('code', 'processing', 'attempt_id', existing.id);
    end if;
    if existing.status = 'creating' then
      update public.checkout_order_attempts set status = 'unknown', failure_code = 'stale_creating_attempt' where id = existing.id;
    end if;
    if existing.status in ('failed', 'unknown') or existing.status = 'creating' then
      return jsonb_build_object('code', case when existing.status = 'failed' then 'failed' else 'unknown' end, 'attempt_id', existing.id);
    end if;
  end if;

  select pp.id, pp.project_id, pp.title, pp.setup_price
    into offer
    from public.project_pricing pp
    join public.projects p on p.id = pp.project_id
   where pp.project_id = p_project_id
     and pp.pricing_type = 'implementation'
     and pp.is_active = true
     and p.status = 'published'
     and pp.setup_price is not null
     and pp.setup_price > 0;

  if not found then
    return jsonb_build_object('code', 'ineligible');
  end if;

  select count(*)::integer into recent_attempts
    from public.checkout_order_attempts
   where created_at >= timezone('utc', now()) - interval '1 minute';

  if recent_attempts >= 20 then
    return jsonb_build_object('code', 'rate_limited');
  end if;

  insert into public.checkout_order_attempts (project_id, pricing_id, buyer_email, amount, idempotency_key, external_reference, status)
  values (offer.project_id, offer.id, p_buyer_email, offer.setup_price, p_idempotency_key, p_external_reference, 'creating')
  returning * into attempt;

  return jsonb_build_object('code', 'reserved', 'attempt_id', attempt.id, 'project_id', attempt.project_id, 'pricing_id', attempt.pricing_id, 'title', offer.title, 'amount', attempt.amount, 'external_reference', attempt.external_reference);
exception when unique_violation then
  return jsonb_build_object('code', 'processing');
end;
$$;

alter table public.checkout_order_attempts enable row level security;
revoke all on table public.checkout_order_attempts from anon, authenticated;
grant select, insert, update on table public.checkout_order_attempts to service_role;
revoke all on function public.reserve_checkout_order_attempt(uuid, text, uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_checkout_order_attempt(uuid, text, uuid, text) to service_role;
