import { ArrowUpRight } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { siteConfig } from '../config/site'
import { Logo } from './Logo'

export function Footer() {
  const isHome = useLocation().pathname === '/'
  const links = [['Soluções', '/solucoes'], ['Projetos', '#projetos'], ['Sobre', '#sobre'], ['Contato', '/contato']]
  return <footer className="footer"><div className="container"><div className="footer-top"><div><Logo /><p className="footer-note">{siteConfig.slogan}</p></div><nav className="footer-nav" aria-label="Navegação do rodapé">{links.map(([label, href]) => <a key={href} href={href.startsWith('/') ? href : isHome ? href : `/${href}`}>{label}<ArrowUpRight size={14} /></a>)}</nav></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {siteConfig.name}. Todos os direitos reservados.</span><span className="configured-note">Links sociais configuráveis</span></div></div></footer>
}
