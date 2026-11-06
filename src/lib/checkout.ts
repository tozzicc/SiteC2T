const configuredEndpoint = import.meta.env.VITE_CHECKOUT_FUNCTION_URL?.trim() ?? ''
const checkoutEnabled = import.meta.env.VITE_CHECKOUT_ENABLED === 'true'

export const isCheckoutConfigured = checkoutEnabled && /^https:\/\//i.test(configuredEndpoint)

type CheckoutResponse = { checkout_url: string; order_id: string | null }
export class CheckoutError extends Error { retryable: boolean; constructor(message: string, retryable = true) { super(message); this.name = 'CheckoutError'; this.retryable = retryable } }

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => { const random = Math.random() * 16 | 0; const value = char === 'x' ? random : random & 3 | 8; return value.toString(16) })
}

function isCheckoutUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try { const url = new URL(value); return url.protocol === 'https:' && (url.hostname === 'mercadopago.com.br' || url.hostname.endsWith('.mercadopago.com.br') || url.hostname === 'mercadopago.com' || url.hostname.endsWith('.mercadopago.com')) } catch { return false }
}

export async function createCheckoutOrder(projectId: string, buyerEmail: string): Promise<CheckoutResponse> {
  if (!isCheckoutConfigured) throw new CheckoutError('O checkout ainda não está disponível.')
  const response = await fetch(configuredEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: projectId, buyer_email: buyerEmail, idempotency_key: newIdempotencyKey() }) })
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) { const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : 'Não foi possível iniciar o checkout.'; const code = body && typeof body === 'object' && 'code' in body && typeof body.code === 'string' ? body.code : ''; throw new CheckoutError(message, code !== 'checkout_result_unknown') }
  const result = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  if (!isCheckoutUrl(result.checkout_url)) throw new CheckoutError('O checkout retornado é inválido.', false)
  return { checkout_url: result.checkout_url, order_id: typeof result.order_id === 'string' ? result.order_id : null }
}
