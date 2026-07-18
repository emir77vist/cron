import { useState } from 'react'
import {
  Briefcase,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Settings,
  StickyNote,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/nav'
import { useAppStore } from '@/stores/app-store'
import type { AppRoute, NavIconName } from '@/types'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PomodoroWidget } from '@/features/pomodoro'

const ICONS: Record<NavIconName, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  briefcase: Briefcase,
  target: Target,
  'building-2': Building2,
  users: Users,
  'sticky-note': StickyNote,
  settings: Settings,
}

function BrandMark({ collapsed }: { collapsed: boolean }) {
  const [logoFailed, setLogoFailed] = useState(false)

  if (collapsed) {
    return (
      <span
        className="select-none text-2xl font-semibold tracking-tight text-white"
        aria-label="Cron"
        style={{ fontFamily: '"Familjen Grotesk", sans-serif' }}
      >
        C
      </span>
    )
  }

  if (logoFailed) {
    return (
      <span
        className="select-none text-[2.75rem] font-semibold leading-none tracking-tight text-white"
        style={{ fontFamily: '"Familjen Grotesk", sans-serif' }}
      >
        Cron
      </span>
    )
  }

  return (
    <img
      src="/logo-large.png"
      alt="Cron"
      className="h-11 w-auto max-w-[200px] object-contain object-left sm:h-12"
      onError={() => setLogoFailed(true)}
      draggable={false}
    />
  )
}

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const activeRoute = useAppStore((s) => s.activeRoute)
  const setActiveRoute = useAppStore((s) => s.setActiveRoute)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen)

  return (
    <aside
      className={cn(
        'flex h-dvh shrink-0 flex-col border-r border-[#2A2A2A] bg-[#0A0A0A]/95',
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-16' : 'w-60',
      )}
      aria-label="Primary"
    >
      {/* Brand — large white wordmark, generous air */}
      <div
        className={cn(
          'flex items-center border-b border-[#2A2A2A]',
          collapsed ? 'justify-center px-2 py-6' : 'px-5 py-8',
        )}
      >
        <BrandMark collapsed={collapsed} />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2.5" aria-label="Main">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon]
          const active = activeRoute === item.id

          const button = (
            <button
              type="button"
              onClick={() => setActiveRoute(item.id as AppRoute)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-md text-sm transition-colors duration-150',
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
                active
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#888888] hover:bg-[#141414] hover:text-white',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'size-[18px] shrink-0',
                  active
                    ? 'text-white'
                    : 'text-[#888888] group-hover:text-white',
                )}
                strokeWidth={1.6}
              />
              {!collapsed && (
                <span className="truncate font-medium tracking-tight">
                  {item.label}
                </span>
              )}
            </button>
          )

          if (!collapsed) {
            return <div key={item.id}>{button}</div>
          }

          return (
            <Tooltip key={item.id} delayDuration={0}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {item.label}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-[#2A2A2A] p-2.5">
        <PomodoroWidget collapsed={collapsed} />

        {!collapsed && (
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className={cn(
              'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm',
              'text-[#555555] transition-colors hover:bg-[#141414] hover:text-[#888888]',
            )}
          >
            <span>Search</span>
            <kbd className="rounded border border-[#2A2A2A] bg-[#141414] px-1.5 py-0.5 font-mono text-[10px] text-[#555555]">
              ⌘K
            </kbd>
          </button>
        )}

        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            'flex w-full items-center rounded-md text-sm text-[#555555]',
            'transition-colors hover:bg-[#141414] hover:text-[#888888]',
            collapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronsRight className="size-4" strokeWidth={1.75} />
          ) : (
            <>
              <ChevronsLeft className="size-4" strokeWidth={1.75} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
