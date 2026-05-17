import { ArrowUpRight } from 'lucide-react'
import { buildProblemUrl, dateStr } from '@/lib/utils'
import type { Problem } from '@/types'

export function RecentSolves({ items }: { items: Array<{ problem: Problem; solvedAt: string }> }) {
  return (
    <div className="card flex flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-title">Recent solves</h3>
        <p className="muted">Latest 10 accepted problems</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {items.length ? items.map(({ problem, solvedAt }) => (
          <a key={`${problem.platform}-${problem.id}`} href={buildProblemUrl(problem)} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-border bg-bg-3/40 px-3 py-3 hover:bg-bg-4/70">
            <div className="min-w-0">
              <p className="truncate font-semibold">{problem.title}</p>
              <p className="text-xs text-text-muted">{dateStr(solvedAt)}</p>
            </div>
            <ArrowUpRight size={16} className="text-text-dim shrink-0 ml-2" />
          </a>
        )) : <p className="text-sm text-text-muted">No solves yet. Sync your account to populate this list.</p>}
      </div>
    </div>
  )
}
