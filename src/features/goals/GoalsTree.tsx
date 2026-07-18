import { useMemo, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProgressBar } from '@/features/goals/ProgressBar'
import {
  deleteGoal,
  deleteTask,
  listParentOptions,
  setGoalStatus,
  setTaskParent,
  toggleTask,
  updateGoalParent,
} from '@/lib/data/goals'
import { useAppStore } from '@/stores/app-store'
import { HORIZON_LABELS } from '@/lib/goals/horizons'
import type { GoalTreeNode } from '@/lib/goals/tree'
import type { GoalStatus } from '@/types'
import { cn } from '@/lib/utils'

export function GoalsTree({ roots }: { roots: GoalTreeNode[] }) {
  if (roots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#2A2A2A] bg-[#141414]/50 px-8 py-16 text-center">
        <p className="text-sm font-medium text-white">No goals yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#555555]">
          Start with a yearly or quarterly aim, then cascade monthly, weekly,
          and daily goals — plus tasks. Progress rolls up automatically.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-0 border-t border-[#2A2A2A]">
      {roots.map((node) => (
        <TreeRow key={`${node.kind}-${node.id}`} node={node} />
      ))}
    </ul>
  )
}

function TreeRow({ node }: { node: GoalTreeNode }) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children.length > 0
  const pad = 12 + node.depth * 20

  if (node.kind === 'task') {
    return (
      <li className="border-b border-[#2A2A2A]">
        <div
          className="flex items-center gap-3 py-3.5 pr-2 transition-colors hover:bg-white/[0.02]"
          style={{ paddingLeft: pad }}
        >
          <button
            type="button"
            onClick={() => toggleTask(node.id)}
            className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
              node.completed
                ? 'border-white bg-white text-[#0A0A0A]'
                : 'border-[#2A2A2A] text-transparent hover:border-[#555555]',
            )}
            aria-label={node.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            {node.completed ? (
              <Check className="size-3" strokeWidth={2.5} />
            ) : (
              <Circle className="size-3 opacity-0" />
            )}
          </button>
          <span
            className={cn(
              'min-w-0 flex-1 text-sm',
              node.completed ? 'text-[#555555] line-through' : 'text-[#888888]',
            )}
          >
            {node.title}
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.12em] text-[#555555] sm:inline">
            Task
          </span>
          <TaskMenu taskId={node.id} goalId={node.goalId} />
        </div>
      </li>
    )
  }

  return (
    <li className="border-b border-[#2A2A2A]">
      <div
        className="flex items-center gap-2 py-4 pr-2 transition-colors hover:bg-white/[0.02] sm:gap-3"
        style={{ paddingLeft: pad }}
      >
        <button
          type="button"
          disabled={!hasChildren}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded text-[#555555]',
            hasChildren && 'hover:text-white',
            !hasChildren && 'opacity-0',
          )}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {open ? (
            <ChevronDown className="size-4" strokeWidth={1.75} />
          ) : (
            <ChevronRight className="size-4" strokeWidth={1.75} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium tracking-tight text-white">
              {node.title}
            </span>
            {node.horizon && (
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#555555]">
                {HORIZON_LABELS[node.horizon]}
              </span>
            )}
          </div>
        </div>

        <ProgressBar value={node.progress} size="sm" className="shrink-0" />

        <StatusSelect
          status={node.status ?? 'not_started'}
          onChange={(s) => setGoalStatus(node.id, s)}
        />

        <GoalMenu goalId={node.id} horizon={node.horizon!} parentId={node.parentId} />
      </div>

      {hasChildren && open && (
        <ul>
          {node.children.map((child) => (
            <TreeRow key={`${child.kind}-${child.id}`} node={child} />
          ))}
        </ul>
      )}
    </li>
  )
}

function StatusSelect({
  status,
  onChange,
}: {
  status: GoalStatus
  onChange: (s: GoalStatus) => void
}) {
  const labels: Record<GoalStatus, string> = {
    not_started: 'Not started',
    in_progress: 'In progress',
    done: 'Done',
    cancelled: 'Cancelled',
  }

  return (
    <Select value={status} onValueChange={(v) => onChange(v as GoalStatus)}>
      <SelectTrigger
        size="sm"
        className="hidden h-7 w-[7.5rem] border-[#2A2A2A] bg-transparent text-[11px] text-[#888888] md:flex"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-[#2A2A2A] bg-[#141414] text-white">
        {(Object.keys(labels) as GoalStatus[]).map((s) => (
          <SelectItem key={s} value={s}>
            {labels[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function GoalMenu({
  goalId,
  horizon,
  parentId,
}: {
  goalId: string
  horizon: GoalTreeNode['horizon']
  parentId?: string
}) {
  // Subscribe so options refresh when goals change
  const goalsMap = useAppStore((s) => s.goals)
  const parents = useMemo(
    () => listParentOptions(horizon!).filter((p) => p.id !== goalId),
    [horizon, goalId, goalsMap],
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-[#555555] hover:bg-[#1A1A1A] hover:text-white"
          aria-label="Goal actions"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-72 w-56 overflow-y-auto border-[#2A2A2A] bg-[#141414] text-white"
      >
        <DropdownMenuItem
          className="focus:bg-[#1A1A1A] focus:text-white"
          onClick={() => updateGoalParent(goalId, null)}
        >
          Unlink parent
          {!parentId && <span className="ml-auto text-[#555555]">—</span>}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#2A2A2A]" />
        {parents.length === 0 ? (
          <DropdownMenuItem disabled className="text-[#555555]">
            No valid parents
          </DropdownMenuItem>
        ) : (
          parents.map((p) => (
            <DropdownMenuItem
              key={p.id}
              className="focus:bg-[#1A1A1A] focus:text-white"
              onClick={() => updateGoalParent(goalId, p.id)}
            >
              <span className="truncate">
                <span className="text-[#555555]">
                  {HORIZON_LABELS[p.horizon]} ·{' '}
                </span>
                {p.title}
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator className="bg-[#2A2A2A]" />
        <DropdownMenuItem
          className="gap-2 text-[#888888] focus:bg-[#1A1A1A] focus:text-white"
          onClick={() => deleteGoal(goalId)}
        >
          <Trash2 className="size-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TaskMenu({
  taskId,
  goalId,
}: {
  taskId: string
  goalId?: string
}) {
  const goalsMap = useAppStore((s) => s.goals)
  const goals = useMemo(() => listParentOptions(), [goalsMap])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-[#555555] hover:bg-[#1A1A1A] hover:text-white"
          aria-label="Task actions"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-72 w-56 overflow-y-auto border-[#2A2A2A] bg-[#141414] text-white"
      >
        <DropdownMenuItem
          className="focus:bg-[#1A1A1A] focus:text-white"
          onClick={() => setTaskParent(taskId, null)}
        >
          Unlink from goal
          {!goalId && <span className="ml-auto text-[#555555]">—</span>}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#2A2A2A]" />
        {goals.map((g) => (
          <DropdownMenuItem
            key={g.id}
            className="focus:bg-[#1A1A1A] focus:text-white"
            onClick={() => setTaskParent(taskId, g.id)}
          >
            <span className="truncate">
              <span className="text-[#555555]">
                {HORIZON_LABELS[g.horizon]} ·{' '}
              </span>
              {g.title}
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-[#2A2A2A]" />
        <DropdownMenuItem
          className="gap-2 text-[#888888] focus:bg-[#1A1A1A] focus:text-white"
          onClick={() => deleteTask(taskId)}
        >
          <Trash2 className="size-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
