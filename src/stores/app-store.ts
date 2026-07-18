import { create } from 'zustand'
import type {
  Application,
  AppRoute,
  Company,
  Contact,
  EntitiesState,
  EntityId,
  Goal,
  GoalTask,
  Job,
  Note,
  ReflectionArchive,
  ReflectionSession,
  ShellState,
} from '@/types'
import {
  loadReflectionPersist,
  saveReflectionPersist,
} from '@/lib/reflection/persist'

interface AppActions {
  // Shell
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  setActiveRoute: (route: AppRoute) => void

  // Reflection session
  openReflection: (session: Omit<ReflectionSession, 'open'>) => void
  closeReflection: () => void
  softDismissReflection: () => void
  commitReflectionArchive: (archive: ReflectionArchive) => void
  hydrateReflections: () => void
  setLastSeenWeekKey: (key: string) => void

  // Companies
  upsertCompany: (company: Company) => void
  deleteCompany: (id: EntityId) => void

  // Jobs
  upsertJob: (job: Job) => void
  deleteJob: (id: EntityId) => void

  // Applications
  upsertApplication: (application: Application) => void
  deleteApplication: (id: EntityId) => void

  // Notes
  upsertNote: (note: Note) => void
  deleteNote: (id: EntityId) => void

  // Contacts
  upsertContact: (contact: Contact) => void
  deleteContact: (id: EntityId) => void

  // Goals
  upsertGoal: (goal: Goal) => void
  deleteGoal: (id: EntityId) => void
  upsertGoalTask: (task: GoalTask) => void
  deleteGoalTask: (id: EntityId) => void

  // Bulk
  resetEntities: () => void
}

type AppStore = ShellState & EntitiesState & AppActions

const emptyEntities: EntitiesState = {
  companies: {},
  jobs: {},
  applications: {},
  notes: {},
  contacts: {},
  goals: {},
  goalTasks: {},
  reflections: {},
}

function persistReflectionSlice(s: {
  lastReflectedWeekKey: string | null
  lastReflectedMonthKey: string | null
  lastSeenWeekKey: string | null
  reflectionSoftDismissed: string[]
  reflections: AppStore['reflections']
}) {
  saveReflectionPersist({
    lastReflectedWeekKey: s.lastReflectedWeekKey,
    lastReflectedMonthKey: s.lastReflectedMonthKey,
    lastSeenWeekKey: s.lastSeenWeekKey,
    reflectionSoftDismissed: s.reflectionSoftDismissed,
    reflections: s.reflections,
  })
}

