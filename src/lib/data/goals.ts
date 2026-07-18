/**
 * Goals + tasks data access and cascade-safe mutations.
 */

import { createId } from '@/lib/id'
import { canLinkParent } from '@/lib/goals/horizons'
import { buildGoalsTree } from '@/lib/goals/tree'
import { useAppStore } from '@/stores/app-store'
import type {
  EntityId,
  Goal,
  GoalHorizon,
  GoalStatus,
  GoalTask,
} from '@/types'

function nowIso() {
  return new Date().toISOString()
}

function snapshot() {
  return useAppStore.getState()
}

export function getGoals(): Goal[] {
  return Object.values(snapshot().goals)
}

export function getGoalById(id: EntityId): Goal | undefined {
  return snapshot().goals[id]
}

export function getGoalTasks(): GoalTask[] {
  return Object.values(snapshot().goalTasks)
}

export function useGoalsTree() {
  const goals = useAppStore((s) => s.goals)
  const goalTasks = useAppStore((s) => s.goalTasks)
  return buildGoalsTree(Object.values(goals), Object.values(goalTasks))
}

export interface CreateGoalInput {
  title: string
  description?: string
  horizon: GoalHorizon
  parentId?: EntityId | null
  status?: GoalStatus
}

export function createGoal(input: CreateGoalInput): Goal | null {
  const title = input.title.trim()
  if (!title) return null

  let parentId: EntityId | undefined
  if (input.parentId) {
    const parent = getGoalById(input.parentId)
    if (!parent) return null
    if (!canLinkParent(input.horizon, parent.horizon)) return null
    // Prevent cycles: parent cannot be descendant of new goal (new has no descendants)
    parentId = parent.id
  }

  const goal: Goal = {
    id: createId('goal'),
    title,
    description: input.description?.trim() || undefined,
    horizon: input.horizon,
    parentId,
    status: input.status ?? 'not_started',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  snapshot().upsertGoal(goal)
  return goal
}

export function updateGoalParent(
  goalId: EntityId,
  parentId: EntityId | null,
): boolean {
  const goal = getGoalById(goalId)
  if (!goal) return false

  if (!parentId) {
    snapshot().upsertGoal({
      ...goal,
      parentId: undefined,
      updatedAt: nowIso(),
    })
    return true
  }

  if (parentId === goalId) return false
  const parent = getGoalById(parentId)
  if (!parent) return false
  if (!canLinkParent(goal.horizon, parent.horizon)) return false
  if (isDescendant(parentId, goalId)) return false // would create cycle

  snapshot().upsertGoal({
    ...goal,
    parentId,
    updatedAt: nowIso(),
  })
  return true
}

/** Is `maybeDescendant` under `ancestorId` in the goal tree? */
function isDescendant(maybeDescendant: EntityId, ancestorId: EntityId): boolean {
  const goals = snapshot().goals
  let current: EntityId | undefined = maybeDescendant
  const seen = new Set<EntityId>()
  while (current) {
    if (current === ancestorId) return true
    if (seen.has(current)) return false
    seen.add(current)
    current = goals[current]?.parentId
  }
  return false
}

export function setGoalStatus(goalId: EntityId, status: GoalStatus): void {
  const goal = getGoalById(goalId)
  if (!goal) return
  snapshot().upsertGoal({
    ...goal,
    status,
    manualProgress:
      status === 'done' ? 1 : status === 'not_started' ? 0 : goal.manualProgress,
    updatedAt: nowIso(),
  })
}

export function setGoalManualProgress(goalId: EntityId, progress: number): void {
  const goal = getGoalById(goalId)
  if (!goal) return
  const p = Math.min(1, Math.max(0, progress))
  snapshot().upsertGoal({
    ...goal,
    manualProgress: p,
    status: p >= 1 ? 'done' : p > 0 ? 'in_progress' : 'not_started',
    updatedAt: nowIso(),
  })
}

export function deleteGoal(id: EntityId): void {
  snapshot().deleteGoal(id)
}

export interface CreateTaskInput {
  title: string
  goalId?: EntityId | null
  completed?: boolean
}

export function createTask(input: CreateTaskInput): GoalTask | null {
  const title = input.title.trim()
  if (!title) return null

  let goalId: EntityId | undefined
  if (input.goalId) {
    if (!getGoalById(input.goalId)) return null
    goalId = input.goalId
  }

  const task: GoalTask = {
    id: createId('gtask'),
    title,
    completed: input.completed ?? false,
    goalId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  snapshot().upsertGoalTask(task)
  return task
}

export function toggleTask(taskId: EntityId): void {
  const t = snapshot().goalTasks[taskId]
  if (!t) return
  snapshot().upsertGoalTask({
    ...t,
    completed: !t.completed,
    updatedAt: nowIso(),
  })
}

export function setTaskParent(taskId: EntityId, goalId: EntityId | null): void {
  const t = snapshot().goalTasks[taskId]
  if (!t) return
  if (goalId && !getGoalById(goalId)) return
  snapshot().upsertGoalTask({
    ...t,
    goalId: goalId ?? undefined,
    updatedAt: nowIso(),
  })
}

export function deleteTask(id: EntityId): void {
  snapshot().deleteGoalTask(id)
}

/** Goals that can parent a child of the given horizon (or any for tasks). */
export function listParentOptions(childHorizon?: GoalHorizon): Goal[] {
  const all = getGoals().filter((g) => g.status !== 'cancelled')
  if (!childHorizon) {
    return all.sort((a, b) => a.title.localeCompare(b.title))
  }
  return all
    .filter((g) => canLinkParent(childHorizon, g.horizon))
    .sort((a, b) => a.title.localeCompare(b.title))
}
