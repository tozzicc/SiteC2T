import assert from 'node:assert/strict'
import test from 'node:test'
import { isValidHttpsUrl, normalizeOptionalUrl } from '../src/lib/projectValidation.ts'

test('converte URL vazia em null', () => {
  assert.equal(normalizeOptionalUrl(''), null)
})

test('converte URL com apenas espaços em null', () => {
  assert.equal(normalizeOptionalUrl('   \t  '), null)
})

test('remove espaços das extremidades de URL HTTPS válida', () => {
  assert.equal(normalizeOptionalUrl('  https://example.com/demo  '), 'https://example.com/demo')
  assert.equal(isValidHttpsUrl('  https://example.com/demo  '), true)
})

test('rejeita URL HTTP', () => {
  assert.equal(isValidHttpsUrl('http://example.com/demo'), false)
})

test('permite cadastro e edição sem links', () => {
  assert.equal(normalizeOptionalUrl(undefined), null)
  assert.equal(normalizeOptionalUrl(null), null)
  assert.equal(isValidHttpsUrl(''), true)
})
