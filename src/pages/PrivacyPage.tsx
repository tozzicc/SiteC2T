import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { setPageSeo } from '../utils/seo'

export function PrivacyPage() {
  useEffect(() => setPageSeo('Privacidade | C2T Tecnologia', 'Informações básicas sobre o tratamento de dados enviados pelos canais de contato da C2T Tecnologia.'))
  return <main className="privacy-page"><div className="container"><Link className="back-link" to="/contato"><ArrowLeft size={16} /> Voltar para contato</Link><article className="privacy-content"><span className="eyebrow">Privacidade</span><h1>Tratamento dos dados de contato</h1><p>Esta página explica, de forma básica, como os dados enviados pelos canais de contato da C2T Tecnologia são utilizados.</p><h2>Finalidade</h2><p>Os dados informados no formulário ou em um canal comercial serão utilizados para compreender e responder à solicitação enviada.</p><h2>Dados solicitados</h2><p>O formulário solicita apenas nome, e-mail, telefone opcional, tipo de solicitação e mensagem. Não envie informações sensíveis ou desnecessárias.</p><h2>Consentimento</h2><p>O envio depende do consentimento específico para uso dos dados na resposta à solicitação comercial. Esse consentimento não representa autorização genérica para marketing.</p><h2>Informações pendentes</h2><p>Antes da publicação definitiva desta política, devem ser confirmados os dados institucionais, canais oficiais e demais informações jurídicas aplicáveis à operação da C2T Tecnologia.</p><Link className="button button-ghost" to="/contato">Ir para contato</Link></article></div></main>
}
