import { useRef, useState } from 'react'
import { FileUp, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { prepareCsvImport } from '@/lib/data/contacts'
import type { ContactImportSession } from '@/types/contact-import'
import { cn } from '@/lib/utils'

interface CsvImportPanelProps {
  onSessionReady: (session: ContactImportSession) => void
}

export function CsvImportPanel({ onSessionReady }: CsvImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File | undefined | null) {
    if (!file) return
    setError(null)

    if (!/\.csv$/i.test(file.name) && file.type && !file.type.includes('csv') && !file.type.includes('text')) {
      setError('Please upload a .csv file.')
      return
    }

    setBusy(true)
    try {
      const text = await file.text()
      const session = prepareCsvImport(file.name, text)
      if (session.rows.length === 0) {
        setError(
          session.parseWarnings[0] ??
            'No contacts found in that file. Check headers (Name, Company, Email…).',
        )
        return
      }
      // Never save here — only open review
      onSessionReady(session)
    } catch {
      setError('Could not read that file.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section aria-label="Import contacts" className="space-y-4">
      <div>
        <h2 className="text-sm font-medium tracking-tight text-white">
          Import CSV
        </h2>
        <p className="mt-1 max-w-xl text-sm text-[#555555]">
          Upload a contacts export. You will review company matches before
          anything is saved.
        </p>
      </div>

      <div
        className={cn(
          'rounded-lg border border-dashed border-[#2A2A2A] bg-[#141414] px-6 py-10 transition-colors sm:px-8',
          dragOver && 'border-[#555555] bg-[#1A1A1A]',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          void handleFile(e.dataTransfer.files?.[0])
        }}
      >
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[#2A2A2A] bg-[#0A0A0A]">
              <FileUp className="size-4 text-[#888888]" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Drop a CSV here, or browse
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#555555]">
                Columns: Name, Email, Company, Title, Phone, LinkedIn, Notes.
                Matching uses fuzzy company names against your pipeline.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="gap-1.5 bg-white text-[#0A0A0A] hover:bg-white/90"
            >
              <Upload className="size-3.5" strokeWidth={1.75} />
              {busy ? 'Reading…' : 'Upload CSV'}
            </Button>
          </div>
        </div>

        {error && (
          <p className="mt-5 text-sm text-[#888888]" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  )
}
