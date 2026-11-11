import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SITE_ORIGIN = 'https://www.c2ttecnologia.com.br'
const MERCADO_PAGO_ORDERS_URL = 'https://api.mercadopago.com/v1/orders'
const JSON_HEADERS = { 'Content-Type': 'application/json' }
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Reservation = { code: string; attempt_id?: string; title?: string; amount?: number; external_reference?: string; order_id?: string | null; checkout_url?: string }

function allowedOrigins() { return (Deno.env.get('CHECKOUT_ALLOWED_ORIGINS') || SITE_ORIGIN).split(',').map((origin) => origin.trim()).filter(Boolean) }

function corsHeaders(origin: string | null) {
  const headers = new Headers(JSON_HEADERS)
  if (origin && allowedOrigins().includes(origin)) { headers.set('Access-Control-Allow-Origin', origin); headers.set('Vary', 'Origin') }
  headers.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type')
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  return headers
}

function response(body: Record<string, unknown>, status: number, origin: string | null) { return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) }) }
function fail(message: string, status: number, origin: string | null, code = 'checkout_error') { return response({ error: message, code }, status, origin) }

function isCheckoutUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (url.hostname === 'mercadopago.com.br' || url.hostname.endsWith('.mercadopago.com.br') || url.hostname === 'mercadopago.com' || url.hostname.endsWith('.mercadopago.com'))
  } catch { return false }
}

function siteUrl(path: string) {
  const configured = Deno.env.get('CHECKOUT_SITE_URL') || SITE_ORIGIN
  try { const url = new URL(configured); if (url.origin !== SITE_ORIGIN) throw new Error('invalid site origin'); return new URL(path, url).toString() } catch { return new URL(path, SITE_ORIGIN).toString() }
}

async function readJson(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 10_000) throw new Error('payload_too_large')
  const value: unknown = await request.json()
  if (!value || typeof value !== 'object') throw new Error('invalid_payload')
  return value as Record<string, unknown>
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs = 10_000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try { return await fetch(input, { ...init, signal: controller.signal }) } finally { clearTimeout(timer) }
}

