export const PROJECT_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const PROJECT_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export type ProjectImageMimeType = (typeof PROJECT_IMAGE_MIME_TYPES)[number]

export function isAllowedProjectImageType(value: string): value is ProjectImageMimeType {
  return PROJECT_IMAGE_MIME_TYPES.includes(value as ProjectImageMimeType)
}

export function buildProjectImagePath(projectId: string, extension: string): string {
  return `${projectId}/${crypto.randomUUID()}.${extension}`
}

export function isProjectImagePathForProject(storagePath: string, projectId: string): boolean {
  const [pathProjectId, fileName, ...extraSegments] = storagePath.split('/')
  return pathProjectId === projectId && Boolean(fileName) && extraSegments.length === 0
}

export function validateProjectImageFile(file: Pick<File, 'type' | 'size'>): string | null {
  if (!file.size) return 'O arquivo está vazio.'
  if (!isAllowedProjectImageType(file.type)) return 'Use uma imagem JPEG, PNG ou WebP.'
  if (file.size > PROJECT_IMAGE_MAX_BYTES) return 'A imagem deve ter no máximo 5 MB.'
  return null
}
