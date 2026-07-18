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
  // Force-replay: ?intro=1 clears the session flag so OpeningScene mounts
  const [introDone, setIntroDone] = useState(() => {
    try {
      if (new URLSearchParams(window.location.search).get('intro') === '1') {
        sessionStorage.removeItem('cron.intro.seen.v3')
        sessionStorage.removeItem('cron.intro.seen')
        sessionStorage.removeItem('cron.intro.seen.v2')
      }
    } catch {
      /* ignore */
    }
    return !shouldShowIntro()
  })

  const finishIntro = useCallback(() => {
    setIntroDone(true)
    // Drop ?intro=1 from the URL after playing so refresh doesn't loop
    try {
      const url = new URL(window.location.href)
      if (url.searchParams.has('intro')) {
        url.searchParams.delete('intro')
        window.history.replaceState({}, '', url.pathname + url.search + url.hash)
      }
    } catch {
      /* ignore */
    }
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
            : 'opacity-0'
        }
        aria-hidden={!introDone}
      >
        <AppShell>{body}</AppShell>
      </div>
    </>
  )
}
