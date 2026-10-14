import { Archive, CheckCircle2, CircleDashed, FolderKanban, Plus, Rocket, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { siteConfig } from '../config/site'
import { listProjects, projectErrorMessage } from '../lib/projects'
import { listServices, serviceErrorMessage } from '../lib/services'
import type { Project } from '../types/project'
import type { Service } from '../types/service'
import { isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'

export function AdminDashboard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [servicesLoading, setServicesLoading] = useState(true)
  const [error, setError] = useState('')
  const [servicesError, setServicesError] = useState('')
  useEffect(() => { let active = true; listProjects().then((items) => { if (active) setProjects(items) }).catch((reason: unknown) => { if (active) setError(projectErrorMessage(reason)) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  useEffect(() => { let active = true; listServices().then((items) => { if (active) setServices(items) }).catch((reason: unknown) => { if (active) setServicesError(serviceErrorMessage(reason)) }).finally(() => { if (active) setServicesLoading(false) }); return () => { active = false } }, [])
  const published = projects.filter((project) => project.status === 'published').length
  const drafts = projects.filter((project) => project.status === 'draft').length
  const archived = projects.filter((project) => project.status === 'archived').length
  const publishedServices = services.filter((service) => service.status === 'published').length
  const draftServices = services.filter((service) => service.status === 'draft').length
  const archivedServices = services.filter((service) => service.status === 'archived').length
  return <section className="admin-dashboard"><div className="admin-welcome"><div><span className="eyebrow">Dashboard</span><h1>Olá, administrador.</h1><p>Visão geral dos projetos e serviços cadastrados para a {siteConfig.name}. O catálogo público existente continua usando sua fonte estática.</p></div><div className="admin-welcome-actions"><Link className="button button-primary" to="/admin/projetos/novo"><Plus size={16} />Novo projeto</Link><Link className="button button-ghost" to="/admin/servicos/novo"><Plus size={16} />Novo serviço</Link><Link className="button button-ghost" to="/"><span>Ver site público</span></Link></div></div>{error && <div className="admin-alert error" role="alert">{error}</div>}{servicesError && <div className="admin-alert error" role="alert">{servicesError}</div>}<div className="admin-status-grid admin-project-stats"><Stat icon={FolderKanban} label="Total de projetos" value={loading ? '—' : projects.length} /><Stat icon={Rocket} label="Projetos publicados" value={loading ? '—' : published} /><Stat icon={CircleDashed} label="Projetos em rascunho" value={loading ? '—' : drafts} /><Stat icon={Archive} label="Projetos arquivados" value={loading ? '—' : archived} /></div><div className="admin-status-grid admin-project-stats admin-service-stats"><Stat icon={Wrench} label="Total de serviços" value={servicesLoading ? '—' : services.length} /><Stat icon={Rocket} label="Serviços publicados" value={servicesLoading ? '—' : publishedServices} /><Stat icon={CircleDashed} label="Serviços em rascunho" value={servicesLoading ? '—' : draftServices} /><Stat icon={Archive} label="Serviços arquivados" value={servicesLoading ? '—' : archivedServices} /></div><div className="admin-session"><span className="eyebrow">Sessão autenticada</span><h2>Informações básicas</h2><dl><div><dt>E-mail</dt><dd>{user?.email ?? 'Não disponível'}</dd></div><div><dt>ID do usuário</dt><dd>{user?.id ?? 'Não disponível'}</dd></div><div><dt>Conexão Supabase</dt><dd><CheckCircle2 size={14} />{isSupabaseConfigured ? 'Configurada' : 'Não configurada'}</dd></div></dl></div>{!loading && !error && projects.length === 0 && !servicesLoading && services.length === 0 && <div className="admin-empty admin-dashboard-empty"><FolderKanban size={28} /><h2>Nenhum projeto ou serviço no banco ainda.</h2><p>Cadastre os primeiros registros quando as migrations estiverem ativas no Supabase.</p><Link className="button button-ghost" to="/admin/projetos/novo">Cadastrar primeiro projeto</Link></div>}</section>
}

function Stat({ icon: Icon, label, value }: { icon: typeof FolderKanban; label: string; value: number | string }) { return <article className="admin-status-card"><div className="admin-card-icon"><Icon size={20} /></div><div><span>{label}</span><strong>{value}</strong><small>Dados consultados no Supabase</small></div></article> }
