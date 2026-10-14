import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isValidEmail, isValidHttpsUrl, isValidWhatsapp, normalizeEmail, normalizeWhatsapp } from '../src/lib/siteSettingsValidation.ts'
import { normalizeOptionalText } from '../src/lib/siteSettingsValidation.ts'

test('site settings accepts valid email and HTTPS URLs only', () => {
  assert.equal(isValidEmail('contato@c2t.com.br'), true)
  assert.equal(isValidEmail('email-invalido'), false)
  assert.equal(isValidHttpsUrl('https://linkedin.com/company/c2t'), true)
  assert.equal(isValidHttpsUrl('http://linkedin.com/company/c2t'), false)
})

test('site settings normalizes optional contact values', () => {
  assert.equal(normalizeEmail('  CONTATO@C2T.COM.BR '), 'contato@c2t.com.br')
  assert.equal(normalizeEmail(' '), null)
  assert.equal(normalizeWhatsapp('+55 (11) 99999-9999'), '5511999999999')
  assert.equal(normalizeWhatsapp(''), null)
  assert.equal(isValidWhatsapp('+55 (11) 99999-9999'), true)
  assert.equal(isValidWhatsapp('000'), false)
})

test('empty optional settings are valid and normalize to null', () => {
  assert.equal(normalizeOptionalText('C2T Tecnologia'), 'C2T Tecnologia')
  assert.equal(normalizeOptionalText('Tecnologia que simplifica'), 'Tecnologia que simplifica')
  assert.equal(isValidHttpsUrl(''), true)
  assert.equal(isValidHttpsUrl('   '), true)
  assert.equal(normalizeOptionalText(''), null)
  assert.equal(normalizeOptionalText('  '), null)
  assert.equal(normalizeOptionalText('Tecnologia que simplifica'), 'Tecnologia que simplifica')
  assert.equal(normalizeEmail(''), null)
  assert.equal(normalizeWhatsapp(''), null)
})

test('validation helpers do not contain duplicate named exports', () => {
  for (const file of ['src/lib/serviceValidation.ts', 'src/lib/siteSettingsValidation.ts']) {
    const source = readFileSync(file, 'utf8')
    for (const name of ['isValidHttpsUrl', 'normalizeOptionalText']) {
      const count = (source.match(new RegExp(`export function ${name}\\b`, 'g')) ?? []).length
      assert.ok(count <= 1, `${file} exports ${name} more than once`)
    }
  }
})
