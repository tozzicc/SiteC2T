import { ArrowRight, Link2, Mail, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { siteConfig } from '../config/site'
import { SectionHeading } from '../components/SectionHeading'

export function Contact() {
  return <section id="contato" className="contact-section"><div className="container contact-layout"><SectionHeading eyebrow="Vamos conversar" title="Vamos transformar sua ideia em uma solução?" description="Conte um pouco sobre o que você precisa. Vamos avaliar como a tecnologia pode ajudar." /><Link className="button button-primary contact-button" to="/contato">Fale com a C2T <ArrowRight size={17} /></Link><div className="contact-channels"><ContactItem icon={MessageCircle} label="WhatsApp" value={siteConfig.contact.whatsapp} /><ContactItem icon={Mail} label="E-mail" value={siteConfig.contact.email} /><ContactItem icon={Link2} label="LinkedIn" value={siteConfig.contact.linkedin} /></div></div></section>
}

function ContactItem({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return <div className="contact-item"><Icon size={19} /><div><span>{label}</span><strong>{value || 'A definir'}</strong></div></div>
}
