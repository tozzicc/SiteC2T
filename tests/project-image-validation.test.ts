import assert from 'node:assert/strict'
import test from 'node:test'
import { buildProjectImagePath, isProjectImagePathForProject, PROJECT_IMAGE_MAX_BYTES, validateProjectImageFile } from '../src/lib/projectImageValidation.ts'

test('aceita JPEG, PNG e WebP dentro do limite', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) assert.equal(validateProjectImageFile({ type, size: 1024 }), null)
})

test('rejeita arquivo vazio', () => {
  assert.equal(validateProjectImageFile({ type: 'image/png', size: 0 }), 'O arquivo está vazio.')
})

test('rejeita MIME não permitido', () => {
  assert.equal(validateProjectImageFile({ type: 'image/gif', size: 1024 }), 'Use uma imagem JPEG, PNG ou WebP.')
})

test('rejeita arquivo acima de 5 MB', () => {
  assert.equal(validateProjectImageFile({ type: 'image/jpeg', size: PROJECT_IMAGE_MAX_BYTES + 1 }), 'A imagem deve ter no máximo 5 MB.')
})

test('gera caminho cujo primeiro segmento corresponde ao projeto', () => {
  const path = buildProjectImagePath('11111111-1111-1111-1111-111111111111', 'webp')
  assert.equal(isProjectImagePathForProject(path, '11111111-1111-1111-1111-111111111111'), true)
})

test('rejeita caminho pertencente a outro projeto', () => {
  assert.equal(isProjectImagePathForProject('22222222-2222-2222-2222-222222222222/file.webp', '11111111-1111-1111-1111-111111111111'), false)
})
