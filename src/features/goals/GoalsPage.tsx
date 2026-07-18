import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { CreateGoalDialog } from '@/features/goals/CreateGoalDialog'
import { GoalsTree } from '@/features/goals/GoalsTree'
import { ProgressBar } from '@/features/goals/ProgressBar'
import { useGoalsTree } from '@/lib/data/goals'
import { useMetrics } from '@/hooks/use-metrics'
import { HORIZON_LABELS, HORIZON_ORDER } from '@/lib/goals/horizons'
import { formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

export function GoalsPage() {
  const { roots, metrics: treeMetrics } = useGoalsTree()
  const metrics = useMetrics()
  // Prefer deriveMetrics overall (same pure path)
  const goalsM = metrics.goals
  const overall = goalsM.overallProgress

  const [dialog, setDialog] = useState<{
    open: boolean
    mode: 'goal' | 'task'
  }>({ open: false, mode: 'goal' })

  return (
    <div className="page-shell">
      <PageHeader
        title="Goals"
        description="Yearly to daily cascade. Child progress rolls up — link with the parent dropdown."
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialog({ open: true, mode: 'task' })}
              className="border-[#2A2A2A] bg-transparent text-[#888888] hover:bg-[#1A1A1A] hover:text-white"
            >
              Add task
            </Button>
            <Button
              type="button"
              onClick={() => setDialog({ open: true, mode: 'goal' })}
              className="gap-1.5 bg-white text-[#0A0A0A] hover:bg-white/90"
            >
              <Plus className="size-3.5" strokeWidth={1.75} />
              Add goal
            </Button>
          </div>
        }
      />

      <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-20">
        <section aria-label="Overall progress" className="space-y-6">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#555555]">
                Overall
              </p>
              <p className="mt-3 text-5xl font-semibold tracking-tight text-white tabular-nums sm:text-6xl">
                {formatPercent(overall)}
              </p>
              <p className="mt-3 text-sm text-[#555555]">
                {goalsM.completedGoals}/{goalsM.totalGoals} goals ·{' '}
                {goalsM.completedTasks}/{goalsM.totalTasks} tasks
              </p>
            </div>
            <ProgressBar value={overall} className="hidden pb-2 sm:flex" />
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#2A2A2A] sm:grid-cols-5">
            {HORIZON_ORDER.map((h) => {
              const hp = goalsM.byHorizon[h]
              return (
                <div
                  key={h}
                  className="bg-[#0A0A0A] px-4 py-5 sm:px-5 sm:py-6"
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#555555]">
                    {HORIZON_LABELS[h]}
                  </p>
                  <p
                    className={cn(
                      'mt-3 text-2xl font-semibold tabular-nums tracking-tight',
                      hp.total === 0 ? 'text-[#555555]' : 'text-white',
                    )}
                  >
                    {hp.total === 0 ? '—' : formatPercent(hp.progress)}
                  </p>
                  <p className="mt-1 text-[11px] tabular-nums text-[#555555]">
                    {hp.total === 0 ? 'None' : `${hp.done}/${hp.total}`}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        <section aria-label="Goal tree" className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-medium tracking-tight text-white">
              Cascade
            </h2>
            <p className="text-xs text-[#555555]">
              {treeMetrics.totalGoals + treeMetrics.totalTasks === 0
                ? 'Empty'
                : 'Roll-up from children'}
            </p>
          </div>
          <GoalsTree roots={roots} />
        </section>
      </div>

      <CreateGoalDialog
        open={dialog.open}
        mode={dialog.mode}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        onCreated={() => {}}
      />
    </div>
  )
}
