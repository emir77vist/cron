import type { AppMetrics } from '@/types'
import { formatPercent } from '@/lib/format'

export function PipelineFunnel({ metrics }: { metrics: AppMetrics }) {
  const stages = metrics.funnel
  const max = Math.max(1, ...stages.map((s) => s.count))
  const total = metrics.totalApplications

  return (
    <section aria-label="Pipeline funnel" className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-medium tracking-tight text-white">
          Pipeline
        </h2>
        <p className="text-xs tabular-nums text-[#555555]">
          {total} total
          {metrics.totalApplications > 0 && metrics.offerRate > 0 && (
            <>
              {' · '}
              {formatPercent(metrics.offerRate)} offer
            </>
          )}
        </p>
      </div>

      <div className="space-y-6">
        {stages.map((stage) => {
          const widthPct = total === 0 ? 0 : (stage.count / max) * 100
          return (
            <div
              key={stage.key}
              className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-4 sm:grid-cols-[6.5rem_1fr_2.5rem]"
            >
              <span className="text-sm text-[#888888]">{stage.label}</span>
              <div className="relative h-[3px] w-full rounded-full bg-[#2A2A2A]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-300 ease-out"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="text-right text-sm font-medium tabular-nums text-white">
                {stage.count}
              </span>
            </div>
          )
        })}
      </div>

      {total === 0 && (
        <p className="text-sm text-[#555555]">
          Add roles in Job Hub — the funnel fills from real applications.
        </p>
      )}
    </section>
  )
}
