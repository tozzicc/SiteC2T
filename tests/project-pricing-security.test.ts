import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const migration = readFileSync(new URL('../supabase/migrations/202610190001_create_project_pricing.sql', import.meta.url), 'utf8')
const incrementalMigration = readFileSync(new URL('../supabase/migrations/202610190002_adjust_project_pricing_facilitated.sql', import.meta.url), 'utf8')
const source = readFileSync(new URL('../src/lib/projectPricing.ts', import.meta.url), 'utf8')

test('a tabela administrativa não concede leitura pública direta', () => {
  assert.match(migration, /revoke all on table public\.project_pricing from anon, authenticated/i)
  assert.doesNotMatch(migration, /grant select(?:,| on).*to anon/i)
  assert.match(migration, /grant select, insert, update, delete on table public\.project_pricing to authenticated/i)
})

test('a RPC pública mascara preços ocultos e filtra publicação/ativação', () => {
  assert.match(migration, /security definer/i)
  assert.match(migration, /case when pp\.show_price then pp\.setup_price else null end/i)
  assert.match(migration, /pp\.is_active = true/i)
  assert.match(migration, /p\.status = 'published'/i)
  assert.match(migration, /grant execute on function public\.get_public_project_pricing\(uuid\) to anon, authenticated/i)
})

test('a consulta pública usa exclusivamente a RPC', () => {
  assert.match(source, /supabase\.rpc\('get_public_project_pricing'/i)
  assert.doesNotMatch(source, /from\('project_pricing'\).*is_active/i)
})

test('a migration incremental não converte licenças silenciosamente', () => {
  assert.match(incrementalMigration, /pricing_type = 'license'/i)
  assert.match(incrementalMigration, /raise exception/i)
  assert.match(incrementalMigration, /introductory_monthly_price/i)
  assert.match(incrementalMigration, /introductory_months integer/i)
  assert.match(incrementalMigration, /standard_monthly_price/i)
})
