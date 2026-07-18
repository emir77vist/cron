import { useEffect } from 'react'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import {
  formatPomodoroTime,
  usePomodoroStore,
} from '@/features/pomodoro/pomodoro-store'
import { cn } from '@/lib/utils'

/**
 * Compact monochrome Pomodoro — lives in the sidebar footer.
 */
export function PomodoroWidget({ collapsed }: { collapsed: boolean }) {
  const mode = usePomodoroStore((s) => s.mode)
  const remaining = usePomodoroStore((s) => s.remaining)
  const running = usePomodoroStore((s) => s.running)
  const completed = usePomodoroStore((s) => s.completedFocusSessions)
  const start = usePomodoroStore((s) => s.start)
  const pause = usePomodoroStore((s) => s.pause)
  const reset = usePomodoroStore((s) => s.reset)
  const skip = usePomodoroStore((s) => s.skip)
  const tick = usePomodoroStore((s) => s.tick)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => tick(), 250)
    return () => window.clearInterval(id)
  }, [running, tick])

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => (running ? pause() : start())}
        className={cn(
          'flex w-full flex-col items-center gap-0.5 rounded-md py-2',
          'text-[#555555] transition-colors hover:bg-[#141414] hover:text-[#888888]',
        )}
        title={`${mode === 'focus' ? 'Focus' : 'Break'} · ${formatPomodoroTime(remaining)}`}
        aria-label={running ? 'Pause timer' : 'Start timer'}
      >
        <span className="font-mono text-[10px] tabular-nums tracking-tight text-[#888888]">
          {formatPomodoroTime(remaining)}
        </span>
        {running ? (
          <Pause className="size-3.5" strokeWidth={1.75} />
        ) : (
          <Play className="size-3.5" strokeWidth={1.75} />
        )}
      </button>
    )
  }

  return (
    <div className="rounded-md border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-3">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#555555]">
          {mode === 'focus' ? 'Focus' : 'Break'}
        </p>
        <p className="text-[10px] tabular-nums text-[#555555]">
          {completed > 0 ? `${completed} done` : 'Pomodoro'}
        </p>
      </div>
      <p className="mt-2 font-mono text-2xl font-medium tracking-tight text-white tabular-nums">
        {formatPomodoroTime(remaining)}
      </p>
      <div className="mt-3 flex items-center gap-1">
        <IconBtn
          label={running ? 'Pause' : 'Start'}
          onClick={() => (running ? pause() : start())}
        >
          {running ? (
            <Pause className="size-3.5" strokeWidth={1.75} />
          ) : (
            <Play className="size-3.5" strokeWidth={1.75} />
          )}
        </IconBtn>
        <IconBtn label="Reset" onClick={reset}>
          <RotateCcw className="size-3.5" strokeWidth={1.75} />
        </IconBtn>
        <IconBtn label="Skip" onClick={skip}>
          <SkipForward className="size-3.5" strokeWidth={1.75} />
        </IconBtn>
      </div>
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'flex size-7 items-center justify-center rounded-md',
        'text-[#555555] transition-colors hover:bg-[#1A1A1A] hover:text-white',
      )}
    >
      {children}
    </button>
  )
}
