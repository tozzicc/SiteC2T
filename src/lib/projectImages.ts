import { supabase } from './supabase'
import { buildProjectImagePath, PROJECT_IMAGE_MIME_TYPES, validateProjectImageFile } from './projectImageValidation'
import type { ProjectImage, ProjectImageCreateInput, ProjectImageUpdateInput } from '../types/projectImage'

const BUCKET = 'project-images'
const extensionByMime: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export class ProjectImageDataError extends Error {
  code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'ProjectImageDataError'
    this.code = code
  }
}

function requireClient() {
  if (!supabase) throw new ProjectImageDataError('O Supabase ainda não foi configurado.')
  return supabase
}

async function requireSession() {
  const client = requireClient()
  const { data, error } = await client.auth.getSession()
  if (error || !data.session) throw new ProjectImageDataError('Sua sessão expirou. Entre novamente para continuar.')
  return client
}

function mapError(error: { code?: string; message?: string } | null) {
  if (!error) return null
  if (error.code === '42P01' || error.code === 'PGRST205') return new ProjectImageDataError('A estrutura de imagens ainda não foi criada no Supabase.', error.code)
  if (error.code === '23505') return new ProjectImageDataError('Este projeto já possui uma capa ou o arquivo já está cadastrado.', error.code)
  if (error.code === '23514') return new ProjectImageDataError('Os dados da imagem não atendem às regras do banco.', error.code)
  if (error.code === '42501' || error.code === 'PGRST301') return new ProjectImageDataError('Você não tem permissão para executar esta operação.', error.code)
  return new ProjectImageDataError(error.message || 'Não foi possível concluir a operação de imagens.', error.code)
}

function parseImage(value: unknown): ProjectImage {
  if (!value || typeof value !== 'object') throw new ProjectImageDataError('O Supabase retornou uma imagem inválida.')
  const row = value as Record<string, unknown>
  if (typeof row.id !== 'string' || typeof row.project_id !== 'string' || typeof row.storage_path !== 'string' || typeof row.alt_text !== 'string') throw new ProjectImageDataError('O Supabase retornou uma imagem inválida.')
  return {
    id: row.id,
    project_id: row.project_id,
    storage_path: row.storage_path,
    alt_text: row.alt_text,
    image_type: row.image_type === 'cover' ? 'cover' : 'gallery',
    display_order: typeof row.display_order === 'number' ? row.display_order : 0,
    created_at: typeof row.created_at === 'string' ? row.created_at : '',
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : '',
  }
}

function parseImages(value: unknown) {
  if (!Array.isArray(value)) throw new ProjectImageDataError('O Supabase retornou uma lista de imagens inválida.')
  return value.map(parseImage)
}

export function projectImageErrorMessage(error: unknown) {
  return error instanceof ProjectImageDataError ? error.message : 'Não foi possível concluir a operação de imagens.'
}

export function getPublicProjectImageUrl(storagePath: string) {
  const client = requireClient()
  return client.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl
}

export async function listProjectImages(projectId: string) {
  const client = await requireSession()
  const { data, error } = await client.from('project_images').select('*').eq('project_id', projectId).order('image_type', { ascending: true }).order('display_order', { ascending: true }).order('created_at', { ascending: true })
  if (error) throw mapError(error)
  return parseImages(data)
}

export async function updateProjectImage(id: string, input: ProjectImageUpdateInput) {
  const client = await requireSession()
  const normalized = { ...input, ...(typeof input.alt_text === 'string' ? { alt_text: input.alt_text.trim() } : {}) }
  const { data, error } = await client.from('project_images').update(normalized).eq('id', id).select('*').single()
  if (error) throw mapError(error)
  return parseImage(data)
}

export async function addProjectImageToGallery(image: ProjectImage) {
  return updateProjectImage(image.id, { image_type: 'gallery' })
}

