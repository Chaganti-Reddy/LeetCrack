import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface PatternInsightsProps {
  coverage: Array<{ name: string; value: number }>
  weakPatterns: Array<{ tag: string; missing: number }>
}

const colors = ['#c8a84b', '#60a5fa', '#4ade80', '#facc15', '#f87171']

export function PatternInsights({ coverage, weakPatterns }: PatternInsightsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="section-title">Pattern coverage</h3>
          <p className="muted">Solved tag spread</p>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={coverage} dataKey="value" nameKey="name" innerRadius={64} outerRadius={92} paddingAngle={2}>
                {coverage.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="section-title">Weak patterns</h3>
          <p className="muted">Most unsolved high-frequency tags</p>
        </div>
        <div className="space-y-2">
          {weakPatterns.length ? weakPatterns.map((pattern) => (
            <div key={pattern.tag} className="rounded-xl border border-border bg-bg-3/40 px-3 py-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{pattern.tag}</p>
                <p className="text-sm text-text-muted">{pattern.missing} missing</p>
              </div>
            </div>
          )) : <p className="text-sm text-text-muted">No weak patterns detected yet.</p>}
        </div>
      </div>
    </div>
  )
}
