import { AlertTriangle, Check, FileImage, RefreshCw, ShieldCheck, Upload } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { projects as staticProjects } from '../data/content'
import { supabase } from '../lib/supabase'
import { validateProjectImageFile } from '../lib/projectImageValidation'
import { coverBySlug, migrationManifestShape } from '../lib/projectMigrationManifest'
import type { MigrationSlug } from '../lib/projectMigrationManifest'
import type { Project } from '../types/project'
import type { ProjectImage } from '../types/projectImage'

const bucket = 'project-images'
const orderBySlug: Record<MigrationSlug, number> = { 'chamado-ti': 0, agenda: 1, 'gestao-de-projetos': 2 }
type ManifestEntry = { filename: string; image_type: 'cover' | 'gallery'; display_order: number; alt_text: string; sha256: string; bytes: number }
type Preflight = { project: Project | null; images: ProjectImage[]; objects: string[]; manifest: ManifestEntry[]; error: string }

function definition(slug: MigrationSlug) {
  const project = staticProjects.find((item) => item.slug === slug)
  if (!project) throw new Error(`Projeto estático ${slug} não encontrado.`)
  return project
}

function sources(slug: MigrationSlug) {
  return migrationManifestShape(definition(slug).images, coverBySlug[slug])
}

function projectInput(slug: MigrationSlug) {
  const project = definition(slug)
  return { slug: project.slug, title: project.name, subtitle: project.problem, short_description: project.summary, description: project.description, category: project.category, technologies: project.technologies, features: project.features, demo_url: project.demoUrl ?? null, repository_url: project.repoUrl ?? null, status: 'published' as const, display_order: orderBySlug[slug] }
}

async function digestFile(file: File) {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function buildManifest(slug: MigrationSlug) {
  const manifest: ManifestEntry[] = []
  for (const source of sources(slug)) {
    const response = await fetch(`/projects/${slug}/${source.filename}`)
    if (!response.ok) throw new Error(`Não foi possível ler ${source.filename} do catálogo local.`)
    const blob = await response.blob()
    const file = new File([blob], source.filename, { type: blob.type || 'image/png' })
    const validationError = validateProjectImageFile(file)
    if (validationError) throw new Error(`${source.filename}: ${validationError}`)
    manifest.push({ ...source, sha256: await digestFile(file), bytes: file.size })
  }
  return manifest
}

async function listObjects(projectId: string) {
  if (!supabase) throw new Error('Supabase não está configurado.')
  const { data, error } = await supabase.storage.from(bucket).list(projectId, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })
  if (error) throw new Error(`Não foi possível consultar o Storage: ${error.message}`)
  return (data ?? []).map((item) => item.name)
}

async function preflight(slug: MigrationSlug): Promise<Preflight> {
  if (!supabase) return { project: null, images: [], objects: [], manifest: [], error: 'Supabase não está configurado.' }
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !sessionData.session) return { project: null, images: [], objects: [], manifest: [], error: 'Sessão administrativa ausente ou expirada.' }
    const { data: rows, error: projectError } = await supabase.from('projects').select('*').eq('slug', slug)
    if (projectError) throw new Error(`Não foi possível consultar projects: ${projectError.message}`)
    const project = (rows?.[0] as Project | undefined) ?? null
    let images: ProjectImage[] = []
    let objects: string[] = []
    if (project) {
      const { data: imageRows, error: imageError } = await supabase.from('project_images').select('*').eq('project_id', project.id).order('display_order')
      if (imageError) throw new Error(`Não foi possível consultar project_images: ${imageError.message}`)
      images = (imageRows ?? []) as ProjectImage[]
      objects = await listObjects(project.id)
    }
    return { project, images, objects, manifest: await buildManifest(slug), error: '' }
  } catch (reason) { return { project: null, images: [], objects: [], manifest: [], error: reason instanceof Error ? reason.message : 'Falha na pré-validação.' } }
}

