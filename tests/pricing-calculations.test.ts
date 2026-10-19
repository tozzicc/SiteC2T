import test from 'node:test'
import assert from 'node:assert/strict'
import { firstYearTotal, followingMonth } from '../src/utils/pricing.ts'
import type { ProjectPricing } from '../src/types/projectPricing.ts'

const base = (overrides: Partial<ProjectPricing>): ProjectPricing => ({ id: '1', project_id: '2', pricing_type: 'implementation', title: 'Plano', description: null, setup_price: null, recurring_price: null, introductory_monthly_price: null, introductory_months: null, standard_monthly_price: null, included_features: [], commercial_terms: null, support_terms: null, cta_label: 'Solicitar', is_active: true, show_price: true, display_order: 0, created_at: '', updated_at: '', ...overrides })

test('calcula o mês posterior dinamicamente', () => {
  assert.equal(followingMonth(6), 7)
  assert.equal(followingMonth(12), 13)
  assert.equal(followingMonth(18), 19)
  assert.equal(followingMonth(24), 25)
})

test('calcula o total dos primeiros 12 meses dos dois planos', () => {
  assert.equal(firstYearTotal(base({ setup_price: 597, recurring_price: 39.9 })), 1075.8)
  assert.equal(firstYearTotal(base({ pricing_type: 'facilitated_implementation', introductory_monthly_price: 89.9, introductory_months: 12, standard_monthly_price: 39.9 })), 1078.8)
  assert.equal(firstYearTotal(base({ pricing_type: 'facilitated_implementation', introductory_monthly_price: 89.9, introductory_months: 6, standard_monthly_price: 39.9 })), 778.8)
})

test('não calcula totais quando faltam valores', () => {
  assert.equal(firstYearTotal(base({ setup_price: null, recurring_price: 39.9 })), null)
  assert.equal(firstYearTotal(base({ pricing_type: 'facilitated_implementation', introductory_monthly_price: 89.9, introductory_months: 12, standard_monthly_price: null })), null)
})
