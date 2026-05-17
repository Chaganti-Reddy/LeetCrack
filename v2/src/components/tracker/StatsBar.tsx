import { CircleCheckBig, Percent, Star, Target } from 'lucide-react'
import { formatNumber, getDifficultyLabel, problemKey } from '@/lib/utils'
import type { Platform, PlatformProgress, Problem } from '@/types'

interface StatsBarProps {
  platform: Platform
  problems: Problem[]
  progress: PlatformProgress
}

function displayCount(value: number) {
  return value > 0 ? formatNumber(value) : '—'
}

// Ordered tier configs per platform
const TIER_CONFIG: Record<Platform, { label: string; buckets: string[]; color: string; bg: string }[]> = {
  lc: [
    { label: 'Easy', buckets: ['Easy'], color: 'text-difficulty-easy', bg: 'bg-[var(--green-bg)]' },
    { label: 'Medium', buckets: ['Medium'], color: 'text-difficulty-medium', bg: 'bg-[var(--yellow-bg)]' },
    { label: 'Hard', buckets: ['Hard'], color: 'text-difficulty-hard', bg: 'bg-[var(--red-bg)]' },
  ],
  cf: [
    { label: '≤1199', buckets: ['800-1199'], color: 'text-text-muted', bg: 'bg-bg-3' },
    { label: '1200–1599', buckets: ['1200-1599'], color: 'text-[var(--green)]', bg: 'bg-[var(--green-bg)]' },
    { label: '1600–1999', buckets: ['1600-1999'], color: 'text-[#3b82f6]', bg: 'bg-blue-500/10' },
    { label: '2000+', buckets: ['2000+'], color: 'text-[var(--red)]', bg: 'bg-[var(--red-bg)]' },
  ],
  ac: [
    { label: '0–799', buckets: ['0-799'], color: 'text-text-muted', bg: 'bg-bg-3' },
    { label: '800–1599', buckets: ['800-1599'], color: 'text-[var(--green)]', bg: 'bg-[var(--green-bg)]' },
    { label: '1600–2399', buckets: ['1600-2399'], color: 'text-[#3b82f6]', bg: 'bg-blue-500/10' },
    { label: '2400+', buckets: ['2400+'], color: 'text-[var(--red)]', bg: 'bg-[var(--red-bg)]' },
  ],
}

export function StatsBar({ platform, problems, progress }: StatsBarProps) {
  const solvedIds = new Set(Object.keys(progress.solved))
  const total = problems.length
  const solved = problems.filter((p) => solvedIds.has(problemKey(p))).length
  const starred = Object.keys(progress.bookmarks).length
  const coverage = total > 0 && solved > 0 ? `${Math.round((solved / total) * 100)}%` : '—'

  // Count problems per difficulty bucket
  const bucketCounts: Record<string, number> = {}
  for (const p of problems) {
    const bucket = getDifficultyLabel(p)
    bucketCounts[bucket] = (bucketCounts[bucket] ?? 0) + 1
  }

  const tiers = TIER_CONFIG[platform]

  const cards = [
    { label: 'Total', value: displayCount(total), icon: Target },
    { label: 'Solved', value: displayCount(solved), icon: CircleCheckBig },
    { label: 'Coverage', value: coverage, icon: Percent },
    { label: 'Starred', value: displayCount(starred), icon: Star },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="card min-w-0 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.22em] text-text-dim">{card.label}</p>
            <card.icon size={16} className="shrink-0 text-accent" />
          </div>
          <p className="mt-3 truncate font-display text-3xl font-bold">{card.value}</p>
        </div>
      ))}
      <div className="card p-4 xl:col-span-1">
        <p className="text-xs uppercase tracking-[0.22em] text-text-dim">Difficulty mix</p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold">
          {tiers.map((tier) => {
            const count = tier.buckets.reduce((sum, b) => sum + (bucketCounts[b] ?? 0), 0)
            return (
              <div key={tier.label} className={`rounded-lg px-2.5 py-1.5 ${tier.bg} ${tier.color}`}>
                {tier.label} {displayCount(count)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
