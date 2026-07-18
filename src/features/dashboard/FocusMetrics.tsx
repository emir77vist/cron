import { formatKpiNumber } from '@/lib/format'
import type { AppMetrics, FocusWindow } from '@/types'

export function FocusMetrics({ metrics }: { metrics: AppMetrics }) {
  return (
    <section aria-label="Focus" className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-medium tracking-tight text-white">Focus</h2>
        <p className="text-xs text-[#555555]">Activity derived from your pipeline</p>
      </div>

      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <FocusBlock title="Today" window={metrics.focusToday} />
        <FocusBlock title="This week" window={metrics.focusWeek} />
      </div>
    </section>
  )
}

function FocusBlock({
  title,
  window,
}: {
  title: string
  window: FocusWindow
}) {
  const rows = [
    { label: 'Added', value: window.applicationsAdded },
    { label: 'Touched', value: window.activityCount },
    { label: 'Interviews', value: window.interviewsTouched },
  ]

  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#555555]">
        {title}
      </p>
      <div className="mt-6 flex items-end gap-10 sm:gap-14">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="text-3xl font-semibold tracking-tight text-white tabular-nums sm:text-4xl">
              {formatKpiNumber(row.value)}
            </p>
            <p className="mt-2 text-xs text-[#888888]">{row.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
