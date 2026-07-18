import { useReflections } from '@/lib/data/reflections'
import { formatDate, formatPercent } from '@/lib/format'
import { formatDelta } from '@/lib/reflection/snapshot'

/**
 * Calm archive feed of past reflections.
 */
export function ReflectionArchiveList() {
  const items = useReflections()

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#2A2A2A] bg-[#141414]/50 px-8 py-12 text-center">
        <p className="text-sm font-medium text-white">No reflections yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#555555]">
          When a week or month rolls over, Cron will invite you to archive it.
          Or use Reflect Now anytime.
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-[#2A2A2A] border-t border-[#2A2A2A]">
      {items.map((item) => (
        <li key={item.id} className="py-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#555555]">
                {item.periodKind === 'week' ? 'Week' : 'Month'}
                {' · '}
                {item.trigger}
              </p>
              <h3 className="mt-1 text-base font-medium text-white">
                {item.periodLabel}
              </h3>
            </div>
            <time
              dateTime={item.reflectedAt}
              className="text-xs tabular-nums text-[#555555]"
            >
              Archived {formatDate(item.reflectedAt)}
            </time>
          </div>

          <div className="mt-5 grid gap-6 sm:grid-cols-3">
            <AnswerBlock label="Went well" body={item.answers.wentWell} />
            <AnswerBlock label="Got stuck" body={item.answers.stuck} />
            <AnswerBlock
              label="#1 next"
              body={item.answers.priorityNext}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#555555]">
            <span>
              Apps{' '}
              <span className="tabular-nums text-[#888888]">
                {item.metrics.totalApplications}
              </span>
              {item.variance && item.variance.applicationsDelta !== 0 && (
                <span className="ml-1 tabular-nums">
                  ({formatDelta(item.variance.applicationsDelta)})
                </span>
              )}
            </span>
            <span>
              Response{' '}
              <span className="tabular-nums text-[#888888]">
                {formatPercent(item.metrics.responseRate)}
              </span>
            </span>
            <span>
              Goals{' '}
              <span className="tabular-nums text-[#888888]">
                {formatPercent(item.metrics.goalsOverallProgress)}
              </span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

function AnswerBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.1em] text-[#555555]">
        {label}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-[#888888]">
        {body || '—'}
      </p>
    </div>
  )
}
