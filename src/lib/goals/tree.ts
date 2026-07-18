/**
 * Pure goal tree + cascade progress roll-up.
 * Progress of a node = mean of children (child goals + tasks);
 * leaves use status / manualProgress.
 */

import type {
  EntityId,
  Goal,
  GoalHorizon,
  GoalsMetrics,
  GoalTask,
  HorizonProgress,
} from '@/types'
import { HORIZON_ORDER } from '@/lib/goals/horizons'

export type TreeNodeKind = 'goal' | 'task'

export interface GoalTreeNode {
  kind: TreeNodeKind
  id: EntityId
  title: string
  /** 0–1 rolled up */
  progress: number
  depth: number
  // goal fields
  horizon?: GoalHorizon
  status?: Goal['status']
  parentId?: EntityId
  // task fields
  completed?: boolean
  goalId?: EntityId
  children: GoalTreeNode[]
}

export interface GoalsTreeResult {
  roots: GoalTreeNode[]
  /** Progress by goal id (all goals) */
  progressByGoalId: Record<EntityId, number>
  metrics: GoalsMetrics
}

export function buildGoalsTree(
  goals: Goal[],
  tasks: GoalTask[],
): GoalsTreeResult {
  const goalById = new Map(goals.map((g) => [g.id, g]))
  const childrenOf = new Map<EntityId | 'root', Goal[]>()
  childrenOf.set('root', [])

  for (const g of goals) {
    if (g.status === 'cancelled') continue
    const key = g.parentId && goalById.has(g.parentId) ? g.parentId : 'root'
    // Orphan if parent missing → treat as root
    if (g.parentId && !goalById.has(g.parentId)) {
      const list = childrenOf.get('root')!
      list.push(g)
      continue
    }
    if (!childrenOf.has(key)) childrenOf.set(key, [])
    childrenOf.get(key)!.push(g)
  }

  const tasksByGoal = new Map<EntityId | 'orphan', GoalTask[]>()
  for (const t of tasks) {
    const key =
      t.goalId && goalById.has(t.goalId) ? t.goalId : 'orphan'
    if (!tasksByGoal.has(key)) tasksByGoal.set(key, [])
    tasksByGoal.get(key)!.push(t)
  }

  const progressByGoalId: Record<EntityId, number> = {}
  const memo = new Map<EntityId, number>()

  function goalProgress(goalId: EntityId, stack: Set<EntityId>): number {
    if (memo.has(goalId)) return memo.get(goalId)!
    if (stack.has(goalId)) return 0 // cycle guard
    stack.add(goalId)

    const goal = goalById.get(goalId)
    if (!goal || goal.status === 'cancelled') {
      stack.delete(goalId)
      memo.set(goalId, 0)
      return 0
    }

    const childGoals = (childrenOf.get(goalId) ?? []).filter(
      (g) => g.status !== 'cancelled',
    )
    const childTasks = tasksByGoal.get(goalId) ?? []

    let progress: number
    if (childGoals.length === 0 && childTasks.length === 0) {
      progress = leafProgress(goal)
    } else {
      const parts: number[] = []
      for (const cg of childGoals) {
        parts.push(goalProgress(cg.id, stack))
      }
      for (const t of childTasks) {
        parts.push(t.completed ? 1 : 0)
      }
      progress =
        parts.length === 0
          ? leafProgress(goal)
          : parts.reduce((a, b) => a + b, 0) / parts.length
    }

    // Done status floors at 1 for leaves; for parents still use roll-up
    // but if user marked done, show 1
    if (goal.status === 'done' && childGoals.length === 0 && childTasks.length === 0) {
      progress = 1
    }

    stack.delete(goalId)
    memo.set(goalId, progress)
    progressByGoalId[goalId] = progress
    return progress
  }

  // Compute all
  for (const g of goals) {
    if (g.status === 'cancelled') {
      progressByGoalId[g.id] = 0
      continue
    }
    goalProgress(g.id, new Set())
  }

  function buildNode(goal: Goal, depth: number): GoalTreeNode {
    const childGoals = (childrenOf.get(goal.id) ?? [])
      .slice()
      .sort(compareGoals)
    const childTasks = (tasksByGoal.get(goal.id) ?? [])
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title))

    const children: GoalTreeNode[] = [
      ...childGoals.map((cg) => buildNode(cg, depth + 1)),
      ...childTasks.map(
        (t): GoalTreeNode => ({
          kind: 'task',
          id: t.id,
          title: t.title,
          progress: t.completed ? 1 : 0,
          depth: depth + 1,
          completed: t.completed,
          goalId: t.goalId,
          children: [],
        }),
      ),
    ]

    return {
      kind: 'goal',
      id: goal.id,
      title: goal.title,
      progress: progressByGoalId[goal.id] ?? 0,
      depth,
      horizon: goal.horizon,
      status: goal.status,
      parentId: goal.parentId,
      children,
    }
  }

  const rootGoals = (childrenOf.get('root') ?? []).slice().sort(compareGoals)
  const roots = rootGoals.map((g) => buildNode(g, 0))

  // Orphan tasks (no goal) as root-level task nodes
  const orphans = tasksByGoal.get('orphan') ?? []
  for (const t of orphans.sort((a, b) => a.title.localeCompare(b.title))) {
    roots.push({
      kind: 'task',
      id: t.id,
      title: t.title,
      progress: t.completed ? 1 : 0,
      depth: 0,
      completed: t.completed,
      children: [],
    })
  }

  const metrics = deriveGoalsMetrics(goals, tasks, progressByGoalId, rootGoals)

  return { roots, progressByGoalId, metrics }
}

