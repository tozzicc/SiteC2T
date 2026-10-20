import test from 'node:test'
import assert from 'node:assert/strict'
import { publicOptionalText } from '../src/lib/publicContent.ts'

test('oculta somente placeholders editoriais conhecidos', () => {
  assert.equal(publicOptionalText('A definição do problema atendido ainda não foi fornecida para esta etapa.'), '')
  assert.equal(publicOptionalText('Informações sobre funcionalidades ainda não fornecidas.'), '')
  assert.equal(publicOptionalText('Tecnologias utilizadas ainda não informadas.'), '')
  assert.equal(publicOptionalText('O sistema atende chamados internos de TI.'), 'O sistema atende chamados internos de TI.')
  assert.equal(publicOptionalText(''), '')
  assert.equal(publicOptionalText(null), '')
})
