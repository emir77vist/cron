import { formatPercent } from '@/lib/format'
import { formatDelta } from '@/lib/reflection/snapshot'
import type { ReflectionMetricsSnapshot, ReflectionVariance } from '@/types'
import { cn } from '@/lib/utils'

interface VariancePinProps {
  snapshot: ReflectionMetricsSnapshot
  variance: ReflectionVariance | null
}

interface PinRow {
  label: string
  value: string
  delta?: string
  /** Math.sign of delta: -1 | 0 | 1 */
  deltaSign?: number | null
}

/**
 * Real numbers from deriveMetrics (via snapshot), with period-over-period variance.
 * Pinned beside reflection questions.
 */
export function VariancePin({ snapshot, variance }: VariancePinProps) {
  const rows: PinRow[] = [
    {
      label: 'Applications',
      value: String(snapshot.totalApplications),
      delta: variance
        ? formatDelta(variance.applicationsDelta)
        : undefined,
      deltaSign: variance ? Math.sign(variance.applicationsDelta) : null,
    },
    {
      label: 'This week',
      value: String(snapshot.applicationsThisWeek),
      delta: variance
        ? formatDelta(variance.applicationsThisWeekDelta)
        : undefined,
      deltaSign: variance
        ? Math.sign(variance.applicationsThisWeekDelta)
        : null,
    },
    {
      label: 'Response rate',
      value: formatPercent(snapshot.responseRate),
      delta: variance
        ? formatDelta(variance.responseRateDelta, { percent: true })
        : undefined,
      deltaSign: variance ? Math.sign(variance.responseRateDelta) : null,
    },
    {
      label: 'Active',
      value: String(snapshot.activeApplications),
      delta: variance
        ? formatDelta(variance.activeApplicationsDelta)
        : undefined,
      deltaSign: variance
        ? Math.sign(variance.activeApplicationsDelta)
        : null,
    },
    {
      label: 'Interviews',
      value: String(snapshot.interviewsOpen),
      delta: variance
        ? formatDelta(variance.interviewsOpenDelta)
        : undefined,
      deltaSign: variance ? Math.sign(variance.interviewsOpenDelta) : null,
    },
    {
      label: 'Goals',
      value: formatPercent(snapshot.goalsOverallProgress),
      delta: variance
        ? formatDelta(variance.goalsProgressDelta, { percent: true })
        : undefined,
      deltaSign: variance ? Math.sign(variance.goalsProgressDelta) : null,
    },
    {
      label: 'Tasks done',
      value: `${snapshot.tasksCompleted}/${snapshot.tasksTotal}`,
      delta: variance
        ? formatDelta(variance.tasksCompletedDelta)
        : undefined,
      deltaSign: variance ? Math.sign(variance.tasksCompletedDelta) : null,
    },
    {
      label: 'Week activity',
      value: String(snapshot.focusWeekActivity),
    },
  ]

  return (
    <aside
      aria-label="Period metrics"
      className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] p-5 sm:p-6"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#555555]">
        From your data
      </p>
      <p className="mt-1 text-xs text-[#555555]">
        {variance
          ? 'Variance vs last archive'
          : 'No prior archive — baseline only'}
      </p>

      <ul className="mt-6 space-y-4">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-baseline justify-between gap-4 border-b border-[#2A2A2A] pb-3 last:border-0 last:pb-0"
          >
            <span className="text-xs text-[#888888]">{row.label}</span>
            <span className="flex items-baseline gap-2">
              {row.delta != null && row.delta !== '0' && row.delta !== '0%' && (
                <span
                  className={cn(
                    'text-[11px] tabular-nums',
                    row.deltaSign === 1 && 'text-white',
                    row.deltaSign === -1 && 'text-[#555555]',
                    (row.deltaSign === 0 || row.deltaSign == null) &&
                      'text-[#555555]',
                  )}
                >
                  {row.delta}
                </span>
              )}
              <span className="text-sm font-medium tabular-nums text-white">
                {row.value}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
