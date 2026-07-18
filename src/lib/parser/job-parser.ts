/**
 * Job link / description parser.
 *
 * Primary strategy: **URL structure** (ATS path patterns).
 * Fallback: free-text heuristics on pasted job descriptions.
 *
 * Supported URL families:
 * - Greenhouse  boards.greenhouse.io / job-boards.greenhouse.io
 * - Lever       jobs.lever.co
 * - Ashby       jobs.ashbyhq.com
 * - Workday     *.myworkdayjobs.com
 * - LinkedIn    linkedin.com/jobs/view
 * - SmartRecruiters, Workable, Wellfound, Indeed, Greenhouse embed
 */

import type { JobLocationType, JobSeniority, JobSource } from '@/types'
import type { ParsedJobDraft } from '@/types/job-draft'

// ─── Public API ─────────────────────────────────────────────

/**
 * Parse pasted input. If a URL is present, URL structure wins;
 * remaining text (if any) fills gaps. Pure text uses heuristics only.
 */
export function parseJobInput(raw: string): ParsedJobDraft {
  const input = raw.trim()
  if (!input) {
    return blankParsed({
      warnings: ['Nothing to parse — paste a job URL or description.'],
      confidence: 'low',
    })
  }

  const urls = extractUrls(input)
  const textBody = stripUrls(input, urls).trim()

  if (urls.length > 0) {
    const fromUrl = parseJobUrl(urls[0])
    if (textBody.length > 40) {
      const fromText = parseJobText(textBody)
      return mergeParsed(fromUrl, fromText, urls[0])
    }
    return fromUrl
  }

  return parseJobText(input)
}

export function parseJobUrl(urlString: string): ParsedJobDraft {
  let url: URL
  try {
    url = new URL(normalizeUrl(urlString))
  } catch {
    return blankParsed({
      url: urlString,
      warnings: ['Could not parse URL.'],
      confidence: 'low',
      parseMethod: 'url',
    })
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  const path = url.pathname

  // Greenhouse
  if (
    host === 'boards.greenhouse.io' ||
    host === 'job-boards.greenhouse.io' ||
    host.endsWith('.greenhouse.io')
  ) {
    return parseGreenhouse(url, host, path)
  }

  // Lever
  if (host === 'jobs.lever.co' || host.endsWith('.lever.co')) {
    return parseLever(url, path)
  }

  // Ashby
  if (host === 'jobs.ashbyhq.com' || host.endsWith('.ashbyhq.com')) {
    return parseAshby(url, path)
  }

  // Workday
  if (host.includes('myworkdayjobs.com') || host.includes('workdayjobs.com')) {
    return parseWorkday(url, host, path)
  }

  // LinkedIn
  if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) {
    return parseLinkedIn(url, path)
  }

  // SmartRecruiters
  if (host === 'jobs.smartrecruiters.com' || host.includes('smartrecruiters.com')) {
    return parseSmartRecruiters(url, path)
  }

  // Workable
  if (host === 'apply.workable.com' || host.endsWith('.workable.com')) {
    return parseWorkable(url, path)
  }

  // Wellfound / AngelList
  if (host === 'wellfound.com' || host === 'angel.co') {
    return parseWellfound(url, path)
  }

  // Indeed
  if (host.includes('indeed.com')) {
    return parseIndeed(url)
  }

  // Generic company careers path
  return parseGenericCareers(url, host, path)
}

// ─── ATS parsers ────────────────────────────────────────────

/**
 * Greenhouse:
 *   https://boards.greenhouse.io/{board}/jobs/{id}
 *   https://job-boards.greenhouse.io/{board}/jobs/{id}
 *   https://boards.greenhouse.io/embed/job_app?for={board}&token={id}
 */