export function AdminProjectMigrationPage({ slug }: { slug: MigrationSlug }) {
  const project = definition(slug)
  const plannedSources = sources(slug)
  const input = projectInput(slug)
  const [state, setState] = useState<Preflight>({ project: null, images: [], objects: [], manifest: [], error: '' })
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState<string[]>([])
  const refresh = useCallback(() => { setLoading(true); setMessage(''); setResults([]); void preflight(slug).then(setState).finally(() => setLoading(false)) }, [slug])
  useEffect(() => { let active = true; void preflight(slug).then((next) => { if (active) setState(next) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [slug])

  async function execute() {
    if (state.project || state.images.length || state.objects.length || state.error || state.manifest.length !== plannedSources.length || !confirmed || !supabase) return
    setRunning(true); setMessage(''); setResults([]); const created: string[] = []
    try {
      const check = await preflight(slug)
      if (check.error) throw new Error(check.error)
      if (check.project || check.images.length || check.objects.length) throw new Error('A pré-validação mudou: existe um conflito. Nenhuma escrita foi iniciada.')
      const { data: inserted, error: projectError } = await supabase.from('projects').insert(input).select('*').single()
      if (projectError || !inserted) throw new Error(projectError?.message ?? 'Não foi possível criar o projeto.')
      const createdProject = inserted as Project
      created.push(`Projeto criado: ${createdProject.id}`)
      for (const source of check.manifest) {
        const storagePath = `${createdProject.id}/${source.sha256}.png`
        const response = await fetch(`/projects/${slug}/${source.filename}`)
        const file = new File([await response.blob()], source.filename, { type: 'image/png' })
        if (await digestFile(file) !== source.sha256) throw new Error(`Hash divergente antes do upload: ${source.filename}`)
        const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, file, { contentType: 'image/png', upsert: false })
        if (uploadError) throw new Error(`Falha no upload de ${source.filename}: ${uploadError.message}`)
        const { error: imageError } = await supabase.from('project_images').insert({ project_id: createdProject.id, storage_path: storagePath, alt_text: source.alt_text, image_type: source.image_type, display_order: source.display_order })
        if (imageError) throw new Error(`Upload concluído, mas o registro de ${source.filename} falhou: ${imageError.message}`)
        created.push(`${source.filename} enviado e registrado`)
      }
      setResults(created); setMessage('Migração concluída. Valide o projeto no painel antes de qualquer ativação pública.'); setConfirmed(false); refresh()
    } catch (reason) { setResults(created); setMessage(reason instanceof Error ? reason.message : 'A migração foi interrompida.') } finally { setRunning(false) }
  }

  const conflict = Boolean(state.project || state.images.length || state.objects.length || state.error)
  return <section className="admin-migration"><div className="admin-page-heading"><div><span className="eyebrow">Migração controlada</span><h1>{project.name}</h1><p>Fluxo protegido para migrar o projeto estático sem sobrescrever dados ou objetos existentes.</p></div><button className="button button-ghost" type="button" onClick={refresh} disabled={loading || running}><RefreshCw size={16} />Atualizar pré-validação</button></div><div className="admin-alert"><ShieldCheck size={16} />A execução usa a sessão administrativa atual, respeita RLS e não utiliza service_role.</div>{loading ? <div className="admin-empty"><span className="admin-spinner" />Calculando manifesto e consultando o Supabase...</div> : <><div className="project-detail-grid-admin"><article><span className="project-detail-label">Pré-validação</span><h2>{state.project ? 'Conflito de slug encontrado' : 'Slug disponível para criação'}</h2><p>{state.project ? `Já existe um projeto chamado ${state.project.title} (${state.project.status}). Nenhum dado será sobrescrito.` : `Nenhum projeto ${slug} foi encontrado nesta sessão administrativa.`}</p><dl><div><dt>Imagens cadastradas</dt><dd>{state.images.length}</dd></div><div><dt>Objetos no Storage</dt><dd>{state.objects.length}</dd></div><div><dt>Arquivos locais</dt><dd>{state.manifest.length} de {plannedSources.length}</dd></div></dl></article><aside><span className="project-detail-label">Registros planejados</span><p>1 projeto publicado, {plannedSources.length} registros em project_images, 1 capa e {plannedSources.length - 1} imagens de galeria.</p><p>Os outros projetos e o catálogo público não serão alterados.</p></aside></div>{state.error && <div className="admin-alert error" role="alert"><AlertTriangle size={16} />{state.error}</div>}<div className="image-section-heading"><div><span className="eyebrow">Manifesto</span><h2>{plannedSources.length} arquivos verificados</h2></div></div><div className="project-table-wrap"><table className="project-table"><thead><tr><th>Ordem</th><th>Arquivo</th><th>Tipo</th><th>Tamanho</th><th>SHA-256</th></tr></thead><tbody>{state.manifest.map((item) => <tr key={item.filename}><td>{item.display_order}</td><td><strong><FileImage size={14} />{item.filename}</strong><small>{item.alt_text}</small></td><td>{item.image_type === 'cover' ? 'Capa' : 'Galeria'}</td><td>{(item.bytes / 1024 / 1024).toFixed(2)} MB</td><td><code>{item.sha256}</code></td></tr>)}</tbody></table></div>{state.objects.length > 0 && <div className="admin-alert error" role="alert"><AlertTriangle size={16} />Existem objetos na pasta do projeto. A execução está bloqueada para preservar dados existentes.</div>}<label className="migration-confirm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={conflict || running} />Confirmo que revisei a pré-validação e autorizo criar somente o projeto {project.name}, seus {plannedSources.length} objetos e seus {plannedSources.length} registros de imagem.</label><div className="project-form-actions"><button className="button button-primary" type="button" onClick={() => void execute()} disabled={conflict || !confirmed || running || state.manifest.length !== plannedSources.length}>{running ? <><Upload className="spin" size={16} />Migrando...</> : <><Upload size={16} />Executar migração autorizada</>}</button></div>{message && <div className={`admin-alert ${message.includes('concluída') ? 'success' : 'error'}`} role="status"><Check size={16} />{message}</div>}{results.length > 0 && <ul className="migration-results">{results.map((result) => <li key={result}>{result}</li>)}</ul>}</>}</section>
}
