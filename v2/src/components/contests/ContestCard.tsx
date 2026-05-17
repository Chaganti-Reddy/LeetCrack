import { CalendarRange, Clock3, ArrowUpRight } from 'lucide-react'
import { dateStr } from '@/lib/utils'
import type { ContestItem } from '@/types'

export function ContestCard({ contest }: { contest: ContestItem }) {
  return (
    <a href={contest.url} target="_blank" rel="noreferrer" className="card block p-4 hover:border-accent/30 hover:bg-bg-3/50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-text-dim">{contest.platform.toUpperCase()} / {contest.phase}</p>
          <h3 className="mt-2 text-lg font-semibold leading-tight">{contest.title}</h3>
        </div>
        <ArrowUpRight size={18} className="text-text-dim" />
      </div>
      <div className="mt-4 space-y-2 text-sm text-text-muted">
        <p className="flex items-center gap-2"><CalendarRange size={14} /> {dateStr(contest.startTime)}</p>
        <p className="flex items-center gap-2"><Clock3 size={14} /> {contest.durationMinutes ? `${contest.durationMinutes} min` : 'TBA'}</p>
      </div>
    </a>
  )
}
