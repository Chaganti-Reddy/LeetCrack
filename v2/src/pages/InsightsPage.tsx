import { useEffect, useMemo } from 'react'
import { endOfWeek, format, startOfWeek, subWeeks } from 'date-fns'
import { useNavigate, useParams } from 'react-router-dom'
import { BarChart2, Brain, CalendarDays, Crosshair, GitBranch as Github, LineChart, Radar, Zap } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { PlatformTabs } from '@/components/tracker/PlatformTabs'
import { ReadinessGauge } from '@/components/insights/ReadinessGauge'
import { WeeklyChart } from '@/components/insights/WeeklyChart'
import { PatternInsights } from '@/components/insights/PatternInsights'
import { DailyQueue } from '@/components/insights/DailyQueue'
import { RadarChart } from '@/components/insights/RadarChart'
import { HeatmapChart, type DaySolve } from '@/components/profile/HeatmapChart'
import { RecentSolves } from '@/components/profile/RecentSolves'
import { StatCard } from '@/components/profile/StatCard'
import { Button } from '@/components/ui/Button'
import { useStreaks } from '@/hooks/useStreaks'
import { getDifficultyLabel, normalizeDateKey, problemKey } from '@/lib/utils'
import { isReviewDue } from '@/lib/sm2'
import { usePlatformStore } from '@/stores/platformStore'
import { useProgressStore } from '@/stores/progressStore'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import type { Platform, Problem, WeeklyBucket } from '@/types'

const INSIGHTS_FEATURES = [
  { icon: Zap, label: 'Readiness Score', desc: 'Interview readiness gauge based on coverage and consistency' },
  { icon: BarChart2, label: 'Weekly Progress', desc: 'Solve velocity broken down by difficulty over 12 weeks' },
  { icon: Brain, label: 'Pattern Analysis', desc: 'Topics you dominate vs gaps that need attention' },
  { icon: CalendarDays, label: 'Review Queue', desc: 'SM2 spaced repetition — problems due for review today' },
  { icon: Radar, label: 'Skill Radar', desc: 'Visual coverage across 6 core algorithm categories' },
  { icon: LineChart, label: 'Trend Lines', desc: 'Solve velocity and consistency trends over time' },
]

const MIN_SOLVES = 5

