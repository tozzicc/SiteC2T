import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { shouldResetPublicScroll } from '../lib/publicScroll'

function scrollToRouteStart(hash: string) {
  if (hash) {
    const id = decodeURIComponent(hash.slice(1))
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView()
      return
    }
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
}

export function PublicScrollRestoration() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()
  const isInitial = useRef(true)

  useEffect(() => {
    const resetScroll = shouldResetPublicScroll(pathname, navigationType, isInitial.current)
    isInitial.current = false
    if (resetScroll) scrollToRouteStart(hash)
  }, [hash, navigationType, pathname])

  return null
}
