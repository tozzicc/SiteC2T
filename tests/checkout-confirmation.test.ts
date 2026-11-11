import test from 'node:test'
import assert from 'node:assert/strict'
import { amountEquals, mapOrderStatus, statusRank, webhookManifest } from '../supabase/functions/_shared/mercado-pago.ts'

test('mapeia os estados documentados de Orders sem confiar no retorno do navegador', () => {
  assert.equal(mapOrderStatus({ status: 'processed', status_detail: 'accredited' }), 'approved')
  assert.equal(mapOrderStatus({ status: 'processing', status_detail: 'in_process' }), 'pending')
  assert.equal(mapOrderStatus({ status: 'action_required', status_detail: 'waiting_payment' }), 'pending')
  assert.equal(mapOrderStatus({ status: 'failed', status_detail: 'failed' }), 'rejected')
  assert.equal(mapOrderStatus({ status: 'canceled', status_detail: 'expired' }), 'canceled')
  assert.equal(mapOrderStatus({ status: 'created', status_detail: 'created' }), 'pending')
})

test('impede regressão de estado e valida valor monetário', () => {
  assert.ok(statusRank('approved') > statusRank('pending'))
  assert.ok(statusRank('pending') > statusRank('created'))
  assert.equal(amountEquals('597.00', 597), true)
  assert.equal(amountEquals('596.99', 597), false)
  assert.equal(amountEquals('597', 597), true)
})

test('constrói o manifesto oficial da assinatura', () => {
  assert.equal(webhookManifest('ORD123', 'request-123', '1742505638683'), 'id:ORD123;request-id:request-123;ts:1742505638683;')
})
