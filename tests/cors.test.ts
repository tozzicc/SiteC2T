import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { allowedOrigins, corsHeaders } from '../supabase/functions/_shared/cors.ts'

const statusFunction = readFileSync(new URL('../supabase/functions/get-checkout-status/index.ts', import.meta.url), 'utf8')
const paymentResult = readFileSync(new URL('../src/pages/PaymentResultPage.tsx', import.meta.url), 'utf8')

test('CORS autoriza somente os domínios C2T configurados', () => {
  const headers = corsHeaders('https://www.c2ttecnologia.com.br')
  assert.equal(headers.get('Access-Control-Allow-Origin'), 'https://www.c2ttecnologia.com.br')
  assert.equal(headers.get('Access-Control-Allow-Methods'), 'GET, OPTIONS')
  assert.equal(corsHeaders('https://evil.example').get('Access-Control-Allow-Origin'), null)
  assert.deepEqual(allowedOrigins('https://staging.example, https://www.c2ttecnologia.com.br'), ['https://staging.example', 'https://www.c2ttecnologia.com.br'])
})

test('CORS mantém os cabeçalhos necessários para preflight e erros', () => {
  const headers = corsHeaders('https://c2ttecnologia.com.br')
  assert.equal(headers.get('Access-Control-Allow-Headers'), 'content-type, x-client-info, apikey, authorization')
  assert.equal(headers.get('Access-Control-Max-Age'), '600')
  assert.equal(headers.get('Vary'), 'Origin')
  assert.match(statusFunction, /method === 'OPTIONS'/)
  assert.match(statusFunction, /response\(\{ error: 'method_not_allowed'/)
  assert.match(statusFunction, /response\(\{ error: 'status_not_configured'/)
  assert.match(statusFunction, /response\(\{ error: 'status_unavailable'/)
  assert.match(statusFunction, /corsHeaders\(origin/)
})

test('retorno do frontend só apresenta aprovação para status aprovado do backend', () => {
  assert.match(paymentResult, /confirmedStatus === 'approved'/)
  assert.match(paymentResult, /Pagamento aprovado/)
  assert.match(paymentResult, /Pagamento em verificaÃ§Ã£o|Pagamento em verificação/)
  assert.match(paymentResult, /catch.*setConfirmedStatus\('unknown'\)/s)
})
