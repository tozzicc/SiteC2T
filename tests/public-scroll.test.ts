import test from 'node:test'
import assert from 'node:assert/strict'
import { shouldResetPublicScroll } from '../src/lib/publicScroll.ts'

test('reseta scroll em abertura inicial e navegações públicas novas', () => {
  assert.equal(shouldResetPublicScroll('/projetos/chamado-ti', 'POP', true), true)
  assert.equal(shouldResetPublicScroll('/projetos/agenda', 'PUSH', false), true)
  assert.equal(shouldResetPublicScroll('/contato', 'REPLACE', false), true)
})

test('preserva restauração do histórico e não interfere no admin', () => {
  assert.equal(shouldResetPublicScroll('/projetos', 'POP', false), false)
  assert.equal(shouldResetPublicScroll('/admin/projetos', 'PUSH', false), false)
  assert.equal(shouldResetPublicScroll('/admin', 'POP', true), false)
})
