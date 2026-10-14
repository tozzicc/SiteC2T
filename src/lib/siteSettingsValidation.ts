export function normalizeOptionalText(value: string | null | undefined) { const normalized = (value ?? '').trim(); return normalized || null }
export function isValidHttpsUrl(value: string | null | undefined) { const normalized = (value ?? '').trim(); return normalized === '' || (normalized.length <= 2048 && /^https:\/\/[^\s]+$/.test(normalized)) }

export function normalizeEmail(value: string | null | undefined) { return normalizeOptionalText(value)?.toLowerCase() ?? null }
export function normalizeWhatsapp(value: string | null | undefined) { const normalized = normalizeOptionalText(value); return normalized ? normalized.replace(/\D/g, '') : null }
export function isValidEmail(value: string | null | undefined) { const normalized = normalizeEmail(value); return normalized === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) }
export function isValidWhatsapp(value: string | null | undefined) { const normalized = normalizeWhatsapp(value); return normalized === null || /^[1-9][0-9]{7,14}$/.test(normalized) }