function parseGreenhouse(url: URL, host: string, path: string): ParsedJobDraft {
  const warnings: string[] = []
  let boardToken: string | undefined
  let externalJobId: string | undefined
  let title = ''

  const embedFor = url.searchParams.get('for')
  const embedToken = url.searchParams.get('token') ?? url.searchParams.get('gh_jid')
  if (embedFor) {
    boardToken = embedFor
    externalJobId = embedToken ?? undefined
  }

  // /{board}/jobs/{id}[/job-title-slug]
  const m = path.match(/^\/([^/]+)\/jobs\/([^/]+)(?:\/([^/]+))?/i)
  if (m) {
    boardToken = boardToken ?? m[1]
    externalJobId = externalJobId ?? m[2]
    if (m[3]) title = slugToTitle(m[3])
  }

  // Subdomain boards: acme.greenhouse.io
  if (!boardToken && host.endsWith('.greenhouse.io')) {
    const sub = host.replace(/\.greenhouse\.io$/, '')
    if (sub && sub !== 'boards' && sub !== 'job-boards') {
      boardToken = sub
    }
  }

  const companyName = boardToken ? slugToCompany(boardToken) : ''
  if (!companyName) warnings.push('Could not infer company from Greenhouse URL.')
  if (!title) warnings.push('Role title not in URL — fill it in below.')

  return {
    companyName,
    title,
    locationType: 'unknown',
    seniority: inferSeniority(title),
    source: 'greenhouse',
    url: url.toString(),
    parseMethod: 'url',
    boardToken,
    externalJobId,
    confidence: companyName && title ? 'high' : companyName || title ? 'medium' : 'low',
    warnings,
  }
}

/**
 * Lever:
 *   https://jobs.lever.co/{company}/{postingId}
 *   https://jobs.lever.co/{company}/{postingId}/apply
 */
function parseLever(url: URL, path: string): ParsedJobDraft {
  const warnings: string[] = []
  const parts = path.split('/').filter(Boolean)
  const companySlug = parts[0]
  const postingId = parts[1] && parts[1] !== 'apply' ? parts[1] : undefined

  // Sometimes title is embedded after id as slug, or posting id is uuid-like
  let title = ''
  if (postingId && !looksLikeUuid(postingId) && postingId.length > 8) {
    // Lever often uses UUID; if not, might be slug
    if (!/^[0-9a-f-]{20,}$/i.test(postingId)) {
      title = slugToTitle(postingId)
    }
  }

  const companyName = companySlug ? slugToCompany(companySlug) : ''
  if (!companyName) warnings.push('Could not infer company from Lever URL.')
  if (!title) warnings.push('Role title not in URL — fill it in below.')

  return {
    companyName,
    title,
    locationType: 'unknown',
    seniority: inferSeniority(title),
    source: 'lever',
    url: url.toString(),
    parseMethod: 'url',
    boardToken: companySlug,
    externalJobId: postingId,
    confidence: companyName ? (title ? 'high' : 'medium') : 'low',
    warnings,
  }
}

/**
 * Ashby:
 *   https://jobs.ashbyhq.com/{orgSlug}/{jobId}
 *   https://jobs.ashbyhq.com/{orgSlug}
 */
function parseAshby(url: URL, path: string): ParsedJobDraft {
  const warnings: string[] = []
  const parts = path.split('/').filter(Boolean)
  const orgSlug = parts[0]
  const jobPart = parts[1]

  let title = ''
  let externalJobId: string | undefined

  if (jobPart) {
    // Ashby ids are often uuid; title may be query or next segment
    if (looksLikeUuid(jobPart) || /^[0-9a-f-]{16,}$/i.test(jobPart)) {
      externalJobId = jobPart
      if (parts[2]) title = slugToTitle(parts[2])
    } else {
      title = slugToTitle(jobPart)
      externalJobId = jobPart
    }
  }

  // ?utm... ignore; some ashby links put title in hash
  const companyName = orgSlug ? slugToCompany(orgSlug) : ''
  if (!companyName) warnings.push('Could not infer company from Ashby URL.')
  if (!title) warnings.push('Role title not in URL — fill it in below.')

  return {
    companyName,
    title,
    locationType: 'unknown',
    seniority: inferSeniority(title),
    source: 'ashby',
    url: url.toString(),
    parseMethod: 'url',
    boardToken: orgSlug,
    externalJobId,
    confidence: companyName ? (title ? 'high' : 'medium') : 'low',
    warnings,
  }
}

