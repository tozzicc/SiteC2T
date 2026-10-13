import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { loading, session, isAuthorized, error } = useAuth()
  const location = useLocation()
  if (!isSupabaseConfigured) return <AdminState title="Painel não configurado" message="Configure as variáveis do Supabase para habilitar o acesso administrativo." />
  if (loading) return <AdminState title="Verificando acesso" message="Aguarde enquanto validamos sua sessão administrativa." loading />
  if (error && !session) return <AdminState title="Não foi possível verificar o acesso" message={error} />
  if (!session || !isAuthorized) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

export function AdminState({ title, message, loading = false }: { title: string; message: string; loading?: boolean }) {
  return <main className="admin-state"><div className="admin-state-card">{loading && <span className="admin-spinner" aria-hidden="true" />}<span className="eyebrow">C2T / Administração</span><h1>{title}</h1><p>{message}</p><a className="button button-ghost" href="/">Voltar ao site</a></div></main>
}
