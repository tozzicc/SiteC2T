import { ArrowLeft, LockKeyhole, LogIn } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { AdminState } from './AdminRoute'

export function AdminLoginPage() {
  const { session, isAuthorized, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { if (!loading && session && isAuthorized) navigate('/admin', { replace: true }) }, [isAuthorized, loading, navigate, session])
  if (!isSupabaseConfigured) return <AdminState title="Painel não configurado" message="As credenciais públicas do Supabase ainda não foram configuradas neste ambiente." />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    if (!email.trim() || !password) { setError('Informe e-mail e senha.'); return }
    setSubmitting(true)
    const result = await signIn(email.trim(), password)
    setSubmitting(false)
    if (result.error) setError(result.error)
    else navigate((location.state as { from?: string } | null)?.from ?? '/admin', { replace: true })
  }

  return <main className="admin-login"><div className="admin-login-shell"><Link className="back-link" to="/"><ArrowLeft size={16} /> Voltar ao site</Link><div className="admin-login-card"><div className="admin-login-icon"><LockKeyhole size={23} /></div><span className="eyebrow">Área restrita</span><h1>Acesso administrativo</h1><p>Entre com uma conta autorizada pela C2T Tecnologia.</p><form onSubmit={handleSubmit} noValidate><label htmlFor="admin-email">E-mail</label><input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value.slice(0, 160))} autoComplete="username" required /><label htmlFor="admin-password">Senha</label><input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value.slice(0, 128))} autoComplete="current-password" required />{error && <p className="admin-form-error" role="alert">{error}</p>}<button className="button button-primary admin-submit" type="submit" disabled={submitting}>{submitting ? 'Verificando...' : 'Entrar'}<LogIn size={16} /></button></form></div></div></main>
}
