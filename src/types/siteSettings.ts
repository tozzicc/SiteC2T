export type SiteSettings = { id: 1; company_name: string; tagline: string | null; company_description: string | null; contact_email: string | null; whatsapp_number: string | null; linkedin_url: string | null; instagram_url: string | null; form_endpoint: string | null; created_at: string; updated_at: string }
export type SiteSettingsFormData = Omit<SiteSettings, 'id' | 'created_at' | 'updated_at'>
export type SiteSettingsUpdateInput = Partial<SiteSettingsFormData>
