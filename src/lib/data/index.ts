/**
 * Data-access layer — single facade over the app store.
 * Features import from here; they never touch storage primitives directly.
 * Swap implementations later (API, IndexedDB) without changing callers.
 */

import { useAppStore } from '@/stores/app-store'
import type {
  Application,
  Company,
  Contact,
  EntityId,
  Goal,
  GoalTask,
  Job,
  Note,
} from '@/types'
import { deriveMetrics, type MetricsInput } from '@/lib/metrics/deriveMetrics'

// ─── Snapshot helpers (non-hook) ────────────────────────────

function snapshot() {
  return useAppStore.getState()
}

function listFromRecord<T>(record: Record<EntityId, T>): T[] {
  return Object.values(record)
}

// ─── Companies ──────────────────────────────────────────────

export function getCompanies(): Company[] {
  return listFromRecord(snapshot().companies)
}

export function getCompanyById(id: EntityId): Company | undefined {
  return snapshot().companies[id]
}

export function upsertCompany(
  company: Company,
): void {
  snapshot().upsertCompany(company)
}

export function deleteCompany(id: EntityId): void {
  snapshot().deleteCompany(id)
}

// ─── Jobs ───────────────────────────────────────────────────

export function getJobs(): Job[] {
  return listFromRecord(snapshot().jobs)
}

export function getJobById(id: EntityId): Job | undefined {
  return snapshot().jobs[id]
}

export function getJobsByCompany(companyId: EntityId): Job[] {
  return getJobs().filter((j) => j.companyId === companyId)
}

export function upsertJob(job: Job): void {
  snapshot().upsertJob(job)
}

export function deleteJob(id: EntityId): void {
  snapshot().deleteJob(id)
}

// ─── Applications ───────────────────────────────────────────

export function getApplications(): Application[] {
  return listFromRecord(snapshot().applications)
}

export function getApplicationById(id: EntityId): Application | undefined {
  return snapshot().applications[id]
}

export function getApplicationsByJob(jobId: EntityId): Application[] {
  return getApplications().filter((a) => a.jobId === jobId)
}

export function upsertApplication(application: Application): void {
  snapshot().upsertApplication(application)
}

export function deleteApplication(id: EntityId): void {
  snapshot().deleteApplication(id)
}

// ─── Notes ──────────────────────────────────────────────────

export function getNotes(): Note[] {
  return listFromRecord(snapshot().notes)
}

export function getNoteById(id: EntityId): Note | undefined {
  return snapshot().notes[id]
}

export function upsertNote(note: Note): void {
  snapshot().upsertNote(note)
}

export function deleteNote(id: EntityId): void {
  snapshot().deleteNote(id)
}

// ─── Contacts ───────────────────────────────────────────────

export function getContacts(): Contact[] {
  return listFromRecord(snapshot().contacts)
}

export function getContactById(id: EntityId): Contact | undefined {
  return snapshot().contacts[id]
}

export function upsertContact(contact: Contact): void {
  snapshot().upsertContact(contact)
}

export function deleteContact(id: EntityId): void {
  snapshot().deleteContact(id)
}

// ─── Goals ──────────────────────────────────────────────────

export function getGoals(): Goal[] {
  return listFromRecord(snapshot().goals)
}

export function getGoalById(id: EntityId): Goal | undefined {
  return snapshot().goals[id]
}

export function upsertGoal(goal: Goal): void {
  snapshot().upsertGoal(goal)
}

export function deleteGoal(id: EntityId): void {
  snapshot().deleteGoal(id)
}

export function getGoalTasks(): GoalTask[] {
  return listFromRecord(snapshot().goalTasks)
}

export function upsertGoalTask(task: GoalTask): void {
  snapshot().upsertGoalTask(task)
}

export function deleteGoalTask(id: EntityId): void {
  snapshot().deleteGoalTask(id)
}

// ─── Metrics ────────────────────────────────────────────────

export function getMetricsInput(): MetricsInput {
  return {
    companies: getCompanies(),
    jobs: getJobs(),
    applications: getApplications(),
    notes: getNotes(),
    goals: getGoals(),
    goalTasks: getGoalTasks(),
  }
}

export function getMetrics() {
  return deriveMetrics(getMetricsInput())
}
