/** Domain types for Cron — keep UI-free and serializable. */

// ─── IDs ────────────────────────────────────────────────────

export type EntityId = string

// ─── Navigation / shell ─────────────────────────────────────

export type AppRoute =
  | 'dashboard'
  | 'jobs'
  | 'goals'
  | 'companies'
  | 'notes'
  | 'settings'

export interface NavItem {
  id: AppRoute
  label: string
  /** lucide icon name key used by the shell */
  icon: NavIconName
  /** Optional keyboard shortcut hint shown in command palette */
  shortcut?: string
}

export type NavIconName =
  | 'layout-dashboard'
  | 'briefcase'
  | 'target'
  | 'building-2'
  | 'users'
  | 'sticky-note'
  | 'settings'

// ─── Companies ──────────────────────────────────────────────

export interface Company {
  id: EntityId
  name: string
  website?: string
  careersUrl?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// ─── Jobs ───────────────────────────────────────────────────

export type JobSource =
  | 'greenhouse'
  | 'lever'
  | 'ashby'
  | 'linkedin'
  | 'company-site'
  | 'referral'
  | 'other'

export type JobSeniority =
  | 'intern'
  | 'entry'
  | 'mid'
  | 'senior'
  | 'staff'
  | 'principal'
  | 'unknown'

export type JobLocationType = 'remote' | 'hybrid' | 'onsite' | 'unknown'

export interface Job {
  id: EntityId
  title: string
  companyId: EntityId
  location?: string
  locationType: JobLocationType
  seniority: JobSeniority
  source: JobSource
  url?: string
  salaryMin?: number
  salaryMax?: number
  currency?: string
  description?: string
  tags: string[]
  postedAt?: string
  createdAt: string
  updatedAt: string
}

// ─── Applications ───────────────────────────────────────────

export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'accepted'

export interface Application {
  id: EntityId
  jobId: EntityId
  status: ApplicationStatus
  appliedAt?: string
  lastActivityAt: string
  nextStep?: string
  nextStepAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// ─── Notes ──────────────────────────────────────────────────

export type NoteEntityType = 'job' | 'company' | 'application' | 'general'

export interface Note {
  id: EntityId
  title: string
  body: string
  entityType: NoteEntityType
  entityId?: EntityId
  createdAt: string
  updatedAt: string
}

// ─── Contacts (mini-CRM) ────────────────────────────────────

export type ContactSource = 'manual' | 'csv'

export interface Contact {
  id: EntityId
  name: string
  email?: string
  phone?: string
  title?: string
  linkedin?: string
  notes?: string
  /** Linked company in store when known */
  companyId?: EntityId
  /** Original company string from import / manual entry */
  companyNameRaw?: string
  /** Applications linked via company (or explicit) */
  applicationIds: EntityId[]
  source: ContactSource
  createdAt: string
  updatedAt: string
}

// ─── Goals (cascade) ────────────────────────────────────────

/** Coarser → finer. Parent must be strictly coarser than child. */
export type GoalHorizon =
  | 'yearly'
  | 'quarterly'
  | 'monthly'
  | 'weekly'
  | 'daily'

export type GoalStatus = 'not_started' | 'in_progress' | 'done' | 'cancelled'

export interface Goal {
  id: EntityId
  title: string
  description?: string
  horizon: GoalHorizon
  /** Parent goal (coarser horizon). Roots omit this. */
  parentId?: EntityId
  status: GoalStatus
  /**
   * Manual leaf progress 0–1 when the goal has no children.
   * Ignored when child goals or tasks exist (roll-up wins).
   */
  manualProgress?: number
  createdAt: string
  updatedAt: string
}

/** Atomic work unit; may hang under a goal. */
export interface GoalTask {
  id: EntityId
  title: string
  completed: boolean
  /** Parent goal (any horizon). */
  goalId?: EntityId
  createdAt: string
  updatedAt: string
}

export interface HorizonProgress {
  total: number
  done: number
  /** 0–1 average roll-up across goals in this horizon */
  progress: number
}

export interface GoalsMetrics {
  totalGoals: number
  completedGoals: number
  totalTasks: number
  completedTasks: number
  /** 0–1 mean progress of root goals (cascade roll-up) */
  overallProgress: number
  byHorizon: Record<GoalHorizon, HorizonProgress>
}

// ─── Metrics ────────────────────────────────────────────────

export interface PipelineCounts {
  saved: number
  applied: number
  screening: number
  interview: number
  offer: number
  rejected: number
  withdrawn: number
  accepted: number
}

/** Ordered funnel stage for dashboard display */
export interface FunnelStage {
  key: keyof PipelineCounts | 'applied_group' | 'offer_group'
  label: string
  count: number
}

export interface ActivityItem {
  id: EntityId
  kind: 'application' | 'note'
  /** Primary line, e.g. "Stripe · Applied" */
  label: string
  /** Secondary line */
  detail: string
  at: string
  applicationId?: EntityId
  status?: ApplicationStatus
}

export type PriorityUrgency = 'high' | 'medium' | 'low'

export interface PriorityItem {
  id: EntityId
  applicationId: EntityId
  title: string
  companyName: string
  reason: string
  status: ApplicationStatus
  urgency: PriorityUrgency
  at: string
}

export interface FocusWindow {
  /** Applications created or applied in window */
  applicationsAdded: number
  /** Distinct applications with activity in window */
  activityCount: number
  /** Applications that entered interview in window (approx via lastActivity + status) */
  interviewsTouched: number
}

export interface AppMetrics {
  totalJobs: number
  totalCompanies: number
  totalApplications: number
  totalNotes: number
  pipeline: PipelineCounts
  /** 0–1 */
  responseRate: number
  /** 0–1 */
  offerRate: number
  activeApplications: number

