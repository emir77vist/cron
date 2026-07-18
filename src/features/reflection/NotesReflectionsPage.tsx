import { PageHeader } from '@/components/shared/PageHeader'
import {
  ReflectNowButton,
  ReflectionArchiveList,
} from '@/features/reflection'

/**
 * Notes route hosts the reflection archive for v1 (calm history surface).
 */
export function NotesReflectionsPage() {
  return (
    <div className="page-shell max-w-3xl">
      <PageHeader
        title="Reflections"
        description="Archived weeks and months — metrics snapshots with your answers."
        actions={<ReflectNowButton />}
      />

      <div className="mt-16">
        <ReflectionArchiveList />
      </div>
    </div>
  )
}
