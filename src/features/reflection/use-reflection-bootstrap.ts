import { useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import { checkAutoReflection } from '@/lib/data/reflections'

/**
 * Hydrate persisted reflection state, then auto-open on week/month rollover.
 */
export function useReflectionBootstrap() {
  const hydrate = useAppStore((s) => s.hydrateReflections)

  useEffect(() => {
    hydrate()
    // Defer auto-check so hydrate state is applied
    const t = window.setTimeout(() => {
      checkAutoReflection()
    }, 80)
    return () => window.clearTimeout(t)
  }, [hydrate])
}
