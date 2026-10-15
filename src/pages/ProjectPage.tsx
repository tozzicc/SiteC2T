import { ArrowLeft, ArrowUpRight, Check, Code2, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { ProjectGallery } from '../components/ProjectGallery'
import { usePublicProjects } from '../hooks/usePublicCatalog'
import { getContactUrl, getWhatsAppUrl } from '../utils/contact'
import { setPageSeo } from '../utils/seo'

export function ProjectPage() {
  const { slug } = useParams()
  const { items: projects, loading } = usePublicProjects()
  const project = projects.find((item) => item.slug === slug)
  useEffect(() => { if (project) setPageSeo(`${project.name} | C2T Tecnologia`, `${project.name}: ${project.summary}`) }, [project])
  if (loading) return <main className="not-found"><div className="container"><span className="eyebrow">Catalogo</span><h1>Carregando projeto...</h1></div></main>
  if (!project) return <ProjectNotFound />
  const whatsappUrl = getWhatsAppUrl(project.name)
  const contactUrl = getContactUrl(project.name)
  const hasDemo = Boolean(project.demoUrl && /^https:\/\//.test(project.demoUrl))
  const hasRepository = Boolean(project.repoUrl && /^https:\/\//.test(project.repoUrl))
  return <><header className="project-hero"><div className="container"><Link className="back-link" to="/#projetos"><ArrowLeft size={16} /> Voltar para projetos</Link><div className="project-hero-content"><div><span className="eyebrow">{project.category}</span><h1>{project.name}</h1><p>{project.summary}</p><span className="project-status">Publicado</span></div><div className="project-hero-mark">C2T<span>/</span>PROJECT</div></div></div></header><main className="project-detail"><div className="container"><div className="project-detail-grid"><div><ProjectGallery images={project.images} projectName={project.name} /></div><div className="project-copy"><span className="eyebrow">Sobre o projeto</span><h2>Uma solução pensada para evoluir.</h2><p>{project.description}</p><div className="detail-actions">{hasDemo && <a className="button button-primary" href={project.demoUrl} target="_blank" rel="noreferrer">Ver demonstração <ExternalLink size={16} /></a>}{whatsappUrl ? <a className="button button-ghost" href={whatsappUrl} target="_blank" rel="noreferrer">Solicitar informações <ArrowUpRight size={16} /></a> : <Link className="button button-ghost" to={contactUrl}>Solicitar informações <ArrowUpRight size={16} /></Link>}</div></div></div><div className="project-sections"><section className="detail-block"><span className="eyebrow">O desafio</span><h2>O problema que a solução atende</h2><p>{project.problem}</p></section><section className="detail-block"><span className="eyebrow">Recursos</span><h2>Principais funcionalidades</h2>{project.features.length ? <ul className="detail-list">{project.features.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul> : <p>Informações sobre funcionalidades ainda não fornecidas.</p>}</section><section className="detail-block"><span className="eyebrow">Tecnologia</span><h2>Stack do projeto</h2>{project.technologies.length ? <div className="technology-list">{project.technologies.map((technology) => <span key={technology}><Code2 size={14} />{technology}</span>)}</div> : <p>Tecnologias utilizadas ainda não informadas.</p>}{hasRepository && <a className="repository-link" href={project.repoUrl} target="_blank" rel="noreferrer">Ver repositório <ExternalLink size={14} /></a>}</section></div><div className="project-bottom-nav"><Link className="button button-ghost" to="/#projetos"><ArrowLeft size={16} /> Todos os projetos</Link><Link className="text-link" to={contactUrl}>Falar com a C2T <ArrowUpRight size={16} /></Link></div></div></main></>
}

function ProjectNotFound() { useEffect(() => setPageSeo('Projeto nao encontrado | C2T Tecnologia', 'O projeto solicitado nao foi encontrado.')); return <><main className="not-found"><div className="container"><span className="eyebrow">404 / projeto</span><h1>Este projeto nao foi encontrado.</h1><p>O endereco pode estar incorreto ou o projeto ainda nao foi publicado.</p><Link className="button button-primary" to="/#projetos">Voltar para projetos <ArrowLeft size={16} /></Link></div></main></> }
