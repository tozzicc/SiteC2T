const DEFAULT_ALLOWED_ORIGINS = ['https://www.c2ttecnologia.com.br', 'https://c2ttecnologia.com.br']

export function allowedOrigins(configured = '') {
  const origins = configured.split(',').map((origin) => origin.trim()).filter(Boolean)
  return origins.length > 0 ? origins : DEFAULT_ALLOWED_ORIGINS
}

export function corsHeaders(origin: string | null, configured = '') {
  const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  if (origin && allowedOrigins(configured).includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Vary', 'Origin')
  }
  headers.set('Access-Control-Allow-Headers', 'content-type, x-client-info, apikey, authorization')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  headers.set('Access-Control-Max-Age', '600')
  return headers
}
