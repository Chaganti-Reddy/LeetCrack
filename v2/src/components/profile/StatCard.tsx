interface StatCardProps {
  label: string
  value: string | number
  tone?: 'accent' | 'green' | 'yellow' | 'red'
}

export function StatCard({ label, value, tone = 'accent' }: StatCardProps) {
  const toneClass = tone === 'green' ? 'text-[var(--green)]' : tone === 'yellow' ? 'text-[var(--yellow)]' : tone === 'red' ? 'text-[var(--red)]' : 'text-accent-2'
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-text-dim">{label}</p>
      <p className={`mt-3 font-display text-3xl font-bold ${toneClass}`}>{value}</p>
    </div>
  )
}
