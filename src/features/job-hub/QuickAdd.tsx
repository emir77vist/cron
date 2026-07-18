import { useState } from 'react'
import { Link2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { parseJobInput } from '@/lib/parser/job-parser'
import {
  draftFromParsed,
  emptyDraft,
  type JobApplicationDraft,
} from '@/types/job-draft'
import type { JobSource } from '@/types'
import { DraftFormDialog } from '@/features/job-hub/DraftFormDialog'

export function QuickAdd() {
  const [raw, setRaw] = useState('')
  const [draft, setDraft] = useState<JobApplicationDraft | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [parseMeta, setParseMeta] = useState<{
    method: string
    confidence: string
    warnings: string[]
    source: JobSource
  } | null>(null)
  const [hint, setHint] = useState<string | null>(null)

  function handleParse() {
    const trimmed = raw.trim()
    if (!trimmed) {
      setHint('Paste a job URL or description first.')
      return
    }
    setHint(null)
    const parsed = parseJobInput(trimmed)
    setDraft(draftFromParsed(parsed))
    setParseMeta({
      method: parsed.parseMethod,
      confidence: parsed.confidence,
      warnings: parsed.warnings,
      source: parsed.source,
    })
    setDialogOpen(true)
  }

  function handleManual() {
    const base = emptyDraft()
    // If they typed a bare URL, still attach it
    const maybeUrl = raw.trim()
    if (/^https?:\/\//i.test(maybeUrl) || maybeUrl.includes('greenhouse.io')) {
      base.url = maybeUrl.split(/\s/)[0]
    } else if (maybeUrl && !maybeUrl.includes('\n') && maybeUrl.length < 80) {
      base.title = maybeUrl
    }
    setDraft(base)
    setParseMeta(null)
    setDialogOpen(true)
  }

  return (
    <section aria-label="Quick add" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium tracking-tight text-white">
            Quick Add from Link
          </h2>
          <p className="mt-1 text-sm text-[#555555]">
            Paste a Greenhouse, Lever, Ashby, Workday, or LinkedIn URL — or a
            job description. We parse structure first, text second.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[#2A2A2A] bg-[#141414] p-5 sm:p-6">
        <div className="relative">
          <Textarea
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value)
              if (hint) setHint(null)
            }}
            placeholder="https://boards.greenhouse.io/acme/jobs/123…&#10;or paste the full job description"
            rows={4}
            className="min-h-[112px] resize-none border-[#2A2A2A] bg-[#0A0A0A] pr-4 text-[15px] leading-relaxed text-white placeholder:text-[#555555] focus-visible:ring-[#555555]/40"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                handleParse()
              }
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#555555]">
            {hint ? (
              <span className="text-[#888888]">{hint}</span>
            ) : (
              <>
                <Link2 className="mr-1 inline size-3 opacity-70" />
                ⌘↵ to parse
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleManual}
              className="border-[#2A2A2A] bg-transparent text-[#888888] hover:bg-[#1A1A1A] hover:text-white"
            >
              Manual entry
            </Button>
            <Button
              type="button"
              onClick={handleParse}
              className="gap-1.5 bg-white text-[#0A0A0A] hover:bg-white/90"
            >
              <Sparkles className="size-3.5" strokeWidth={1.75} />
              Parse & review
            </Button>
          </div>
        </div>
      </div>

      <DraftFormDialog
        open={dialogOpen}
        draft={draft}
        parseMeta={parseMeta ?? undefined}
        onOpenChange={setDialogOpen}
        onSubmitted={() => {
          setRaw('')
          setDraft(null)
          setParseMeta(null)
        }}
      />
    </section>
  )
}
