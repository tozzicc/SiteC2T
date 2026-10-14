import { supabase } from './supabase'
import { normalizeOptionalUrl } from './projectValidation'
import type { Project, ProjectCreateInput, ProjectStatus, ProjectUpdateInput } from '../types/project'

export class ProjectDataError extends Error {
  code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'ProjectDataError'
    this.code = code
  }
}

function requireClient() {
  if (!supabase) throw new ProjectDataError('O Supabase ainda não foi configurado.')
  return supabase
}

async function requireSession() {
  const client = requireClient()
  const { data, error } = await client.auth.getSession()
  if (error || !data.session) throw new ProjectDataError('Sua sessão expirou. Entre novamente para continuar.')
  return client
}

function mapError(error: { code?: string; message?: string } | null) {
  if (!error) return null
  if (error.code === '42P01' || error.code === 'PGRST205') return new ProjectDataError('A tabela de projetos ainda não foi criada no Supabase.', error.code)
  if (error.code === '23505') return new ProjectDataError('Já existe um projeto com este slug.', error.code)
  if (error.code === '23514') return new ProjectDataError('Os dados informados não atendem às regras do banco.', error.code)
  if (error.code === '42501' || error.code === 'PGRST301') return new ProjectDataError('Você não tem permissão para executar esta operação.', error.code)
  return new ProjectDataError('Não foi possível concluir a operação de projetos.', error.code)
}

function parseProject(value: unknown): Project {
  if (!value || typeof value !== 'object') throw new ProjectDataError('O Supabase retornou um projeto inválido.')
  const row = value as Record<string, unknown>
  if (typeof row.id !== 'string' || typeof row.slug !== 'string' || typeof row.title !== 'string' || typeof row.status !== 'string') throw new ProjectDataError('O Supabase retornou um projeto inválido.')
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: typeof row.subtitle === 'string' ? row.subtitle : null,
    short_description: typeof row.short_description === 'string' ? row.short_description : '',
    description: typeof row.description === 'string' ? row.description : '',
    category: typeof row.category === 'string' ? row.category : '',
    technologies: Array.isArray(row.technologies) ? row.technologies.filter((item): item is string => typeof item === 'string') : [],
    features: Array.isArray(row.features) ? row.features.filter((item): item is string => typeof item === 'string') : [],
    demo_url: typeof row.demo_url === 'string' ? row.demo_url : null,
    repository_url: typeof row.repository_url === 'string' ? row.repository_url : null,
    status: row.status === 'published' || row.status === 'archived' ? row.status : 'draft',
    display_order: typeof row.display_order === 'number' ? row.display_order : 0,
    created_at: typeof row.created_at === 'string' ? row.created_at : '',
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : '',
    published_at: typeof row.published_at === 'string' ? row.published_at : null,
  }
}

function parseProjects(value: unknown): Project[] {
  if (!Array.isArray(value)) throw new ProjectDataError('O Supabase retornou uma lista inválida.')
  return value.map(parseProject)
}

export function projectErrorMessage(error: unknown) {
  return error instanceof ProjectDataError ? error.message : 'Não foi possível concluir a operação de projetos.'
}

export async function listProjects() {
  const client = await requireSession()
  const { data, error } = await client.from('projects').select('*').order('display_order', { ascending: true }).order('title', { ascending: true })
  if (error) throw mapError(error)
  return parseProjects(data)
}

export async function getProjectById(id: string) {
  const client = await requireSession()
  const { data, error } = await client.from('projects').select('*').eq('id', id).maybeSingle()
  if (error) throw mapError(error)
  if (!data) throw new ProjectDataError('Projeto não encontrado.')
  return parseProject(data)
}

export async function createProject(input: ProjectCreateInput) {
  const client = await requireSession()
  const payload = { ...input, demo_url: normalizeOptionalUrl(input.demo_url), repository_url: normalizeOptionalUrl(input.repository_url) }
  const { data, error } = await client.from('projects').insert(payload).select('*').single()
  if (error) throw mapError(error)
  return parseProject(data)
}

export async function updateProject(id: string, input: ProjectUpdateInput) {
  const client = await requireSession()
  const payload = { ...input, ...(Object.prototype.hasOwnProperty.call(input, 'demo_url') ? { demo_url: normalizeOptionalUrl(input.demo_url) } : {}), ...(Object.prototype.hasOwnProperty.call(input, 'repository_url') ? { repository_url: normalizeOptionalUrl(input.repository_url) } : {}) }
  const { data, error } = await client.from('projects').update(payload).eq('id', id).select('*').single()
  if (error) throw mapError(error)
  return parseProject(data)
}

export async function deleteProject(id: string) {
  const client = await requireSession()
  const { error } = await client.from('projects').delete().eq('id', id)
  if (error) throw mapError(error)
}

export async function updateProjectStatus(project: Project, status: ProjectStatus) {
  return updateProject(project.id, { status })
}
