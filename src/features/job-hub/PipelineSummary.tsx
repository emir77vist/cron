import { useMemo } from 'react'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'

interface PipelineCard {
  key: string
  label: string
  count: number
}

export function PipelineSummary() {
  const applications = useAppStore((s) => s.applications)

  const cards = useMemo((): PipelineCard[] => {
    const list = Object.values(applications)
    const count = (pred: (s: string) => boolean) =>
      list.filter((a) => pred(a.status)).length

    return [
      {
        key: 'applied',
        label: 'Applied',
        count: count((s) => s === 'applied' || s === 'screening'),
      },
      {
        key: 'interview',
        label: 'Interview',
        count: count((s) => s === 'interview'),
      },
      {
        key: 'offer',
        label: 'Offer',
        count: count((s) => s === 'offer' || s === 'accepted'),
      },
      {
        key: 'rejected',
        label: 'Rejected',
        count: count((s) => s === 'rejected'),
      },
    ]
  }, [applications])

  return (
    <section aria-label="Pipeline summary">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-medium tracking-tight text-white">
          Pipeline
        </h2>
        <span className="text-xs text-[#555555]">
          {Object.keys(applications).length} total
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.key}
            className={cn(
              'rounded-lg border border-[#2A2A2A] bg-[#141414] px-5 py-5',
              'transition-colors',
            )}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#555555]">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-white tabular-nums">
              {card.count}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
