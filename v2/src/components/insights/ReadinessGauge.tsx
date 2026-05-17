interface ReadinessGaugeProps {
  score: number
}

export function ReadinessGauge({ score }: ReadinessGaugeProps) {
  const radius = 74
  const circumference = 2 * Math.PI * radius
  const progress = circumference - (score / 100) * circumference

  return (
    <div className="card flex flex-col items-center p-6 text-center">
      <h3 className="section-title">Interview readiness</h3>
      <div className="relative mt-4 h-44 w-44">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
          <circle cx="90" cy="90" r={radius} stroke="var(--border)" strokeWidth="12" fill="none" />
          <circle cx="90" cy="90" r={radius} stroke="var(--accent)" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={progress} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-display text-5xl font-bold">{score}</p>
          <p className="muted">out of 100</p>
        </div>
      </div>
    </div>
  )
}
