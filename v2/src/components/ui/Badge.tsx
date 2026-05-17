import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps {
  children: ReactNode
  variant?: 'easy' | 'medium' | 'hard' | 'accent' | 'muted' | 'outline'
  className?: string
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  easy: 'bg-[var(--green-bg)] text-difficulty-easy border-[var(--green)]/20',
  medium: 'bg-[var(--yellow-bg)] text-difficulty-medium border-[var(--yellow)]/20',
  hard: 'bg-[var(--red-bg)] text-difficulty-hard border-[var(--red)]/20',
  accent: 'bg-accent-dim text-accent-2 border-accent/20',
  muted: 'bg-bg-4/80 text-text-muted border-border',
  outline: 'bg-transparent text-text border-border-2',
}

export function Badge({ children, variant = 'muted', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide', variants[variant], className)}>
      {children}
    </span>
  )
}
