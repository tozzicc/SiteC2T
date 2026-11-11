-- ET-15C: estados e metadados da confirmação autenticada do provedor.
-- Aplicar manualmente no Supabase; esta migration não é executada por este projeto.
alter table public.checkout_order_attempts
  drop constraint if exists checkout_order_attempts_status_check;

alter table public.checkout_order_attempts
  add constraint checkout_order_attempts_status_check
  check (status in ('creating', 'created', 'pending', 'approved', 'rejected', 'canceled', 'failed', 'unknown'));

alter table public.checkout_order_attempts
  add column if not exists provider_status text,
  add column if not exists provider_status_detail text,
  add column if not exists last_verified_at timestamptz,
  add column if not exists payment_confirmed_at timestamptz;

create index if not exists checkout_order_attempts_external_reference_idx
  on public.checkout_order_attempts (external_reference);
