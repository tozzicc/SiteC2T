# ET-10 — integração pública com Supabase

## Estratégia

- `src/lib/publicCatalog.ts` é a camada pública de leitura. Ela usa somente o cliente publishable/anon do Supabase e consulta `projects`/`services` com `status = published`.
- O catálogo estático continua sendo o fallback quando o Supabase não está configurado, indisponível ou retorna erro.
- A mesclagem é feita por `slug`: um registro publicado do Supabase substitui o item estático; registros novos são acrescentados; não há duplicação.
- `projectMigrationMode` e `serviceMigrationMode` são os switches explícitos da migração gradual. Enquanto um slug está em `static`, sua versão local continua visível. Ao mudar para `supabase`, a versão local só aparece se houver registro publicado correspondente. Isso evita tentar consultar drafts/archived, que são ocultados pela RLS.
- Imagens públicas são lidas por `project_images` apenas para projetos publicados e convertidas para URLs públicas do bucket `project-images`. Se não houver imagem válida, a interface preserva a imagem estática ou mostra o estado vazio.
- `src/lib/publicSettings.ts` lê somente campos institucionais públicos de `site_settings`, valida e-mails, números WhatsApp e URLs HTTPS e usa `src/config/site.ts` como fallback.

## Páginas integradas

- Home: projetos em destaque, soluções e canais de contato.
- `/projetos/:slug`: dados e galeria do projeto.
- `/solucoes`: serviços publicados e projetos relacionados.
- `/contato`: endpoint HTTPS, WhatsApp, e-mail e LinkedIn públicos.

## Pendências e validação manual

As migrations e policies não foram alteradas nem executadas. Elas precisam estar aplicadas no projeto Supabase para a leitura pública funcionar; em especial, valide as policies de leitura pública de `projects`, `project_images`, `services` e `site_settings`, e confirme que o bucket `project-images` está público para as URLs geradas.

Para validar no navegador:

1. Execute `npm run dev` e abra `/`, `/solucoes`, `/projetos/chamado-ti` e `/contato`.
2. Publique um projeto/serviço no painel administrativo e confirme que o item aparece no site sem login.
3. Teste um slug em draft/archived enquanto o switch correspondente estiver em `supabase`; ele não deve aparecer.
4. Desligue temporariamente o Supabase e confirme o fallback estático e os estados de carregamento/indisponibilidade.
