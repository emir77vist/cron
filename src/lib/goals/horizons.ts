import type { GoalHorizon } from '@/types'

/** Lower index = coarser (valid parent of finer). */
export const HORIZON_ORDER: GoalHorizon[] = [
  'yearly',
  'quarterly',
  'monthly',
  'weekly',
  'daily',
]

export const HORIZON_LABELS: Record<GoalHorizon, string> = {
  yearly: 'Yearly',
  quarterly: 'Quarterly',
  monthly: 'Monthly',
  weekly: 'Weekly',
  daily: 'Daily',
}

export function horizonRank(h: GoalHorizon): number {
  return HORIZON_ORDER.indexOf(h)
}

/** Parent must be strictly coarser than child. */
export function canLinkParent(
  childHorizon: GoalHorizon,
  parentHorizon: GoalHorizon,
): boolean {
  return horizonRank(parentHorizon) < horizonRank(childHorizon)
}

/** Valid parent horizons for a child (coarser only). */
export function parentHorizonsFor(child: GoalHorizon): GoalHorizon[] {
  const r = horizonRank(child)
  return HORIZON_ORDER.filter((_, i) => i < r)
}
