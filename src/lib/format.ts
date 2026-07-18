import type { ApplicationStatus } from '@/types'

export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Relative short time for activity feeds */
export function formatRelative(iso?: string, now = new Date()): string {
  if (!iso) return '—'
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return '—'
  const diffSec = Math.round((now.getTime() - t) / 1000)
  if (diffSec < 60) return 'Just now'
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(iso)
}

/** 0–1 → "42%" */
export function formatPercent(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) return '0%'
  const pct = Math.round(rate * 100)
  return `${pct}%`
}

/** Large KPI display — integers stay clean */
export function formatKpiNumber(n: number): string {
  if (!Number.isFinite(n)) return '0'
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(1)
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  accepted: 'Accepted',
}

export const STATUS_OPTIONS: ApplicationStatus[] = [
  'saved',
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
  'accepted',
]
