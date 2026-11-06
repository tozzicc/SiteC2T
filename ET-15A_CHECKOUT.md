# ET-15A — Checkout Pro em ambiente de teste

## Arquitetura

O frontend Vite/React chama a Supabase Edge Function `create-checkout-order`. A função é pública apenas no gateway da Supabase por meio de `supabase/config.toml`; a própria função valida a origem e usa credencial de servidor. Uma RPC `security definer` reserva a tentativa sob lock transacional, valida projeto publicado, modalidade `implementation` ativa e `setup_price > 0`, e nunca aceita preço do navegador. O `recurring_price` e `one_time_price` não participam do checkout.

A tentativa é registrada em `checkout_order_attempts` antes da chamada ao Mercado Pago. O `idempotency_key` e o `external_reference` são únicos; o `mercadopago_order_id` e a `checkout_url` são preservados para conciliação futura. Um lock advisory transacional aplica um limite global de 20 reservas por minuto sem armazenar IP. Estados `creating` antigos passam a `unknown`, sem nova criação automática. A migration é local e deve ser aplicada manualmente antes de publicar a função.

## Configuração necessária

Frontend, sem segredos:

- `VITE_CHECKOUT_ENABLED=true`
- `VITE_CHECKOUT_FUNCTION_URL=https://<projeto>.supabase.co/functions/v1/create-checkout-order`

Supabase Edge Function:

- `SUPABASE_URL` — fornecida pelo ambiente da função.
- `SUPABASE_SERVICE_ROLE_KEY` — secret do projeto, nunca no frontend.
- `MERCADOPAGO_ACCESS_TOKEN` — token privado do ambiente de teste.
- `MERCADOPAGO_ENVIRONMENT=test`
- `CHECKOUT_SITE_URL=https://www.c2ttecnologia.com.br` — opcional, validada contra o domínio oficial.
- `CHECKOUT_ALLOWED_ORIGINS=https://www.c2ttecnologia.com.br` — opcional; suporta lista separada por vírgulas.

O token de produção não deve ser configurado nesta etapa. A documentação do Mercado Pago informa que as credenciais de teste devem ser conferidas no ambiente Test; a compatibilidade exata do token depende da conta/test user configurada no painel.

## Fluxo e limites

O comprador informa apenas o e-mail, o frontend envia `project_id` e uma chave de idempotência, e a função cria uma Order com `type=online`, `processing_mode=manual`, moeda da conta em BRL, `config.online` e `auto_return=approved`. O navegador redireciona para a `checkout_url` validada na mesma aba.

As rotas `/pagamento/sucesso`, `/pagamento/pendente` e `/pagamento/recusado` são informativas. Nenhuma delas confirma pagamento, consulta a Order ou libera sistema. Falhas de rede, timeout, JSON inválido ou persistência após a chamada ao Mercado Pago são marcadas como `unknown`; o frontend bloqueia nova tentativa automática para evitar uma segunda cobrança. Webhook definitivo, conciliação, entrega automática e produção ficam fora da ET-15A.

## Aplicação

Não executar SQL remoto, deploy, commit ou push automaticamente. Aplicar a migration e publicar a Edge Function somente após aprovação explícita e revisão dos secrets.
