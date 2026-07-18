import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { JobApplicationDraft } from '@/types/job-draft'
import type {
  ApplicationStatus,
  JobLocationType,
  JobSeniority,
  JobSource,
} from '@/types'
import { STATUS_LABELS, STATUS_OPTIONS } from '@/lib/format'
import { sourceLabel } from '@/lib/parser/job-parser'
import { submitApplicationDraft } from '@/lib/data/applications'

interface DraftFormDialogProps {
  open: boolean
  draft: JobApplicationDraft | null
  parseMeta?: {
    method: string
    confidence: string
    warnings: string[]
    source: JobSource
  }
  onOpenChange: (open: boolean) => void
  onSubmitted: () => void
}

export function DraftFormDialog({
  open,
  draft: initial,
  parseMeta,
  onOpenChange,
  onSubmitted,
}: DraftFormDialogProps) {
  const [draft, setDraft] = useState<JobApplicationDraft | null>(initial)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(initial)
    setError(null)
  }, [initial, open])

  if (!draft) return null

  function patch<K extends keyof JobApplicationDraft>(
    key: K,
    value: JobApplicationDraft[K],
  ) {
    setDraft((d) => (d ? { ...d, [key]: value } : d))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft) return
    if (!draft.companyName.trim()) {
      setError('Company is required.')
      return
    }
    if (!draft.title.trim()) {
      setError('Role title is required.')
      return
    }
    submitApplicationDraft(draft)
    onSubmitted()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(90dvh,720px)] overflow-y-auto border-[#2A2A2A] bg-[#141414] text-white sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight text-white">
            Review & add
          </DialogTitle>
          <DialogDescription className="text-[#888888]">
            Parser prefilled this draft. Edit anything, then add to your
            pipeline.
          </DialogDescription>
        </DialogHeader>

        {parseMeta && (
          <div className="rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2.5 text-xs text-[#555555]">
            <span className="text-[#888888]">
              {sourceLabel(parseMeta.source)}
            </span>
            {' · '}
            {parseMeta.method} parse
            {' · '}
            {parseMeta.confidence} confidence
            {parseMeta.warnings.length > 0 && (
              <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[#555555]">
                {parseMeta.warnings.slice(0, 3).map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Company" htmlFor="company">
            <Input
              id="company"
              value={draft.companyName}
              onChange={(e) => patch('companyName', e.target.value)}
              placeholder="Acme"
              className="border-[#2A2A2A] bg-[#0A0A0A] text-white placeholder:text-[#555555]"
              autoFocus
            />
          </Field>

          <Field label="Role" htmlFor="title">
            <Input
              id="title"
              value={draft.title}
              onChange={(e) => patch('title', e.target.value)}
              placeholder="Software Engineer"
              className="border-[#2A2A2A] bg-[#0A0A0A] text-white placeholder:text-[#555555]"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status" htmlFor="status">
              <Select
                value={draft.status}
                onValueChange={(v) =>
                  patch('status', v as ApplicationStatus)
                }
              >
                <SelectTrigger
                  id="status"
                  className="w-full border-[#2A2A2A] bg-[#0A0A0A] text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#2A2A2A] bg-[#141414] text-white">
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Date" htmlFor="date">
              <Input
                id="date"
                type="date"
                value={draft.appliedAt}
                onChange={(e) => patch('appliedAt', e.target.value)}
                className="border-[#2A2A2A] bg-[#0A0A0A] text-white"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Location" htmlFor="location">
              <Input
                id="location"
                value={draft.location}
                onChange={(e) => patch('location', e.target.value)}
                placeholder="Remote / SF"
                className="border-[#2A2A2A] bg-[#0A0A0A] text-white placeholder:text-[#555555]"
              />
            </Field>

            <Field label="Location type" htmlFor="locationType">
              <Select
                value={draft.locationType}
                onValueChange={(v) =>
                  patch('locationType', v as JobLocationType)
                }
              >
                <SelectTrigger
                  id="locationType"
                  className="w-full border-[#2A2A2A] bg-[#0A0A0A] text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#2A2A2A] bg-[#141414] text-white">
                  {(
                    [
                      'unknown',
                      'remote',
                      'hybrid',
                      'onsite',
                    ] as JobLocationType[]
                  ).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Source" htmlFor="source">
              <Select
                value={draft.source}
                onValueChange={(v) => patch('source', v as JobSource)}
              >
                <SelectTrigger
                  id="source"
                  className="w-full border-[#2A2A2A] bg-[#0A0A0A] text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#2A2A2A] bg-[#141414] text-white">
                  {(
                    [
                      'greenhouse',
                      'lever',
                      'ashby',
                      'linkedin',
                      'company-site',
                      'referral',
                      'other',
                    ] as JobSource[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {sourceLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Seniority" htmlFor="seniority">
              <Select
                value={draft.seniority}
                onValueChange={(v) => patch('seniority', v as JobSeniority)}
              >
                <SelectTrigger
                  id="seniority"
                  className="w-full border-[#2A2A2A] bg-[#0A0A0A] text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#2A2A2A] bg-[#141414] text-white">
                  {(
                    [
                      'unknown',
                      'intern',
                      'entry',
                      'mid',
                      'senior',
                      'staff',
                      'principal',
                    ] as JobSeniority[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Job URL" htmlFor="url">
            <Input
              id="url"
              value={draft.url}
              onChange={(e) => patch('url', e.target.value)}
              placeholder="https://…"
              className="border-[#2A2A2A] bg-[#0A0A0A] text-white placeholder:text-[#555555]"
            />
          </Field>

          <Field label="Notes" htmlFor="notes">
            <Textarea
              id="notes"
              value={draft.notes}
              onChange={(e) => patch('notes', e.target.value)}
              placeholder="Referral, deadline, talking points…"
              rows={3}
              className="resize-none border-[#2A2A2A] bg-[#0A0A0A] text-white placeholder:text-[#555555]"
            />
          </Field>

          {error && (
            <p className="text-sm text-[#888888]" role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#2A2A2A] bg-transparent text-[#888888] hover:bg-[#1A1A1A] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-white text-[#0A0A0A] hover:bg-white/90"
            >
              Add to pipeline
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs text-[#888888]">
        {label}
      </Label>
      {children}
    </div>
  )
}
