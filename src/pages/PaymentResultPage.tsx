import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

type ResultKind = 'success' | 'pending' | 'failure'
type ConfirmedStatus = 'created' | 'pending' | 'approved' | 'rejected' | 'canceled' | 'unknown'
const statusEndpoint = import.meta.env.VITE_CHECKOUT_STATUS_FUNCTION_URL?.trim() ?? ''
const copy: Record<ResultKind, { eyebrow: string; title: string; message: string }> = {
  success: { eyebrow: 'Checkout recebido', title: 'Pagamento em verificação', message: 'O retorno do Mercado Pago ainda não confirma a aprovação. A C2T precisa validar a ordem por uma confirmação segura.' },
  pending: { eyebrow: 'Checkout pendente', title: 'Pagamento em verificação', message: 'A ordem ainda não foi confirmada pelo backend. Aguarde a atualização segura do Mercado Pago.' },
  failure: { eyebrow: 'Checkout encerrado', title: 'Pagamento não concluído', message: 'A operação foi recusada ou cancelada. Nenhum acesso ou entrega foi liberado automaticamente.' },
}

export function PaymentResultPage({ kind }: { kind: ResultKind }) {
  const [params] = useSearchParams()
  const reference = params.get('external_reference') || params.get('order_id')
  const [confirmedStatus, setConfirmedStatus] = useState<ConfirmedStatus | null>(null)
  useEffect(() => {
    if (!reference || !statusEndpoint) return
    let cancelled = false
    const poll = async () => {
      for (let attempt = 0; attempt < 8 && !cancelled; attempt += 1) {
        try {
          const url = new URL(statusEndpoint)
          url.searchParams.set(reference.startsWith('c2t-') ? 'external_reference' : 'order_id', reference)
          const response = await fetch(url)
          const body = await response.json().catch(() => null)
          const status = body && typeof body.status === 'string' ? body.status as ConfirmedStatus : 'unknown'
          if (!cancelled) setConfirmedStatus(status)
          if (status === 'approved' || status === 'rejected' || status === 'canceled') return
        } catch { if (!cancelled) setConfirmedStatus('unknown') }
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }
    void poll()
    return () => { cancelled = true }
  }, [reference])
  const content = confirmedStatus === 'approved'
    ? { eyebrow: 'Pagamento confirmado', title: 'Pagamento aprovado', message: 'O Mercado Pago confirmou a ordem e o pagamento foi validado com segurança pela C2T.' }
    : confirmedStatus === 'rejected' || confirmedStatus === 'canceled' ? copy.failure : copy[confirmedStatus === null ? kind : 'success']
  return <><main className="not-found payment-result"><div className="container"><span className="eyebrow">{content.eyebrow}</span><h1>{content.title}</h1><p>{content.message}</p>{reference && <p className="pricing-purchase-note">Referência recebida: {reference}</p>}<Link className="button button-primary" to="/projetos">Voltar aos projetos</Link><Link className="button button-ghost" to="/contato">Falar com a C2T</Link></div></main></>
}
