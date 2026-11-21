import { useSyncExternalStore } from 'react'

const QUERY = '(min-width: 768px)'

const subscribe = (onChange: () => void) => {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/** True at the md breakpoint and up (768px), matching Tailwind's `md:`. False while server-rendering. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)
}
