import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Logo } from './Logo'

const navItems = [['Início', 'inicio'], ['Soluções', 'solucoes'], ['Projetos', 'projetos'], ['Sobre', 'sobre'], ['Contato', 'contato']]

export function Header() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isSolutions = location.pathname === '/solucoes'
  const isContact = location.pathname === '/contato'
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('inicio')

  useEffect(() => {
    if (!isHome) return
    const sections = navItems.map(([, id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)), { rootMargin: '-30% 0px -60% 0px' })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [isHome])

  const currentActive = isHome ? active : isSolutions ? 'solucoes' : isContact ? 'contato' : 'projetos'
  return <header className="site-header"><div className="container header-inner"><Logo /><button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open}>{open ? <X /> : <Menu />}</button><nav className={open ? 'nav open' : 'nav'} aria-label="Navegação principal">{navItems.map(([label, id]) => <a key={id} className={currentActive === id ? 'active' : ''} href={id === 'solucoes' ? '/solucoes' : id === 'contato' ? '/contato' : isHome ? `#${id}` : `/#${id}`} onClick={() => setOpen(false)}>{label}</a>)}</nav></div></header>
}
