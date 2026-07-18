import { PageHeader } from '@/components/shared/PageHeader'
import { ROUTE_LABELS } from '@/lib/nav'
import type { AppRoute } from '@/types'

interface PlaceholderViewProps {
  route: AppRoute
}

const DESCRIPTIONS: Partial<Record<AppRoute, string>> = {
  dashboard: 'Pipeline health and activity at a glance.',
  jobs: 'Browse, filter, and track roles across companies.',
  goals: 'Yearly to daily cascade with roll-up progress.',
  companies: 'Networking contacts linked to your pipeline.',
  notes: 'Research notes, interview prep, and follow-ups.',
  settings: 'Preferences and workspace configuration.',
}

export function PlaceholderView({ route }: PlaceholderViewProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10 sm:px-10 sm:py-12">
      <PageHeader
        title={ROUTE_LABELS[route]}
        description={DESCRIPTIONS[route]}
      />

      <div className="mt-12 rounded-lg border border-[#2A2A2A] bg-[#141414] px-8 py-16 text-center">
        <p className="text-sm font-medium text-white">Coming next</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#555555]">
          This surface is scaffolded and will attach without changing the shell.
        </p>
      </div>
    </div>
  )
}
