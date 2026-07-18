/**
 * CSV → draft review session. Nothing is written to the store here.
 */

import { parseCsv, headerKey } from '@/lib/parser/csv'
import {
  COMPANY_MATCH_THRESHOLD,
  similarity,
} from '@/lib/fuzzy'
import { createId } from '@/lib/id'
import type { Application, Company, EntityId, Job } from '@/types'
import type {
  ContactImportDraftRow,
  ContactImportSession,
  CompanyMatchCandidate,
  ParsedContactRow,
} from '@/types/contact-import'

/** Flexible header aliases → field */
const HEADER_MAP: Record<string, keyof ParsedContactRow | 'skip'> = {
  name: 'name',
  fullname: 'name',
  contact: 'name',
  contactname: 'name',
  person: 'name',
  firstname: 'name', // alone; combined later if lastname present
  lastname: 'skip',
  email: 'email',
  emailaddress: 'email',
  mail: 'email',
  phone: 'phone',
  mobile: 'phone',
  tel: 'phone',
  telephone: 'phone',
  title: 'title',
  role: 'title',
  position: 'title',
  jobtitle: 'title',
  company: 'company',
  companyname: 'company',
  organization: 'company',
  organisation: 'company',
  employer: 'company',
  org: 'company',
  linkedin: 'linkedin',
  linkedinurl: 'linkedin',
  linkedinprofile: 'linkedin',
  url: 'linkedin',
  notes: 'notes',
  note: 'notes',
  comment: 'notes',
  comments: 'notes',
}

export interface ImportContext {
  companies: Company[]
  jobs: Job[]
  applications: Application[]
}

export function buildImportSession(
  fileName: string,
  csvText: string,
  ctx: ImportContext,
): ContactImportSession {
  const table = parseCsv(csvText)
  const warnings: string[] = []

  if (table.length === 0) {
    return {
      fileName,
      importedAt: new Date().toISOString(),
      rows: [],
      parseWarnings: ['CSV is empty.'],
    }
  }

  const headers = table[0].map(headerKey)
  const colIndex: Partial<Record<keyof ParsedContactRow, number>> = {}
  let firstNameIdx = -1
  let lastNameIdx = -1

  headers.forEach((h, i) => {
    if (h === 'firstname') firstNameIdx = i
    if (h === 'lastname' || h === 'surname') lastNameIdx = i
    const mapped = HEADER_MAP[h]
    if (mapped && mapped !== 'skip' && colIndex[mapped] === undefined) {
      colIndex[mapped] = i
    }
  })

  if (colIndex.name === undefined && firstNameIdx < 0) {
    warnings.push(
      'No name column found. Expected headers like Name, Full Name, or First Name.',
    )
  }

  const dataRows = table.slice(1)
  const rows: ContactImportDraftRow[] = []

  for (let r = 0; r < dataRows.length; r++) {
    const cells = dataRows[r]
    const get = (key: keyof ParsedContactRow) => {
      const idx = colIndex[key]
      if (idx === undefined) return undefined
      const v = cells[idx]?.trim()
      return v || undefined
    }

    let name = get('name') ?? ''
    if (!name && (firstNameIdx >= 0 || lastNameIdx >= 0)) {
      const first = firstNameIdx >= 0 ? cells[firstNameIdx]?.trim() ?? '' : ''
      const last = lastNameIdx >= 0 ? cells[lastNameIdx]?.trim() ?? '' : ''
      name = [first, last].filter(Boolean).join(' ')
    }

    if (!name) {
      warnings.push(`Row ${r + 2}: skipped — missing name.`)
      continue
    }

    const raw: ParsedContactRow = {
      name,
      email: get('email'),
      phone: get('phone'),
      title: get('title'),
      company: get('company'),
      linkedin: get('linkedin'),
      notes: get('notes'),
      rawLine: r + 2,
    }

    const match = matchCompany(raw.company, ctx.companies)
    const linkedApplicationIds =
      match.matchedCompanyId != null
        ? applicationsForCompany(
            match.matchedCompanyId,
            ctx.jobs,
            ctx.applications,
          )
        : []

    rows.push({
      rowId: createId('imp'),
      raw,
      matchedCompanyId: match.matchedCompanyId,
      matchScore: match.score,
      candidates: match.candidates,
      linkedApplicationIds,
      included: true,
      createCompanyIfMissing: Boolean(raw.company) && match.matchedCompanyId == null,
    })
  }

  if (rows.length === 0) {
    warnings.push('No valid contact rows to import.')
  }

  return {
    fileName,
    importedAt: new Date().toISOString(),
    rows,
    parseWarnings: warnings,
  }
}

function matchCompany(
  companyName: string | undefined,
  companies: Company[],
): {
  matchedCompanyId: EntityId | null
  score: number
  candidates: CompanyMatchCandidate[]
} {
  if (!companyName?.trim() || companies.length === 0) {
    return { matchedCompanyId: null, score: 0, candidates: [] }
  }

  const scored: CompanyMatchCandidate[] = companies
    .map((c) => ({
      companyId: c.id,
      name: c.name,
      score: similarity(companyName, c.name),
    }))
    .filter((c) => c.score >= 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const best = scored[0]
  if (best && best.score >= COMPANY_MATCH_THRESHOLD) {
    return {
      matchedCompanyId: best.companyId,
      score: best.score,
      candidates: scored,
    }
  }

  return {
    matchedCompanyId: null,
    score: best?.score ?? 0,
    candidates: scored,
  }
}

export function applicationsForCompany(
  companyId: EntityId,
  jobs: Job[],
  applications: Application[],
): EntityId[] {
  const jobIds = new Set(
    jobs.filter((j) => j.companyId === companyId).map((j) => j.id),
  )
  return applications
    .filter((a) => jobIds.has(a.jobId))
    .map((a) => a.id)
}

/** Recompute links when user changes company selection in review UI */
export function recomputeRowLinks(
  row: ContactImportDraftRow,
  companyId: EntityId | null,
  ctx: ImportContext,
): ContactImportDraftRow {
  if (!companyId) {
    return {
      ...row,
      matchedCompanyId: null,
      matchScore: 0,
      linkedApplicationIds: [],
      createCompanyIfMissing: Boolean(row.raw.company),
    }
  }
  const company = ctx.companies.find((c) => c.id === companyId)
  const score = company && row.raw.company
    ? similarity(row.raw.company, company.name)
    : company
      ? 1
      : 0
  return {
    ...row,
    matchedCompanyId: companyId,
    matchScore: score,
    linkedApplicationIds: applicationsForCompany(
      companyId,
      ctx.jobs,
      ctx.applications,
    ),
    createCompanyIfMissing: false,
  }
}

export function partitionRows(rows: ContactImportDraftRow[]) {
  const matched = rows.filter((r) => r.matchedCompanyId != null)
  const unmatched = rows.filter((r) => r.matchedCompanyId == null)
  return { matched, unmatched }
}
