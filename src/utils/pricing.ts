import type { ProjectPricing } from '../types/projectPricing'

export function followingMonth(months: number | null | undefined) { return months && months > 0 ? months + 1 : null }

export function firstYearTotal(plan: ProjectPricing) {
  if (plan.pricing_type === 'implementation') {
    if (plan.setup_price == null || plan.recurring_price == null) return null
    return Math.round((plan.setup_price + plan.recurring_price * 12) * 100) / 100
  }
  if (plan.introductory_monthly_price == null || plan.introductory_months == null || plan.standard_monthly_price == null) return null
  return Math.round((plan.introductory_monthly_price * Math.min(plan.introductory_months, 12) + plan.standard_monthly_price * Math.max(12 - plan.introductory_months, 0)) * 100) / 100
}