export default function InsightsPage() {
  const navigate = useNavigate()
  const { platform = 'lc' } = useParams<{ platform: Platform }>()
  const setActivePlatform = useUiStore((state) => state.setActivePlatform)
  const { questions, cfMeta, acMeta } = usePlatformStore((state) => state)
  const progress = useProgressStore((state) => state.platforms[platform])
  const user = useAuthStore((state) => state.user)
  const login = useAuthStore((state) => state.login)
  const initialized = useAuthStore((state) => state.initialized)

  useEffect(() => {
    if (!['lc', 'cf', 'ac'].includes(platform)) navigate('/insights/lc', { replace: true })
    setActivePlatform(platform)
  }, [navigate, platform, setActivePlatform])

  const problems = (platform === 'lc' ? questions : platform === 'cf' ? cfMeta : acMeta) as Problem[]
  const solvedProblems = problems.filter((problem) => progress.solved[problemKey(problem)])
  const solvedCount = solvedProblems.length
  const streaks = useStreaks(progress.activity)
  const recent = useMemo(
    () =>
      solvedProblems
        .map((problem) => ({ problem, solvedAt: progress.solved[problemKey(problem)] }))
        .sort((a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime())
        .slice(0, 10),
    [progress.solved, solvedProblems],
  )
  const dueItems = solvedProblems
    .filter((problem) => isReviewDue(progress.reviewData[problemKey(problem)]))
    .slice(0, 12)
    .map((problem) => ({ problem, nextReviewAt: progress.reviewData[problemKey(problem)]?.nextReviewAt ?? new Date().toISOString() }))

  const readinessScore = Math.min(100, Math.round(
    (solvedProblems.length / Math.max(problems.length, 1)) * 45 +
    Math.min(streaks.current, 14) * 2 +
    Math.max(0, 20 - dueItems.length) +
    Math.min(streaks.last30Days, 20)
  ))

  const weeklyData = useMemo<WeeklyBucket[]>(() => {
    return Array.from({ length: 12 }, (_, index) => {
      const weekStart = startOfWeek(subWeeks(new Date(), 11 - index))
      const weekEnd = endOfWeek(weekStart)
      const bucket: WeeklyBucket = { label: format(weekStart, 'MMM d'), easy: 0, medium: 0, hard: 0 }
      solvedProblems.forEach((problem) => {
        const solvedAt = progress.solved[problemKey(problem)]
        const solvedDate = new Date(solvedAt)
        if (solvedDate >= weekStart && solvedDate <= weekEnd) {
          const label = getDifficultyLabel(problem).toLowerCase()
          if (label.includes('easy') || label.includes('0-7') || label.includes('800-1199')) bucket.easy += 1
          else if (label.includes('medium') || label.includes('1200-1599') || label.includes('800-1599')) bucket.medium += 1
          else bucket.hard += 1
        }
      })
      return bucket
    })
  }, [progress.solved, solvedProblems])

  const tagFrequency = useMemo(() => {
    const solvedCounts: Record<string, number> = {}
    const totalCounts: Record<string, number> = {}
    problems.forEach((problem) => {
      if (!('tags' in problem)) return
      problem.tags.forEach((tag) => {
        totalCounts[tag] = (totalCounts[tag] ?? 0) + 1
        if (progress.solved[problemKey(problem)]) solvedCounts[tag] = (solvedCounts[tag] ?? 0) + 1
      })
    })
    return { solvedCounts, totalCounts }
  }, [problems, progress.solved])

  const coverage = Object.entries(tagFrequency.solvedCounts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))

  const weakPatterns = Object.entries(tagFrequency.totalCounts)
    .map(([tag, total]) => ({ tag, missing: total - (tagFrequency.solvedCounts[tag] ?? 0) }))
    .sort((left, right) => right.missing - left.missing)
    .slice(0, 6)

  const radarGroups = [
    { skill: 'Arrays', tags: ['Array', 'arrays'] },
    { skill: 'DP', tags: ['Dynamic Programming', 'dp'] },
    { skill: 'Graphs', tags: ['Graph', 'graphs'] },
    { skill: 'Trees', tags: ['Tree', 'Binary Tree'] },
    { skill: 'Strings', tags: ['String', 'strings'] },
    { skill: 'Math', tags: ['Math', 'math'] },
  ].map((group) => ({ skill: group.skill, value: solvedProblems.filter((problem) => 'tags' in problem && group.tags.some((tag) => problem.tags.includes(tag))).length }))

  // Per-platform heatmap
  const solvesByDate = useMemo(() => {
    const byDate: Record<string, DaySolve[]> = {}
    const plat = platform as 'lc' | 'cf' | 'ac'
    solvedProblems.forEach((p) => {
      const solvedAt = progress.solved[problemKey(p)]
      const date = normalizeDateKey(solvedAt)
      if (!byDate[date]) byDate[date] = []
      byDate[date].push({ title: p.title, platform: plat, difficulty: getDifficultyLabel(p), problem: p })
    })
    return byDate
  }, [progress.solved, solvedProblems, platform])

  // Not enough data yet — show feature preview wall
  if (solvedCount < MIN_SOLVES) {
    const needed = MIN_SOLVES - solvedCount
    return (
      <Layout>
        <div className="space-y-6">
          <PlatformTabs platform={platform} basePath="insights" />

          {/* Progress indicator */}
          <div className="card p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Crosshair size={26} strokeWidth={1.5} />
            </div>
            <p className="font-display text-2xl font-bold">Insights unlock at {MIN_SOLVES} solves</p>
            <p className="mt-2 text-sm text-text-muted max-w-md mx-auto">
              {solvedCount === 0
                ? `Mark problems as solved in the Tracker to start building your intelligence dashboard.`
                : `You've solved ${solvedCount} problem${solvedCount === 1 ? '' : 's'}. Solve ${needed} more to unlock full insights.`}
            </p>
            {/* Progress bar */}
            <div className="mx-auto mt-5 max-w-xs">
              <div className="flex justify-between text-xs text-text-dim mb-1.5">
                <span>{solvedCount} solved</span>
                <span>{MIN_SOLVES} needed</span>
              </div>
              <div className="h-2 rounded-full bg-bg-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all"
                  style={{ width: `${Math.min(100, (solvedCount / MIN_SOLVES) * 100)}%` }}
                />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button variant="primary" onClick={() => navigate(`/tracker/${platform}`)}>
                Go to Tracker
              </Button>
              {initialized && !user && (
                <Button variant="secondary" onClick={() => void login()}>
                  <Github size={14} /> Sign in to sync
                </Button>
              )}
            </div>
          </div>

          {/* Feature preview grid */}
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-text-dim px-1">What's waiting for you</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {INSIGHTS_FEATURES.map((feature) => (
                <div key={feature.label} className="card flex items-start gap-4 p-5 opacity-60 select-none">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg-3 text-text-dim">
                    <feature.icon size={18} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{feature.label}</p>
                    <p className="mt-0.5 text-xs text-text-muted leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-4">
        <PlatformTabs platform={platform} basePath="insights" />

        {/* Streak stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Current streak" value={streaks.current} tone="green" />
          <StatCard label="Longest streak" value={streaks.longest} tone="accent" />
          <StatCard label="Active days" value={streaks.totalDays} tone="yellow" />
          <StatCard label="Solved" value={solvedCount} tone="red" />
        </div>

        {/* Full-width heatmap */}
        <HeatmapChart activity={progress.activity} solvesByDate={solvesByDate} />

        {/* Recent solves + Readiness gauge — natural heights, no stretch */}
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr] xl:items-start">
          <RecentSolves items={recent} />
          <ReadinessGauge score={readinessScore} />
        </div>

        {/* Weekly chart — full width */}
        <WeeklyChart data={weeklyData} />

        {/* Pattern insights + queue/radar — natural heights */}
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
          <PatternInsights coverage={coverage} weakPatterns={weakPatterns} />
          <div className="space-y-4">
            <DailyQueue items={dueItems} />
            <RadarChart data={radarGroups} />
          </div>
        </div>
      </div>
    </Layout>
  )
}