export async function setProjectImageAsCover(image: ProjectImage) {
  const client = await requireSession()
  const { data: currentCover, error: coverError } = await client.from('project_images').select('*').eq('project_id', image.project_id).eq('image_type', 'cover').maybeSingle()
  if (coverError) throw mapError(coverError)
  if (currentCover && currentCover.id !== image.id) {
    const { error } = await client.from('project_images').update({ image_type: 'gallery' }).eq('id', currentCover.id)
    if (error) throw mapError(error)
  }
  const { data, error } = await client.from('project_images').update({ image_type: 'cover' }).eq('id', image.id).select('*').single()
  if (error) {
    if (currentCover && currentCover.id !== image.id) await client.from('project_images').update({ image_type: 'cover' }).eq('id', currentCover.id)
    throw mapError(error)
  }
  return parseImage(data)
}

export async function uploadProjectImage(projectId: string, file: File, metadata: Pick<ProjectImageCreateInput, 'alt_text' | 'image_type' | 'display_order'>) {
  const validationError = validateProjectImageFile(file)
  if (validationError) throw new ProjectImageDataError(validationError)
  const client = await requireSession()
  const extension = extensionByMime[file.type]
  if (!extension || !PROJECT_IMAGE_MIME_TYPES.includes(file.type as typeof PROJECT_IMAGE_MIME_TYPES[number])) throw new ProjectImageDataError('Tipo de imagem não permitido.')
  const storagePath = buildProjectImagePath(projectId, extension)
  const { error: uploadError } = await client.storage.from(BUCKET).upload(storagePath, file, { contentType: file.type, upsert: false })
  if (uploadError) throw new ProjectImageDataError('Não foi possível enviar o arquivo para o Storage.')
  const payload: ProjectImageCreateInput = { project_id: projectId, storage_path: storagePath, alt_text: metadata.alt_text.trim(), image_type: metadata.image_type, display_order: metadata.display_order }
  const { data, error } = await client.from('project_images').insert(payload).select('*').single()
  if (error) {
    const cleanup = await client.storage.from(BUCKET).remove([storagePath])
    if (cleanup.error) throw new ProjectImageDataError('O arquivo foi enviado, mas o cadastro falhou e a limpeza ficou pendente. Remova o arquivo no Storage antes de tentar novamente.', cleanup.error.message)
    throw mapError(error)
  }
  return parseImage(data)
}

export async function replaceProjectImage(image: ProjectImage, file: File) {
  const validationError = validateProjectImageFile(file)
  if (validationError) throw new ProjectImageDataError(validationError)
  const client = await requireSession()
  const extension = extensionByMime[file.type]
  if (!extension) throw new ProjectImageDataError('Tipo de imagem não permitido.')
  const newPath = buildProjectImagePath(image.project_id, extension)
  const { error: uploadError } = await client.storage.from(BUCKET).upload(newPath, file, { contentType: file.type, upsert: false })
  if (uploadError) throw new ProjectImageDataError('Não foi possível enviar a nova imagem para o Storage.')
  const { data, error } = await client.from('project_images').update({ storage_path: newPath }).eq('id', image.id).select('*').single()
  if (error) {
    await client.storage.from(BUCKET).remove([newPath])
    throw mapError(error)
  }
  const cleanup = await client.storage.from(BUCKET).remove([image.storage_path])
  if (cleanup.error) throw new ProjectImageDataError('A imagem foi substituída, mas o arquivo antigo ficou pendente de remoção. Verifique o Storage.', cleanup.error.message)
  return parseImage(data)
}

export async function deleteProjectImage(image: ProjectImage) {
  const client = await requireSession()
  const { error: recordError } = await client.from('project_images').delete().eq('id', image.id)
  if (recordError) throw mapError(recordError)
  const { error: storageError } = await client.storage.from(BUCKET).remove([image.storage_path])
  if (storageError) throw new ProjectImageDataError('O registro foi removido, mas o arquivo ficou pendente de remoção no Storage. Verifique-o antes de reutilizar o caminho.', storageError.message)
}