/**
 * Workday:
 *   https://{tenant}.wd5.myworkdayjobs.com/{site}/job/{Job-Title}_{id}
 *   https://{tenant}.wd1.myworkdayjobs.com/en-US/{site}/details/{Job-Title}_{id}
 */
function parseWorkday(url: URL, host: string, path: string): ParsedJobDraft {
  const warnings: string[] = []
  const tenant = host.split('.')[0]
  let title = ''
  let externalJobId: string | undefined

  const jobSeg =
    path.match(/\/job\/([^/]+)/i)?.[1] ??
    path.match(/\/details\/([^/]+)/i)?.[1] ??
    path.split('/').filter(Boolean).pop()

  if (jobSeg) {
    // Often "Senior-Software-Engineer_R-12345"
    const und = jobSeg.lastIndexOf('_')
    if (und > 0) {
      title = slugToTitle(jobSeg.slice(0, und))
      externalJobId = jobSeg.slice(und + 1)
    } else {
      title = slugToTitle(jobSeg)
    }
  }

  const companyName = tenant && !tenant.startsWith('wd') ? slugToCompany(tenant) : ''
  if (!companyName) warnings.push('Could not infer company from Workday host.')
  if (!title) warnings.push('Role title not clear from Workday path.')

  return {
    companyName,
    title,
    locationType: 'unknown',
    seniority: inferSeniority(title),
    source: 'company-site',
    url: url.toString(),
    parseMethod: 'url',
    boardToken: tenant,
    externalJobId,
    confidence: title ? 'medium' : 'low',
    warnings,
  }
}

/**
 * LinkedIn:
 *   /jobs/view/{id}/
 *   /jobs/view/{title-at-company}-{id}
 */
function parseLinkedIn(url: URL, path: string): ParsedJobDraft {
  const warnings: string[] = []
  let title = ''
  let companyName = ''
  let externalJobId: string | undefined

  const m = path.match(/\/jobs\/view\/([^/]+)/i)
  if (m) {
    const slug = decodeURIComponent(m[1])
    const idMatch = slug.match(/-?(\d{8,})$/)
    if (idMatch) externalJobId = idMatch[1]

    // title-at-company-id
    const at = slug.match(/^(.*?)-at-(.*?)-(\d+)$/i)
    if (at) {
      title = slugToTitle(at[1])
      companyName = slugToCompany(at[2])
    } else if (!/^\d+$/.test(slug)) {
      title = slugToTitle(slug.replace(/-\d+$/, ''))
    }
  }

  if (!title) warnings.push('LinkedIn URL has limited metadata — add role title.')
  if (!companyName) warnings.push('Company not in LinkedIn URL path — add company.')

  return {
    companyName,
    title,
    locationType: 'unknown',
    seniority: inferSeniority(title),
    source: 'linkedin',
    url: url.toString(),
    parseMethod: 'url',
    externalJobId,
    confidence: title && companyName ? 'medium' : 'low',
    warnings,
  }
}

/**
 * SmartRecruiters:
 *   https://jobs.smartrecruiters.com/{company}/{id}-{title}
 */
function parseSmartRecruiters(url: URL, path: string): ParsedJobDraft {
  const parts = path.split('/').filter(Boolean)
  const companySlug = parts[0]
  const jobSeg = parts[1] ?? ''
  const idTitle = jobSeg.match(/^(\d+)-?(.*)$/)
  const externalJobId = idTitle?.[1]
  const title = idTitle?.[2] ? slugToTitle(idTitle[2]) : jobSeg ? slugToTitle(jobSeg) : ''

  return {
    companyName: companySlug ? slugToCompany(companySlug) : '',
    title,
    locationType: 'unknown',
    seniority: inferSeniority(title),
    source: 'other',
    url: url.toString(),
    parseMethod: 'url',
    boardToken: companySlug,
    externalJobId,
    confidence: companySlug ? 'medium' : 'low',
    warnings: title ? [] : ['Role title missing from SmartRecruiters URL.'],
  }
}

/**
 * Workable:
 *   https://apply.workable.com/{company}/j/{shortcode}/
 */
