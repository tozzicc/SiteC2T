import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

type AuthContextValue = {
  session: Session | null
  user: User | null
  isAuthorized: boolean
  loading: boolean
  error: string
  signIn: (email: string, password: string) => Promise<{ error: string }>
  signOut: () => Promise<{ error: string }>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const genericError = 'Não foi possível concluir a operação. Tente novamente.'

async function checkAdmin(userId: string) {
  if (!supabase) return { authorized: false, error: 'O Supabase ainda não foi configurado.' }
  const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle()
  if (error) return { authorized: false, error: genericError }
  return { authorized: Boolean(data), error: data ? '' : 'Acesso não autorizado.' }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(() => isSupabaseConfigured && Boolean(supabase))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const client = supabase
    let active = true
    const applySession = async (nextSession: Session | null) => {
      if (!active) return
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      if (!nextSession?.user) { setIsAuthorized(false); setLoading(false); return }
      const result = await checkAdmin(nextSession.user.id)
      if (!active) return
      setIsAuthorized(result.authorized)
      setError(result.error)
      setLoading(false)
      if (!result.authorized && result.error === 'Acesso não autorizado.') await client.auth.signOut()
    }
    client.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) { setError(genericError); setLoading(false); return }
      void applySession(data.session)
    }).catch(() => { if (active) { setError(genericError); setLoading(false) } })
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => { void applySession(nextSession) })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    session, user, isAuthorized, loading, error,
    signIn: async (email, password) => {
      if (!supabase) return { error: 'O Supabase ainda não foi configurado.' }
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError || !data.user) return { error: genericError }
      const result = await checkAdmin(data.user.id)
      if (!result.authorized) { await supabase.auth.signOut(); return { error: result.error || genericError } }
      setSession(data.session); setUser(data.user); setIsAuthorized(true); setError('')
      return { error: '' }
    },
    signOut: async () => {
      if (!supabase) return { error: '' }
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) return { error: genericError }
      setSession(null); setUser(null); setIsAuthorized(false); setError('')
      return { error: '' }
    },
  }), [error, isAuthorized, loading, session, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
