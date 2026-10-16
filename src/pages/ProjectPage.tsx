import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { ProjectDetailLayout } from '../components/ProjectDetailLayout'
import { usePublicProjects } from '../hooks/usePublicCatalog'
import { setPageSeo } from '../utils/seo'

export function ProjectPage() {
  const { slug } = useParams()
  const { items: projects, loading } = usePublicProjects()
  const project = projects.find((item) => item.slug === slug)
  useEffect(() => { if (project) setPageSeo(`${project.name} | C2T Tecnologia`, `${project.name}: ${project.summary}`) }, [project])
  if (loading) return <main className="not-found"><div className="container"><span className="eyebrow">Catalogo</span><h1>Carregando projeto...</h1></div></main>
  if (!project) return <ProjectNotFound />
  return <ProjectDetailLayout project={project} />
}

function ProjectNotFound() { useEffect(() => setPageSeo('Projeto nao encontrado | C2T Tecnologia', 'O projeto solicitado nao foi encontrado.')); return <><main className="not-found"><div className="container"><span className="eyebrow">404 / projeto</span><h1>Este projeto nao foi encontrado.</h1><p>O endereco pode estar incorreto ou o projeto ainda nao foi publicado.</p><Link className="button button-primary" to="/projetos">Voltar para projetos <ArrowLeft size={16} /></Link></div></main></> }