function leafProgress(goal: Goal): number {
  if (goal.status === 'done') return 1
  if (goal.status === 'cancelled') return 0
  if (goal.manualProgress != null) {
    return clamp01(goal.manualProgress)
  }
  if (goal.status === 'in_progress') return 0.5
  return 0
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

function compareGoals(a: Goal, b: Goal): number {
  const hr = HORIZON_ORDER.indexOf(a.horizon) - HORIZON_ORDER.indexOf(b.horizon)
  if (hr !== 0) return hr
  return a.title.localeCompare(b.title)
}

function emptyHorizonProgress(): HorizonProgress {
  return { total: 0, done: 0, progress: 0 }
}

export function deriveGoalsMetrics(
  goals: Goal[],
  tasks: GoalTask[],
  progressByGoalId: Record<EntityId, number>,
  rootGoals: Goal[],
): GoalsMetrics {
  const active = goals.filter((g) => g.status !== 'cancelled')
  const completedGoals = active.filter(
    (g) => g.status === 'done' || (progressByGoalId[g.id] ?? 0) >= 0.999,
  ).length

  const byHorizon = Object.fromEntries(
    HORIZON_ORDER.map((h) => [h, emptyHorizonProgress()]),
  ) as Record<GoalHorizon, HorizonProgress>

  for (const h of HORIZON_ORDER) {
    const inH = active.filter((g) => g.horizon === h)
    byHorizon[h].total = inH.length
    byHorizon[h].done = inH.filter(
      (g) => g.status === 'done' || (progressByGoalId[g.id] ?? 0) >= 0.999,
    ).length
    byHorizon[h].progress =
      inH.length === 0
        ? 0
        : inH.reduce((s, g) => s + (progressByGoalId[g.id] ?? 0), 0) /
          inH.length
  }

  const roots = rootGoals.filter((g) => g.status !== 'cancelled')
  const overallProgress =
    roots.length === 0
      ? 0
      : roots.reduce((s, g) => s + (progressByGoalId[g.id] ?? 0), 0) /
        roots.length

  return {
    totalGoals: active.length,
    completedGoals,
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.completed).length,
    overallProgress,
    byHorizon,
  }
}

export function emptyGoalsMetrics(): GoalsMetrics {
  return {
    totalGoals: 0,
    completedGoals: 0,
    totalTasks: 0,
    completedTasks: 0,
    overallProgress: 0,
    byHorizon: Object.fromEntries(
      HORIZON_ORDER.map((h) => [h, emptyHorizonProgress()]),
    ) as Record<GoalHorizon, HorizonProgress>,
  }
}
