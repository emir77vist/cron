import type { ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sidebar } from '@/components/layout/Sidebar'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { useCommandPaletteShortcut } from '@/hooks/use-command-palette-shortcut'
import {
  ReflectionModal,
  useReflectionBootstrap,
} from '@/features/reflection'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  useCommandPaletteShortcut()
  useReflectionBootstrap()

  return (
    <TooltipProvider delayDuration={200}>
      <div className="dot-matrix flex h-dvh w-full overflow-hidden">
        <Sidebar />
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Soft vignette edge so content floats on the matrix */}
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 70% at 50% 40%, transparent 40%, rgba(10,10,10,0.55) 100%)',
            }}
          />
          <div className="relative z-[1] flex-1 overflow-y-auto">{children}</div>
        </main>
        <CommandPalette />
        <ReflectionModal />
      </div>
    </TooltipProvider>
  )
}
