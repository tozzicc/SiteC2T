import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SectionHeading } from '../components/SectionHeading'
import { usePublicProjects } from '../hooks/usePublicCatalog'

export function Projects() {
  const { items: projects, loading, degraded } = usePublicProjects()

  return (
    <section id="projetos" className="section projects-section">
      <div className="container">
        <div className="heading-row">
          <SectionHeading eyebrow="Projetos em destaque" title="Ideias que ganham forma." description="Explore o catálogo de projetos da C2T Tecnologia. As informações serão ampliadas conforme forem validadas." />
          <span className="section-count">{loading ? '... / projetos' : `${String(projects.length).padStart(2, '0')} / projetos`}</span>
        </div>
        {loading ? <div className="catalog-loading" role="status">Carregando projetos...</div> : degraded ? <div className="catalog-empty" role="alert">Não foi possível carregar os projetos publicados no momento.</div> : projects.length === 0 ? <div className="catalog-empty">Nenhum projeto publicado no momento.</div> : <div className="projects-grid">
          {projects.map((project, index) => <article className="project-card" key={project.id}>
            <div className="project-image">
              {project.images[0] ? <img src={project.images[0].src} alt={project.images[0].alt} /> : <div className="project-image-empty" aria-label={`${project.name} — imagem de capa pendente`}>Imagem de capa pendente</div>}
              <span className="project-number">{String(index + 1).padStart(2, '0')}</span>
              {project.images[0]?.isPlaceholder && <span className="placeholder-label">Placeholder</span>}
            </div>
            <div className="project-info">
              <div className="project-info-copy">
                <span className="project-category">{project.category}</span>
                <h3>{project.name}</h3>
                <p>{project.summary}</p>
                <div className="project-techs">{project.technologies.length ? project.technologies.slice(0, 3).map((technology) => <span key={technology}>{technology}</span>) : <span>Tecnologias a definir</span>}</div>
              </div>
              <Link className="project-detail-link" to={`/projetos/${project.slug}`} aria-label={`Ver detalhes de ${project.name}`}>Ver detalhes <ArrowUpRight size={17} /></Link>
            </div>
          </article>)}
        </div>}
      </div>
    </section>
  )
}
