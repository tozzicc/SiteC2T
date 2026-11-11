export type MercadoPagoOrder = {
  id?: unknown
  type?: unknown
  external_reference?: unknown
  total_amount?: unknown
  total_paid_amount?: unknown
  currency?: unknown
  status?: unknown
  status_detail?: unknown
}

export type InternalPaymentStatus = 'created' | 'pending' | 'approved' | 'rejected' | 'canceled' | 'unknown'

export function parseSignature(value: string | null) {
  const result: Record<string, string> = {}
  for (const part of (value || '').split(',')) {
    const separator = part.indexOf('=')
    if (separator > 0) result[part.slice(0, separator).trim()] = part.slice(separator + 1).trim()
  }
  return result
}

export function webhookManifest(dataId: string, requestId: string, timestamp: string) {
  return `id:${dataId};request-id:${requestId};ts:${timestamp};`
}

export function mapOrderStatus(order: MercadoPagoOrder): InternalPaymentStatus {
  if (order.status === 'processed' && order.status_detail === 'accredited') return 'approved'
  if (order.status === 'failed') return 'rejected'
  if (order.status === 'canceled') return 'canceled'
  if (order.status === 'refunded' || order.status === 'charged_back') return 'rejected'
  if (order.status === 'created' || order.status === 'processing' || order.status === 'action_required') return 'pending'
  return 'unknown'
}

export function statusRank(status: string) {
  return ({ creating: 0, created: 1, unknown: 1, pending: 2, rejected: 3, canceled: 3, approved: 4 } as Record<string, number>)[status] ?? 0
}

export function isTerminalStatus(status: string) {
  return status === 'approved' || status === 'rejected' || status === 'canceled'
}

export function amountEquals(left: unknown, right: number) {
  return typeof left === 'string' && /^\d+(\.\d{1,2})?$/.test(left) && Number(left).toFixed(2) === right.toFixed(2)
}
