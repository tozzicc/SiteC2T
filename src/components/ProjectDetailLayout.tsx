import { ArrowLeft, ArrowUpRight, Check, Code2, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProjectGallery } from './ProjectGallery'
import type { PublicProject } from '../lib/publicCatalog'
import { getContactUrl, getWhatsAppUrl } from '../utils/contact'

type Props = { project: PublicProject }

function isValidHttpsUrl(value?: string) {
  if (!value) return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export function ProjectDetailLayout({ project }: Props) {
  const hasDemo = isValidHttpsUrl(project.demoUrl)
  const hasRepository = isValidHttpsUrl(project.repoUrl)
  const whatsappUrl = getWhatsAppUrl(project.name)
  const contactUrl = getContactUrl(project.name)

  return <>
    <header className="project-hero">
      <div className="container">
        <Link className="back-link" to="/projetos"><ArrowLeft size={16} /> Voltar aos projetos</Link>
        <div className="project-hero-content">
          <div className="project-hero-copy">
            <span className="eyebrow">{project.category}</span>
            <h1>{project.name}</h1>
            <p>{project.summary}</p>
            {project.status === 'published' && <span className="project-status">Publicado</span>}
          </div>
        </div>
      </div>
    </header>

    <main className="project-detail">
      <div className="container">
        <section className="project-gallery-section" aria-label={`Galeria de ${project.name}`}>
          <ProjectGallery images={project.images} projectName={project.name} />
        </section>

        <div className="project-sections">
          <section className="detail-block detail-block-about">
            <span className="eyebrow">Sobre o projeto</span>
            <h2>Uma solução pensada para evoluir.</h2>
            <p>{project.description}</p>
            <div className="detail-actions">
              {hasDemo && <a className="button button-primary" href={project.demoUrl} target="_blank" rel="noopener noreferrer">Ver demonstração <ExternalLink size={16} /></a>}
              {whatsappUrl ? <a className="button button-ghost" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Solicitar informações <ArrowUpRight size={16} /></a> : <Link className="button button-ghost" to={contactUrl}>Solicitar informações <ArrowUpRight size={16} /></Link>}
            </div>
          </section>

          <section className="detail-block">
            <span className="eyebrow">O desafio</span>
            <h2>O problema que a solução atende</h2>
            <p>{project.problem}</p>
          </section>

          <section className="detail-block">
            <span className="eyebrow">Recursos</span>
            <h2>Principais funcionalidades</h2>
            {project.features.length ? <ul className="detail-list">{project.features.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul> : <p>Informações sobre funcionalidades ainda não fornecidas.</p>}
          </section>

          <section className="detail-block">
            <span className="eyebrow">Tecnologia</span>
            <h2>Tecnologias utilizadas</h2>
            {project.technologies.length ? <div className="technology-list">{project.technologies.map((technology) => <span key={technology}><Code2 size={14} />{technology}</span>)}</div> : <p>Tecnologias utilizadas ainda não informadas.</p>}
            {hasRepository && <a className="repository-link" href={project.repoUrl} target="_blank" rel="noopener noreferrer">Ver repositório <ExternalLink size={14} /></a>}
          </section>
        </div>

        <div className="project-bottom-nav">
          <Link className="button button-ghost" to="/projetos"><ArrowLeft size={16} /> Todos os projetos</Link>
          <Link className="text-link" to={contactUrl}>Falar com a C2T <ArrowUpRight size={16} /></Link>
        </div>
      </div>
    </main>
  </>
}
