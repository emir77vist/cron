import { useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  commitContactImport,
  updateImportRowCompany,
} from '@/lib/data/contacts'
import { useAppStore } from '@/stores/app-store'
import type {
  ContactImportCommitResult,
  ContactImportSession,
} from '@/types/contact-import'
import { partitionRows } from '@/lib/contacts/import-pipeline'
import { cn } from '@/lib/utils'

interface ImportReviewProps {
  session: ContactImportSession
  onCancel: () => void
  onCommitted: (result: ContactImportCommitResult) => void
}

export function ImportReview({
  session: initial,
  onCancel,
  onCommitted,
}: ImportReviewProps) {
  const [session, setSession] = useState(initial)
  const companies = useAppStore((s) => s.companies)
  const companyList = useMemo(
    () =>
      Object.values(companies).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      ),
    [companies],
  )

  const { matched, unmatched } = useMemo(
    () => partitionRows(session.rows.filter((r) => r.included)),
    [session.rows],
  )
  const excluded = session.rows.filter((r) => !r.included).length
  const includedCount = session.rows.filter((r) => r.included).length

  function setCompany(rowId: string, value: string) {
    const companyId = value === '__none__' ? null : value
    setSession((s) => updateImportRowCompany(s, rowId, companyId))
  }

  function toggleIncluded(rowId: string) {
    setSession((s) => ({
      ...s,
      rows: s.rows.map((r) =>
        r.rowId === rowId ? { ...r, included: !r.included } : r,
      ),
    }))
  }

  function toggleCreateCompany(rowId: string) {
    setSession((s) => ({
      ...s,
      rows: s.rows.map((r) =>
        r.rowId === rowId
          ? { ...r, createCompanyIfMissing: !r.createCompanyIfMissing }
          : r,
      ),
    }))
  }

  function handleConfirm() {
    // Explicit commit only
    const result = commitContactImport(session)
    onCommitted(result)
  }

  return (
    <section aria-label="Review import" className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-medium tracking-tight text-white">
            Review import
          </h2>
          <p className="mt-1 text-sm text-[#555555]">
            <span className="text-[#888888]">{session.fileName}</span>
            {' · '}
            Confirm matches before saving. Nothing is stored until you confirm.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-[#2A2A2A] bg-transparent text-[#888888] hover:bg-[#1A1A1A] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={includedCount === 0}
            onClick={handleConfirm}
            className="bg-white text-[#0A0A0A] hover:bg-white/90 disabled:opacity-40"
          >
            Confirm & save {includedCount > 0 ? `(${includedCount})` : ''}
          </Button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Matched" value={matched.length} emphasis />
        <SummaryCard label="Unmatched" value={unmatched.length} />
        <SummaryCard label="Excluded" value={excluded} />
        <SummaryCard label="In file" value={session.rows.length} />
      </div>

      {session.parseWarnings.length > 0 && (
        <ul className="space-y-1 text-xs text-[#555555]">
          {session.parseWarnings.slice(0, 5).map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      {matched.length > 0 && (
        <ReviewTable
          title="Matched to companies"
          description="Fuzzy match on company name. Adjust if wrong; applications auto-link."
          rows={session.rows.filter(
            (r) => r.included && r.matchedCompanyId != null,
          )}
          companyList={companyList}
          showCreateToggle={false}
          onCompanyChange={setCompany}
          onToggleIncluded={toggleIncluded}
          onToggleCreate={toggleCreateCompany}
        />
      )}

      {unmatched.length > 0 && (
        <ReviewTable
          title="Unmatched"
          description="No confident company match. Pick one, create on save, or exclude."
          rows={session.rows.filter(
            (r) => r.included && r.matchedCompanyId == null,
          )}
          companyList={companyList}
          showCreateToggle
          onCompanyChange={setCompany}
          onToggleIncluded={toggleIncluded}
          onToggleCreate={toggleCreateCompany}
        />
      )}

      {excluded > 0 && (
        <ReviewTable
          title="Excluded"
          description="These rows will not be saved."
          rows={session.rows.filter((r) => !r.included)}
          companyList={companyList}
          showCreateToggle={false}
          onCompanyChange={setCompany}
          onToggleIncluded={toggleIncluded}
          onToggleCreate={toggleCreateCompany}
        />
      )}
    </section>
  )
}

function SummaryCard({
  label,
  value,
  emphasis,
}: {
  label: string
  value: number
  emphasis?: boolean
}) {
  return (
    <div className="rounded-lg border border-[#2A2A2A] bg-[#141414] px-5 py-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#555555]">
        {label}
      </p>
      <p
        className={cn(
          'mt-3 text-3xl font-semibold tracking-tight tabular-nums',
          emphasis ? 'text-white' : 'text-[#888888]',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function ReviewTable({
  title,
  description,
  rows,
  companyList,
  showCreateToggle,
  onCompanyChange,
  onToggleIncluded,
  onToggleCreate,
}: {
  title: string
  description: string
  rows: ContactImportSession['rows']
  companyList: { id: string; name: string }[]
  showCreateToggle: boolean
  onCompanyChange: (rowId: string, value: string) => void
  onToggleIncluded: (rowId: string) => void
  onToggleCreate: (rowId: string) => void
}) {
  if (rows.length === 0) return null

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <p className="mt-1 text-xs text-[#555555]">{description}</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#141414]">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2A2A2A] hover:bg-transparent">
              <TableHead className="h-11 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                Contact
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                CSV company
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                Match to
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                Apps
              </TableHead>
              {showCreateToggle && (
                <TableHead className="h-11 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                  Create co.
                </TableHead>
              )}
              <TableHead className="h-11 w-12 px-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                <span className="sr-only">Include</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.rowId}
                className={cn(
                  'border-[#2A2A2A] hover:bg-[#1A1A1A]/50',
                  !row.included && 'opacity-50',
                )}
              >
                <TableCell className="px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{row.raw.name}</p>
                    <p className="mt-0.5 truncate text-xs text-[#555555]">
                      {[row.raw.title, row.raw.email].filter(Boolean).join(' · ') ||
                        '—'}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5 text-sm text-[#888888]">
                  {row.raw.company || (
                    <span className="text-[#555555]">—</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <Select
                    value={row.matchedCompanyId ?? '__none__'}
                    onValueChange={(v) => onCompanyChange(row.rowId, v ?? '__none__')}
                  >
                    <SelectTrigger className="h-8 w-[180px] border-[#2A2A2A] bg-[#0A0A0A] text-sm text-white">
                      <SelectValue placeholder="No company" />
                    </SelectTrigger>
                    <SelectContent className="border-[#2A2A2A] bg-[#141414] text-white">
                      <SelectItem value="__none__">No company</SelectItem>
                      {/* Prefer fuzzy candidates first */}
                      {row.candidates.map((c) => (
                        <SelectItem key={c.companyId} value={c.companyId}>
                          {c.name}
                          <span className="ml-2 text-[#555555]">
                            {Math.round(c.score * 100)}%
                          </span>
                        </SelectItem>
                      ))}
                      {companyList
                        .filter(
                          (c) =>
                            !row.candidates.some((x) => x.companyId === c.id),
                        )
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {row.matchedCompanyId && row.matchScore > 0 && (
                    <p className="mt-1 text-[10px] tabular-nums text-[#555555]">
                      {Math.round(row.matchScore * 100)}% confidence
                    </p>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3.5 text-sm tabular-nums text-[#888888]">
                  {row.linkedApplicationIds.length > 0
                    ? row.linkedApplicationIds.length
                    : '—'}
                </TableCell>
                {showCreateToggle && (
                  <TableCell className="px-4 py-3.5">
                    {row.raw.company && !row.matchedCompanyId ? (
                      <button
                        type="button"
                        onClick={() => onToggleCreate(row.rowId)}
                        className={cn(
                          'rounded-full border px-2.5 py-0.5 text-[11px] transition-colors',
                          row.createCompanyIfMissing
                            ? 'border-white/25 bg-white text-[#0A0A0A]'
                            : 'border-[#2A2A2A] text-[#555555] hover:text-[#888888]',
                        )}
                      >
                        {row.createCompanyIfMissing ? 'Yes' : 'No'}
                      </button>
                    ) : (
                      <span className="text-[#555555]">—</span>
                    )}
                  </TableCell>
                )}
                <TableCell className="px-2 py-3.5">
                  <button
                    type="button"
                    onClick={() => onToggleIncluded(row.rowId)}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-md transition-colors',
                      row.included
                        ? 'text-white hover:bg-[#1A1A1A]'
                        : 'text-[#555555] hover:bg-[#1A1A1A] hover:text-[#888888]',
                    )}
                    aria-label={row.included ? 'Exclude row' : 'Include row'}
                  >
                    {row.included ? (
                      <Check className="size-4" strokeWidth={1.75} />
                    ) : (
                      <X className="size-4" strokeWidth={1.75} />
                    )}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
