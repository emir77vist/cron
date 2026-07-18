import { useMemo } from 'react'
import {
  Briefcase,
  Building2,
  LayoutDashboard,
  PanelLeft,
  PenLine,
  Settings,
  StickyNote,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { startManualReflection } from '@/lib/data/reflections'
import { usePomodoroStore } from '@/features/pomodoro'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { NAV_ITEMS } from '@/lib/nav'
import { useAppStore } from '@/stores/app-store'
import type { AppRoute, NavIconName } from '@/types'

const ICONS: Record<NavIconName, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  briefcase: Briefcase,
  target: Target,
  'building-2': Building2,
  users: Users,
  'sticky-note': StickyNote,
  settings: Settings,
}

export function CommandPalette() {
  const open = useAppStore((s) => s.commandPaletteOpen)
  const setOpen = useAppStore((s) => s.setCommandPaletteOpen)
  const setActiveRoute = useAppStore((s) => s.setActiveRoute)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const pomoRunning = usePomodoroStore((s) => s.running)
  const pomoStart = usePomodoroStore((s) => s.start)
  const pomoPause = usePomodoroStore((s) => s.pause)
  const pomoReset = usePomodoroStore((s) => s.reset)

  const navCommands = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        Icon: ICONS[item.icon],
      })),
    [],
  )

  function go(route: AppRoute) {
    setActiveRoute(route)
    setOpen(false)
  }

  function run(action: () => void) {
    action()
    setOpen(false)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Navigate or run an action"
      className="border-[#2A2A2A] bg-[#141414] text-white sm:max-w-lg"
    >
      <CommandInput
        placeholder="Type a command or search…"
        className="text-white placeholder:text-[#555555]"
      />
      <CommandList>
        <CommandEmpty className="py-8 text-center text-sm text-[#555555]">
          No results.
        </CommandEmpty>

        <CommandGroup heading="Navigation">
          {navCommands.map(({ id, label, shortcut, Icon }) => (
            <CommandItem
              key={id}
              value={`${label} ${id}`}
              onSelect={() => go(id)}
              className="gap-2 data-[selected=true]:bg-[#1A1A1A]"
            >
              <Icon className="size-4 text-[#888888]" strokeWidth={1.75} />
              <span>{label}</span>
              {shortcut && (
                <CommandShortcut className="text-[#555555]">
                  {shortcut}
                </CommandShortcut>
              )}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator className="bg-[#2A2A2A]" />

        <CommandGroup heading="Actions">
          <CommandItem
            value="reflect now weekly reflection"
            onSelect={() =>
              run(() => startManualReflection('week', { usePrevious: false }))
            }
            className="gap-2 data-[selected=true]:bg-[#1A1A1A]"
          >
            <PenLine className="size-4 text-[#888888]" strokeWidth={1.75} />
            <span>Reflect now</span>
            <CommandShortcut className="text-[#555555]">Week</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="reflect last week"
            onSelect={() =>
              run(() => startManualReflection('week', { usePrevious: true }))
            }
            className="gap-2 data-[selected=true]:bg-[#1A1A1A]"
          >
            <PenLine className="size-4 text-[#888888]" strokeWidth={1.75} />
            <span>Reflect on last week</span>
          </CommandItem>
          <CommandItem
            value="pomodoro timer focus start pause"
            onSelect={() => run(() => (pomoRunning ? pomoPause() : pomoStart()))}
            className="gap-2 data-[selected=true]:bg-[#1A1A1A]"
          >
            <Target className="size-4 text-[#888888]" strokeWidth={1.75} />
            <span>{pomoRunning ? 'Pause focus timer' : 'Start focus timer'}</span>
          </CommandItem>
          <CommandItem
            value="pomodoro reset timer"
            onSelect={() => run(pomoReset)}
            className="gap-2 data-[selected=true]:bg-[#1A1A1A]"
          >
            <Target className="size-4 text-[#888888]" strokeWidth={1.75} />
            <span>Reset focus timer</span>
          </CommandItem>
          <CommandItem
            value="toggle sidebar collapse expand"
            onSelect={() => run(toggleSidebar)}
            className="gap-2 data-[selected=true]:bg-[#1A1A1A]"
          >
            <PanelLeft className="size-4 text-[#888888]" strokeWidth={1.75} />
            <span>
              {sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
