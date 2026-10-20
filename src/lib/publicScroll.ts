export type NavigationType = 'POP' | 'PUSH' | 'REPLACE'

export function shouldResetPublicScroll(pathname: string, navigationType: NavigationType, isInitial: boolean) {
  return !pathname.startsWith('/admin') && (isInitial || navigationType !== 'POP')
}
