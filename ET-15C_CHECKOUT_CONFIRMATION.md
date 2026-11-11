# ET-15C — Confirmação segura de pagamentos

## Diagnóstico

A Order era criada com `processing_mode: "manual"`, como exige o Checkout Pro com Orders API, mas sem `capture_mode`. O navegador recebia o retorno `approved`, enquanto o registro local permanecia `created`. Esse retorno nunca foi tratado como prova de pagamento. A criação agora informa `capture_mode: "automatic"`; a confirmação continua dependendo da consulta autenticada à Order.

## Fluxo implementado

1. Mercado Pago envia o evento `order` para `mercado-pago-webhook`.
2. A função valida `x-signature`, `x-request-id`, `data.id` e janela de tempo da assinatura.
3. A função consulta `GET /v1/orders/{id}` com `MERCADOPAGO_ACCESS_TOKEN`.
4. Confere identificador, referência, moeda BRL, valor total e valor pago.
5. Atualiza `checkout_order_attempts` com estado interno e metadados do provedor.
6. A página de retorno consulta `get-checkout-status` no máximo oito vezes, com intervalo de dois segundos. Apenas `approved` confirmado pelo backend é exibido como aprovado.

Estados mapeados: `processed/accredited` → `approved`; `processing`, `action_required` e `created` → `pending`; `failed` → `rejected`; `canceled` → `canceled`. Estados finais não regridem para pendente.

## Secrets adicionais

Configurar somente no Supabase, sem colocar valores no repositório:

- `MERCADOPAGO_WEBHOOK_SECRET`: segredo exibido em Developers > sua aplicação > Webhooks > Configuração de notificações.
- Os secrets já existentes `MERCADOPAGO_ACCESS_TOKEN`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` continuam necessários.

## Painel Mercado Pago

No ambiente **Test**, em **Developers > sua aplicação > Webhooks configuration**:

- URL: `https://<projeto>.supabase.co/functions/v1/mercado-pago-webhook`
- Evento: **Order (Mercado Pago)** / `order`
- Salvar e copiar o segredo gerado para `MERCADOPAGO_WEBHOOK_SECRET`.

Orders API não usa `notification_url` no corpo da Order; a configuração é feita no painel da aplicação. Orders antigas não passam a ser notificadas retroativamente.

## Migration e publicação manual

Aplicar localmente/revisar a migration `supabase/migrations/202611100001_confirm_checkout_orders.sql` antes da publicação. Não foi executada remotamente.

Após autorização explícita, os comandos são:

```powershell
supabase db push
supabase secrets set MERCADOPAGO_WEBHOOK_SECRET="<valor-fora-do-repositorio>"
supabase functions deploy mercado-pago-webhook --no-verify-jwt
supabase functions deploy get-checkout-status --no-verify-jwt
supabase functions deploy create-checkout-order --no-verify-jwt
```

Configurar no frontend `VITE_CHECKOUT_STATUS_FUNCTION_URL` com a URL de `get-checkout-status` e publicar o frontend conforme o processo existente.

## Validação de uma nova compra de teste

1. Aplicar a migration e configurar os secrets/painel somente após revisão.
2. Criar uma nova compra com usuário de teste do Mercado Pago; não reutilizar a referência da validação anterior.
3. Confirmar que a tentativa nasce em `created` e que a Order possui `capture_mode` `automatic`.
4. Concluir o pagamento de teste.
5. No painel, simular/revisar a notificação `order` e conferir resposta HTTP 200.
6. Confirmar no Supabase que `provider_status=processed`, `provider_status_detail=accredited` e `status=approved`.
7. Abrir o retorno e confirmar que a página só exibe “Pagamento aprovado” após a consulta segura.

Não há liberação automática de sistema, licença ou credencial nesta ET.
