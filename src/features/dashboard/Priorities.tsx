import type { AppMetrics, PriorityUrgency } from '@/types'
import { StatusBadge } from '@/features/job-hub/StatusBadge'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'

export function Priorities({ metrics }: { metrics: AppMetrics }) {
  const setActiveRoute = useAppStore((s) => s.setActiveRoute)
  const priorities = metrics.priorities

  return (
    <section aria-label="Priorities" className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-medium tracking-tight text-white">
          Priorities
        </h2>
        <button
          type="button"
          onClick={() => setActiveRoute('jobs')}
          className="text-xs text-[#555555] transition-colors hover:text-[#888888]"
        >
          Open Job Hub
        </button>
      </div>

      {priorities.length === 0 ? (
        <div className="border-t border-[#2A2A2A] pt-8">
          <p className="text-sm text-[#888888]">Nothing urgent.</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-[#555555]">
            When applications enter interview or pick up a next step, they surface
            here — like a quiet chief of staff.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#2A2A2A] border-t border-[#2A2A2A]">
          {priorities.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setActiveRoute('jobs')}
                className="group flex w-full items-start gap-4 py-5 text-left transition-colors hover:bg-white/[0.02]"
              >
                <span className="w-6 shrink-0 pt-0.5 text-sm tabular-nums text-[#555555]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-white group-hover:text-white">
                      {item.companyName}
                    </span>
                    <span className="text-[#555555]">·</span>
                    <span className="truncate text-sm text-[#888888]">
                      {item.title}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#555555]">
                    {item.reason}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusBadge status={item.status} />
                  <UrgencyDot urgency={item.urgency} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function UrgencyDot({ urgency }: { urgency: PriorityUrgency }) {
  return (
    <span
      className={cn(
        'text-[10px] uppercase tracking-[0.12em]',
        urgency === 'high' && 'text-white',
        urgency === 'medium' && 'text-[#888888]',
        urgency === 'low' && 'text-[#555555]',
      )}
    >
      {urgency}
    </span>
  )
}
