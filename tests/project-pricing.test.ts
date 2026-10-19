import test from 'node:test'
import assert from 'node:assert/strict'
import { formatBrl, parseBrl } from '../src/utils/currency.ts'

test('converte moeda brasileira preservando centavos', () => {
  assert.equal(parseBrl('997,00'), 997)
  assert.equal(parseBrl('1.497,50'), 1497.5)
  assert.equal(formatBrl(99.9), 'R$ 99,90')
})

test('rejeita valores negativos e inválidos', () => {
  assert.equal(parseBrl('-10,00'), null)
  assert.equal(parseBrl('abc'), null)
})
