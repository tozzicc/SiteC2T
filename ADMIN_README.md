# Painel administrativo C2T

Esta documentação descreve a configuração da fundação do painel administrativo em `/admin`. A implementação usa Supabase Auth para autenticação e uma tabela de autorização separada; nenhum CRUD, Storage ou módulo comercial foi implementado nesta etapa.

## 1. Criar o projeto Supabase

1. Crie um projeto no painel do Supabase.
2. Em **Project Settings > API**, copie a **Project URL** e a chave pública **anon**.
3. Não use nem armazene `service_role`, chaves secretas ou credenciais administrativas no frontend.

Crie `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://vppzptwrddhxnxidsoho.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publishable-publica
# Opcional e legado: usado somente se a chave publishable estiver vazia
VITE_SUPABASE_ANON_KEY=
```

Sem uma URL e uma chave pública válidas, o site público continua funcionando e o painel informa que o Supabase não está configurado.

A aplicação prioriza `VITE_SUPABASE_PUBLISHABLE_KEY` e usa `VITE_SUPABASE_ANON_KEY` apenas como compatibilidade legada. Preencha a chave pública manualmente; não invente chaves e nunca use `service_role` ou uma secret key no frontend.

Após alterar `.env.local`, reinicie o servidor Vite. Esta configuração local não executa migrations, cria administradores nem inicia a ET-07.

## 2. Criar a tabela de autorização

No **SQL Editor** do Supabase, execute manualmente o conteúdo de:

```text
supabase/migrations/202610120001_create_admin_users.sql
```

A migration cria `public.admin_users`, ativa RLS e permite que cada usuário autenticado leia somente o próprio registro. Não existe cadastro público nem política de escrita para o frontend.

## 3. Criar e autorizar o primeiro administrador

1. Em **Authentication > Users**, crie um usuário com e-mail e senha.
2. Copie o UUID desse usuário.
3. No SQL Editor, execute, substituindo o UUID:

```sql
insert into public.admin_users (user_id)
values ('UUID_DO_USUARIO_CRIADO_NO_AUTH');
```

O provisionamento é manual e deve ser realizado por um operador autorizado. Não inclua senha, chave secreta, e-mail real ou UUID sensível no repositório.

## 4. Executar e acessar

```bash
npm install
npm run dev
```

Acesse `/admin/login`, informe as credenciais do usuário previamente autorizado e, após o login, o painel fica disponível em `/admin`.

O logout invalida a sessão pelo Supabase. Não há cadastro, recuperação de senha ou autenticação simulada.

## 5. Diagnóstico rápido

- **Supabase não configurado:** confirme se `.env.local` existe e se as duas variáveis estão preenchidas; reinicie o servidor Vite após alterá-las.
- **Usuário não autorizado:** o usuário existe no Auth, mas ainda não tem uma linha correspondente em `public.admin_users`.
- **Erro de permissão/RLS:** confirme que a migration foi executada integralmente e que o UUID inserido corresponde ao usuário do Auth.
- **Erro de rede:** verifique a URL do projeto, a chave `anon` e a disponibilidade do projeto Supabase.

Para validar uma instalação local:

```bash
npm run build
npm run lint
```

## ET-07 — gerenciamento administrativo de projetos

O módulo administrativo está disponível em `/admin/projetos` e usa a tabela `public.projects`, separada do catálogo público estático em `src/data/content.ts`. A migration `supabase/migrations/202610130001_create_projects.sql` deve ser revisada e executada manualmente no SQL Editor do Supabase; ela não é executada pela aplicação.

Enquanto a migration não estiver ativa, o painel informa que a tabela de projetos ainda não foi criada. Nenhum projeto público existente é migrado ou alterado nesta etapa.

## ET-08 — gerenciamento de imagens

O gerenciamento administrativo está disponível em `/admin/imagens` e também pelo detalhe de cada projeto. As migrations `supabase/migrations/202610130002_create_project_images_storage.sql` e `supabase/migrations/202610130003_create_project_images.sql` criam o bucket público `project-images`, a tabela `public.project_images` e suas policies. Elas devem ser revisadas e executadas manualmente no SQL Editor; a aplicação não executa migrations.

O bucket aceita somente JPEG, PNG e WebP de até 5 MB. Ele é público: qualquer arquivo enviado pode ser acessado por URL direta, independentemente do status do projeto; as policies RLS não impedem esse acesso direto. Envie somente imagens destinadas à divulgação pública. Upload, substituição e exclusão pela aplicação exigem um usuário presente em `public.admin_users`. Não armazene imagens confidenciais nesse bucket.

O fluxo envia o arquivo com um caminho UUID organizado por projeto, grava os metadados e remove o upload quando o INSERT falha. Na exclusão, o registro é removido antes do arquivo para evitar referências quebradas; se a remoção do Storage falhar, o painel informa a pendência. A substituição mantém o arquivo antigo até a nova imagem estar vinculada.

Para testar manualmente após executar as migrations: selecione um projeto em `/admin/imagens`, envie uma imagem válida, defina capa, altere alt text/ordem, substitua e remova a imagem. As galerias públicas existentes em `src/data/content.ts` não são migradas nesta etapa.

Imagens, Serviços, Contatos e Configurações permanecem como módulos futuros e desabilitados nesta etapa; Projetos está disponível em `/admin/projetos`.
## ET-09 — serviços, contatos e configurações

O módulo de serviços está disponível em `/admin/servicos`. A migration `supabase/migrations/202610130004_create_services.sql` deve ser revisada e executada manualmente no SQL Editor; a aplicação não executa migrations. O CRUD administrativo aceita os status `draft`, `published` e `archived`, preserva `published_at` ao despublicar e usa somente nomes de ícones Lucide previamente aprovados. A leitura pública, quando integrada em etapa futura, ficará restrita a serviços publicados; esta etapa não altera o catálogo público.

O módulo `/admin/configuracoes` grava a linha singleton `id = 1` de `public.site_settings`, criada pela migration `supabase/migrations/202610130005_create_site_settings.sql` com `C2T Tecnologia` e `Tecnologia que simplifica`. Campos opcionais vazios são enviados como `NULL`; e-mail, WhatsApp e links HTTPS são validados no painel. Não foram incluídos segredos, senhas, chaves privadas ou `service_role`.

O módulo `/admin/contatos` é somente informativo: exibe os canais configurados e direciona a edição para Configurações. Nenhum formulário público ou integração de mensagens foi criado nesta etapa. As policies RLS exigem um usuário presente em `public.admin_users` para operações administrativas; usuários anônimos podem somente ler os dados públicos previstos pelas migrations.

Após revisar e executar manualmente as migrations no Supabase, reinicie o Vite e valide o fluxo autenticado em `/admin/servicos`, `/admin/contatos` e `/admin/configuracoes`. A ET-10 permanece pendente.
