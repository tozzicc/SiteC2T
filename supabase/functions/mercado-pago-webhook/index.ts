import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { amountEquals, isTerminalStatus, mapOrderStatus, parseSignature, statusRank, webhookManifest, type MercadoPagoOrder } from '../_shared/mercado-pago.ts'

const ORDERS_URL = 'https://api.mercadopago.com/v1/orders'
const jsonHeaders = { 'Content-Type': 'application/json' }
const response = (body: Record<string, unknown>, status: number) => new Response(JSON.stringify(body), { status, headers: jsonHeaders })

async function hmac(secret: string, message: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return [...new Uint8Array(signature)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

function equalHex(left: string, right: string) {
  if (!/^[0-9a-f]{64}$/i.test(left) || !/^[0-9a-f]{64}$/i.test(right)) return false
  let difference = left.length ^ right.length
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  return difference === 0
}

async function verifiedSignature(request: Request, dataId: string, secret: string) {
  const signature = parseSignature(request.headers.get('x-signature'))
  const requestId = request.headers.get('x-request-id') || ''
  if (!signature.ts || !signature.v1 || !requestId || !dataId) return false
  const timestamp = Number(signature.ts)
  if (!Number.isSafeInteger(timestamp) || Math.abs(Date.now() - timestamp * 1000) > 15 * 60 * 1000) return false
  return equalHex(await hmac(secret, webhookManifest(dataId, requestId, signature.ts)), signature.v1)
}

async function providerOrder(orderId: string, accessToken: string) {
  const result = await fetch(`${ORDERS_URL}/${encodeURIComponent(orderId)}`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } })
  if (!result.ok) throw new Error(`provider_${result.status}`)
  return await result.json() as MercadoPagoOrder
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return response({ error: 'method_not_allowed' }, 405)
  const secret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET')
  const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!secret || !accessToken || !supabaseUrl || !serviceRoleKey) return response({ error: 'webhook_not_configured' }, 503)

  const dataId = new URL(request.url).searchParams.get('data.id') || ''
  if (!(await verifiedSignature(request, dataId, secret))) return response({ error: 'invalid_signature' }, 401)
  let notification: Record<string, unknown>
  try { notification = await request.json() as Record<string, unknown> } catch { return response({ error: 'invalid_payload' }, 400) }
  const data = notification.data && typeof notification.data === 'object' ? notification.data as Record<string, unknown> : {}
  if (notification.type !== 'order' || typeof data.id !== 'string' || data.id !== dataId) return response({ error: 'invalid_order_notification' }, 400)

  let order: MercadoPagoOrder
  try { order = await providerOrder(dataId, accessToken) } catch (error) { console.error('mercadopago_order_lookup_failed', error instanceof Error ? error.message : 'unknown'); return response({ error: 'provider_unavailable' }, 503) }
  if (order.id !== dataId || order.type !== 'online' || typeof order.external_reference !== 'string') return response({ error: 'provider_order_mismatch' }, 422)
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: attempt, error: lookupError } = await supabase.from('checkout_order_attempts').select('id,status,external_reference,amount,mercadopago_order_id').eq('mercadopago_order_id', dataId).eq('external_reference', order.external_reference).maybeSingle()
  if (lookupError) return response({ error: 'database_unavailable' }, 503)
  if (!attempt) return response({ error: 'unknown_order' }, 404)
  if (order.currency !== 'BRL' || !amountEquals(order.total_amount, Number(attempt.amount)) || !amountEquals(order.total_paid_amount, Number(attempt.amount)) && mapOrderStatus(order) === 'approved') return response({ error: 'order_value_mismatch' }, 422)

  const mappedStatus = mapOrderStatus(order)
  const nextStatus = isTerminalStatus(String(attempt.status)) && statusRank(String(attempt.status)) > statusRank(mappedStatus) ? attempt.status : mappedStatus
  const values = { status: nextStatus, provider_status: typeof order.status === 'string' ? order.status : null, provider_status_detail: typeof order.status_detail === 'string' ? order.status_detail : null, last_verified_at: new Date().toISOString(), ...(nextStatus === 'approved' ? { payment_confirmed_at: new Date().toISOString() } : {}) }
  const { error: updateError } = await supabase.from('checkout_order_attempts').update(values).eq('id', attempt.id)
  if (updateError) return response({ error: 'database_update_failed' }, 503)
  return response({ received: true }, 200)
})
