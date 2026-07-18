import type {
  ActivityItem,
  AppMetrics,
  Application,
  ApplicationStatus,
  Company,
  FunnelStage,
  Goal,
  GoalTask,
  Job,
  Note,
  PipelineCounts,
  PriorityItem,
  PriorityUrgency,
} from '@/types'
import { buildGoalsTree, emptyGoalsMetrics } from '@/lib/goals/tree'

export interface MetricsInput {
  companies: Company[]
  jobs: Job[]
  applications: Application[]
  notes: Note[]
  goals?: Goal[]
  goalTasks?: GoalTask[]
  /** Optional clock for pure tests; defaults to now */
  now?: Date
}

const EMPTY_PIPELINE: PipelineCounts = {
  saved: 0,
  applied: 0,
  screening: 0,
  interview: 0,
  offer: 0,
  rejected: 0,
  withdrawn: 0,
  accepted: 0,
}

const ACTIVE_STATUSES: ApplicationStatus[] = [
  'saved',
  'applied',
  'screening',
  'interview',
  'offer',
]

const RESPONDED_STATUSES: ApplicationStatus[] = [
  'screening',
  'interview',
  'offer',
  'rejected',
  'accepted',
  'withdrawn',
]

/**
 * Pure metrics derivation — single source of truth for Dashboard & Job Hub.
 * Returns zeros / empty lists when input is empty. Never invents sample data.
 */
export function deriveMetrics(input: MetricsInput): AppMetrics {
  const {
    companies,
    jobs,
    applications,
    notes,
    goals = [],
    goalTasks = [],
  } = input
  const now = input.now ?? new Date()

  const companyById = new Map(companies.map((c) => [c.id, c]))
  const jobById = new Map(jobs.map((j) => [j.id, j]))

  const pipeline: PipelineCounts = { ...EMPTY_PIPELINE }
  for (const app of applications) {
    pipeline[app.status] += 1
  }

  const appliedOrBeyond = applications.filter((a) => a.status !== 'saved')
  const responded = applications.filter((a) =>
    RESPONDED_STATUSES.includes(a.status),
  )
  const offers = applications.filter(
    (a) => a.status === 'offer' || a.status === 'accepted',
  )

  const responseRate =
    appliedOrBeyond.length === 0 ? 0 : responded.length / appliedOrBeyond.length
  const offerRate =
    appliedOrBeyond.length === 0 ? 0 : offers.length / appliedOrBeyond.length

  const activeApplications = applications.filter((a) =>
    ACTIVE_STATUSES.includes(a.status),
  ).length

  const startOfToday = startOfLocalDay(now)
  const startOfWeek = startOfLocalWeek(now)

  const applicationsToday = applications.filter((a) =>
    isAddedInWindow(a, startOfToday, now),
  ).length
  const applicationsThisWeek = applications.filter((a) =>
    isAddedInWindow(a, startOfWeek, now),
  ).length

  const focusToday = buildFocusWindow(applications, startOfToday, now)
  const focusWeek = buildFocusWindow(applications, startOfWeek, now)

  const funnel = buildFunnel(pipeline)
  const recentActivity = buildRecentActivity(
    applications,
    notes,
    jobById,
    companyById,
    6,
  )
  const priorities = buildPriorities(
    applications,
    jobById,
    companyById,
    now,
    5,
  )

  const goalsMetrics =
    goals.length === 0 && goalTasks.length === 0
      ? emptyGoalsMetrics()
      : buildGoalsTree(goals, goalTasks).metrics

  return {
    totalJobs: jobs.length,
    totalCompanies: companies.length,
    totalApplications: applications.length,
    totalNotes: notes.length,
    pipeline,
    responseRate,
    offerRate,
    activeApplications,
    applicationsToday,
    applicationsThisWeek,
    interviewsOpen: pipeline.interview + pipeline.screening,
    offersOpen: pipeline.offer,
    savedBacklog: pipeline.saved,
    focusToday,
    focusWeek,
    funnel,
    recentActivity,
    priorities,
    goals: goalsMetrics,
    updatedAt: now.toISOString(),
  }
}

/** Empty metrics for initial store / loading states. */
export function emptyMetrics(): AppMetrics {
  return deriveMetrics({
    companies: [],
    jobs: [],
    applications: [],
    notes: [],
    goals: [],
    goalTasks: [],
  })
}

// ─── Windows ────────────────────────────────────────────────

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

/** Week starts Monday (ISO-style, local). */
function startOfLocalWeek(d: Date): Date {
  const day = startOfLocalDay(d)
  const dow = day.getDay() // 0 Sun … 6 Sat
  const offset = dow === 0 ? 6 : dow - 1
  day.setDate(day.getDate() - offset)
  return day
}

function parseTime(iso: string): number {
  const t = Date.parse(iso)
  return Number.isNaN(t) ? 0 : t
}

function inRange(iso: string, from: Date, to: Date): boolean {
  const t = parseTime(iso)
  return t >= from.getTime() && t <= to.getTime()
}

/** Application “added” = appliedAt if set, else createdAt. */
function applicationAddedAt(a: Application): string {
  return a.appliedAt ?? a.createdAt
}

function isAddedInWindow(a: Application, from: Date, to: Date): boolean {
  return inRange(applicationAddedAt(a), from, to)
}

function buildFocusWindow(
  applications: Application[],
  from: Date,
  to: Date,
): AppMetrics['focusToday'] {
  const applicationsAdded = applications.filter((a) =>
    isAddedInWindow(a, from, to),
  ).length

  const activityCount = applications.filter((a) =>
    inRange(a.lastActivityAt, from, to),
  ).length

  const interviewsTouched = applications.filter(
    (a) =>
      (a.status === 'interview' || a.status === 'screening') &&
      inRange(a.lastActivityAt, from, to),
  ).length

  return { applicationsAdded, activityCount, interviewsTouched }
}