export const useAppStore = create<AppStore>((set, get) => ({
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  activeRoute: 'dashboard',
  lastReflectedWeekKey: null,
  lastReflectedMonthKey: null,
  lastSeenWeekKey: null,
  reflectionSoftDismissed: [],
  reflectionSession: null,

  ...emptyEntities,

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setActiveRoute: (route) => set({ activeRoute: route }),

  openReflection: (session) =>
    set({
      reflectionSession: { ...session, open: true },
      // Close command palette so it doesn't sit above
      commandPaletteOpen: false,
    }),

  closeReflection: () => set({ reflectionSession: null }),

  softDismissReflection: () => {
    const session = get().reflectionSession
    if (!session) return
    set((s) => {
      const keys = s.reflectionSoftDismissed.includes(session.periodKey)
        ? s.reflectionSoftDismissed
        : [...s.reflectionSoftDismissed, session.periodKey]
      const next = {
        reflectionSession: null as null,
        reflectionSoftDismissed: keys,
        lastReflectedWeekKey: s.lastReflectedWeekKey,
        lastReflectedMonthKey: s.lastReflectedMonthKey,
        lastSeenWeekKey: s.lastSeenWeekKey,
        reflections: s.reflections,
      }
      persistReflectionSlice(next)
      return {
        reflectionSession: null,
        reflectionSoftDismissed: keys,
      }
    })
  },

  commitReflectionArchive: (archive) => {
    set((s) => {
      const reflections = { ...s.reflections, [archive.id]: archive }
      const lastReflectedWeekKey =
        archive.periodKind === 'week'
          ? archive.periodKey
          : s.lastReflectedWeekKey
      const lastReflectedMonthKey =
        archive.periodKind === 'month'
          ? archive.periodKey
          : s.lastReflectedMonthKey
      const reflectionSoftDismissed = s.reflectionSoftDismissed.filter(
        (k) => k !== archive.periodKey,
      )
      const next = {
        reflections,
        lastReflectedWeekKey,
        lastReflectedMonthKey,
        lastSeenWeekKey: s.lastSeenWeekKey,
        reflectionSoftDismissed,
        reflectionSession: null as null,
      }
      persistReflectionSlice(next)
      return {
        reflections,
        lastReflectedWeekKey,
        lastReflectedMonthKey,
        reflectionSoftDismissed,
        reflectionSession: null,
      }
    })
  },

  hydrateReflections: () => {
    const blob = loadReflectionPersist()
    if (!blob) return
    set({
      lastReflectedWeekKey: blob.lastReflectedWeekKey,
      lastReflectedMonthKey: blob.lastReflectedMonthKey,
      lastSeenWeekKey: blob.lastSeenWeekKey,
      reflectionSoftDismissed: blob.reflectionSoftDismissed,
      reflections: blob.reflections,
    })
  },

  setLastSeenWeekKey: (key) => {
    set((s) => {
      if (s.lastSeenWeekKey === key) return s
      const next = {
        lastSeenWeekKey: key,
        lastReflectedWeekKey: s.lastReflectedWeekKey,
        lastReflectedMonthKey: s.lastReflectedMonthKey,
        reflectionSoftDismissed: s.reflectionSoftDismissed,
        reflections: s.reflections,
      }
      persistReflectionSlice(next)
      return { lastSeenWeekKey: key }
    })
  },

  upsertCompany: (company) =>
    set((s) => ({
      companies: { ...s.companies, [company.id]: company },
    })),
  deleteCompany: (id) =>
    set((s) => {
      const next = { ...s.companies }
      delete next[id]
      return { companies: next }
    }),

  upsertJob: (job) =>
    set((s) => ({
      jobs: { ...s.jobs, [job.id]: job },
    })),
  deleteJob: (id) =>
    set((s) => {
      const next = { ...s.jobs }
      delete next[id]
      return { jobs: next }
    }),

  upsertApplication: (application) =>
    set((s) => ({
      applications: { ...s.applications, [application.id]: application },
    })),
  deleteApplication: (id) =>
    set((s) => {
      const next = { ...s.applications }
      delete next[id]
      return { applications: next }
    }),

  upsertNote: (note) =>
    set((s) => ({
      notes: { ...s.notes, [note.id]: note },
    })),
  deleteNote: (id) =>
    set((s) => {
      const next = { ...s.notes }
      delete next[id]
      return { notes: next }
    }),

  upsertContact: (contact) =>
    set((s) => ({
      contacts: { ...s.contacts, [contact.id]: contact },
    })),
  deleteContact: (id) =>
    set((s) => {
      const next = { ...s.contacts }
      delete next[id]
      return { contacts: next }
    }),

  upsertGoal: (goal) =>
    set((s) => ({
      goals: { ...s.goals, [goal.id]: goal },
    })),
  deleteGoal: (id) =>
    set((s) => {
      const next = { ...s.goals }
      delete next[id]
      const goals = { ...next }
      for (const g of Object.values(goals)) {
        if (g.parentId === id) {
          goals[g.id] = {
            ...g,
            parentId: undefined,
            updatedAt: new Date().toISOString(),
          }
        }
      }
      const goalTasks = { ...s.goalTasks }
      for (const t of Object.values(goalTasks)) {
        if (t.goalId === id) {
          goalTasks[t.id] = {
            ...t,
            goalId: undefined,
            updatedAt: new Date().toISOString(),
          }
        }
      }
      return { goals, goalTasks }
    }),

  upsertGoalTask: (task) =>
    set((s) => ({
      goalTasks: { ...s.goalTasks, [task.id]: task },
    })),
  deleteGoalTask: (id) =>
    set((s) => {
      const next = { ...s.goalTasks }
      delete next[id]
      return { goalTasks: next }
    }),

  resetEntities: () =>
    set((s) => ({
      ...emptyEntities,
      // keep reflection meta
      lastReflectedWeekKey: s.lastReflectedWeekKey,
      lastReflectedMonthKey: s.lastReflectedMonthKey,
      reflectionSoftDismissed: s.reflectionSoftDismissed,
      reflections: s.reflections,
    })),
}))

export const selectSidebarCollapsed = (s: AppStore) => s.sidebarCollapsed
export const selectCommandPaletteOpen = (s: AppStore) => s.commandPaletteOpen
export const selectActiveRoute = (s: AppStore) => s.activeRoute
