import { ArrowUpRight } from 'lucide-react'
import { SectionHeading } from '../components/SectionHeading'
import { usePublicServices } from '../hooks/usePublicCatalog'

export function Solutions() {
  const { items: services, loading } = usePublicServices()
  return <section id="solucoes" className="section"><div className="container"><SectionHeading eyebrow="O que fazemos" title="Tecnologia com propósito." description="Da primeira ideia ao produto em operação, criamos soluções que fazem sentido para a realidade de cada negócio." />{loading ? <div className="catalog-loading" role="status">Carregando soluções...</div> : <div className="solutions-grid">{services.map(({ icon: Icon, title, description }, index) => <article className="solution-card" key={title}><div className="card-index">{String(index + 1).padStart(2, '0')}</div><div className="icon-box"><Icon size={22} /></div><h3>{title}</h3><p>{description}</p><ArrowUpRight className="card-arrow" size={19} /></article>)}</div>}</div></section>
}
