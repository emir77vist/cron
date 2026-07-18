import type {
  ApplicationStatus,
  JobLocationType,
  JobSeniority,
  JobSource,
} from '@/types'

/** Result of parsing a URL or pasted job description. */
export interface ParsedJobDraft {
  companyName: string
  title: string
  location?: string
  locationType: JobLocationType
  seniority: JobSeniority
  source: JobSource
  url?: string
  description?: string
  /** How the parser obtained the fields */
  parseMethod: 'url' | 'text' | 'mixed'
  /** ATS board / org slug when known */
  boardToken?: string
  externalJobId?: string
  confidence: 'high' | 'medium' | 'low'
  warnings: string[]
}

/** Editable draft before commit to the applications collection. */
export interface JobApplicationDraft {
  companyName: string
  title: string
  location: string
  locationType: JobLocationType
  seniority: JobSeniority
  source: JobSource
  url: string
  status: ApplicationStatus
  notes: string
  appliedAt: string
  description: string
}

export function emptyDraft(): JobApplicationDraft {
  return {
    companyName: '',
    title: '',
    location: '',
    locationType: 'unknown',
    seniority: 'unknown',
    source: 'other',
    url: '',
    status: 'saved',
    notes: '',
    appliedAt: new Date().toISOString().slice(0, 10),
    description: '',
  }
}

export function draftFromParsed(parsed: ParsedJobDraft): JobApplicationDraft {
  return {
    companyName: parsed.companyName,
    title: parsed.title,
    location: parsed.location ?? '',
    locationType: parsed.locationType,
    seniority: parsed.seniority,
    source: parsed.source,
    url: parsed.url ?? '',
    status: 'saved',
    notes: '',
    appliedAt: new Date().toISOString().slice(0, 10),
    description: parsed.description ?? '',
  }
}
