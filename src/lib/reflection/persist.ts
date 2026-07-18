/**
 * Persist reflection meta + archives so rollover detection survives reloads.
 */

import type { EntityId, ReflectionArchive } from '@/types'

const STORAGE_KEY = 'cron.reflections.v1'

export interface ReflectionPersistBlob {
  lastReflectedWeekKey: string | null
  lastReflectedMonthKey: string | null
  lastSeenWeekKey: string | null
  reflectionSoftDismissed: string[]
  reflections: Record<EntityId, ReflectionArchive>
}

export function loadReflectionPersist(): ReflectionPersistBlob | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ReflectionPersistBlob>
    if (!parsed || typeof parsed !== 'object') return null
    return {
      lastReflectedWeekKey: parsed.lastReflectedWeekKey ?? null,
      lastReflectedMonthKey: parsed.lastReflectedMonthKey ?? null,
      lastSeenWeekKey: parsed.lastSeenWeekKey ?? null,
      reflectionSoftDismissed: Array.isArray(parsed.reflectionSoftDismissed)
        ? parsed.reflectionSoftDismissed
        : [],
      reflections: parsed.reflections ?? {},
    }
  } catch {
    return null
  }
}

export function saveReflectionPersist(blob: ReflectionPersistBlob): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blob))
  } catch {
    // quota / private mode — ignore
  }
}
