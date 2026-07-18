import { cn } from '@/lib/utils'
import { STATUS_LABELS } from '@/lib/format'
import type { ApplicationStatus } from '@/types'

/**
 * Monochrome status pill — weight/opacity only, no color.
 */
export function StatusBadge({
  status,
  className,
}: {
  status: ApplicationStatus
  className?: string
}) {
  const emphasis =
    status === 'offer' || status === 'accepted'
      ? 'border-white/25 bg-white text-[#0A0A0A]'
      : status === 'rejected' || status === 'withdrawn'
        ? 'border-[#2A2A2A] bg-transparent text-[#555555]'
        : status === 'interview' || status === 'screening'
          ? 'border-[#2A2A2A] bg-[#1A1A1A] text-white'
          : 'border-[#2A2A2A] bg-[#141414] text-[#888888]'

  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-medium tracking-wide',
        emphasis,
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}
