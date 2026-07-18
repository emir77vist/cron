import { PageHeader } from '@/components/shared/PageHeader'
import { QuickAdd } from '@/features/job-hub/QuickAdd'
import { PipelineSummary } from '@/features/job-hub/PipelineSummary'
import { ApplicationsTable } from '@/features/job-hub/ApplicationsTable'

export function JobHubPage() {
  return (
    <div className="page-shell-wide">
      <PageHeader
        title="Job Hub"
        description="Track roles from link to offer. Parse listings, manage status, keep notes — all in one calm surface."
      />

      <div className="mt-16 space-y-16">
        <QuickAdd />
        <PipelineSummary />
        <ApplicationsTable />
      </div>
    </div>
  )
}
