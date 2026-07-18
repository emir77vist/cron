/**
 * Reflection data-access: open sessions, commit archives, read history.
 */

import { createId } from '@/lib/id'
import { getMetrics } from '@/lib/data/index'
import {
  detectAutoReflectionTarget,
  getCurrentISOWeekPeriod,
  getCurrentMonthPeriod,
  getISOWeekKey,
  getPreviousISOWeekPeriod,
  getPreviousMonthPeriod,
  periodToSessionFields,
  type PeriodInfo,
} from '@/lib/reflection/periods'
import {
  computeVariance,
  findPreviousArchive,
  snapshotFromMetrics,
} from '@/lib/reflection/snapshot'
import { useAppStore } from '@/stores/app-store'
import type {
  ReflectionAnswers,
  ReflectionArchive,
  ReflectionPeriodKind,
} from '@/types'

export function getReflections(): ReflectionArchive[] {
  return Object.values(useAppStore.getState().reflections).sort((a, b) =>
    b.reflectedAt.localeCompare(a.reflectedAt),
  )
}

export function useReflections(): ReflectionArchive[] {
  const reflections = useAppStore((s) => s.reflections)
  return Object.values(reflections).sort((a, b) =>
    b.reflectedAt.localeCompare(a.reflectedAt),
  )
}

/**
 * Call once on app mount after hydrate.
 * Auto-prompt only when ISO week has rolled over since last visit — never every session.
 */
export function checkAutoReflection(): void {
  const state = useAppStore.getState()
  if (state.reflectionSession?.open) return

  const currentWeekKey = getISOWeekKey()

  // First visit: seed lastSeenWeekKey only — no prompt
  if (!state.lastSeenWeekKey) {
    state.setLastSeenWeekKey(currentWeekKey)
    return
  }

  const result = detectAutoReflectionTarget({
    lastReflectedWeekKey: state.lastReflectedWeekKey,
    lastSeenWeekKey: state.lastSeenWeekKey,
    softDismissed: state.reflectionSoftDismissed,
  })

  // Always advance lastSeen to current week after check
  // (so we only fire once per week change)
  if (state.lastSeenWeekKey !== currentWeekKey) {
    state.setLastSeenWeekKey(currentWeekKey)
  }

  if (!result) return

  const already = Object.values(state.reflections).some(
    (r) => r.periodKey === result.period.key,
  )
  if (already) {
    if (state.lastReflectedWeekKey !== result.period.key) {
      useAppStore.setState({ lastReflectedWeekKey: result.period.key })
    }
    return
  }

  state.openReflection({
    ...periodToSessionFields(result.period),
    trigger: 'auto',
  })
}

export function startManualReflection(
  kind: ReflectionPeriodKind = 'week',
  opts?: { usePrevious?: boolean },
): void {
  const usePrevious = opts?.usePrevious ?? false
  let period: PeriodInfo
  if (kind === 'week') {
    period = usePrevious
      ? getPreviousISOWeekPeriod()
      : getCurrentISOWeekPeriod()
  } else {
    period = usePrevious
      ? getPreviousMonthPeriod()
      : getCurrentMonthPeriod()
  }

  useAppStore.getState().openReflection({
    ...periodToSessionFields(period),
    trigger: 'manual',
  })
}

export function getLiveSnapshot() {
  return snapshotFromMetrics(getMetrics())
}

export function getVarianceForSession(periodKind: ReflectionPeriodKind) {
  const snapshot = getLiveSnapshot()
  const archives = getReflections()
  const prev = findPreviousArchive(archives, periodKind)
  return {
    snapshot,
    variance: computeVariance(snapshot, prev?.metrics),
    previous: prev,
  }
}

export function submitReflection(answers: ReflectionAnswers): ReflectionArchive {
  const state = useAppStore.getState()
  const session = state.reflectionSession
  if (!session?.open) {
    throw new Error('No open reflection session')
  }

  const metrics = getLiveSnapshot()
  const prev = findPreviousArchive(
    getReflections(),
    session.periodKind,
    session.periodKey,
  )
  const variance = computeVariance(metrics, prev?.metrics)

  const archive: ReflectionArchive = {
    id: createId('ref'),
    periodKind: session.periodKind,
    periodKey: session.periodKey,
    periodLabel: session.periodLabel,
    periodStart: session.periodStart,
    periodEnd: session.periodEnd,
    reflectedAt: new Date().toISOString(),
    trigger: session.trigger,
    answers: {
      wentWell: answers.wentWell.trim(),
      stuck: answers.stuck.trim(),
      priorityNext: answers.priorityNext.trim(),
    },
    metrics,
    variance,
  }

  state.commitReflectionArchive(archive)
  return archive
}

export function softDismissReflection(): void {
  useAppStore.getState().softDismissReflection()
}

export function closeReflection(): void {
  useAppStore.getState().closeReflection()
}
