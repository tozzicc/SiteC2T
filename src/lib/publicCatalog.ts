import type { LucideIcon } from 'lucide-react'
import { BriefcaseBusiness, Code2, Workflow, Headset, Bot, Settings, Wrench, BarChart3, Globe2, Database, ShieldCheck } from 'lucide-react'
import { projects as staticProjects, services as staticServices } from '../data/content'
import type { Project as StaticProject, Service as StaticService } from '../data/content'
import type { ProjectImage as StaticImage } from '../data/content'
import type { Project } from '../types/project'
import type { ProjectImage } from '../types/projectImage'
import type { Service } from '../types/service'
import { supabase } from './supabase'
import { getPublicProjectImageUrl } from './projectImages'
import { projectMigrationMode, serviceMigrationMode } from './publicMigrationMode'
export { projectMigrationMode, serviceMigrationMode } from './publicMigrationMode'

/**
 * Explicit migration switches. `static` keeps the legacy catalog visible until
 * the corresponding row is approved and published in Supabase. Change a slug
 * to `supabase` only when its public record is ready. This is intentionally
 * local and public: it never reveals drafts or asks the browser for admin data.
 */
export type PublicProject = StaticProject
export type PublicService = StaticService

function isPublishedProject(row: Project) { return row.status === 'published' }
function isPublishedService(row: Service) { return row.status === 'published' }

function mapProject(row: Project, images: ProjectImage[]): PublicProject {
  const dbImages: StaticImage[] = images
    .sort((a, b) => (a.image_type === 'cover' ? -1 : 1) - (b.image_type === 'cover' ? -1 : 1) || a.display_order - b.display_order)
    .map((image) => ({ src: getPublicProjectImageUrl(image.storage_path), alt: image.alt_text, isPlaceholder: false, kind: image.image_type === 'cover' ? ('promotional' as const) : ('screenshot' as const) }))
    .filter((image) => /^https:\/\//.test(image.src))
  return {
    id: row.id, slug: row.slug, name: row.title, summary: row.short_description,
    description: row.description, problem: row.subtitle || 'Informações sobre o desafio ainda não fornecidas.',
    category: row.category, technologies: row.technologies, features: row.features, images: dbImages,
    demoUrl: row.demo_url ?? undefined, repoUrl: row.repository_url ?? undefined, status: 'published',
  }
}

function staticProjectForSlug(slug: string) { return staticProjects.find((project) => project.slug === slug) }

export async function loadPublicProjects(): Promise<{ items: PublicProject[]; degraded: boolean }> {
  const fallback = staticProjects.filter((item) => projectMigrationMode[item.slug] !== 'supabase')
  if (!supabase) return { items: fallback, degraded: true }
  const { data, error } = await supabase.from('projects').select('*').eq('status', 'published').order('display_order').order('title')
  if (error || !data) return { items: fallback, degraded: true }
  const rows = data as Project[]
  const ids = rows.map((row) => row.id)
  const { data: imageRows } = ids.length ? await supabase.from('project_images').select('*').in('project_id', ids).order('display_order') : { data: [] as ProjectImage[] }
  const images = (imageRows ?? []) as ProjectImage[]
  const dbProjects = rows.filter(isPublishedProject).map((row) => mapProject(row, images.filter((image) => image.project_id === row.id)))
  const dbBySlug = new Map(dbProjects.map((project) => [project.slug, project]))
  const dbOrder = new Map(rows.map((row, index) => [row.slug, index]))
  const merged = staticProjects.map((item) => dbBySlug.get(item.slug) ?? item).filter((item) => projectMigrationMode[item.slug] !== 'supabase' || dbBySlug.has(item.slug))
  const extras = dbProjects.filter((item) => !staticProjectForSlug(item.slug))
  const staticOrder = new Map(staticProjects.map((item, index) => [item.slug, index]))
  return { items: [...merged, ...extras].sort((a, b) => (dbOrder.get(a.slug) ?? (dbOrder.size + (staticOrder.get(a.slug) ?? 0))) - (dbOrder.get(b.slug) ?? (dbOrder.size + (staticOrder.get(b.slug) ?? 0)))), degraded: false }
}

const iconMap: Record<string, LucideIcon> = { Code2, BriefcaseBusiness, Workflow, Headset, Bot, Settings, Wrench, BarChart3, Globe2, Database, ShieldCheck }

function mapService(row: Service): PublicService {
  const Icon = row.icon_name ? iconMap[row.icon_name] : Wrench
  return { slug: row.slug, icon: Icon ?? Wrench, title: row.title, description: row.description, examples: row.features, benefits: [], projectSlugs: [] }
}

export async function loadPublicServices(): Promise<{ items: PublicService[]; degraded: boolean }> {
  const fallback = staticServices.filter((item) => serviceMigrationMode[item.slug] !== 'supabase')
  if (!supabase) return { items: fallback, degraded: true }
  const { data, error } = await supabase.from('services').select('*').eq('status', 'published').order('display_order').order('title')
  if (error || !data) return { items: fallback, degraded: true }
  const dbServices = (data as Service[]).filter(isPublishedService).map(mapService)
  const dbBySlug = new Map(dbServices.map((service) => [service.slug, service]))
  const dbOrder = new Map((data as Service[]).map((row, index) => [row.slug, index]))
  const merged = staticServices.map((item) => dbBySlug.get(item.slug) ?? item).filter((item) => serviceMigrationMode[item.slug] !== 'supabase' || dbBySlug.has(item.slug))
  const extras = dbServices.filter((item) => !staticServices.some((staticItem) => staticItem.slug === item.slug))
  const staticOrder = new Map(staticServices.map((item, index) => [item.slug, index]))
  return { items: [...merged, ...extras].sort((a, b) => (dbOrder.get(a.slug) ?? (dbOrder.size + (staticOrder.get(a.slug) ?? 0))) - (dbOrder.get(b.slug) ?? (dbOrder.size + (staticOrder.get(b.slug) ?? 0)))), degraded: false }
}