function parseWorkable(url: URL, path: string): ParsedJobDraft {
  const parts = path.split('/').filter(Boolean)
  const companySlug = parts[0]
  let externalJobId: string | undefined
  const jIdx = parts.indexOf('j')
  if (jIdx >= 0 && parts[jIdx + 1]) externalJobId = parts[jIdx + 1]

  return {
    companyName: companySlug ? slugToCompany(companySlug) : '',
    title: '',
    locationType: 'unknown',
    seniority: 'unknown',
    source: 'other',
    url: url.toString(),
    parseMethod: 'url',
    boardToken: companySlug,
    externalJobId,
    confidence: companySlug ? 'medium' : 'low',
    warnings: ['Workable URLs rarely include the role title — fill it in below.'],
  }
}

/**
 * Wellfound:
 *   /company/{slug}/jobs/{id}-{title}
 */
function parseWellfound(url: URL, path: string): ParsedJobDraft {
  const companyM = path.match(/\/company\/([^/]+)/i)
  const jobM = path.match(/\/jobs\/([^/]+)/i)
  const companyName = companyM ? slugToCompany(companyM[1]) : ''
  let title = ''
  let externalJobId: string | undefined
  if (jobM) {
    const seg = jobM[1]
    const m = seg.match(/^(\d+)-(.+)$/)
    if (m) {
      externalJobId = m[1]
      title = slugToTitle(m[2])
    } else {
      title = slugToTitle(seg)
    }
  }
  return {
    companyName,
    title,
    locationType: 'unknown',
    seniority: inferSeniority(title),
    source: 'other',
    url: url.toString(),
    parseMethod: 'url',
    boardToken: companyM?.[1],
    externalJobId,
    confidence: companyName || title ? 'medium' : 'low',
    warnings: [],
  }
}

function parseIndeed(url: URL): ParsedJobDraft {
  const title = url.searchParams.get('q') ?? ''
  const location = url.searchParams.get('l') ?? undefined
  const jk = url.searchParams.get('jk') ?? undefined
  return {
    companyName: '',
    title: title ? slugToTitle(title.replace(/\+/g, ' ')) : '',
    location,
    locationType: location ? inferLocationType(location) : 'unknown',
    seniority: inferSeniority(title),
    source: 'other',
    url: url.toString(),
    parseMethod: 'url',
    externalJobId: jk ?? undefined,
    confidence: 'low',
    warnings: ['Indeed links usually need company & role filled manually.'],
  }
}

