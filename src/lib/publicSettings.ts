import { supabase } from './supabase'
import { siteConfig } from '../config/site'
import type { SiteSettings } from '../types/siteSettings'

export type PublicSettings = Pick<SiteSettings, 'company_name' | 'tagline' | 'company_description' | 'contact_email' | 'whatsapp_number' | 'linkedin_url' | 'instagram_url' | 'form_endpoint'>

const fallback: PublicSettings = { company_name: siteConfig.name, tagline: siteConfig.slogan, company_description: null, contact_email: siteConfig.contact.email || null, whatsapp_number: siteConfig.contact.whatsapp || null, linkedin_url: siteConfig.contact.linkedin || null, instagram_url: siteConfig.social.instagram || null, form_endpoint: siteConfig.formEndpoint || null }
let cached: Promise<PublicSettings> | undefined

function validHttps(value: unknown) { return typeof value === 'string' && /^https:\/\/[^\s]+$/.test(value) ? value : null }

export function loadPublicSettings() {
  if (cached) return cached
  cached = (async () => {
    if (!supabase) return fallback
    const { data, error } = await supabase.from('site_settings').select('company_name,tagline,company_description,contact_email,whatsapp_number,linkedin_url,instagram_url,form_endpoint').eq('id', 1).maybeSingle()
    if (error || !data) return fallback
    const row = data as Record<string, unknown>
    return {
      company_name: typeof row.company_name === 'string' && row.company_name.trim() ? row.company_name : fallback.company_name,
      tagline: typeof row.tagline === 'string' && row.tagline.trim() ? row.tagline : fallback.tagline,
      company_description: typeof row.company_description === 'string' && row.company_description.trim() ? row.company_description : fallback.company_description,
      contact_email: typeof row.contact_email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.contact_email) ? row.contact_email : fallback.contact_email,
      whatsapp_number: typeof row.whatsapp_number === 'string' && /^[1-9][0-9]{7,14}$/.test(row.whatsapp_number) ? row.whatsapp_number : fallback.whatsapp_number,
      linkedin_url: validHttps(row.linkedin_url), instagram_url: validHttps(row.instagram_url), form_endpoint: validHttps(row.form_endpoint),
    }
  })()
  return cached
}
