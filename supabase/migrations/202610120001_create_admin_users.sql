-- ET-06: vínculo explícito entre usuários do Supabase Auth e administradores.
-- Execute no SQL Editor do Supabase somente após criar o usuário no Auth.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.admin_users enable row level security;

drop policy if exists "Admins can read their own admin record" on public.admin_users;
create policy "Admins can read their own admin record"
  on public.admin_users
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke insert, update, delete on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;
