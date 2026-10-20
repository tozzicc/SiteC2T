import { supabase } from './supabase'
import type { ProjectDemo, ProjectDemoInput } from '../types/projectDemo'

export class ProjectDemoDataError extends Error {
  code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'ProjectDemoDataError'
    this.code = code
  }
}

function client() {
  if (!supabase) throw new ProjectDemoDataError('O Supabase ainda não foi configurado.')
  return supabase
}

async function sessionClient() {
  const c = client()
  const { data, error } = await c.auth.getSession()
  if (error || !data.session) throw new ProjectDemoDataError('Sua sessão expirou. Entre novamente para continuar.')
  return c
}

function mapError(error: { code?: string } | null) {
  if (!error) return null
  if (error.code === '42P01' || error.code === 'PGRST205') return new ProjectDemoDataError('A migration de demonstrações ainda não foi aplicada no Supabase.', error.code)
  if (error.code === '23514') return new ProjectDemoDataError('As credenciais de demonstração não atendem às regras do banco.', error.code)
  if (error.code === '42501' || error.code === 'PGRST301') return new ProjectDemoDataError('Você não tem permissão para alterar a demonstração.', error.code)
  return new ProjectDemoDataError('Não foi possível concluir a operação de demonstração.', error.code)
}

function parse(value: unknown): ProjectDemo {
  if (!value || typeof value !== 'object') throw new ProjectDemoDataError('O Supabase retornou uma demonstração inválida.')
  const row = value as Record<string, unknown>
  if (typeof row.project_id !== 'string') throw new ProjectDemoDataError('O Supabase retornou uma demonstração inválida.')
  return {
    project_id: row.project_id,
    demo_username: typeof row.demo_username === 'string' ? row.demo_username : '',
    demo_password: typeof row.demo_password === 'string' ? row.demo_password : '',
    is_enabled: row.is_enabled === true,
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : '',
  }
}

export function projectDemoErrorMessage(error: unknown) {
  return error instanceof ProjectDemoDataError ? error.message : 'Não foi possível concluir a operação de demonstração.'
}

export async function getProjectDemo(projectId: string) {
  const c = await sessionClient()
  const { data, error } = await c.from('project_demos').select('*').eq('project_id', projectId).maybeSingle()
  if (error) throw mapError(error)
  return data ? parse(data) : null
}

export async function saveProjectDemo(input: ProjectDemoInput) {
  const c = await sessionClient()
  const { data, error } = await c.from('project_demos').upsert({ ...input, demo_username: input.demo_username.trim(), demo_password: input.demo_password.trim() }, { onConflict: 'project_id' }).select('*').single()
  if (error) throw mapError(error)
  return parse(data)
}

export async function deleteProjectDemo(projectId: string) {
  const c = await sessionClient()
  const { error } = await c.from('project_demos').delete().eq('project_id', projectId)
  if (error) throw mapError(error)
}

export async function listPublicProjectDemos(projectIds: string[]) {
  if (!supabase || projectIds.length === 0) return []
  const { data, error } = await supabase.from('project_demos').select('project_id,demo_username,demo_password').in('project_id', projectIds).eq('is_enabled', true)
  if (error || !data) return []
  return data.map((row) => ({ project_id: row.project_id as string, demo_username: row.demo_username as string, demo_password: row.demo_password as string }))
}
