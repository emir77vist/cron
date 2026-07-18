import { useState } from 'react'
import {
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { StatusBadge } from '@/features/job-hub/StatusBadge'
import {
  removeApplication,
  updateApplicationNotes,
  updateApplicationStatus,
  useApplicationRows,
  type ApplicationRow,
} from '@/lib/data/applications'
import { formatDate, STATUS_LABELS, STATUS_OPTIONS } from '@/lib/format'
import type { ApplicationStatus } from '@/types'
import { cn } from '@/lib/utils'

export function ApplicationsTable() {
  const rows = useApplicationRows()
  const [notesRow, setNotesRow] = useState<ApplicationRow | null>(null)
  const [notesText, setNotesText] = useState('')

  function openNotes(row: ApplicationRow) {
    setNotesRow(row)
    setNotesText(row.application.notes ?? '')
  }

  function saveNotes() {
    if (!notesRow) return
    updateApplicationNotes(notesRow.application.id, notesText)
    setNotesRow(null)
  }

  if (rows.length === 0) {
    return (
      <section aria-label="Applications">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-medium tracking-tight text-white">
            Applications
          </h2>
        </div>
        <div className="rounded-lg border border-dashed border-[#2A2A2A] bg-[#141414]/50 px-8 py-16 text-center">
          <p className="text-sm font-medium text-white">No applications yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#555555]">
            Paste a job link above to parse company and role, review the draft,
            and add it to your pipeline.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section aria-label="Applications">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-medium tracking-tight text-white">
          Applications
        </h2>
        <span className="text-xs text-[#555555]">{rows.length} roles</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#141414]">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2A2A2A] hover:bg-transparent">
              <TableHead className="h-11 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                Company
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                Role
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                Status
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                Date
              </TableHead>
              <TableHead className="h-11 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                Notes
              </TableHead>
              <TableHead className="h-11 w-12 px-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#555555]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.application.id}
                className="border-[#2A2A2A] hover:bg-[#1A1A1A]/60"
              >
                <TableCell className="px-4 py-3.5">
                  <span className="font-medium text-white">
                    {row.company.name}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white">{row.job.title}</span>
                    {row.job.location && (
                      <span className="text-xs text-[#555555]">
                        {row.job.location}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <StatusSelect
                    status={row.application.status}
                    onChange={(status) =>
                      updateApplicationStatus(row.application.id, status)
                    }
                  />
                </TableCell>
                <TableCell className="px-4 py-3.5 text-[#888888] tabular-nums">
                  {formatDate(
                    row.application.appliedAt ?? row.application.createdAt,
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => openNotes(row)}
                    className={cn(
                      'block w-full truncate text-left text-sm transition-colors',
                      row.application.notes
                        ? 'text-[#888888] hover:text-white'
                        : 'text-[#555555] hover:text-[#888888]',
                    )}
                  >
                    {row.application.notes || 'Add note…'}
                  </button>
                </TableCell>
                <TableCell className="px-2 py-3.5">
                  <RowActions row={row} onEditNotes={() => openNotes(row)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!notesRow}
        onOpenChange={(o) => {
          if (!o) setNotesRow(null)
        }}
      >
        <DialogContent className="border-[#2A2A2A] bg-[#141414] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Notes</DialogTitle>
            <DialogDescription className="text-[#888888]">
              {notesRow
                ? `${notesRow.company.name} · ${notesRow.job.title}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="row-notes" className="text-xs text-[#888888]">
              Private notes
            </Label>
            <Textarea
              id="row-notes"
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              rows={5}
              className="resize-none border-[#2A2A2A] bg-[#0A0A0A] text-white placeholder:text-[#555555]"
              placeholder="Interview feedback, contacts, deadlines…"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNotesRow(null)}
              className="border-[#2A2A2A] bg-transparent text-[#888888] hover:bg-[#1A1A1A] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveNotes}
              className="bg-white text-[#0A0A0A] hover:bg-white/90"
            >
              Save notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function StatusSelect({
  status,
  onChange,
}: {
  status: ApplicationStatus
  onChange: (s: ApplicationStatus) => void
}) {
  return (
    <Select value={status} onValueChange={(v) => onChange(v as ApplicationStatus)}>
      <SelectTrigger
        size="sm"
        className="h-auto w-auto gap-1 border-0 bg-transparent p-0 shadow-none hover:bg-transparent focus-visible:ring-0 [&>svg]:text-[#555555]"
        aria-label={`Status: ${STATUS_LABELS[status]}`}
      >
        <StatusBadge status={status} />
      </SelectTrigger>
      <SelectContent className="border-[#2A2A2A] bg-[#141414] text-white">
        {STATUS_OPTIONS.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function RowActions({
  row,
  onEditNotes,
}: {
  row: ApplicationRow
  onEditNotes: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-[#555555] hover:bg-[#1A1A1A] hover:text-white"
          aria-label="Row actions"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-[#2A2A2A] bg-[#141414] text-white"
      >
        {row.job.url && (
          <DropdownMenuItem
            className="gap-2 focus:bg-[#1A1A1A] focus:text-white"
            onClick={() => window.open(row.job.url, '_blank', 'noopener')}
          >
            <ExternalLink className="size-3.5 text-[#888888]" />
            Open listing
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="gap-2 focus:bg-[#1A1A1A] focus:text-white"
          onClick={onEditNotes}
        >
          <Pencil className="size-3.5 text-[#888888]" />
          Edit notes
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#2A2A2A]" />
        <DropdownMenuItem
          className="gap-2 text-[#888888] focus:bg-[#1A1A1A] focus:text-white"
          onClick={() => removeApplication(row.application.id)}
        >
          <Trash2 className="size-3.5" />
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
