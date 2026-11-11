import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const referencePattern = /^c2t-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const orderPattern = /^ORD[A-Z0-9]+$/
const originConfig = () => Deno.env.get('CHECKOUT_ALLOWED_ORIGINS') || ''
const response = (body: Record<string, unknown>, status: number, origin: string | null) => new Response(JSON.stringify(body), { status, headers: corsHeaders(origin, originConfig()) })

Deno.serve(async (request) => {
  const origin = request.headers.get('origin')
  if (request.method === 'OPTIONS') {
    if (!origin || !corsHeaders(origin, originConfig()).has('Access-Control-Allow-Origin')) return response({ error: 'origin_not_allowed' }, 403, origin)
    return new Response(null, { status: 204, headers: corsHeaders(origin, originConfig()) })
  }
  if (request.method !== 'GET') return response({ error: 'method_not_allowed' }, 405, origin)
  const params = new URL(request.url).searchParams
  const reference = params.get('external_reference') || ''
  const orderId = params.get('order_id') || ''
  if (!referencePattern.test(reference) && !orderPattern.test(orderId)) return response({ status: 'unknown' }, 200, origin)
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return response({ error: 'status_not_configured' }, 503, origin)
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const query = supabase.from('checkout_order_attempts').select('status,provider_status,provider_status_detail,last_verified_at')
  const { data, error } = referencePattern.test(reference) ? await query.eq('external_reference', reference).maybeSingle() : await query.eq('mercadopago_order_id', orderId).maybeSingle()
  if (error) return response({ error: 'status_unavailable' }, 503, origin)
  if (!data) return response({ status: 'unknown' }, 200, origin)
  return response({ status: data.status, provider_status: data.provider_status, provider_status_detail: data.provider_status_detail, last_verified_at: data.last_verified_at }, 200, origin)
})
