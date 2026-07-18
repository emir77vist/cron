import { create } from 'zustand'

export type PomodoroMode = 'focus' | 'break'

interface PomodoroState {
  mode: PomodoroMode
  /** Seconds remaining */
  remaining: number
  running: boolean
  focusMinutes: number
  breakMinutes: number
  completedFocusSessions: number
  /** epoch ms when current segment ends, if running */
  endsAt: number | null

  start: () => void
  pause: () => void
  reset: () => void
  skip: () => void
  tick: (now?: number) => void
  setFocusMinutes: (m: number) => void
  setBreakMinutes: (m: number) => void
}

const DEFAULT_FOCUS = 25
const DEFAULT_BREAK = 5

function modeSeconds(mode: PomodoroMode, focusM: number, breakM: number) {
  return (mode === 'focus' ? focusM : breakM) * 60
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  mode: 'focus',
  remaining: DEFAULT_FOCUS * 60,
  running: false,
  focusMinutes: DEFAULT_FOCUS,
  breakMinutes: DEFAULT_BREAK,
  completedFocusSessions: 0,
  endsAt: null,

  start: () => {
    const s = get()
    const remaining = s.remaining > 0 ? s.remaining : modeSeconds(s.mode, s.focusMinutes, s.breakMinutes)
    set({
      running: true,
      remaining,
      endsAt: Date.now() + remaining * 1000,
    })
  },

  pause: () => {
    const s = get()
    if (!s.running || !s.endsAt) {
      set({ running: false, endsAt: null })
      return
    }
    const remaining = Math.max(0, Math.ceil((s.endsAt - Date.now()) / 1000))
    set({ running: false, remaining, endsAt: null })
  },

  reset: () => {
    const s = get()
    set({
      running: false,
      endsAt: null,
      remaining: modeSeconds(s.mode, s.focusMinutes, s.breakMinutes),
    })
  },

  skip: () => {
    const s = get()
    const nextMode: PomodoroMode = s.mode === 'focus' ? 'break' : 'focus'
    const completed =
      s.mode === 'focus'
        ? s.completedFocusSessions + 1
        : s.completedFocusSessions
    set({
      mode: nextMode,
      completedFocusSessions: completed,
      running: false,
      endsAt: null,
      remaining: modeSeconds(nextMode, s.focusMinutes, s.breakMinutes),
    })
  },

  tick: (now = Date.now()) => {
    const s = get()
    if (!s.running || !s.endsAt) return
    const remaining = Math.max(0, Math.ceil((s.endsAt - now) / 1000))
    if (remaining <= 0) {
      const nextMode: PomodoroMode = s.mode === 'focus' ? 'break' : 'focus'
      const completed =
        s.mode === 'focus'
          ? s.completedFocusSessions + 1
          : s.completedFocusSessions
      set({
        mode: nextMode,
        completedFocusSessions: completed,
        running: false,
        endsAt: null,
        remaining: modeSeconds(nextMode, s.focusMinutes, s.breakMinutes),
      })
      return
    }
    if (remaining !== s.remaining) set({ remaining })
  },

  setFocusMinutes: (m) => {
    const focusMinutes = Math.min(90, Math.max(1, m))
    const s = get()
    set({
      focusMinutes,
      remaining:
        s.mode === 'focus' && !s.running
          ? focusMinutes * 60
          : s.remaining,
    })
  },

  setBreakMinutes: (m) => {
    const breakMinutes = Math.min(30, Math.max(1, m))
    const s = get()
    set({
      breakMinutes,
      remaining:
        s.mode === 'break' && !s.running
          ? breakMinutes * 60
          : s.remaining,
    })
  },
}))

export function formatPomodoroTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
