import { BarChart3, ChevronLeft, FolderKanban, Image, LayoutDashboard, LogOut, Mail, Menu, Settings, Wrench, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useAuth } from './AuthContext'

const futureItems: Array<{ label: string; icon: typeof FolderKanban }> = []

export function AdminLayout() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  async function logout() { const result = await signOut(); if (!result.error) navigate('/admin/login', { replace: true }) }
  return <div className="admin-shell"><aside className={open ? 'admin-sidebar open' : 'admin-sidebar'}><div className="admin-sidebar-top"><Logo /><button className="admin-close" type="button" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={19} /></button></div><nav className="admin-nav" aria-label="Navegação administrativa"><NavLink className={({ isActive }) => isActive ? 'admin-nav-active' : ''} to="/admin" end onClick={() => setOpen(false)}><LayoutDashboard size={17} />Dashboard</NavLink><NavLink className={({ isActive }) => isActive ? 'admin-nav-active' : ''} to="/admin/projetos" onClick={() => setOpen(false)}><FolderKanban size={17} />Projetos</NavLink><NavLink className={({ isActive }) => isActive ? 'admin-nav-active' : ''} to="/admin/imagens" onClick={() => setOpen(false)}><Image size={17} />Imagens</NavLink><NavLink className={({ isActive }) => isActive ? 'admin-nav-active' : ''} to="/admin/servicos" onClick={() => setOpen(false)}><Wrench size={17} />Serviços</NavLink><NavLink className={({ isActive }) => isActive ? 'admin-nav-active' : ''} to="/admin/contatos" onClick={() => setOpen(false)}><Mail size={17} />Contatos</NavLink><NavLink className={({ isActive }) => isActive ? 'admin-nav-active' : ''} to="/admin/configuracoes" onClick={() => setOpen(false)}><Settings size={17} />Configurações</NavLink>{futureItems.map(({ label, icon: Icon }) => <span className="admin-nav-disabled" key={label} aria-disabled="true"><Icon size={17} />{label}<small>Futuro</small></span>)}</nav><div className="admin-sidebar-bottom"><Link to="/"><ChevronLeft size={16} />Site público</Link><button type="button" onClick={logout}><LogOut size={16} />Sair</button></div></aside><div className="admin-main"><header className="admin-header"><button className="admin-menu" type="button" onClick={() => setOpen(true)} aria-label="Abrir menu administrativo"><Menu size={21} /></button><div className="admin-header-title"><BarChart3 size={17} />Painel administrativo</div><div className="admin-user"><span>{user?.email ?? 'Administrador'}</span><button type="button" onClick={logout} aria-label="Sair"><LogOut size={17} /></button></div></header><div className="admin-content"><Outlet /></div></div></div>
}
