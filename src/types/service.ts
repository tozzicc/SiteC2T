export const SERVICE_ICON_NAMES = ['Code2', 'BriefcaseBusiness', 'Workflow', 'Headset', 'Bot', 'Settings', 'Wrench', 'BarChart3', 'Globe2', 'Database', 'ShieldCheck'] as const
export type ServiceIconName = (typeof SERVICE_ICON_NAMES)[number]
export type ServiceStatus = 'draft' | 'published' | 'archived'

export type Service = { id: string; slug: string; title: string; short_description: string; description: string; icon_name: ServiceIconName | null; features: string[]; status: ServiceStatus; display_order: number; created_at: string; updated_at: string; published_at: string | null }
export type ServiceFormData = { slug: string; title: string; short_description: string; description: string; icon_name: ServiceIconName; features: string[]; status: ServiceStatus; display_order: number }
export type ServiceCreateInput = ServiceFormData
export type ServiceUpdateInput = Partial<ServiceFormData>
