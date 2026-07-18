import { cn } from '@/lib/utils'

export function ProgressBar({
  value,
  className,
  size = 'md',
}: {
  value: number
  className?: string
  size?: 'sm' | 'md'
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        className,
      )}
    >
      <div
        className={cn(
          'relative w-24 overflow-hidden rounded-full bg-[#2A2A2A] sm:w-32',
          size === 'sm' ? 'h-[3px]' : 'h-1',
        )}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-[#888888]">
        {pct}%
      </span>
    </div>
  )
}
