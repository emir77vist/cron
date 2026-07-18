import { PageHeader } from '@/components/shared/PageHeader'
import { useMetrics } from '@/hooks/use-metrics'
import { KpiRow } from '@/features/dashboard/KpiRow'
import { FocusMetrics } from '@/features/dashboard/FocusMetrics'
import { PipelineFunnel } from '@/features/dashboard/PipelineFunnel'
import { Priorities } from '@/features/dashboard/Priorities'
import { RecentActivity } from '@/features/dashboard/RecentActivity'
import { ReflectNowButton } from '@/features/reflection'
import { useReflections } from '@/lib/data/reflections'
import { formatDate } from '@/lib/format'
import { useAppStore } from '@/stores/app-store'

export function DashboardPage() {
  const metrics = useMetrics()
  const reflections = useReflections()
  const latest = reflections[0]
  const setActiveRoute = useAppStore((s) => s.setActiveRoute)

  return (
    <div className="page-shell">
      <PageHeader
        title="Dashboard"
        description="A calm read on your search — only what matters right now."
        actions={<ReflectNowButton />}
      />

      <div className="mt-16 space-y-20 sm:mt-20 sm:space-y-24">
        <KpiRow metrics={metrics} />

        <FocusMetrics metrics={metrics} />

        <div className="grid gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <PipelineFunnel metrics={metrics} />
          <RecentActivity metrics={metrics} />
        </div>

        <Priorities metrics={metrics} />

        {latest && (
          <section aria-label="Latest reflection" className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-sm font-medium tracking-tight text-white">
                Last reflection
              </h2>
              <button
                type="button"
                onClick={() => setActiveRoute('notes')}
                className="text-xs text-[#555555] transition-colors hover:text-[#888888]"
              >
                View archive
              </button>
            </div>
            <div className="border-t border-[#2A2A2A] pt-6">
              <p className="text-xs text-[#555555]">
                {latest.periodLabel}
                {' · '}
                {formatDate(latest.reflectedAt)}
              </p>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#888888]">
                {latest.answers.priorityNext ||
                  latest.answers.wentWell ||
                  'Archived without free-text priority.'}
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
