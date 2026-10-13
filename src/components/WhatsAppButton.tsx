import { MessageCircle } from 'lucide-react'
import { getWhatsAppUrl } from '../utils/contact'

export function WhatsAppButton() {
  const url = getWhatsAppUrl()
  if (!url) return null
  return <a className="whatsapp-float" href={url} target="_blank" rel="noreferrer" aria-label="Falar com a C2T Tecnologia pelo WhatsApp" title="Falar pelo WhatsApp"><MessageCircle size={23} /><span>WhatsApp</span></a>
}
