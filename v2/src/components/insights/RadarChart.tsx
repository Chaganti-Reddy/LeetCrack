import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart as RechartsRadarChart, ResponsiveContainer } from 'recharts'

export function RadarChart({ data }: { data: Array<{ skill: string; value: number }> }) {
  return (
    <div className="card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-title">Skills radar</h3>
        <p className="muted">Topic strength snapshot</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart data={data} outerRadius={110}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.24} />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
