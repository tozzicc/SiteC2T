# Painel administrativo C2T

Esta documentação descreve a configuração da fundação do painel administrativo em `/admin`. A implementação usa Supabase Auth para autenticação e uma tabela de autorização separada; nenhum CRUD, Storage ou módulo comercial foi implementado nesta etapa.

## 1. Criar o projeto Supabase

1. Crie um projeto no painel do Supabase.
2. Em **Project Settings > API**, copie a **Project URL** e a chave pública **anon**.
3. Não use nem armazene `service_role`, chaves secretas ou credenciais administrativas no frontend.

Crie `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

Sem essas duas variáveis, o site público continua funcionando e o painel informa que o Supabase não está configurado.

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

As áreas de Projetos, Imagens, Serviços, Contatos e Configurações aparecem como módulos futuros e permanecem desabilitadas nesta etapa.
