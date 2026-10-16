export type MigrationSourceImage = { src: string; alt: string }
export type MigrationSlug = 'chamado-ti' | 'agenda' | 'gestao-de-projetos'
export const coverBySlug: Record<MigrationSlug, string> = { 'chamado-ti': '0.png', agenda: 'Agenda Online para Bem-Estar - ANUNCIO.png', 'gestao-de-projetos': 'capa 1.png' }

export function migrationManifestShape(images: MigrationSourceImage[], coverFilename: string) {
  return images.map((image, index) => ({ filename: image.src.split('/').pop() ?? '', image_type: image.src.endsWith(`/${coverFilename}`) ? 'cover' as const : 'gallery' as const, display_order: index, alt_text: image.alt }))
}
