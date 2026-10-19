export type PricingType = 'implementation' | 'facilitated_implementation'

export type ProjectPricing = {
  id: string
  project_id: string
  pricing_type: PricingType
  title: string
  description: string | null
  setup_price: number | null
  recurring_price: number | null
  introductory_monthly_price: number | null
  introductory_months: number | null
  standard_monthly_price: number | null
  included_features: string[]
  commercial_terms: string | null
  support_terms: string | null
  cta_label: string
  is_active: boolean
  show_price: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export type ProjectPricingInput = Omit<ProjectPricing, 'id' | 'created_at' | 'updated_at'>
