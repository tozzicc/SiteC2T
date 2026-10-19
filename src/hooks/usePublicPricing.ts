import { useEffect, useState } from 'react'
import { listPublicProjectPricing } from '../lib/projectPricing'
import type { ProjectPricing } from '../types/projectPricing'
export function usePublicPricing(projectId: string) { const [state, setState] = useState<{ items: ProjectPricing[]; loading: boolean; error: boolean }>({ items: [], loading: true, error: false }); useEffect(() => { let active = true; void listPublicProjectPricing(projectId).then((items) => { if (active) setState({ items, loading: false, error: false }) }).catch(() => { if (active) setState({ items: [], loading: false, error: true }) }); return () => { active = false } }, [projectId]); return state }
