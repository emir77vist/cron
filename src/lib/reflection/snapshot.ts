/**
 * Build metrics snapshots + variance for reflections.
 * All numbers originate from deriveMetrics (or prior archived snapshots).
 */

import type { AppMetrics } from '@/types'
import type {
  ReflectionArchive,
  ReflectionMetricsSnapshot,
  ReflectionVariance,
} from '@/types'

export function snapshotFromMetrics(metrics: AppMetrics): ReflectionMetricsSnapshot {
  return {
    totalApplications: metrics.totalApplications,
    applicationsThisWeek: metrics.applicationsThisWeek,
    applicationsToday: metrics.applicationsToday,
    responseRate: metrics.responseRate,
    offerRate: metrics.offerRate,
    activeApplications: metrics.activeApplications,
    interviewsOpen: metrics.interviewsOpen,
    offersOpen: metrics.offersOpen,
    savedBacklog: metrics.savedBacklog,
    goalsOverallProgress: metrics.goals.overallProgress,
    goalsTotal: metrics.goals.totalGoals,
    goalsCompleted: metrics.goals.completedGoals,
    tasksTotal: metrics.goals.totalTasks,
    tasksCompleted: metrics.goals.completedTasks,
    focusWeekActivity: metrics.focusWeek.activityCount,
    focusWeekAdded: metrics.focusWeek.applicationsAdded,
    capturedAt: metrics.updatedAt,
  }
}

export function computeVariance(
  current: ReflectionMetricsSnapshot,
  previous: ReflectionMetricsSnapshot | null | undefined,
): ReflectionVariance | null {
  if (!previous) return null
  return {
    applicationsDelta: current.totalApplications - previous.totalApplications,
    applicationsThisWeekDelta:
      current.applicationsThisWeek - previous.applicationsThisWeek,
    responseRateDelta: current.responseRate - previous.responseRate,
    activeApplicationsDelta:
      current.activeApplications - previous.activeApplications,
    interviewsOpenDelta: current.interviewsOpen - previous.interviewsOpen,
    goalsProgressDelta:
      current.goalsOverallProgress - previous.goalsOverallProgress,
    tasksCompletedDelta: current.tasksCompleted - previous.tasksCompleted,
  }
}

/** Previous archive of same period kind, excluding current key. */
export function findPreviousArchive(
  archives: ReflectionArchive[],
  kind: ReflectionArchive['periodKind'],
  beforeKey?: string,
): ReflectionArchive | null {
  const list = archives
    .filter((a) => a.periodKind === kind)
    .filter((a) => (beforeKey ? a.periodKey !== beforeKey : true))
    .sort((a, b) => b.reflectedAt.localeCompare(a.reflectedAt))
  return list[0] ?? null
}

/** Format signed delta for display */
export function formatDelta(n: number, opts?: { percent?: boolean }): string {
  if (!Number.isFinite(n) || n === 0) return '0'
  if (opts?.percent) {
    const pct = Math.round(n * 100)
    if (pct === 0) return '0%'
    return pct > 0 ? `+${pct}%` : `${pct}%`
  }
  return n > 0 ? `+${n}` : String(n)
}
