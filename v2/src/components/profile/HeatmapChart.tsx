import { addDays, format, startOfWeek, subWeeks } from 'date-fns'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { buildProblemUrl } from '@/lib/utils'
import type { Problem } from '@/types'

export interface DaySolve {
  title: string
  platform: 'lc' | 'cf' | 'ac'
  difficulty?: string
  problem?: Problem
}

interface HeatmapChartProps {
  activity: Record<string, number>
  solvesByDate?: Record<string, DaySolve[]>
}

const WEEKS = 52
const LEVEL_COLORS = [
  'var(--bg-3)',
  'rgba(74,222,128,0.20)',
  'rgba(74,222,128,0.42)',
  'rgba(74,222,128,0.66)',
  'rgba(74,222,128,0.92)',
]
const PLATFORM_COLORS: Record<string, string> = { lc: '#f5a524', cf: '#4fc3f7', ac: '#818cf8' }
const PLATFORM_LABELS: Record<string, string> = { lc: '⚡ LeetCode', cf: '📊 Codeforces', ac: '🔵 AtCoder' }

function buildWeeks(activity: Record<string, number>) {
  const today = new Date()
  const startDate = startOfWeek(subWeeks(today, WEEKS - 1))
  const maxVal = Math.max(1, ...Object.values(activity))
  return Array.from({ length: WEEKS }, (_, w) => {
    const weekStart = addDays(startDate, w * 7)
    return Array.from({ length: 7 }, (_, d) => {
      const day = addDays(weekStart, d)
      const date = day.toISOString().slice(0, 10)
      const count = activity[date] ?? 0
      const isFuture = day > today
      return { date, count, level: isFuture ? 0 : count === 0 ? 0 : Math.min(4, Math.ceil((count / maxVal) * 4)), isFuture }
    })
  })
}

function buildMonthLabels(weeks: ReturnType<typeof buildWeeks>) {
  const seen = new Set<string>()
  return weeks.flatMap((week, wi) => {
    const month = week[0].date.slice(0, 7)
    if (seen.has(month)) return []
    seen.add(month)
    return [{ label: format(new Date(week[0].date + 'T00:00:00'), 'MMM'), wi }]
  })
}

export function HeatmapChart({ activity, solvesByDate = {} }: HeatmapChartProps) {
  const [popup, setPopup] = useState<{ date: string; x: number; y: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const weeks = buildWeeks(activity)
  const monthLabels = buildMonthLabels(weeks)
  const hasAnyActivity = Object.values(activity).some((v) => v > 0)

  // Close popup on scroll or outside click
  useEffect(() => {
    if (!popup) return
    const close = () => setPopup(null)
    window.addEventListener('scroll', close, true)
    window.addEventListener('click', close)
    return () => { window.removeEventListener('scroll', close, true); window.removeEventListener('click', close) }
  }, [popup])

  function handleCellClick(date: string, e: React.MouseEvent) {
    e.stopPropagation()
    const solves = solvesByDate[date]
    if (!solves?.length) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    // Use viewport-relative coords for portal (fixed positioning)
    const x = rect.left + rect.width / 2
    const y = rect.bottom + 8
    setPopup((prev) => prev?.date === date ? null : { date, x, y })
  }

  const popupSolves = popup ? (solvesByDate[popup.date] ?? []) : []
  const popupGroups = (['lc', 'cf', 'ac'] as const)
    .map((p) => ({ platform: p, solves: popupSolves.filter((s) => s.platform === p) }))
    .filter((g) => g.solves.length)

  return (
    <div className="card flex flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="section-title">Activity heatmap</h3>
        <p className="muted">Last 52 weeks</p>
      </div>

      <div ref={wrapperRef} className="relative overflow-x-auto">
        {/* Month labels */}
        <div className="relative mb-1 h-[18px]">
          {monthLabels.map(({ label, wi }) => (
            <span
              key={`${label}-${wi}`}
              className="absolute text-[10px] text-text-dim"
              style={{ left: `${(wi / WEEKS) * 100}%` }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Grid: flex columns = weeks, each column has 7 rows that flex-fill the height */}
        <div className="relative flex w-full gap-[3px]" style={{ height: 88 }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-1 flex-col gap-[3px]">
              {week.map((cell) => (
                <div
                  key={cell.date}
                  title={`${cell.date}: ${cell.count} solve${cell.count !== 1 ? 's' : ''}`}
                  className={`min-h-0 flex-1 rounded-[2px] transition-transform hover:scale-125 hover:relative hover:z-10 ${cell.isFuture ? 'opacity-30' : ''} ${solvesByDate[cell.date]?.length ? 'cursor-pointer ring-[0.5px] ring-white/20' : ''}`}
                  style={{ backgroundColor: LEVEL_COLORS[cell.level] }}
                  onClick={(e) => handleCellClick(cell.date, e)}
                />
              ))}
            </div>
          ))}
          {!hasAnyActivity && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="text-xs text-text-dim">Sync your account to see activity</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-2 flex items-center justify-end gap-1.5">
          <span className="text-[10px] text-text-dim">Less</span>
          {LEVEL_COLORS.map((color, i) => (
            <div key={i} className="h-3 w-3 rounded-[2px]" style={{ backgroundColor: color }} />
          ))}
          <span className="text-[10px] text-text-dim">More</span>
        </div>

        {/* Day detail popup — rendered in a portal so it escapes overflow:hidden */}
        {popup && popupGroups.length > 0 && createPortal(
          <div
            className="fixed z-[9999] min-w-[200px] max-w-[280px] rounded-2xl border border-border bg-bg-2 p-3 shadow-2xl"
            style={{
              left: Math.max(8, Math.min(popup.x - 110, window.innerWidth - 288)),
              top: popup.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-2 border-b border-border pb-2 text-xs font-bold uppercase tracking-widest text-text-dim">
              {format(new Date(popup.date + 'T00:00:00'), 'MMM d, yyyy')}
            </p>
            {popupGroups.map(({ platform, solves }) => (
              <div key={platform} className="mb-2 last:mb-0">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: PLATFORM_COLORS[platform] }}>
                  {PLATFORM_LABELS[platform]}
                </p>
                <div className="space-y-1">
                  {solves.map((s, i) => {
                    const url = s.problem ? buildProblemUrl(s.problem) : undefined
                    return (
                      <div key={i} className="flex items-center justify-between gap-2">
                        {url ? (
                          <a href={url} target="_blank" rel="noreferrer" className="truncate text-[12px] text-text hover:text-accent-2 transition-colors">
                            {s.title}
                          </a>
                        ) : (
                          <span className="truncate text-[12px] text-text">{s.title}</span>
                        )}
                        {s.difficulty && <span className="shrink-0 text-[11px] text-text-muted">{s.difficulty}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>,
          document.body,
        )}
      </div>
    </div>
  )
}
