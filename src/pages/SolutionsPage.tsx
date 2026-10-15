import { ArrowRight, ArrowUpRight, Check, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { siteConfig } from '../config/site'
import { usePublicProjects, usePublicServices } from '../hooks/usePublicCatalog'
import { getContactUrl, getWhatsAppUrl } from '../utils/contact'
import { setPageSeo } from '../utils/seo'

export function SolutionsPage() {
  const { items: projects } = usePublicProjects()
  const { items: services, loading } = usePublicServices()
  useEffect(() => setPageSeo('Solucoes e Servicos | C2T Tecnologia', 'Conheca as solucoes da C2T Tecnologia.'))
  const contactUrl = (name?: string) => getWhatsAppUrl(name ?? 'as solucoes da C2T Tecnologia') || getContactUrl(name)
  const generalContactUrl = contactUrl()
  const external = generalContactUrl.startsWith('https://')
  return <><main className="solutions-page"><section className="solutions-hero"><div className="container"><Link className="back-link" to="/#inicio"><ArrowUpRight size={15} /> Voltar para o inicio</Link><div className="solutions-hero-copy"><span className="eyebrow">Solucoes e servicos</span><h1>Tecnologia que acompanha o ritmo do seu negocio.</h1><p>Construimos solucoes digitais com clareza, proximidade e visao pratica.</p><a className="button button-primary" href={generalContactUrl} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>Solicite uma avaliacao <ArrowRight size={17} /></a></div></div></section><section className="services-section"><div className="container"><div className="section-heading"><span className="eyebrow">Como podemos ajudar</span><h2>Servicos para diferentes desafios.</h2><p>Conheca as frentes de atuacao da C2T.</p></div>{loading ? <div className="catalog-loading" role="status">Carregando servicos...</div> : <div className="services-list">{services.map((service, index) => <ServiceBlock key={service.slug} service={service} index={index} projects={projects} contactUrl={contactUrl(service.title)} />)}</div>}</div></section></main></>
}

type ServiceBlockProps = { service: (typeof import('../data/content').services)[number]; index: number; projects: typeof import('../data/content').projects; contactUrl: string }
function ServiceBlock({ service, index, projects, contactUrl }: ServiceBlockProps) {
  const Icon = service.icon
  const linkedProjects = service.projectSlugs?.map((slug) => projects.find((project) => project.slug === slug)).filter(Boolean) ?? []
  return <article className="service-block"><div className="service-block-head"><span className="service-index">{String(index + 1).padStart(2, '0')}</span><div className="service-icon"><Icon size={25} /></div><div><h2>{service.title}</h2><p>{service.description}</p></div></div><div className="service-columns"><div><span className="service-label">Possiveis aplicacoes</span><ul>{service.examples.map((example) => <li key={example}><span />{example}</li>)}</ul></div><div><span className="service-label">Beneficios potenciais</span><ul>{service.benefits.map((benefit) => <li key={benefit}><Check size={15} />{benefit}</li>)}</ul></div></div>{linkedProjects.length > 0 && <div className="service-projects"><span className="service-label">Projetos relacionados</span><div>{linkedProjects.map((project) => project && <Link key={project.slug} to={`/projetos/${project.slug}`}>{project.name}<ArrowUpRight size={15} /></Link>)}</div></div>}<a className="service-cta" href={contactUrl} target={contactUrl.startsWith('https://') ? '_blank' : undefined} rel={contactUrl.startsWith('https://') ? 'noreferrer' : undefined}>{siteConfig.contact.whatsapp ? <MessageCircle size={16} /> : <ArrowRight size={16} />} Solicite uma avaliacao</a></article>
}
