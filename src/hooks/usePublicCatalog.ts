import { useEffect, useState } from 'react'
import { loadPublicProjects, loadPublicServices, type PublicProject, type PublicService } from '../lib/publicCatalog'
import { loadPublicSettings, type PublicSettings } from '../lib/publicSettings'

export function usePublicProjects() {
  const [state, setState] = useState<{ items: PublicProject[]; loading: boolean; degraded: boolean }>({ items: [], loading: true, degraded: false })
  useEffect(() => { let active = true; void loadPublicProjects().then((result) => { if (active) setState({ ...result, loading: false }) }); return () => { active = false } }, [])
  return state
}

export function usePublicServices() {
  const [state, setState] = useState<{ items: PublicService[]; loading: boolean; degraded: boolean }>({ items: [], loading: true, degraded: false })
  useEffect(() => { let active = true; void loadPublicServices().then((result) => { if (active) setState({ ...result, loading: false }) }); return () => { active = false } }, [])
  return state
}

export function usePublicSettings() {
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  useEffect(() => { let active = true; void loadPublicSettings().then((result) => { if (active) setSettings(result) }); return () => { active = false } }, [])
  return settings
}
