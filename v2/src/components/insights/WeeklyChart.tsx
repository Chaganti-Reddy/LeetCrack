import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { WeeklyBucket } from '@/types'

export function WeeklyChart({ data }: { data: WeeklyBucket[] }) {
  // Only show radius on top-most non-zero bar per stack
  const processedData = data.map((d) => ({ ...d }))

  return (
    <div className="card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-title">Weekly solve trend</h3>
        <p className="muted">Last 12 weeks</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={processedData} barCategoryGap="35%">
            <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              stroke="var(--text-dim)"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tick={{ fill: 'var(--text-muted)' }}
            />
            <YAxis
              stroke="var(--text-dim)"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tick={{ fill: 'var(--text-muted)' }}
              allowDecimals={false}
              width={24}
            />
            <Tooltip
              cursor={{ fill: 'var(--bg-3)', radius: 6 }}
              contentStyle={{
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                fontSize: '12px',
                color: 'var(--text)',
              }}
              itemStyle={{ color: 'var(--text-muted)' }}
              labelStyle={{ color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{value}</span>}
            />
            <Bar dataKey="easy" name="Easy" stackId="stack" fill="var(--green)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="medium" name="Medium" stackId="stack" fill="var(--yellow)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="hard" name="Hard" stackId="stack" fill="var(--red)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
