import { ArrowRight, ArrowUpRight, Check, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { siteConfig } from '../config/site'
import { projects, services } from '../data/content'
import { getContactUrl, getWhatsAppUrl } from '../utils/contact'
import { setPageSeo } from '../utils/seo'

export function SolutionsPage() {
  useEffect(() => setPageSeo('Soluções e Serviços | C2T Tecnologia', 'Conheça as soluções da C2T Tecnologia para sistemas web, processos empresariais, automação e consultoria em TI. Tecnologia que simplifica.'))

  const contactUrl = (serviceName?: string) => getWhatsAppUrl(serviceName ?? 'as soluções da C2T Tecnologia') || getContactUrl(serviceName)
  const generalContactUrl = contactUrl()
  const isExternalContact = generalContactUrl.startsWith('https://')
  return <><main className="solutions-page"><section className="solutions-hero"><div className="container"><Link className="back-link" to="/#inicio"><ArrowUpRight size={15} /> Voltar para o início</Link><div className="solutions-hero-copy"><span className="eyebrow">Soluções e serviços</span><h1>Tecnologia que acompanha o ritmo do seu negócio.</h1><p>Construímos soluções digitais com clareza, proximidade e visão prática para apoiar processos que precisam funcionar melhor.</p><a className="button button-primary" href={generalContactUrl} target={isExternalContact ? '_blank' : undefined} rel={isExternalContact ? 'noreferrer' : undefined}>Solicite uma avaliação para sua empresa <ArrowRight size={17} /></a></div></div></section><section className="services-section"><div className="container"><div className="section-heading"><span className="eyebrow">Como podemos ajudar</span><h2>Serviços para diferentes desafios.</h2><p>Conheça as frentes de atuação da C2T e encontre o próximo passo para a sua operação.</p></div><div className="services-list">{services.map((service, index) => <ServiceBlock key={service.slug} service={service} index={index} projects={projects} contactUrl={contactUrl(service.title)} />)}</div></div></section></main></>
}

type ServiceBlockProps = { service: (typeof services)[number]; index: number; projects: typeof import('../data/content').projects; contactUrl: string }

function ServiceBlock({ service, index, projects, contactUrl }: ServiceBlockProps) {
  const Icon = service.icon
  const linkedProjects = service.projectSlugs?.map((slug) => projects.find((project) => project.slug === slug)).filter(Boolean) ?? []
  return <article className="service-block"><div className="service-block-head"><span className="service-index">0{index + 1}</span><div className="service-icon"><Icon size={25} /></div><div><h2>{service.title}</h2><p>{service.description}</p></div></div><div className="service-columns"><div><span className="service-label">Possíveis aplicações</span><ul>{service.examples.map((example) => <li key={example}><span />{example}</li>)}</ul></div><div><span className="service-label">Benefícios potenciais</span><ul>{service.benefits.map((benefit) => <li key={benefit}><Check size={15} />{benefit}</li>)}</ul></div></div>{linkedProjects.length > 0 && <div className="service-projects"><span className="service-label">Projetos relacionados</span><div>{linkedProjects.map((project) => project && <Link key={project.slug} to={`/projetos/${project.slug}`}>{project.name}<ArrowUpRight size={15} /></Link>)}</div></div>}<a className="service-cta" href={contactUrl} target={contactUrl.startsWith('https://') ? '_blank' : undefined} rel={contactUrl.startsWith('https://') ? 'noreferrer' : undefined}>{siteConfig.contact.whatsapp ? <MessageCircle size={16} /> : <ArrowRight size={16} />} Solicite uma avaliação para sua empresa</a></article>
}
