import { CheckCircle2, CircleDashed, FolderKanban, Image, Mail, Settings, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { siteConfig } from '../config/site'
import { isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'

const modules = [{ label: 'Projetos', icon: FolderKanban }, { label: 'Imagens', icon: Image }, { label: 'Serviços', icon: Wrench }, { label: 'Contatos', icon: Mail }, { label: 'Configurações', icon: Settings }]

export function AdminDashboard() {
  const { user } = useAuth()
  return <section className="admin-dashboard"><div className="admin-welcome"><div><span className="eyebrow">Dashboard</span><h1>Olá, administrador.</h1><p>Esta é a fundação do painel da {siteConfig.name}. Os módulos administrativos serão habilitados em etapas futuras.</p></div><Link className="button button-ghost" to="/"><span>Ver site público</span></Link></div><div className="admin-status-grid"><article className="admin-status-card"><div className="admin-card-icon connected"><CheckCircle2 size={20} /></div><div><span>Conexão Supabase</span><strong>{isSupabaseConfigured ? 'Configurada' : 'Não configurada'}</strong><small>{isSupabaseConfigured ? 'Cliente público carregado' : 'Defina as variáveis de ambiente'}</small></div></article><article className="admin-status-card"><div className="admin-card-icon"><CircleDashed size={20} /></div><div><span>Sessão atual</span><strong>Autorizada</strong><small>{user?.email ?? 'E-mail não disponível'}</small></div></article></div><div className="admin-session"><span className="eyebrow">Sessão autenticada</span><h2>Informações básicas</h2><dl><div><dt>E-mail</dt><dd>{user?.email ?? 'Não disponível'}</dd></div><div><dt>ID do usuário</dt><dd>{user?.id ?? 'Não disponível'}</dd></div></dl></div><div className="admin-future"><div className="admin-future-heading"><div><span className="eyebrow">Próximas áreas</span><h2>Módulos preparados para expansão.</h2></div><span className="admin-readonly">Somente leitura</span></div><div className="admin-module-grid">{modules.map(({ label, icon: Icon }) => <div className="admin-module-card" key={label}><Icon size={19} /><span>{label}</span><small>Disponível em etapa futura</small></div>)}</div></div></section>
}