function parseGenericCareers(url: URL, host: string, path: string): ParsedJobDraft {
  const warnings = [
    'Unrecognized ATS — inferred company from domain; verify fields.',
  ]
  // Strip common hosts
  let companyName = ''
  const base = host.replace(/\.(com|io|co|ai|dev|org|net|app)$/i, '')
  if (
    !['jobs', 'careers', 'boards', 'apply', 'www', 'go', 'app'].includes(base) &&
    !base.includes('.')
  ) {
    companyName = slugToCompany(base)
  } else {
    // acme.jobs.com → acme
    const parts = host.split('.')
    if (parts.length >= 3) companyName = slugToCompany(parts[0])
  }

  // /careers/job/senior-engineer or /jobs/senior-engineer
  let title = ''
  const jobPath = path.match(
    /\/(?:jobs?|careers?|positions?|openings?)\/(?:job\/)?([^/?#]+)/i,
  )
  if (jobPath) title = slugToTitle(jobPath[1])

  return {
    companyName,
    title,
    locationType: 'unknown',
    seniority: inferSeniority(title),
    source: 'company-site',
    url: url.toString(),
    parseMethod: 'url',
    confidence: companyName || title ? 'medium' : 'low',
    warnings,
  }
}

// ─── Text fallback ──────────────────────────────────────────

export function parseJobText(text: string): ParsedJobDraft {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const warnings: string[] = []
  let title = ''
  let companyName = ''
  let location: string | undefined
  let description = text.slice(0, 4000)

  // Labeled fields
  for (const line of lines.slice(0, 30)) {
    const companyLabeled = matchLabel(line, [
      'company',
      'organization',
      'employer',
      'about the company',
    ])
    if (companyLabeled && !companyName) companyName = cleanCompany(companyLabeled)

    const titleLabeled = matchLabel(line, [
      'title',
      'role',
      'position',
      'job title',
    ])
    if (titleLabeled && !title) title = cleanTitle(titleLabeled)

    const locLabeled = matchLabel(line, ['location', 'based in', 'office'])
    if (locLabeled && !location) location = locLabeled
  }

  // "Role at Company" / "Role @ Company"
  if (!title || !companyName) {
    for (const line of lines.slice(0, 12)) {
      const at = line.match(
        /^(.{3,80}?)\s+(?:at|@|–|-|—)\s+([A-Z][A-Za-z0-9 .&'/-]{1,60})$/,
      )
      if (at) {
        if (!title) title = cleanTitle(at[1])
        if (!companyName) companyName = cleanCompany(at[2])
        break
      }
    }
  }

  // First non-meta line as title
  if (!title) {
    const first = lines.find(
      (l) =>
        l.length > 4 &&
        l.length < 100 &&
        !/^(http|www\.|location|about|we are|description)/i.test(l),
    )
    if (first) title = cleanTitle(first)
  }

  // "Join Company" / "Company is hiring"
  if (!companyName) {
    for (const line of lines.slice(0, 20)) {
      const join = line.match(/\b(?:join|about)\s+([A-Z][A-Za-z0-9 .&']{1,40})\b/)
      if (join) {
        companyName = cleanCompany(join[1])
        break
      }
      const hiring = line.match(
        /\b([A-Z][A-Za-z0-9 .&']{1,40})\s+is\s+hiring\b/i,
      )
      if (hiring) {
        companyName = cleanCompany(hiring[1])
        break
      }
    }
  }

  // Location heuristics
  if (!location) {
    for (const line of lines.slice(0, 25)) {
      if (
        /\b(remote|hybrid|on-?site|san francisco|new york|london|nyc|sf bay|united states|berlin|toronto)\b/i.test(
          line,
        ) &&
        line.length < 80
      ) {
        location = line
        break
      }
    }
  }

  if (!title) warnings.push('Could not detect role title from text.')
  if (!companyName) warnings.push('Could not detect company from text.')

  return {
    companyName,
    title,
    location,
    locationType: location ? inferLocationType(location) : 'unknown',
    seniority: inferSeniority(title),
    source: 'other',
    description,
    parseMethod: 'text',
    confidence:
      title && companyName ? 'medium' : title || companyName ? 'low' : 'low',
    warnings,
  }
}

// ─── Merge / helpers ────────────────────────────────────────

function mergeParsed(
  urlDraft: ParsedJobDraft,
  textDraft: ParsedJobDraft,
  url: string,
): ParsedJobDraft {
  const warnings = [...urlDraft.warnings]
  const companyName = urlDraft.companyName || textDraft.companyName
  const title = urlDraft.title || textDraft.title
  const location = urlDraft.location || textDraft.location

  if (!urlDraft.companyName && textDraft.companyName) {
    warnings.push('Company filled from pasted text.')
  }
  if (!urlDraft.title && textDraft.title) {
    warnings.push('Role title filled from pasted text.')
  }

  return {
    companyName,
    title,
    location,
    locationType:
      urlDraft.locationType !== 'unknown'
        ? urlDraft.locationType
        : textDraft.locationType,
    seniority:
      urlDraft.seniority !== 'unknown' ? urlDraft.seniority : textDraft.seniority,
    source: urlDraft.source !== 'other' ? urlDraft.source : textDraft.source,
    url,
    description: textDraft.description,
    parseMethod: 'mixed',
    boardToken: urlDraft.boardToken,
    externalJobId: urlDraft.externalJobId,
    confidence:
      companyName && title
        ? urlDraft.confidence === 'high'
          ? 'high'
          : 'medium'
        : 'low',
    warnings: warnings.filter((w, i, a) => a.indexOf(w) === i),
  }
}

function blankParsed(
  partial: Partial<ParsedJobDraft> & {
    warnings: string[]
    confidence: ParsedJobDraft['confidence']
  },
): ParsedJobDraft {
  return {
    companyName: '',
    title: '',
    locationType: 'unknown',
    seniority: 'unknown',
    source: 'other',
    parseMethod: 'text',
    ...partial,
  }
}

function normalizeUrl(s: string): string {
  const t = s.trim()
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t}`
}

function extractUrls(text: string): string[] {
  const re = /https?:\/\/[^\s<>"')\]]+/gi
  const found = text.match(re) ?? []
  // Also bare domains with path for job boards
  const bare =
    text.match(
      /(?:^|\s)((?:boards\.greenhouse\.io|jobs\.lever\.co|jobs\.ashbyhq\.com|linkedin\.com\/jobs)[^\s<>"')\]]*)/gi,
    ) ?? []
  return [
    ...found.map((u) => u.replace(/[.,;:]+$/, '')),
    ...bare.map((u) => u.trim().replace(/[.,;:]+$/, '')),
  ]
}

function stripUrls(text: string, urls: string[]): string {
  let out = text
  for (const u of urls) out = out.replace(u, ' ')
  return out
}

function slugToTitle(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/\+/g, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\b(And|Or|Of|The|For|In|At|To)\b/g, (w) => w.toLowerCase())
    .replace(/^\w/, (c) => c.toUpperCase())
}

function slugToCompany(slug: string): string {
  const known: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    xai: 'xAI',
    spacex: 'SpaceX',
    stripe: 'Stripe',
    notion: 'Notion',
    figma: 'Figma',
    linear: 'Linear',
    vercel: 'Vercel',
    airbnb: 'Airbnb',
    nvidia: 'NVIDIA',
    meta: 'Meta',
    google: 'Google',
    apple: 'Apple',
    amazon: 'Amazon',
    netflix: 'Netflix',
    coinbase: 'Coinbase',
    databricks: 'Databricks',
    snowflake: 'Snowflake',
    palantir: 'Palantir',
    scaleai: 'Scale AI',
    'scale-ai': 'Scale AI',
  }
  const key = slug.toLowerCase().replace(/\s+/g, '')
  if (known[key]) return known[key]
  return slugToTitle(slug)
}

function cleanTitle(s: string): string {
  return s.replace(/^[-–—:\s]+/, '').replace(/\s+/g, ' ').trim()
}

function cleanCompany(s: string): string {
  return s
    .replace(/\s+(Inc\.?|LLC|Ltd\.?|Corp\.?)$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchLabel(line: string, labels: string[]): string | null {
  for (const label of labels) {
    const re = new RegExp(`^${label}\\s*[:：]\\s*(.+)$`, 'i')
    const m = line.match(re)
    if (m) return m[1].trim()
  }
  return null
}

function looksLikeUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s,
  )
}

export function inferSeniority(title: string): JobSeniority {
  const t = title.toLowerCase()
  if (/\b(intern|internship)\b/.test(t)) return 'intern'
  if (/\b(principal|distinguished)\b/.test(t)) return 'principal'
  if (/\b(staff)\b/.test(t)) return 'staff'
  if (/\b(senior|sr\.?)\b/.test(t)) return 'senior'
  if (/\b(junior|jr\.?|entry[- ]level|new grad|early career)\b/.test(t))
    return 'entry'
  if (/\b(mid[- ]level|ii\b|2\b)\b/.test(t)) return 'mid'
  return 'unknown'
}

export function inferLocationType(location: string): JobLocationType {
  const l = location.toLowerCase()
  if (/\bremote\b/.test(l) && /\bhybrid\b/.test(l)) return 'hybrid'
  if (/\bremote\b/.test(l)) return 'remote'
  if (/\bhybrid\b/.test(l)) return 'hybrid'
  if (/\b(on-?site|in-?office)\b/.test(l)) return 'onsite'
  return 'unknown'
}

export function sourceLabel(source: JobSource): string {
  const map: Record<JobSource, string> = {
    greenhouse: 'Greenhouse',
    lever: 'Lever',
    ashby: 'Ashby',
    linkedin: 'LinkedIn',
    'company-site': 'Company site',
    referral: 'Referral',
    other: 'Other',
  }
  return map[source]
}
