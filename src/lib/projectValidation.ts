export function normalizeOptionalUrl(value: string | null | undefined): string | null {
  const normalized = (value ?? '').trim()
  return normalized || null
}

export function isValidHttpsUrl(value: string | null | undefined): boolean {
  const normalized = normalizeOptionalUrl(value)
  return normalized === null || /^https:\/\/[^\s]+$/.test(normalized)
}
