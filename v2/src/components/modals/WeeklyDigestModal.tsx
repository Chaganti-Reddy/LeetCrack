import * as Dialog from '@radix-ui/react-dialog'
import { Target, X } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { useProgressStore } from '@/stores/progressStore'
import { useUiStore } from '@/stores/uiStore'

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

function calcCurrentStreak(activity: Record<string, number>): number {
  let streak = 0
  for (let offset = 0; offset < 365; offset++) {
    const d = new Date()
    d.setDate(d.getDate() - offset)
    const key = d.toISOString().slice(0, 10)
    if ((activity[key] ?? 0) > 0) streak++
    else break
  }
  return streak
}

export function WeeklyDigestModal() {
  const open = useUiStore((state) => state.weeklyDigestOpen)
  const setOpen = useUiStore((state) => state.setWeeklyDigestOpen)
  const platforms = useProgressStore((state) => state.platforms)

  const stats = useMemo(() => {
    const days = getLast7Days()
    const lcCount = days.reduce((s, d) => s + (platforms.lc.activity[d] ?? 0), 0)
    const cfCount = days.reduce((s, d) => s + (platforms.cf.activity[d] ?? 0), 0)
    const acCount = days.reduce((s, d) => s + (platforms.ac.activity[d] ?? 0), 0)
    const total = lcCount + cfCount + acCount

    // Combined activity for streak
    const combined: Record<string, number> = {}
    for (const p of ['lc', 'cf', 'ac'] as const) {
      for (const [day, count] of Object.entries(platforms[p].activity)) {
        combined[day] = (combined[day] ?? 0) + count
      }
    }
    const streak = calcCurrentStreak(combined)

    // Readiness: based on LC (most commonly used)
    const lcSolved = Object.keys(platforms.lc.solved).length
    const lcStreak = calcCurrentStreak(platforms.lc.activity)
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i)
      return platforms.lc.activity[d.toISOString().slice(0, 10)] ?? 0
    }).reduce((s, v) => s + v, 0)
    const readiness = Math.min(100, Math.round(
      Math.min(lcSolved, 100) * 0.4 +
      Math.min(lcStreak, 14) * 2 +
      Math.min(last30, 20) * 1
    ))

    return { lcCount, cfCount, acCount, total, streak, readiness, days }
  }, [platforms])

  const weeklyGoal = useUiStore((state) => state.weeklyGoal)
  const setWeeklyGoal = useUiStore((state) => state.setWeeklyGoal)
  const readinessColor = stats.readiness >= 75 ? 'text-green-400' : stats.readiness >= 50 ? 'text-yellow-400' : 'text-accent'
  const goalPct = weeklyGoal > 0 ? Math.min(100, Math.round((stats.total / weeklyGoal) * 100)) : 0
  const goalColor = goalPct >= 100 ? 'bg-green-500' : goalPct >= 60 ? 'bg-accent' : 'bg-yellow-500'

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-bg-2 p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <Dialog.Title className="font-display text-lg font-bold">Weekly Digest</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-text-muted">
                {stats.days[0]} → {stats.days[6]}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-text-muted hover:bg-bg-4 hover:text-text transition-colors" aria-label="Close">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Big total */}
          <div className="mb-4 text-center">
            <div className="font-display text-5xl font-extrabold text-accent leading-none">{stats.total}</div>
            <p className="mt-2 text-sm text-text-muted">problems solved this week</p>
          </div>

          {/* Weekly goal */}
          <div className="mb-5 rounded-xl border border-border bg-bg-3 px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold"><Target size={12} /> Weekly goal</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1} max={99}
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(Math.max(1, Number(e.target.value)))}
                  className="w-10 rounded bg-bg-4 px-1 py-0.5 text-center text-xs text-text outline-none focus:ring-1 focus:ring-accent/40"
                />
                <span className="text-text-dim">/ week</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-bg-4 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${goalColor}`} style={{ width: `${goalPct}%` }} />
            </div>
            <p className="mt-1.5 text-right text-[10px] text-text-dim">
              {goalPct >= 100 ? '🎉 Goal reached!' : `${stats.total} / ${weeklyGoal} (${goalPct}%)`}
            </p>
          </div>

          {/* Platform breakdown */}
          <div className="mb-5 grid grid-cols-3 gap-2">
            {[
              { label: 'LeetCode', count: stats.lcCount, color: 'text-yellow-400' },
              { label: 'Codeforces', count: stats.cfCount, color: 'text-blue-400' },
              { label: 'AtCoder', count: stats.acCount, color: 'text-green-400' },
            ].map(({ label, count, color }) => (
              <div key={label} className="rounded-xl border border-border bg-bg-3 px-2 py-3 text-center">
                <div className={`font-display text-2xl font-bold ${color}`}>{count}</div>
                <div className="mt-1 text-xs text-text-dim">{label}</div>
              </div>
            ))}
          </div>

          {/* Streak + readiness */}
          <div className="mb-5 flex justify-around rounded-xl border border-border bg-bg-3 py-3 text-xs">
            <span>🔥 <strong>{stats.streak}</strong> day streak</span>
            <span className={readinessColor}>⚡ <strong>{stats.readiness}%</strong> readiness</span>
          </div>

          {/* Day bar mini chart — 32px usable bar area */}
          <div className="mb-5">
            <div className="flex items-end gap-1" style={{ height: '32px' }}>
              {stats.days.map((day) => {
                const total = (platforms.lc.activity[day] ?? 0) + (platforms.cf.activity[day] ?? 0) + (platforms.ac.activity[day] ?? 0)
                const maxDay = Math.max(...stats.days.map((d) => (platforms.lc.activity[d] ?? 0) + (platforms.cf.activity[d] ?? 0) + (platforms.ac.activity[d] ?? 0)), 1)
                const h = total ? Math.max(3, Math.round((total / maxDay) * 32)) : 2
                return (
                  <div key={day} className="flex-1 rounded-sm" style={{ height: `${h}px`, background: total ? 'var(--accent)' : 'var(--bg-4)' }} />
                )
              })}
            </div>
            <div className="mt-1 flex gap-1">
              {stats.days.map((day) => {
                const dayLabel = new Date(day + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1)
                return <div key={day} className="flex-1 text-center text-[9px] text-text-dim">{dayLabel}</div>
              })}
            </div>
          </div>

          <Dialog.Close asChild>
            <Button className="w-full">Done</Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
