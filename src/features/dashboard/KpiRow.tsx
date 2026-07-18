import { formatKpiNumber, formatPercent } from '@/lib/format'
import type { AppMetrics } from '@/types'

interface Kpi {
  label: string
  value: string
  hint?: string
}

export function KpiRow({ metrics }: { metrics: AppMetrics }) {
  const kpis: Kpi[] = [
    {
      label: 'Applications this week',
      value: formatKpiNumber(metrics.applicationsThisWeek),
      hint:
        metrics.applicationsToday > 0
          ? `${metrics.applicationsToday} today`
          : 'Since Monday',
    },
    {
      label: 'Response rate',
      value: formatPercent(metrics.responseRate),
      hint:
        metrics.totalApplications > 0
          ? `${metrics.activeApplications} active`
          : 'No applications yet',
    },
    {
      label: 'Open interviews',
      value: formatKpiNumber(metrics.interviewsOpen),
      hint:
        metrics.offersOpen > 0
          ? `${metrics.offersOpen} offer${metrics.offersOpen === 1 ? '' : 's'}`
          : 'Screening + interview',
    },
    {
      label: 'Goals progress',
      value: formatPercent(metrics.goals.overallProgress),
      hint:
        metrics.goals.totalGoals > 0
          ? `${metrics.goals.completedGoals}/${metrics.goals.totalGoals} done`
          : 'No goals yet',
    },
  ]

  return (
    <section aria-label="Key metrics">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#2A2A2A] lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="flex flex-col justify-between bg-[#0A0A0A] px-6 py-9 sm:px-8 sm:py-11"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#555555]">
              {kpi.label}
            </p>
            <p className="mt-8 text-4xl font-semibold tracking-tight text-white tabular-nums sm:text-5xl">
              {kpi.value}
            </p>
            {kpi.hint && (
              <p className="mt-3 text-xs text-[#555555]">{kpi.hint}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
