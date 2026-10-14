import test from 'node:test'
import assert from 'node:assert/strict'
import { isServiceIconName, isValidServiceSlug, normalizeOptionalText } from '../src/lib/serviceValidation.ts'

test('service validation accepts slugs and the approved icon list', () => {
  assert.equal(isValidServiceSlug('automacao-de-processos'), true)
  assert.equal(isValidServiceSlug('Serviço inválido'), false)
  assert.equal(isServiceIconName('Code2'), true)
  assert.equal(isServiceIconName('UnknownIcon'), false)
})

test('optional service text is normalized to null', () => {
  assert.equal(normalizeOptionalText('  '), null)
  assert.equal(normalizeOptionalText('  Consultoria  '), 'Consultoria')
})
