export type ProjectImageType = 'cover' | 'gallery'

export type ProjectImage = {
  id: string
  project_id: string
  storage_path: string
  alt_text: string
  image_type: ProjectImageType
  display_order: number
  created_at: string
  updated_at: string
}

export type ProjectImageCreateInput = {
  project_id: string
  storage_path: string
  alt_text: string
  image_type: ProjectImageType
  display_order: number
}

export type ProjectImageUpdateInput = Partial<Pick<ProjectImage, 'alt_text' | 'image_type' | 'display_order'>>
