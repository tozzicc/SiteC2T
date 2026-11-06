import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const functionSource = readFileSync(new URL('../supabase/functions/create-checkout-order/index.ts', import.meta.url), 'utf8')
const clientSource = readFileSync(new URL('../src/lib/checkout.ts', import.meta.url), 'utf8')
const migration = readFileSync(new URL('../supabase/migrations/202611050001_create_checkout_order_attempts.sql', import.meta.url), 'utf8')
const config = readFileSync(new URL('../supabase/config.toml', import.meta.url), 'utf8')

test('checkout valida a oferta implementation no banco e usa somente setup_price', () => {
  assert.match(migration, /pricing_type = 'implementation'/i)
  assert.match(migration, /is_active = true/i)
  assert.match(migration, /setup_price > 0/i)
  assert.doesNotMatch(functionSource, /recurring_price|one_time_price/i)
})

test('checkout exige idempotência, registra a order e trata duplicidade', () => {
  assert.match(functionSource, /X-Idempotency-Key/i)
  assert.match(functionSource, /reserve_checkout_order_attempt/i)
  assert.match(functionSource, /mercadopago_order_id/i)
  assert.match(migration, /pg_advisory_xact_lock/i)
  assert.match(migration, /status in \('creating', 'created', 'failed', 'unknown'\)/i)
  assert.match(migration, /idempotency_key uuid not null unique/i)
  assert.match(migration, /mercadopago_order_id text/i)
})

test('checkout não expõe credenciais no frontend e valida o redirect', () => {
  assert.doesNotMatch(clientSource, /ACCESS_TOKEN|SERVICE_ROLE|Bearer/i)
  assert.match(clientSource, /isCheckoutUrl/i)
  assert.match(functionSource, /Authorization: `Bearer \$\{accessToken\}`/i)
  assert.match(functionSource, /config: \{ online:/i)
  assert.match(functionSource, /auto_return: 'approved'/i)
})

test('função pública desabilita somente o JWT do checkout', () => {
  assert.match(config, /\[functions\.create-checkout-order\]/i)
  assert.match(config, /verify_jwt\s*=\s*false/i)
  assert.doesNotMatch(config, /\[functions\.(?!create-checkout-order)[^\]]+\]/i)
})
