import { useCallback, useState, type ReactNode } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PlaceholderView } from '@/components/shared/PlaceholderView'
import { ContactsPage } from '@/features/contacts'
import { DashboardPage } from '@/features/dashboard'
import { GoalsPage } from '@/features/goals'
import { JobHubPage } from '@/features/job-hub'
import { NotesReflectionsPage } from '@/features/reflection'
import { OpeningScene, shouldShowIntro } from '@/features/intro'
import { useAppStore } from '@/stores/app-store'

export default function App() {
  const activeRoute = useAppStore((s) => s.activeRoute)

  // Intro mounts by default (not gated by sessionStorage).
  // Opt out: ?intro=0 or OS “Reduce motion”.
  const [introDone, setIntroDone] = useState(() => !shouldShowIntro())

  const finishIntro = useCallback(() => {
    setIntroDone(true)
  }, [])

  let body: ReactNode
  switch (activeRoute) {
    case 'dashboard':
      body = <DashboardPage />
      break
    case 'jobs':
      body = <JobHubPage />
      break
    case 'goals':
      body = <GoalsPage />
      break
    case 'companies':
      body = <ContactsPage />
      break
    case 'notes':
      body = <NotesReflectionsPage />
      break
    default:
      body = <PlaceholderView route={activeRoute} />
  }

  return (
    <>
      {!introDone && <OpeningScene onComplete={finishIntro} />}
      <div
        className={
          introDone
            ? 'opacity-100 transition-opacity duration-500'
            : 'opacity-0 pointer-events-none'
        }
        aria-hidden={!introDone}
      >
        <AppShell>{body}</AppShell>
      </div>
    </>
  )
}