// ─── Funnel ─────────────────────────────────────────────────

function buildFunnel(pipeline: PipelineCounts): FunnelStage[] {
  return [
    { key: 'saved', label: 'Saved', count: pipeline.saved },
    {
      key: 'applied_group',
      label: 'Applied',
      count: pipeline.applied + pipeline.screening,
    },
    { key: 'interview', label: 'Interview', count: pipeline.interview },
    {
      key: 'offer_group',
      label: 'Offer',
      count: pipeline.offer + pipeline.accepted,
    },
    { key: 'rejected', label: 'Rejected', count: pipeline.rejected },
  ]
}

// ─── Activity ───────────────────────────────────────────────

function buildRecentActivity(
  applications: Application[],
  notes: Note[],
  jobById: Map<string, Job>,
  companyById: Map<string, Company>,
  limit: number,
): ActivityItem[] {
  const items: ActivityItem[] = []

  for (const app of applications) {
    const job = jobById.get(app.jobId)
    const company = job ? companyById.get(job.companyId) : undefined
    const companyName = company?.name ?? 'Unknown'
    const role = job?.title ?? 'Role'
    items.push({
      id: `app-${app.id}`,
      kind: 'application',
      label: `${companyName}`,
      detail: `${role} · ${statusLabel(app.status)}`,
      at: app.lastActivityAt,
      applicationId: app.id,
      status: app.status,
    })
  }

  for (const note of notes) {
    items.push({
      id: `note-${note.id}`,
      kind: 'note',
      label: note.title || 'Note',
      detail: note.body.slice(0, 80) || 'Updated note',
      at: note.updatedAt || note.createdAt,
    })
  }

  return items
    .sort((a, b) => parseTime(b.at) - parseTime(a.at))
    .slice(0, limit)
}

// ─── Priorities (Chief of Staff) ────────────────────────────

function buildPriorities(
  applications: Application[],
  jobById: Map<string, Job>,
  companyById: Map<string, Company>,
  now: Date,
  limit: number,
): PriorityItem[] {
  const scored: (PriorityItem & { score: number })[] = []

  for (const app of applications) {
    if (app.status === 'rejected' || app.status === 'withdrawn') continue

    const job = jobById.get(app.jobId)
    const company = job ? companyById.get(job.companyId) : undefined
    const companyName = company?.name ?? 'Unknown'
    const title = job?.title ?? 'Role'

    const { reason, urgency, score } = scorePriority(app, now)
    if (score <= 0) continue

    scored.push({
      id: app.id,
      applicationId: app.id,
      title,
      companyName,
      reason,
      status: app.status,
      urgency,
      at: app.nextStepAt ?? app.lastActivityAt,
      score,
    })
  }

  return scored
    .sort((a, b) => b.score - a.score || parseTime(b.at) - parseTime(a.at))
    .slice(0, limit)
    .map(({ score: _score, ...rest }) => rest)
}

function scorePriority(
  app: Application,
  now: Date,
): { reason: string; urgency: PriorityUrgency; score: number } {
  const nowMs = now.getTime()

  // Explicit next step overdue / upcoming
  if (app.nextStepAt) {
    const due = parseTime(app.nextStepAt)
    const days = (due - nowMs) / (1000 * 60 * 60 * 24)
    if (days < 0) {
      return {
        reason: app.nextStep
          ? `Overdue: ${app.nextStep}`
          : 'Next step is overdue',
        urgency: 'high',
        score: 100 + Math.min(30, Math.abs(days)),
      }
    }
    if (days <= 2) {
      return {
        reason: app.nextStep
          ? `Due soon: ${app.nextStep}`
          : 'Next step due within 2 days',
        urgency: 'high',
        score: 90 - days * 5,
      }
    }
    if (days <= 7) {
      return {
        reason: app.nextStep ?? 'Upcoming next step',
        urgency: 'medium',
        score: 70 - days,
      }
    }
  }

  if (app.status === 'offer') {
    return {
      reason: 'Offer open — decide or negotiate',
      urgency: 'high',
      score: 95,
    }
  }

  if (app.status === 'interview') {
    return {
      reason: app.nextStep ?? 'Interview in progress — prepare next round',
      urgency: 'high',
      score: 85,
    }
  }

  if (app.status === 'screening') {
    return {
      reason: app.nextStep ?? 'Screening — follow up if silent',
      urgency: 'medium',
      score: 65,
    }
  }

  if (app.status === 'applied') {
    const daysSince = (nowMs - parseTime(app.appliedAt ?? app.createdAt)) / (1000 * 60 * 60 * 24)
    if (daysSince >= 7) {
      return {
        reason: 'Applied 7+ days ago — consider a nudge',
        urgency: 'medium',
        score: 55,
      }
    }
    return {
      reason: 'Awaiting response',
      urgency: 'low',
      score: 35,
    }
  }

  if (app.status === 'saved') {
    return {
      reason: 'Saved — apply or archive',
      urgency: 'low',
      score: 20,
    }
  }

  if (app.status === 'accepted') {
    return {
      reason: 'Accepted — onboarding / wrap-up',
      urgency: 'medium',
      score: 50,
    }
  }

  return { reason: '', urgency: 'low', score: 0 }
}

function statusLabel(status: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    saved: 'Saved',
    applied: 'Applied',
    screening: 'Screening',
    interview: 'Interview',
    offer: 'Offer',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
    accepted: 'Accepted',
  }
  return map[status]
}
