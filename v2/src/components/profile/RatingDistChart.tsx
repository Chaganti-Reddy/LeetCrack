import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export function RatingDistChart({ data }: { data: Array<{ bucket: string; count: number }> }) {
  return (
    <div className="card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-title">Difficulty distribution</h3>
        <p className="muted">Solved problems by bucket</p>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="bucket" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }} />
            <Bar dataKey="count" fill="var(--accent)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
