/**
 * Application-centric data operations for Job Hub.
 * Creates company + job + application in one commit when needed.
 */

import { createId } from '@/lib/id'
import { useAppStore } from '@/stores/app-store'
import type {
  Application,
  ApplicationStatus,
  Company,
  EntityId,
  Job,
} from '@/types'
import type { JobApplicationDraft } from '@/types/job-draft'
import {
  deleteApplication as deleteAppRaw,
  deleteJob as deleteJobRaw,
  getApplications,
  getCompanies,
  getJobById,
  getJobs,
  upsertApplication,
  upsertCompany,
  upsertJob,
} from '@/lib/data/index'
import { deriveMetrics } from '@/lib/metrics/deriveMetrics'

export interface ApplicationRow {
  application: Application
  job: Job
  company: Company
}

function nowIso() {
  return new Date().toISOString()
}

function dateToIso(dateOnly: string | undefined): string | undefined {
  if (!dateOnly) return undefined
  // YYYY-MM-DD → ISO at noon UTC to avoid TZ shift in display
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return `${dateOnly}T12:00:00.000Z`
  }
  return dateOnly
}

/** Find company by case-insensitive name, or create. */
export function findOrCreateCompany(name: string, website?: string): Company {
  const trimmed = name.trim()
  const existing = getCompanies().find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
  )
  if (existing) {
    if (website && !existing.website) {
      const updated: Company = {
        ...existing,
        website,
        updatedAt: nowIso(),
      }
      upsertCompany(updated)
      return updated
    }
    return existing
  }

  const company: Company = {
    id: createId('co'),
    name: trimmed,
    website,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  upsertCompany(company)
  return company
}

/**
 * Commit a draft into the shared collection:
 * company (find/create) → job → application.
 */
export function submitApplicationDraft(
  draft: JobApplicationDraft,
): ApplicationRow {
  const company = findOrCreateCompany(
    draft.companyName,
    draft.url ? tryOrigin(draft.url) : undefined,
  )

  const job: Job = {
    id: createId('job'),
    title: draft.title.trim(),
    companyId: company.id,
    location: draft.location.trim() || undefined,
    locationType: draft.locationType,
    seniority: draft.seniority,
    source: draft.source,
    url: draft.url.trim() || undefined,
    description: draft.description.trim() || undefined,
    tags: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  upsertJob(job)

  const appliedAt = dateToIso(draft.appliedAt)
  const application: Application = {
    id: createId('app'),
    jobId: job.id,
    status: draft.status,
    appliedAt:
      draft.status === 'saved' && !draft.appliedAt ? undefined : appliedAt,
    lastActivityAt: nowIso(),
    notes: draft.notes.trim() || undefined,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  upsertApplication(application)

  return { application, job, company }
}

export function updateApplicationStatus(
  id: EntityId,
  status: ApplicationStatus,
): void {
  const state = useAppStore.getState()
  const app = state.applications[id]
  if (!app) return
  const updated: Application = {
    ...app,
    status,
    lastActivityAt: nowIso(),
    updatedAt: nowIso(),
    appliedAt:
      app.appliedAt ??
      (status !== 'saved' ? nowIso() : undefined),
  }
  upsertApplication(updated)
}

export function updateApplicationNotes(id: EntityId, notes: string): void {
  const app = useAppStore.getState().applications[id]
  if (!app) return
  upsertApplication({
    ...app,
    notes: notes.trim() || undefined,
    lastActivityAt: nowIso(),
    updatedAt: nowIso(),
  })
}

/** Remove application; optionally orphan job if no other apps. */
export function removeApplication(id: EntityId): void {
  const state = useAppStore.getState()
  const app = state.applications[id]
  if (!app) return
  const jobId = app.jobId
  deleteAppRaw(id)
  const remaining = getApplications().filter((a) => a.jobId === jobId)
  if (remaining.length === 0) {
    deleteJobRaw(jobId)
  }
}

export function getApplicationRows(): ApplicationRow[] {
  const apps = getApplications()
  const companies = Object.fromEntries(getCompanies().map((c) => [c.id, c]))
  const jobs = Object.fromEntries(getJobs().map((j) => [j.id, j]))

  return apps
    .map((application) => {
      const job = jobs[application.jobId]
      if (!job) return null
      const company = companies[job.companyId]
      if (!company) return null
      return { application, job, company } satisfies ApplicationRow
    })
    .filter((r): r is ApplicationRow => r !== null)
    .sort((a, b) => {
      const da = a.application.appliedAt ?? a.application.createdAt
      const db = b.application.appliedAt ?? b.application.createdAt
      return db.localeCompare(da)
    })
}

export function getApplicationRow(id: EntityId): ApplicationRow | null {
  return getApplicationRows().find((r) => r.application.id === id) ?? null
}

export function getHubPipelineCounts() {
  const metrics = deriveMetrics({
    companies: getCompanies(),
    jobs: getJobs(),
    applications: getApplications(),
    notes: [],
  })
  return {
    applied: metrics.pipeline.applied + metrics.pipeline.screening,
    interview: metrics.pipeline.interview,
    offer: metrics.pipeline.offer + metrics.pipeline.accepted,
    rejected: metrics.pipeline.rejected,
    saved: metrics.pipeline.saved,
    total: metrics.totalApplications,
  }
}

function tryOrigin(url: string): string | undefined {
  try {
    return new URL(url).origin
  } catch {
    return undefined
  }
}

/** Reactive hook-friendly selectors via store subscription in components */
export function useApplicationRows(): ApplicationRow[] {
  const applications = useAppStore((s) => s.applications)
  const jobs = useAppStore((s) => s.jobs)
  const companies = useAppStore((s) => s.companies)

  return Object.values(applications)
    .map((application) => {
      const job = jobs[application.jobId]
      if (!job) return null
      const company = companies[job.companyId]
      if (!company) return null
      return { application, job, company } satisfies ApplicationRow
    })
    .filter((r): r is ApplicationRow => r !== null)
    .sort((a, b) => {
      const da = a.application.appliedAt ?? a.application.createdAt
      const db = b.application.appliedAt ?? b.application.createdAt
      return db.localeCompare(da)
    })
}

// re-export for convenience
export { getJobById }
