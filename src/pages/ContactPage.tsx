import { AlertCircle, ArrowLeft, CheckCircle2, ExternalLink, Link2, Mail, MessageCircle, Send } from 'lucide-react'
import { FormEvent, ReactElement, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { siteConfig } from '../config/site'
import { contactSubjects } from '../data/contact'
import { getWhatsAppUrl } from '../utils/contact'
import { setPageSeo } from '../utils/seo'
import { usePublicSettings } from '../hooks/usePublicCatalog'

type Subject = typeof contactSubjects[number]
type FormState = { name: string; email: string; phone: string; subject: Subject; message: string; consent: boolean; website: string }
type FormErrors = Partial<Record<keyof FormState, string>>
type SubmitState = { type: 'idle' | 'loading' | 'success' | 'error'; message?: string }

const defaultForm: FormState = { name: '', email: '', phone: '', subject: 'Desenvolvimento de Sistemas', message: '', consent: false, website: '' }
const isSubject = (value: string): value is Subject => contactSubjects.includes(value as Subject)

export function ContactPage() {
  const settings = usePublicSettings()
  const [searchParams] = useSearchParams()
  const requestedSubject = searchParams.get('assunto') ?? ''
  const initialSubject = isSubject(requestedSubject) ? requestedSubject : defaultForm.subject
  const initialMessage = searchParams.get('mensagem') ?? ''
  const [form, setForm] = useState<FormState>({ ...defaultForm, subject: initialSubject, message: initialMessage.slice(0, 2000) })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitState, setSubmitState] = useState<SubmitState>({ type: 'idle' })

  useEffect(() => setPageSeo('Contato | C2T Tecnologia', 'Fale com a C2T Tecnologia sobre sistemas web, soluções empresariais, automação e consultoria em TI.'))

  const whatsappUrl = useMemo(() => getWhatsAppUrl(), [])
  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => setForm((current) => ({ ...current, [field]: value }))

  function validate() {
    const nextErrors: FormErrors = {}
    if (form.name.trim().length < 3) nextErrors.name = 'Informe seu nome completo.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Informe um e-mail válido.'
    if (form.phone && !/^[+\d\s().-]{8,20}$/.test(form.phone)) nextErrors.phone = 'Informe um telefone válido ou deixe o campo vazio.'
    if (!isSubject(form.subject)) nextErrors.subject = 'Selecione o tipo de solicitação.'
    if (form.message.trim().length < 20) nextErrors.message = 'Escreva uma mensagem com pelo menos 20 caracteres.'
    if (form.message.length > 2000) nextErrors.message = 'A mensagem deve ter no máximo 2.000 caracteres.'
    if (!form.consent) nextErrors.consent = 'É necessário consentir com o uso dos dados para responder à solicitação.'
    return nextErrors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) { setSubmitState({ type: 'idle' }); return }
    if (form.website) { setSubmitState({ type: 'error', message: 'Não foi possível enviar a solicitação.' }); return }
    if (!settings?.form_endpoint || !/^https:\/\//.test(settings.form_endpoint)) { setSubmitState({ type: 'error', message: 'O formulário está temporariamente indisponível. Tente novamente mais tarde.' }); return }

    setSubmitState({ type: 'loading' })
    try {
      const response = await fetch(settings.form_endpoint, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), subject: form.subject, message: form.message.trim(), consent: form.consent }) })
      if (!response.ok) throw new Error('request-failed')
      setForm({ ...defaultForm, subject: initialSubject })
      setErrors({})
      setSubmitState({ type: 'success', message: 'Sua solicitação foi enviada. Obrigado pelo contato.' })
    } catch { setSubmitState({ type: 'error', message: 'Não foi possível enviar agora. Seus dados foram preservados; tente novamente ou use um canal disponível.' }) }
  }

  const fieldError = (field: keyof FormState) => errors[field] ? <span className="field-error" id={`${field}-error`}><AlertCircle size={14} />{errors[field]}</span> : null

  return <main className="contact-page"><section className="contact-page-hero"><div className="container"><Link className="back-link" to="/#inicio"><ArrowLeft size={16} /> Voltar para o início</Link><div className="contact-page-copy"><span className="eyebrow">Contato comercial</span><h1>Vamos conversar sobre seu próximo projeto?</h1><p>Conte para a C2T Tecnologia o que sua empresa precisa. Vamos avaliar como a tecnologia pode ajudar.</p></div></div></section><section className="contact-form-section"><div className="container contact-form-layout"><form className="commercial-form" onSubmit={handleSubmit} noValidate><div className="form-header"><span className="eyebrow">Solicitação de orçamento</span><h2>Fale com a nossa equipe.</h2><p>Preencha os campos abaixo. Usaremos os dados somente para responder à sua solicitação comercial.</p></div><div className="form-grid"><Field label="Nome completo" required error={fieldError('name')}><input id="name" name="name" type="text" value={form.name} onChange={(event) => update('name', event.target.value.slice(0, 120))} minLength={3} maxLength={120} autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} /></Field><Field label="E-mail" required error={fieldError('email')}><input id="email" name="email" type="email" value={form.email} onChange={(event) => update('email', event.target.value.slice(0, 160))} maxLength={160} autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} /></Field><Field label="WhatsApp / telefone" error={fieldError('phone')}><input id="phone" name="phone" type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value.slice(0, 20))} maxLength={20} autoComplete="tel" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : undefined} /></Field><Field label="Tipo de solicitação" required error={fieldError('subject')}><select id="subject" name="subject" value={form.subject} onChange={(event) => update('subject', event.target.value as Subject)} aria-invalid={Boolean(errors.subject)} aria-describedby={errors.subject ? 'subject-error' : undefined}>{contactSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}</select></Field></div><Field label="Mensagem" required error={fieldError('message')}><textarea id="message" name="message" value={form.message} onChange={(event) => update('message', event.target.value.slice(0, 2000))} minLength={20} maxLength={2000} rows={6} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'message-error' : undefined} /></Field><div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update('website', event.target.value)} /></div><label className={errors.consent ? 'consent-row has-error' : 'consent-row'}><input type="checkbox" checked={form.consent} onChange={(event) => update('consent', event.target.checked)} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? 'consent-error' : undefined} /><span>Autorizo o uso destes dados para que a C2T Tecnologia responda à minha solicitação comercial.</span></label>{fieldError('consent')}<p className="privacy-note">Os dados não serão usados como autorização genérica para marketing. Consulte a <Link to="/privacidade">política de privacidade</Link>.</p><button className="button button-primary form-submit" type="submit" disabled={submitState.type === 'loading'}>{submitState.type === 'loading' ? 'Enviando...' : 'Enviar solicitação'}<Send size={16} /></button>{submitState.type === 'success' && <div className="form-status success" role="status"><CheckCircle2 size={18} />{submitState.message}</div>}{submitState.type === 'error' && <div className="form-status error" role="alert"><AlertCircle size={18} />{submitState.message}</div>}</form><aside className="contact-options"><span className="eyebrow">Outros canais</span><h2>Prefere falar diretamente?</h2><p>Escolha um canal disponível para continuar a conversa com a C2T Tecnologia.</p>{whatsappUrl && <a className="contact-option" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={19} /><span>WhatsApp<strong>Falar com a C2T</strong></span><ExternalLink size={15} /></a>}{siteConfig.contact.email && <a className="contact-option" href={`mailto:${siteConfig.contact.email}`}><Mail size={19} /><span>E-mail<strong>{siteConfig.contact.email}</strong></span><ExternalLink size={15} /></a>}{siteConfig.contact.linkedin && <a className="contact-option" href={siteConfig.contact.linkedin} target="_blank" rel="noreferrer"><Link2 size={19} /><span>LinkedIn<strong>Ver perfil</strong></span><ExternalLink size={15} /></a>}{!whatsappUrl && !siteConfig.contact.email && !siteConfig.contact.linkedin && <p className="contact-unavailable">Os canais diretos ainda não foram configurados. O formulário poderá ser ativado após a configuração do endpoint.</p>}</aside></div></section></main>
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error: ReactElement | null; children: ReactElement<{ id?: string }> }) {
  return <div className="form-field"><label htmlFor={children.props.id}>{label}{required && <span aria-hidden="true"> *</span>}</label>{children}{error}</div>
}
