import { useState } from 'react'
import { PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { startManualReflection } from '@/lib/data/reflections'
import { cn } from '@/lib/utils'

export function ReflectNowButton({
  className,
  variant = 'outline',
}: {
  className?: string
  variant?: 'outline' | 'default' | 'ghost'
}) {
  const [open, setOpen] = useState(false)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          className={cn(
            variant === 'outline' &&
              'border-[#2A2A2A] bg-transparent text-[#888888] hover:bg-[#1A1A1A] hover:text-white',
            variant === 'default' && 'bg-white text-[#0A0A0A] hover:bg-white/90',
            'gap-1.5',
            className,
          )}
        >
          <PenLine className="size-3.5" strokeWidth={1.75} />
          Reflect Now
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-[#2A2A2A] bg-[#141414] text-white"
      >
        <DropdownMenuItem
          className="focus:bg-[#1A1A1A] focus:text-white"
          onClick={() => startManualReflection('week', { usePrevious: false })}
        >
          This week
        </DropdownMenuItem>
        <DropdownMenuItem
          className="focus:bg-[#1A1A1A] focus:text-white"
          onClick={() => startManualReflection('week', { usePrevious: true })}
        >
          Last week
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#2A2A2A]" />
        <DropdownMenuItem
          className="focus:bg-[#1A1A1A] focus:text-white"
          onClick={() => startManualReflection('month', { usePrevious: false })}
        >
          This month
        </DropdownMenuItem>
        <DropdownMenuItem
          className="focus:bg-[#1A1A1A] focus:text-white"
          onClick={() => startManualReflection('month', { usePrevious: true })}
        >
          Last month
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
