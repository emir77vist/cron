/**
 * Contact data-access + explicit import commit.
 * Import never writes until commitContactImport is called.
 */

import { createId } from '@/lib/id'
import { useAppStore } from '@/stores/app-store'
import type { Company, Contact, EntityId } from '@/types'
import type {
  ContactImportCommitResult,
  ContactImportSession,
} from '@/types/contact-import'
import {
  getApplications,
  getCompanies,
  getJobs,
  upsertCompany,
  upsertContact as upsertContactRaw,
} from '@/lib/data/index'
import {
  applicationsForCompany,
  buildImportSession,
  recomputeRowLinks,
  type ImportContext,
} from '@/lib/contacts/import-pipeline'

function nowIso() {
  return new Date().toISOString()
}

function snapshotCtx(): ImportContext {
  return {
    companies: getCompanies(),
    jobs: getJobs(),
    applications: getApplications(),
  }
}

export function getContacts(): Contact[] {
  return Object.values(useAppStore.getState().contacts)
}

export function getContactById(id: EntityId): Contact | undefined {
  return useAppStore.getState().contacts[id]
}

export function upsertContact(contact: Contact): void {
  upsertContactRaw(contact)
}

export function deleteContact(id: EntityId): void {
  useAppStore.getState().deleteContact(id)
}

export function useContacts(): Contact[] {
  const contacts = useAppStore((s) => s.contacts)
  return Object.values(contacts).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )
}

/** Parse file text into a review session — no store writes. */
export function prepareCsvImport(
  fileName: string,
  csvText: string,
): ContactImportSession {
  return buildImportSession(fileName, csvText, snapshotCtx())
}

export function updateImportRowCompany(
  session: ContactImportSession,
  rowId: string,
  companyId: EntityId | null,
): ContactImportSession {
  const ctx = snapshotCtx()
  return {
    ...session,
    rows: session.rows.map((row) =>
      row.rowId === rowId ? recomputeRowLinks(row, companyId, ctx) : row,
    ),
  }
}

/**
 * Persist included rows only. Explicit user action required.
 * Creates missing companies when createCompanyIfMissing is set.
 */
export function commitContactImport(
  session: ContactImportSession,
): ContactImportCommitResult {
  const result: ContactImportCommitResult = {
    contactsCreated: 0,
    companiesCreated: 0,
    applicationsLinked: 0,
    skipped: 0,
  }

  const companyByName = new Map(
    getCompanies().map((c) => [c.name.toLowerCase(), c]),
  )

  for (const row of session.rows) {
    if (!row.included) {
      result.skipped++
      continue
    }

    let companyId = row.matchedCompanyId ?? undefined
    let companyNameRaw = row.raw.company

    if (!companyId && row.createCompanyIfMissing && row.raw.company?.trim()) {
      const key = row.raw.company.trim().toLowerCase()
      const existing = companyByName.get(key)
      if (existing) {
        companyId = existing.id
      } else {
        const company: Company = {
          id: createId('co'),
          name: row.raw.company.trim(),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        upsertCompany(company)
        companyByName.set(key, company)
        companyId = company.id
        result.companiesCreated++
      }
    }

    let applicationIds: EntityId[] = []
    if (companyId) {
      applicationIds = applicationsForCompany(
        companyId,
        getJobs(),
        getApplications(),
      )
      // Prefer user-confirmed links from review if still valid
      if (row.linkedApplicationIds.length > 0) {
        const set = new Set(applicationIds)
        applicationIds = row.linkedApplicationIds.filter((id) => set.has(id))
        if (applicationIds.length === 0) {
          applicationIds = applicationsForCompany(
            companyId,
            getJobs(),
            getApplications(),
          )
        }
      }
    }

    const contact: Contact = {
      id: createId('ct'),
      name: row.raw.name.trim(),
      email: row.raw.email?.trim() || undefined,
      phone: row.raw.phone?.trim() || undefined,
      title: row.raw.title?.trim() || undefined,
      linkedin: row.raw.linkedin?.trim() || undefined,
      notes: row.raw.notes?.trim() || undefined,
      companyId,
      companyNameRaw: companyNameRaw?.trim() || undefined,
      applicationIds,
      source: 'csv',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    upsertContact(contact)
    result.contactsCreated++
    result.applicationsLinked += applicationIds.length
  }

  return result
}

export function getContactCompanyName(contact: Contact): string {
  if (contact.companyId) {
    const c = useAppStore.getState().companies[contact.companyId]
    if (c) return c.name
  }
  return contact.companyNameRaw ?? '—'
}

export function getLinkedApplicationSummaries(contact: Contact): {
  id: EntityId
  company: string
  role: string
  status: string
}[] {
  const state = useAppStore.getState()
  return contact.applicationIds
    .map((id) => {
      const app = state.applications[id]
      if (!app) return null
      const job = state.jobs[app.jobId]
      const company = job ? state.companies[job.companyId] : undefined
      return {
        id,
        company: company?.name ?? '—',
        role: job?.title ?? '—',
        status: app.status,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
}
