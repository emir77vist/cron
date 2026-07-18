/**
 * ISO week / calendar month period helpers for the Reflection system.
 */

import type { ReflectionPeriodKind } from '@/types'

export interface PeriodInfo {
  kind: ReflectionPeriodKind
  key: string
  label: string
  start: Date
  end: Date
}

/** Monday 00:00 local of the ISO week containing `d`. */
export function startOfISOWeek(d: Date): Date {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = day.getDay() // 0 Sun … 6 Sat
  const offset = dow === 0 ? 6 : dow - 1
  day.setDate(day.getDate() - offset)
  day.setHours(0, 0, 0, 0)
  return day
}

export function endOfISOWeek(d: Date): Date {
  const start = startOfISOWeek(d)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return end
}

/** ISO week key: YYYY-Www (ISO-8601 week date). */
export function getISOWeekKey(d: Date = new Date()): string {
  const thu = startOfISOWeek(d)
  thu.setDate(thu.getDate() + 3)
  const isoYear = thu.getFullYear()
  const jan4 = new Date(isoYear, 0, 4)
  const week1Start = startOfISOWeek(jan4)
  const diffMs = startOfISOWeek(d).getTime() - week1Start.getTime()
  const week = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1
  return `${isoYear}-W${String(week).padStart(2, '0')}`
}

export function getMonthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

/** The ISO week that just completed (previous week relative to now). */
export function getPreviousISOWeekPeriod(now: Date = new Date()): PeriodInfo {
  const prev = addDays(startOfISOWeek(now), -7)
  return periodFromWeekDate(prev)
}

export function getCurrentISOWeekPeriod(now: Date = new Date()): PeriodInfo {
  return periodFromWeekDate(now)
}

function periodFromWeekDate(d: Date): PeriodInfo {
  const start = startOfISOWeek(d)
  const end = endOfISOWeek(d)
  const key = getISOWeekKey(d)
  return {
    kind: 'week',
    key,
    label: formatWeekLabel(start, end, key),
    start,
    end,
  }
}

export function getPreviousMonthPeriod(now: Date = new Date()): PeriodInfo {
  const firstThis = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastPrev = addDays(firstThis, -1)
  return periodFromMonthDate(lastPrev)
}

export function getCurrentMonthPeriod(now: Date = new Date()): PeriodInfo {
  return periodFromMonthDate(now)
}

function periodFromMonthDate(d: Date): PeriodInfo {
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
  const key = getMonthKey(d)
  return {
    kind: 'month',
    key,
    label: formatMonthLabel(start),
    start,
    end,
  }
}

function formatWeekLabel(start: Date, end: Date, key: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const a = start.toLocaleDateString('en-US', opts)
  const b = end.toLocaleDateString('en-US', opts)
  const weekNum = key.split('-W')[1]
  return `Week ${weekNum} · ${a} – ${b}`
}

function formatMonthLabel(start: Date): string {
  return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Auto-prompt only when the ISO week has rolled over since last visit.
 *
 * - First visit: record current week, do NOT prompt.
 * - Same week as last visit: do NOT prompt (no every-session spam).
 * - New ISO week (week change / Sunday→Monday boundary): prompt once
 *   for the completed previous week (unless already reflected or soft-dismissed).
 *
 * Month auto-prompt is intentionally disabled.
 */
export function detectAutoReflectionTarget(input: {
  lastReflectedWeekKey: string | null
  /** ISO week key observed on last successful open/check */
  lastSeenWeekKey: string | null
  softDismissed: string[]
  now?: Date
}): { period: PeriodInfo; nextSeenWeekKey: string } | null {
  const now = input.now ?? new Date()
  const currentWeekKey = getISOWeekKey(now)
  const soft = new Set(input.softDismissed)

  // First open ever — seed lastSeen, no prompt
  if (!input.lastSeenWeekKey) {
    return null
  }

  // Still in the same ISO week — no auto prompt
  if (input.lastSeenWeekKey === currentWeekKey) {
    return null
  }

  // ISO week changed since last visit → reflect on the week that just ended
  const completed = getPreviousISOWeekPeriod(now)

  if (input.lastReflectedWeekKey === completed.key) {
    return null
  }
  if (soft.has(completed.key)) {
    return null
  }

  // Also skip if an archive already exists for that period
  return { period: completed, nextSeenWeekKey: currentWeekKey }
}

/** Whether we should only update lastSeenWeekKey (no modal). */
export function shouldSeedSeenWeek(lastSeenWeekKey: string | null): boolean {
  return lastSeenWeekKey == null
}

export function periodToSessionFields(period: PeriodInfo) {
  return {
    periodKind: period.kind,
    periodKey: period.key,
    periodLabel: period.label,
    periodStart: period.start.toISOString(),
    periodEnd: period.end.toISOString(),
  }
}
