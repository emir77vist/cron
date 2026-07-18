import { useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { deriveMetrics } from '@/lib/metrics/deriveMetrics'
import type { AppMetrics } from '@/types'

/**
 * Reactive metrics: re-derives whenever entities change.
 * Dashboard and other views must use this (or getMetrics) — never hardcode numbers.
 */
export function useMetrics(): AppMetrics {
  const companies = useAppStore((s) => s.companies)
  const jobs = useAppStore((s) => s.jobs)
  const applications = useAppStore((s) => s.applications)
  const notes = useAppStore((s) => s.notes)
  const goals = useAppStore((s) => s.goals)
  const goalTasks = useAppStore((s) => s.goalTasks)

  return useMemo(
    () =>
      deriveMetrics({
        companies: Object.values(companies),
        jobs: Object.values(jobs),
        applications: Object.values(applications),
        notes: Object.values(notes),
        goals: Object.values(goals),
        goalTasks: Object.values(goalTasks),
      }),
    [companies, jobs, applications, notes, goals, goalTasks],
  )
}
