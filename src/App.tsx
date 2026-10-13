import { Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Hero } from './sections/Hero'
import { Solutions } from './sections/Solutions'
import { Projects } from './sections/Projects'
import { About } from './sections/About'
import { Contact } from './sections/Contact'
import { ProjectPage } from './pages/ProjectPage'
import { SolutionsPage } from './pages/SolutionsPage'
import { ContactPage } from './pages/ContactPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { WhatsAppButton } from './components/WhatsAppButton'
import { setPageSeo } from './utils/seo'
import { AuthProvider } from './admin/AuthContext'
import { AdminRoute } from './admin/AdminRoute'
import { AdminLoginPage } from './admin/AdminLoginPage'
import { AdminLayout } from './admin/AdminLayout'
import { AdminDashboard } from './admin/AdminDashboard'

function Home() { useEffect(() => setPageSeo('C2T Tecnologia | Soluções Digitais', 'C2T Tecnologia — Tecnologia que simplifica. Sistemas web, soluções empresariais, automação e consultoria em TI.')); return <><Header /><main><Hero /><Solutions /><Projects /><About /><Contact /></main><Footer /></> }
function NotFound() { return <><Header /><main className="not-found"><div className="container"><span className="eyebrow">404</span><h1>Página não encontrada.</h1><p>O endereço informado não existe.</p><a className="button button-primary" href="/#inicio">Voltar ao início</a></div></main><Footer /></> }
export default function App() { return <AuthProvider><Routes><Route path="/" element={<Home />} /><Route path="/solucoes" element={<><Header /><SolutionsPage /><Footer /></>} /><Route path="/contato" element={<><Header /><ContactPage /><Footer /></>} /><Route path="/privacidade" element={<><Header /><PrivacyPage /><Footer /></>} /><Route path="/projetos/:slug" element={<><Header /><ProjectPage /><Footer /></>} /><Route path="/admin/login" element={<AdminLoginPage />} /><Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}><Route index element={<AdminDashboard />} /><Route path="*" element={<AdminDashboard />} /></Route><Route path="*" element={<NotFound />} /></Routes><WhatsAppButton /></AuthProvider> }