async function markAttempt(supabase: ReturnType<typeof createClient>, attemptId: string, values: Record<string, unknown>) {
  const { error } = await supabase.from('checkout_order_attempts').update(values).eq('id', attemptId)
  return error
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin')
  if (!origin || !allowedOrigins().includes(origin)) return fail('Origem não autorizada.', 403, origin, 'origin_not_allowed')
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (request.method !== 'POST') return fail('Método não permitido.', 405, origin, 'method_not_allowed')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
  if (!supabaseUrl || !serviceRoleKey || !accessToken || Deno.env.get('MERCADOPAGO_ENVIRONMENT') !== 'test') return fail('Checkout de teste indisponível.', 503, origin, 'checkout_not_configured')

  let payload: Record<string, unknown>
  try { payload = await readJson(request) } catch { return fail('Dados de checkout inválidos.', 400, origin, 'invalid_payload') }
  const projectId = typeof payload.project_id === 'string' ? payload.project_id : ''
  const idempotencyKey = typeof payload.idempotency_key === 'string' ? payload.idempotency_key : ''
  const buyerEmail = typeof payload.buyer_email === 'string' ? payload.buyer_email.trim().toLowerCase() : ''
  if (!UUID_RE.test(projectId) || !UUID_RE.test(idempotencyKey) || buyerEmail.length > 254 || !EMAIL_RE.test(buyerEmail)) return fail('Informe um projeto e um e-mail válidos.', 400, origin, 'invalid_buyer_data')

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const externalReference = `c2t-${idempotencyKey}`
  const { data: rawReservation, error: reservationError } = await supabase.rpc('reserve_checkout_order_attempt', { p_project_id: projectId, p_buyer_email: buyerEmail, p_idempotency_key: idempotencyKey, p_external_reference: externalReference })
  if (reservationError || !rawReservation || typeof rawReservation !== 'object') { console.error('checkout_reservation_failed', reservationError?.code || 'invalid_response'); return fail('Não foi possível reservar o checkout.', 503, origin, 'reservation_failed') }
  const reservation = rawReservation as Reservation

  if (reservation.code === 'created') {
    if (!isCheckoutUrl(reservation.checkout_url)) return fail('O checkout existente precisa de verificação manual.', 409, origin, 'checkout_result_unknown')
    return response({ checkout_url: reservation.checkout_url, order_id: reservation.order_id }, 200, origin)
  }
  if (reservation.code === 'processing') return fail('Esta tentativa já está sendo processada. Aguarde a confirmação.', 409, origin, 'checkout_processing')
  if (reservation.code === 'failed') return fail('Esta tentativa falhou. Inicie uma nova tentativa.', 409, origin, 'checkout_failed')
  if (reservation.code === 'unknown') return fail('O resultado desta tentativa é desconhecido. Não repita a cobrança; aguarde a verificação.', 409, origin, 'checkout_result_unknown')
  if (reservation.code === 'rate_limited') return fail('Muitas tentativas recentes. Aguarde um minuto e tente novamente.', 429, origin, 'rate_limited')
  if (reservation.code === 'ineligible') return fail('A oferta não está disponível para compra.', 409, origin, 'offer_unavailable')
  if (reservation.code === 'ambiguous_offer') return fail('A oferta de compra precisa de revisão administrativa.', 409, origin, 'offer_ambiguous')
  if (reservation.code !== 'reserved' || !reservation.attempt_id || !reservation.title || typeof reservation.amount !== 'number' || !Number.isFinite(reservation.amount) || reservation.amount <= 0 || reservation.external_reference !== externalReference) return fail('A reserva de checkout é inválida.', 503, origin, 'reservation_invalid')

  const amountText = reservation.amount.toFixed(2)
  let mercadoResponse: Response
  try {
    mercadoResponse = await fetchWithTimeout(MERCADO_PAGO_ORDERS_URL, { method: 'POST', headers: { ...JSON_HEADERS, Authorization: `Bearer ${accessToken}`, 'X-Idempotency-Key': idempotencyKey }, body: JSON.stringify({ type: 'online', processing_mode: 'manual', capture_mode: 'automatic', total_amount: amountText, external_reference: reservation.external_reference, description: `Aquisição do sistema ${reservation.title}`, payer: { email: buyerEmail }, items: [{ title: reservation.title, description: 'Aquisição do sistema C2T Tecnologia', quantity: 1, unit_price: amountText }], config: { online: { success_url: siteUrl('/pagamento/sucesso'), failure_url: siteUrl('/pagamento/recusado'), pending_url: siteUrl('/pagamento/pendente'), auto_return: 'approved' } } }) })
  } catch (error) {
    console.error('checkout_provider_request_failed', error instanceof Error ? error.name : 'unknown')
    await markAttempt(supabase, reservation.attempt_id, { status: 'unknown', failure_code: 'mercadopago_result_unknown' })
    return fail('Não foi possível confirmar o resultado da tentativa. Não repita a cobrança automaticamente.', 503, origin, 'checkout_result_unknown')
  }

  if (!mercadoResponse.ok) {
    await markAttempt(supabase, reservation.attempt_id, { status: 'failed', failure_code: `mercadopago_${mercadoResponse.status}` })
    return fail('Não foi possível criar o checkout. Tente novamente.', mercadoResponse.status === 429 ? 429 : 502, origin, 'checkout_provider_rejected')
  }

  let mercadoOrder: unknown
  try { mercadoOrder = await mercadoResponse.json() } catch (error) { console.error('checkout_provider_invalid_json', error instanceof Error ? error.name : 'unknown'); await markAttempt(supabase, reservation.attempt_id, { status: 'unknown', failure_code: 'mercadopago_invalid_json' }); return fail('O resultado do checkout é desconhecido. Não repita a cobrança automaticamente.', 503, origin, 'checkout_result_unknown') }
  const order = mercadoOrder && typeof mercadoOrder === 'object' ? mercadoOrder as Record<string, unknown> : {}
  if (typeof order.id !== 'string' || !isCheckoutUrl(order.checkout_url)) { await markAttempt(supabase, reservation.attempt_id, { status: 'unknown', failure_code: 'invalid_checkout_response' }); return fail('O resultado do checkout é desconhecido. Não repita a cobrança automaticamente.', 503, origin, 'checkout_result_unknown') }
  const updateError = await markAttempt(supabase, reservation.attempt_id, { status: 'created', mercadopago_order_id: order.id, checkout_url: order.checkout_url })
  if (updateError) { console.error('checkout_persistence_failed', updateError.code || 'unknown'); return fail('O checkout foi criado, mas não pôde ser registrado com segurança. Não repita a cobrança.', 503, origin, 'checkout_result_unknown') }
  return response({ checkout_url: order.checkout_url, order_id: order.id }, 201, origin)
})
