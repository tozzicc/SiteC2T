# ET-14 — Compra única

## Auditoria

O modelo comercial existente em `public.project_pricing` tinha somente `implementation` e `facilitated_implementation`. `setup_price` representa implantação e `recurring_price` representa mensalidade; nenhum deles foi reutilizado como preço de aquisição.

## Implementação local

- A migration `202611030001_add_one_time_project_pricing.sql` adiciona a modalidade `one_time` e o campo `one_time_price`.
- A migration mantém os registros mensais e suas colunas, recria as restrições para aceitar a nova modalidade e atualiza a RPC pública.
- A RPC pública preserva o catálogo de modalidades ativas e publicadas, mascarando preços quando `show_price = false`; a consulta pública atual filtra `one_time`. Assim, mensalidades podem ser reativadas futuramente sem nova estrutura de banco.
- O painel administra compra única, implantação à vista e implantação facilitada. Nenhum valor existente é alterado automaticamente.
- A página pública mostra somente compra única, demonstração e proposta personalizada. “Comprar agora” permanece desabilitado enquanto o checkout real não existir.

## Cadastro necessário antes de publicar

Aplicar a migration manualmente no Supabase e cadastrar, para cada sistema, uma linha `one_time` com `one_time_price`, título, condições aprovadas, `is_active = true` e `show_price = true` somente após validação comercial. A migration não inclui valores fictícios.

## Pontos para ET-15

O contrato já possui `project_id`, `id` da modalidade e `one_time_price` selecionado. A ET-15 deve validar o valor no backend, criar a Order do Mercado Pago, manter tokens fora do React/Vite e implementar webhook, confirmação e liberação somente no backend. Esta etapa não cria cobranças nem URLs de pagamento.
