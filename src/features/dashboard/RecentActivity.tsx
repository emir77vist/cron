import type { AppMetrics } from '@/types'
import { formatRelative } from '@/lib/format'
import { useAppStore } from '@/stores/app-store'

export function RecentActivity({ metrics }: { metrics: AppMetrics }) {
  const setActiveRoute = useAppStore((s) => s.setActiveRoute)
  const items = metrics.recentActivity

  return (
    <section aria-label="Recent activity" className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-medium tracking-tight text-white">
          Recent
        </h2>
        <p className="text-xs text-[#555555]">Latest movement</p>
      </div>

      {items.length === 0 ? (
        <div className="border-t border-[#2A2A2A] pt-8">
          <p className="text-sm text-[#555555]">
            Activity appears as you add and update applications.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#2A2A2A] border-t border-[#2A2A2A]">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  if (item.kind === 'application') setActiveRoute('jobs')
                }}
                className="flex w-full items-baseline justify-between gap-6 py-4 text-left transition-colors hover:bg-white/[0.02]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {item.label}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-[#555555]">
                    {item.detail}
                  </p>
                </div>
                <time
                  dateTime={item.at}
                  className="shrink-0 text-xs tabular-nums text-[#555555]"
                >
                  {formatRelative(item.at)}
                </time>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
