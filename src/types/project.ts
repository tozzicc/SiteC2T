export type ProjectStatus = 'draft' | 'published' | 'archived'

export type Project = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  short_description: string
  description: string
  category: string
  technologies: string[]
  features: string[]
  demo_url: string | null
  repository_url: string | null
  status: ProjectStatus
  display_order: number
  created_at: string
  updated_at: string
  published_at: string | null
}

export type ProjectFormData = {
  slug: string
  title: string
  subtitle: string
  short_description: string
  description: string
  category: string
  technologies: string[]
  features: string[]
  demo_url: string
  repository_url: string
  status: ProjectStatus
  display_order: number
}

export type ProjectCreateInput = ProjectFormData
export type ProjectUpdateInput = Partial<ProjectFormData>
