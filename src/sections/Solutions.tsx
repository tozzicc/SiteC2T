import { ArrowUpRight } from 'lucide-react'
import { solutions } from '../data/content'
import { SectionHeading } from '../components/SectionHeading'

export function Solutions() { return <section id="solucoes" className="section"><div className="container"><SectionHeading eyebrow="O que fazemos" title="Tecnologia com propósito." description="Da primeira ideia ao produto em operação, criamos soluções que fazem sentido para a realidade de cada negócio." /><div className="solutions-grid">{solutions.map(({ icon: Icon, title, description }, index) => <article className="solution-card" key={title}><div className="card-index">0{index + 1}</div><div className="icon-box"><Icon size={22} /></div><h3>{title}</h3><p>{description}</p><ArrowUpRight className="card-arrow" size={19} /></article>)}</div></div></section> }
