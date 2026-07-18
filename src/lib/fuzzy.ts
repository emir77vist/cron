/**
 * Lightweight fuzzy string matching for company names.
 * Normalize → exact / contains / token / Levenshtein ratio.
 */

export function normalizeName(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(
      /\b(inc|incorporated|llc|ltd|limited|corp|corporation|co|company|the|group|holdings)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim()
}

/** 0–1 similarity score */
export function similarity(a: string, b: string): number {
  const na = normalizeName(a)
  const nb = normalizeName(b)
  if (!na || !nb) return 0
  if (na === nb) return 1

  // Containment
  if (na.includes(nb) || nb.includes(na)) {
    const shorter = Math.min(na.length, nb.length)
    const longer = Math.max(na.length, nb.length)
    return 0.85 + 0.15 * (shorter / longer)
  }

  // Token Jaccard
  const ta = new Set(na.split(' ').filter(Boolean))
  const tb = new Set(nb.split(' ').filter(Boolean))
  if (ta.size && tb.size) {
    let inter = 0
    for (const t of ta) if (tb.has(t)) inter++
    const union = ta.size + tb.size - inter
    const jaccard = union === 0 ? 0 : inter / union
    if (jaccard >= 0.5) {
      // blend with edit distance
      return Math.max(jaccard, levenshteinRatio(na, nb))
    }
  }

  return levenshteinRatio(na, nb)
}

function levenshteinRatio(a: string, b: string): number {
  if (a === b) return 1
  const m = a.length
  const n = b.length
  if (m === 0 || n === 0) return 0

  // Cap expensive compares
  if (Math.abs(m - n) > 12 && Math.max(m, n) > 20) {
    return 0
  }

  const prev = new Array<number>(n + 1)
  const curr = new Array<number>(n + 1)
  for (let j = 0; j <= n; j++) prev[j] = j

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      )
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j]
  }

  const dist = prev[n]
  return 1 - dist / Math.max(m, n)
}

/** Default threshold for “matched” company */
export const COMPANY_MATCH_THRESHOLD = 0.72
