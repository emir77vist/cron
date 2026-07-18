import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { VariancePin } from '@/features/reflection/VariancePin'
import {
  getVarianceForSession,
  softDismissReflection,
  submitReflection,
} from '@/lib/data/reflections'
import { useAppStore } from '@/stores/app-store'
import { useMetrics } from '@/hooks/use-metrics'
import { cn } from '@/lib/utils'

const QUESTIONS = [
  {
    key: 'wentWell' as const,
    prompt: 'What went well?',
    hint: 'Wins, momentum, people who helped.',
  },
  {
    key: 'stuck' as const,
    prompt: 'Where did I get stuck?',
    hint: 'Friction, delays, energy drains.',
  },
  {
    key: 'priorityNext' as const,
    prompt: '#1 priority next week?',
    hint: 'One clear focus — not a list.',
  },
]

/**
 * Full-screen soft-lock reflection.
 * Hard to dismiss accidentally; never punitive — "Not now" is always available.
 */
export function ReflectionModal() {
  const session = useAppStore((s) => s.reflectionSession)
  // Re-derive metrics live while open
  const metrics = useMetrics()

  const { snapshot, variance } = useMemo(() => {
    if (!session?.open) {
      return { snapshot: null, variance: null }
    }
    return getVarianceForSession(session.periodKind)
    // metrics invalidates when store entities change
  }, [session?.open, session?.periodKind, session?.periodKey, metrics])

  const [answers, setAnswers] = useState({
    wentWell: '',
    stuck: '',
    priorityNext: '',
  })
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when a new session opens
  useEffect(() => {
    if (session?.open) {
      setAnswers({ wentWell: '', stuck: '', priorityNext: '' })
      setLeaveOpen(false)
      setError(null)
    }
  }, [session?.periodKey, session?.open])

  // Soft lock: trap Escape → confirm leave
  useEffect(() => {
    if (!session?.open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        setLeaveOpen(true)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [session?.open])

  // Prevent body scroll
  useEffect(() => {
    if (!session?.open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [session?.open])

  const requestLeave = useCallback(() => {
    setLeaveOpen(true)
  }, [])

  const confirmLeave = useCallback(() => {
    softDismissReflection()
    setLeaveOpen(false)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const filled =
      answers.wentWell.trim() ||
      answers.stuck.trim() ||
      answers.priorityNext.trim()
    if (!filled) {
      setError('Write at least one answer — or choose Not now.')
      return
    }
    submitReflection(answers)
  }

  if (!session?.open || !snapshot) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reflection-title"
      className="fixed inset-0 z-[100] flex flex-col bg-[#0A0A0A]"
      // Soft lock: ignore outside chrome — full screen is the surface
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Ambient field — same monochrome canvas, subtle dot-matrix */}
      <div className="dot-matrix pointer-events-none absolute inset-0 opacity-80" />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:px-10 sm:py-14">
          {/* Header */}
          <header className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#555555]">
              {session.trigger === 'auto' ? 'Period closed' : 'Reflection'}
              {' · '}
              {session.periodKind === 'week' ? 'Weekly' : 'Monthly'}
            </p>
            <h1
              id="reflection-title"
              className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              Reflect
            </h1>
            <p className="mt-2 text-sm text-[#888888]">{session.periodLabel}</p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#555555]">
              A quiet pause. Numbers on the side are from your real pipeline and
              goals — not guesses. Take a minute; you can always choose Not now.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="mt-12 grid gap-12 lg:grid-cols-[1fr_16rem] lg:gap-16 xl:grid-cols-[1fr_18rem]"
          >
            {/* Questions */}
            <div className="space-y-10">
              {QUESTIONS.map((q, i) => (
                <div key={q.key} className="space-y-3">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs tabular-nums text-[#555555]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Label
                      htmlFor={q.key}
                      className="text-base font-medium text-white"
                    >
                      {q.prompt}
                    </Label>
                  </div>
                  <p className="pl-8 text-xs text-[#555555]">{q.hint}</p>
                  <Textarea
                    id={q.key}
                    value={answers[q.key]}
                    onChange={(e) => {
                      setAnswers((a) => ({ ...a, [q.key]: e.target.value }))
                      if (error) setError(null)
                    }}
                    rows={4}
                    placeholder="Write freely…"
                    className={cn(
                      'min-h-[112px] resize-none border-[#2A2A2A] bg-[#141414] pl-4 text-[15px] leading-relaxed text-white',
                      'placeholder:text-[#555555] focus-visible:ring-[#555555]/30',
                    )}
                  />
                </div>
              ))}

              {error && (
                <p className="text-sm text-[#888888]" role="alert">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 border-t border-[#2A2A2A] pt-8">
                <Button
                  type="submit"
                  className="bg-white text-[#0A0A0A] hover:bg-white/90"
                >
                  Archive period
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={requestLeave}
                  className="border-[#2A2A2A] bg-transparent text-[#888888] hover:bg-[#1A1A1A] hover:text-white"
                >
                  Not now
                </Button>
                <p className="w-full text-xs text-[#555555] sm:ml-auto sm:w-auto">
                  Esc asks before leaving · nothing is saved until you archive
                </p>
              </div>
            </div>

            {/* Metrics pin */}
            <div className="lg:sticky lg:top-10 lg:self-start">
              <VariancePin snapshot={snapshot} variance={variance} />
            </div>
          </form>
        </div>
      </div>

      {/* Soft leave confirm — calm, not punitive */}
      {leaveOpen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 p-6">
          <div
            className="w-full max-w-sm rounded-lg border border-[#2A2A2A] bg-[#141414] p-6"
            role="alertdialog"
            aria-labelledby="leave-title"
          >
            <h2
              id="leave-title"
              className="text-base font-medium text-white"
            >
              Leave without archiving?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#888888]">
              We won’t ask again for this period until the next rollover. You can
              always open Reflect Now from the dashboard.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLeaveOpen(false)}
                className="border-[#2A2A2A] bg-transparent text-[#888888] hover:bg-[#1A1A1A] hover:text-white"
              >
                Keep writing
              </Button>
              <Button
                type="button"
                onClick={confirmLeave}
                className="bg-white text-[#0A0A0A] hover:bg-white/90"
              >
                Not now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
