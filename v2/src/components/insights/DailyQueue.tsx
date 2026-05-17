import { buildProblemUrl, dateStr } from '@/lib/utils'
import type { Problem } from '@/types'

export function DailyQueue({ items }: { items: Array<{ problem: Problem; nextReviewAt: string }> }) {
  return (
    <div className="card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-title">Daily review queue</h3>
        <p className="muted">SM2 due today</p>
      </div>
      <div className="space-y-2">
        {items.length ? items.map(({ problem, nextReviewAt }) => (
          <a key={`${problem.platform}-${problem.id}`} href={buildProblemUrl(problem)} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-border bg-bg-3/40 px-3 py-3 hover:bg-bg-4/70">
            <div>
              <p className="font-semibold">{problem.title}</p>
              <p className="text-xs text-text-muted">Due {dateStr(nextReviewAt)}</p>
            </div>
            <span className="text-xs text-accent-2">Review</span>
          </a>
        )) : <p className="text-sm text-text-muted">Your queue is clear. Keep solving new problems.</p>}
      </div>
    </div>
  )
}
