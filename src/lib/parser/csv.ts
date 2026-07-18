/**
 * Minimal CSV parser — handles quotes, commas, newlines in fields.
 */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let i = 0
  let inQuotes = false

  // Strip BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)

  while (i < text.length) {
    const c = text[i]

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += c
      i++
      continue
    }

    if (c === '"') {
      inQuotes = true
      i++
      continue
    }

    if (c === ',') {
      row.push(field)
      field = ''
      i++
      continue
    }

    if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      // skip completely empty trailing lines
      if (row.some((cell) => cell.trim() !== '')) {
        rows.push(row)
      }
      row = []
      i++
      continue
    }

    field += c
    i++
  }

  // last field
  row.push(field)
  if (row.some((cell) => cell.trim() !== '')) {
    rows.push(row)
  }

  return rows
}

export function headerKey(cell: string): string {
  return cell
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
    .replace(/[^a-z0-9]/g, '')
}
