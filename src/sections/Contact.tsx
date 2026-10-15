import { ArrowRight, Link2, Mail, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SectionHeading } from '../components/SectionHeading'
import { usePublicSettings } from '../hooks/usePublicCatalog'

export function Contact() {
  const settings = usePublicSettings()
  return <section id="contato" className="contact-section"><div className="container contact-layout"><SectionHeading eyebrow="Vamos conversar" title="Vamos transformar sua ideia em uma solução?" description="Conte um pouco sobre o que você precisa. Vamos avaliar como a tecnologia pode ajudar." /><Link className="button button-primary contact-button" to="/contato">Fale com a C2T <ArrowRight size={17} /></Link><div className="contact-channels"><ContactItem icon={MessageCircle} label="WhatsApp" value={settings?.whatsapp_number ?? ''} /><ContactItem icon={Mail} label="E-mail" value={settings?.contact_email ?? ''} /><ContactItem icon={Link2} label="LinkedIn" value={settings?.linkedin_url ?? ''} /></div></div></section>
}

function ContactItem({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) { return <div className="contact-item"><Icon size={19} /><div><span>{label}</span><strong>{value || 'A definir'}</strong></div></div> }
