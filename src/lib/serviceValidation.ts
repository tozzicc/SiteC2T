const SERVICE_ICON_NAMES = ['Code2', 'BriefcaseBusiness', 'Workflow', 'Headset', 'Bot', 'Settings', 'Wrench', 'BarChart3', 'Globe2', 'Database', 'ShieldCheck'] as const
type ServiceIconName = typeof SERVICE_ICON_NAMES[number]

export function isValidHttpsUrl(value: string | null | undefined) { const normalized = (value ?? '').trim(); return normalized === '' || (normalized.length <= 2048 && /^https:\/\/[^\s]+$/.test(normalized)) }

export function isServiceIconName(value: string): value is ServiceIconName { return SERVICE_ICON_NAMES.includes(value as ServiceIconName) }
export function isValidServiceSlug(value: string) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) }
export function normalizeOptionalText(value: string | null | undefined) { const normalized = (value ?? '').trim(); return normalized || null }
