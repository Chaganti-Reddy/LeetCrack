import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { RatingHistoryPoint, RivalSeries } from '@/types'

const rivalColors = ['#60a5fa', '#4ade80', '#f87171', '#facc15']

export function RatingGraph({ history, rivals }: { history: RatingHistoryPoint[]; rivals: RivalSeries[] }) {
  const base = history.map((point) => {
    const row: Record<string, string | number | null> = { date: point.date.slice(0, 10), you: point.rating }
    rivals.forEach((rival) => {
      const match = rival.points.find((item) => item.date.slice(0, 10) === point.date.slice(0, 10))
      row[rival.handle] = match?.rating ?? null
    })
    return row
  })

  return (
    <div className="card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-title">Rating history</h3>
        <p className="muted">Compare yourself with rivals</p>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={base}>
            <XAxis dataKey="date" stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} fontSize={12} />
            <Tooltip contentStyle={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }} />
            <Line type="monotone" dataKey="you" stroke="var(--accent)" strokeWidth={3} dot={false} />
            {rivals.map((rival, index) => (
              <Line key={rival.handle} type="monotone" dataKey={rival.handle} stroke={rivalColors[index % rivalColors.length]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
