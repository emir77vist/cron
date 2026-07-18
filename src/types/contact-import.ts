import type { EntityId } from '@/types'

/** One row parsed from CSV (flexible headers). */
export interface ParsedContactRow {
  name: string
  email?: string
  phone?: string
  title?: string
  company?: string
  linkedin?: string
  notes?: string
  rawLine: number
}

export interface CompanyMatchCandidate {
  companyId: EntityId
  name: string
  score: number
}

/**
 * Draft row in the review screen — never persisted until user confirms.
 */
export interface ContactImportDraftRow {
  rowId: string
  raw: ParsedContactRow
  /** Selected company id, or null if unmatched / none */
  matchedCompanyId: EntityId | null
  matchScore: number
  candidates: CompanyMatchCandidate[]
  /** Application ids suggested from company match */
  linkedApplicationIds: EntityId[]
  /** User can exclude a row before commit */
  included: boolean
  /**
   * If unmatched and company name present, create a new Company on commit.
   * Default true for rows with a company string.
   */
  createCompanyIfMissing: boolean
}

export interface ContactImportSession {
  fileName: string
  importedAt: string
  rows: ContactImportDraftRow[]
  parseWarnings: string[]
}

export interface ContactImportCommitResult {
  contactsCreated: number
  companiesCreated: number
  applicationsLinked: number
  skipped: number
}
