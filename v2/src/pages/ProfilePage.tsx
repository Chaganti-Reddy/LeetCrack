import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BarChart3, CalendarDays, GitBranch as Github, Link2, Pencil, Trash2, UserCircle2 } from 'lucide-react'
import { PlatformTabs } from '@/components/tracker/PlatformTabs'
import { Layout } from '@/components/layout/Layout'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { HeatmapChart, type DaySolve } from '@/components/profile/HeatmapChart'
import { RecentSolves } from '@/components/profile/RecentSolves'
import { RatingDistChart } from '@/components/profile/RatingDistChart'
import { StatCard } from '@/components/profile/StatCard'
import { StudyPlanWidget } from '@/components/profile/StudyPlanWidget'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { getDifficultyLabel, getPlatformLabel, normalizeDateKey, problemKey } from '@/lib/utils'
import { useStreaks } from '@/hooks/useStreaks'
import { usePlatformStore } from '@/stores/platformStore'
import { useProgressStore } from '@/stores/progressStore'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import type { LcProblem, Platform, Problem } from '@/types'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { platform = 'lc' } = useParams<{ platform: Platform }>()
  const setActivePlatform = useUiStore((state) => state.setActivePlatform)
  const { questions, cfMeta, acMeta, lcUserInfo, cfUserInfo, acUserInfo, interviewDate, setInterviewDate } = usePlatformStore((state) => state)
  const progress = useProgressStore((state) => state.platforms[platform])
  const user = useAuthStore((state) => state.user)
  const login = useAuthStore((state) => state.login)
  const initialized = useAuthStore((state) => state.initialized)
  const clearPlatform = useProgressStore((state) => state.clearPlatform)
  const clearUserInfo = usePlatformStore((state) => state.clearUserInfo)
  const [confirmClear, setConfirmClear] = useState(false)
  const [isEditingInterviewDate, setIsEditingInterviewDate] = useState(false)
  const [interviewDateDraft, setInterviewDateDraft] = useState('')

  useEffect(() => {
    if (!['lc', 'cf', 'ac'].includes(platform)) navigate('/profile/lc', { replace: true })
    setActivePlatform(platform)
  }, [navigate, platform, setActivePlatform])

  useEffect(() => {
    setInterviewDateDraft(interviewDate ?? '')
  }, [interviewDate])

  const problems = (platform === 'lc' ? questions : platform === 'cf' ? cfMeta : acMeta) as Problem[]
  const info = platform === 'lc' ? lcUserInfo : platform === 'cf' ? cfUserInfo : acUserInfo
  const solvedProblems = useMemo(() => problems.filter((problem) => progress.solved[problemKey(problem)]), [problems, progress.solved])
  const recent = useMemo(() => solvedProblems.map((problem) => ({ problem, solvedAt: progress.solved[problemKey(problem)] })).sort((left, right) => new Date(right.solvedAt).getTime() - new Date(left.solvedAt).getTime()).slice(0, 10), [progress.solved, solvedProblems])
  const streaks = useStreaks(progress.activity)
  const distribution = useMemo(() => {
    const counts = solvedProblems.reduce<Record<string, number>>((acc, problem) => {
      const bucket = getDifficultyLabel(problem)
      acc[bucket] = (acc[bucket] ?? 0) + 1
      return acc
    }, {})
    return Object.entries(counts).map(([bucket, count]) => ({ bucket, count }))
  }, [solvedProblems])

  // Per-platform activity for heatmap
  const heatmapActivity = progress.activity

  // Avg solve time
  const avgSolveTime = useMemo(() => {
    const times = Object.values(progress.solveTimes ?? {}).filter((t) => t > 0)
    if (!times.length) return null
    const avg = Math.round(times.reduce((s, t) => s + t, 0) / times.length)
    const m = Math.floor(avg / 60), s = avg % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }, [progress.solveTimes])

  // Solves grouped by date for day-detail popup — current platform only
  const solvesByDate = useMemo(() => {
    const byDate: Record<string, DaySolve[]> = {}
    const plat = platform as 'lc' | 'cf' | 'ac'
    const add = (problem: Problem, solvedAt: string) => {
      const date = normalizeDateKey(solvedAt)
      if (!byDate[date]) byDate[date] = []
      byDate[date].push({ title: problem.title, platform: plat, difficulty: getDifficultyLabel(problem), problem })
    }
    solvedProblems.forEach((p) => add(p, progress.solved[problemKey(p)]))
    return byDate
  }, [progress.solved, solvedProblems, platform])

  const interviewCountdownLabel = useMemo(() => {
    if (!interviewDate) return null
    const daysUntilInterview = Math.ceil((new Date(interviewDate).getTime() - Date.now()) / 86400000)
    if (Number.isNaN(daysUntilInterview)) return null
    if (daysUntilInterview === 0) return 'Interview today! 🎯'
    if (daysUntilInterview > 0) return `Interview in ${daysUntilInterview} day${daysUntilInterview === 1 ? '' : 's'}`
    const daysAgo = Math.abs(daysUntilInterview)
    return `Interview was ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`
  }, [interviewDate])

  const hasSolves = solvedProblems.length > 0

  return (
    <Layout>
      <div className="space-y-4">
        <PlatformTabs platform={platform} basePath="profile" />

        {/* Auth nudge card — shown to guests who have no account-linked info */}
        {initialized && !user && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-accent/30 bg-accent/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <UserCircle2 size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm">Stats shown from local data</p>
                <p className="text-xs text-text-muted mt-0.5">Sign in to sync your account and see handle-level stats, ratings, and streaks across devices.</p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => void login()} className="shrink-0">
              <Github size={14} /> Sign in
            </Button>
          </div>
        )}

        <ProfileHeader platform={platform} info={info} />

        {/* Connect CTA — shown when no username synced yet */}
        {!info?.username && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-border bg-bg-2 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-3 text-text-muted">
                <Link2 size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm">No {getPlatformLabel(platform)} account connected</p>
                <p className="text-xs text-text-muted mt-0.5">Go to Tracker and enter your handle to sync solved problems and account stats.</p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate(`/tracker/${platform}`)} className="shrink-0">
              Connect
            </Button>
          </div>
        )}

        {isEditingInterviewDate || interviewCountdownLabel ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-bg-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-dim text-accent">
                <CalendarDays size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm">{interviewCountdownLabel ?? 'Set your interview date'}</p>
                <p className="mt-0.5 text-xs text-text-muted">Track how much prep time you have left.</p>
              </div>
            </div>
            {isEditingInterviewDate ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={interviewDateDraft}
                  onChange={(event) => setInterviewDateDraft(event.target.value)}
                  className="h-10 rounded-lg border border-border bg-bg-3 px-3 text-sm text-text outline-none transition focus:border-accent"
                />
                <Button variant="secondary" size="sm" onClick={() => { setInterviewDate(interviewDateDraft || null); setIsEditingInterviewDate(false) }}>
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setInterviewDateDraft(interviewDate ?? ''); setIsEditingInterviewDate(false) }}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setIsEditingInterviewDate(true)} className="shrink-0">
                <Pencil size={14} /> Edit
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-bg-2 px-5 py-4">
            <button type="button" className="text-sm font-medium text-text-muted transition hover:text-text" onClick={() => setIsEditingInterviewDate(true)}>
              Set interview date →
            </button>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Current streak" value={streaks.current} tone="green" />
          <StatCard label="Longest streak" value={streaks.longest} tone="accent" />
          <StatCard label="Active days" value={streaks.totalDays} tone="yellow" />
          <StatCard label="Solved" value={solvedProblems.length} tone="red" />
        </div>
        {avgSolveTime && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Avg solve time" value={avgSolveTime} tone="accent" />
          </div>
        )}

        {hasSolves ? (
          <>
            {platform === 'lc' && <StudyPlanWidget questions={questions as LcProblem[]} solved={progress.solved} />}
            {/* Full-width heatmap — inherently wide, no side-by-side stretching */}
            <HeatmapChart activity={heatmapActivity} solvesByDate={solvesByDate} />
            {/* Recent solves + rating dist — items-start so each is natural height */}
            <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr] xl:items-start">
              <RecentSolves items={recent} />
              <RatingDistChart data={distribution} />
            </div>
          </>
        ) : (
          <EmptyState
            icon={BarChart3}
            heading="No solves tracked yet"
            description={`Head over to the Tracker and mark some ${platform.toUpperCase()} problems as solved. Your activity heatmap, streaks, and distribution charts will appear here.`}
            cta={{ label: 'Go to Tracker', onClick: () => navigate(`/tracker/${platform}`) }}
          />
        )}

        {/* Danger zone — clear platform data */}
        {hasSolves && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
            <div>
              <p className="font-semibold text-sm text-red-400">Clear {getPlatformLabel(platform)} data</p>
              <p className="text-xs text-text-muted mt-0.5">Remove all solved, bookmarks, notes and review history for this platform.</p>
            </div>
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Sure?</span>
                <Button variant="secondary" className="text-red-400 border-red-500/30 hover:bg-red-500/10" onClick={() => { clearPlatform(platform as Platform); clearUserInfo(platform as Platform); setConfirmClear(false) }}>
                  Yes, clear
                </Button>
                <Button variant="secondary" onClick={() => setConfirmClear(false)}>Cancel</Button>
              </div>
            ) : (
              <Button variant="secondary" className="shrink-0 text-red-400 border-red-500/30 hover:bg-red-500/10" onClick={() => setConfirmClear(true)}>
                <Trash2 size={14} /> Clear data
              </Button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
