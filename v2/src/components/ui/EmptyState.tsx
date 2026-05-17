import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  icon: LucideIcon
  heading: string
  description: string
  cta?: { label: string; onClick: () => void }
  secondaryCta?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon: Icon, heading, description, cta, secondaryCta, className }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-border bg-bg-2/50 p-12 text-center ${className ?? ''}`}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-3 text-text-dim">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <div className="max-w-sm">
        <p className="font-display text-xl font-bold">{heading}</p>
        <p className="mt-2 text-sm text-text-muted leading-relaxed">{description}</p>
      </div>
      {(cta || secondaryCta) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {cta && <Button variant="primary" onClick={cta.onClick}>{cta.label}</Button>}
          {secondaryCta && <Button variant="ghost" onClick={secondaryCta.onClick}>{secondaryCta.label}</Button>}
        </div>
      )}
    </div>
  )
}
