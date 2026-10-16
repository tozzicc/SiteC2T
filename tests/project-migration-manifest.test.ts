import assert from 'node:assert/strict'
import test from 'node:test'
import { projects } from '../src/data/content.ts'
import { migrationManifestShape } from '../src/lib/projectMigrationManifest.ts'
import { projectMigrationMode } from '../src/lib/publicMigrationMode.ts'

test('Agenda possui 16 imagens, uma capa e ordem preservada', () => {
  const manifest = migrationManifestShape(projects.find((project) => project.slug === 'agenda')!.images, 'Agenda Online para Bem-Estar - ANUNCIO.png')
  assert.equal(manifest.length, 16)
  assert.equal(manifest.filter((item) => item.image_type === 'cover').length, 1)
  assert.equal(manifest.find((item) => item.image_type === 'cover')?.filename, 'Agenda Online para Bem-Estar - ANUNCIO.png')
  assert.deepEqual(manifest.map((item) => item.display_order), Array.from({ length: 16 }, (_, index) => index))
})

test('Gestão de Projetos possui 9 imagens e a capa correta', () => {
  const manifest = migrationManifestShape(projects.find((project) => project.slug === 'gestao-de-projetos')!.images, 'capa 1.png')
  assert.equal(manifest.length, 9)
  assert.equal(manifest.filter((item) => item.image_type === 'gallery').length, 8)
  assert.equal(manifest.find((item) => item.image_type === 'cover')?.filename, 'capa 1.png')
})

test('os três slugs permanecem em modo static durante a migração', () => {
  assert.deepEqual(projectMigrationMode, { 'chamado-ti': 'supabase', agenda: 'supabase', 'gestao-de-projetos': 'supabase' })
})

test('os alt texts do catálogo são preservados no manifesto', () => {
  const manifest = migrationManifestShape(projects.find((project) => project.slug === 'agenda')!.images, 'Agenda Online para Bem-Estar - ANUNCIO.png')
  assert.equal(manifest[0].alt_text, 'Agenda Online — arte de apresentação')
  assert.equal(manifest[1].alt_text, 'Agenda Online — escolha de horários, captura da aplicação')
})
