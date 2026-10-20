import { siteConfig } from '../config/site'

export type WhatsAppContext = 'general' | 'Chamado TI' | 'Agenda' | 'Gestão de Projetos' | string

export function getWhatsAppMessage(context: WhatsAppContext = 'general') {
  if (context === 'Chamado TI') return 'Olá! Gostaria de conhecer melhor o sistema Chamado TI da C2T.'
  if (context === 'Agenda') return 'Olá! Gostaria de conhecer melhor o sistema Agenda da C2T.'
  if (context === 'Gestão de Projetos') return 'Olá! Gostaria de conhecer melhor o sistema Gestão de Projetos da C2T.'
  if (context === 'general') return 'Olá! Conheci a C2T Tecnologia pelo site e gostaria de mais informações.'
  return `Olá! Gostaria de solicitar uma avaliação para minha empresa sobre ${context}.`
}

export function getWhatsAppUrl(context: WhatsAppContext = 'general') {
  const number = siteConfig.contact.whatsapp.replace(/\D/g, '')
  if (!number) return ''
  return `https://wa.me/${number}?text=${encodeURIComponent(getWhatsAppMessage(context))}`
}

export function getWhatsAppUrlForPlan(number: string, project: string, plan: string, details?: string) {
  const normalized = number.replace(/\D/g, '')
  if (!normalized) return ''
  const commercialDetails = details ? ` ${details}.` : ''
  return `https://wa.me/${normalized}?text=${encodeURIComponent(`Olá! Gostaria de solicitar informações sobre o plano ${plan} do projeto ${project} da C2T.${commercialDetails}`)}`
}

export function getContactUrl(subject?: string) {
  const params = new URLSearchParams()
  if (subject) params.set('assunto', subject)
  return params.toString() ? `/contato?${params.toString()}` : '/contato'
}

export function getContactSubject(projectName: string) {
  if (projectName.toLocaleLowerCase().includes('chamado')) return 'Chamado TI'
  if (projectName.toLocaleLowerCase().includes('agenda')) return 'Agenda'
  if (projectName.toLocaleLowerCase().includes('gestão') || projectName.toLocaleLowerCase().includes('gestao')) return 'Gestão de Projetos'
  return 'Sistemas Personalizados'
}
