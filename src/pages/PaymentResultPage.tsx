import { Link, useSearchParams } from 'react-router-dom'

type ResultKind = 'success' | 'pending' | 'failure'
const copy: Record<ResultKind, { eyebrow: string; title: string; message: string }> = {
  success: { eyebrow: 'Checkout recebido', title: 'Pagamento em verificação', message: 'Recebemos o retorno do Mercado Pago. Isso ainda não confirma a aprovação: a C2T precisa validar a ordem por uma confirmação segura.' },
  pending: { eyebrow: 'Checkout pendente', title: 'Pagamento pendente', message: 'O Mercado Pago informou que a operação ainda está pendente. Aguarde a confirmação segura antes de considerar a compra concluída.' },
  failure: { eyebrow: 'Checkout encerrado', title: 'Pagamento não concluído', message: 'A operação foi recusada ou cancelada. Nenhum acesso ou entrega foi liberado automaticamente.' },
}

export function PaymentResultPage({ kind }: { kind: ResultKind }) {
  const [params] = useSearchParams()
  const content = copy[kind]
  const reference = params.get('external_reference') || params.get('order_id')
  return <><main className="not-found payment-result"><div className="container"><span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.message}</p>{reference && <p className="pricing-purchase-note">Referência recebida: {reference}</p>}<Link className="button button-primary" to="/projetos">Voltar aos projetos</Link><Link className="button button-ghost" to="/contato">Falar com a C2T</Link></div></main></>
}