  // Time-window KPIs (derived, never fabricated)
  applicationsToday: number
  applicationsThisWeek: number
  interviewsOpen: number
  offersOpen: number
  savedBacklog: number

  focusToday: FocusWindow
  focusWeek: FocusWindow

  /** Lean funnel for dashboard (saved → applied → interview → offer → rejected) */
  funnel: FunnelStage[]

  /** Recent activity, newest first */
  recentActivity: ActivityItem[]

  /** Chief-of-staff style priorities */
  priorities: PriorityItem[]

  /** Goals cascade roll-up (from goals + tasks) */
  goals: GoalsMetrics

  updatedAt: string
}

// ─── Reflections ────────────────────────────────────────────

export type ReflectionPeriodKind = 'week' | 'month'

export interface ReflectionAnswers {
  wentWell: string
  stuck: string
  priorityNext: string
}

/** Compact metrics snapshot archived with a reflection (from deriveMetrics). */
export interface ReflectionMetricsSnapshot {
  totalApplications: number
  applicationsThisWeek: number
  applicationsToday: number
  responseRate: number
  offerRate: number
  activeApplications: number
  interviewsOpen: number
  offersOpen: number
  savedBacklog: number
  goalsOverallProgress: number
  goalsTotal: number
  goalsCompleted: number
  tasksTotal: number
  tasksCompleted: number
  focusWeekActivity: number
  focusWeekAdded: number
  capturedAt: string
}

export interface ReflectionVariance {
  applicationsDelta: number
  applicationsThisWeekDelta: number
  responseRateDelta: number
  activeApplicationsDelta: number
  interviewsOpenDelta: number
  goalsProgressDelta: number
  tasksCompletedDelta: number
}

export interface ReflectionArchive {
  id: EntityId
  periodKind: ReflectionPeriodKind
  /** ISO week `2026-W29` or month `2026-07` */
  periodKey: string
  periodLabel: string
  periodStart: string
  periodEnd: string
  reflectedAt: string
  trigger: 'auto' | 'manual'
  answers: ReflectionAnswers
  metrics: ReflectionMetricsSnapshot
  /** vs previous archive of same kind; null if first */
  variance: ReflectionVariance | null
}

export interface ReflectionSession {
  open: boolean
  periodKind: ReflectionPeriodKind
  periodKey: string
  periodLabel: string
  periodStart: string
  periodEnd: string
  trigger: 'auto' | 'manual'
}

// ─── Store shape helpers ────────────────────────────────────

export interface EntitiesState {
  companies: Record<EntityId, Company>
  jobs: Record<EntityId, Job>
  applications: Record<EntityId, Application>
  notes: Record<EntityId, Note>
  contacts: Record<EntityId, Contact>
  goals: Record<EntityId, Goal>
  goalTasks: Record<EntityId, GoalTask>
  reflections: Record<EntityId, ReflectionArchive>
}

export interface ShellState {
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  activeRoute: AppRoute
  /** ISO week key last submitted, e.g. 2026-W28 */
  lastReflectedWeekKey: string | null
  /** Month key last submitted, e.g. 2026-06 */
  lastReflectedMonthKey: string | null
  /**
   * Last ISO week key observed on app open.
   * Used to detect week rollover once — not every session.
   */
  lastSeenWeekKey: string | null
  /** Period keys soft-dismissed ("Not now") — no auto re-prompt until next period */
  reflectionSoftDismissed: string[]
  reflectionSession: ReflectionSession | null
}
