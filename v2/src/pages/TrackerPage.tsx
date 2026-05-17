import { CalendarDays } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useShallow } from 'zustand/shallow'
import { CURATED_LOOKUPS } from '@/lib/constants'
import { downloadCsv, getDifficultyLabel, problemKey } from '@/lib/utils'
import { useProblems } from '@/hooks/useProblems'
import { useLCSync, useLCFullSync } from '@/hooks/useLCSync'
import { useCFSync } from '@/hooks/useCFSync'
import { useACSync } from '@/hooks/useACSync'
import { useToast } from '@/components/ui/Toast'
import { Layout } from '@/components/layout/Layout'
import { FilterBar } from '@/components/tracker/FilterBar'
import { NotePanel } from '@/components/tracker/NotePanel'
import { PlatformTabs } from '@/components/tracker/PlatformTabs'
import { ProblemTable } from '@/components/tracker/ProblemTable'
import { StatsBar } from '@/components/tracker/StatsBar'
import { LCFullSyncDialog } from '@/components/tracker/LCFullSyncDialog'
import { SyncBar } from '@/components/tracker/SyncBar'
import { SyncUsernameDialog } from '@/components/tracker/SyncUsernameDialog'
import { usePlatformStore } from '@/stores/platformStore'
import { useProgressStore } from '@/stores/progressStore'
import { useUiStore } from '@/stores/uiStore'
import type { FiltersState, Platform } from '@/types'
import { isReviewDue } from '@/lib/sm2'

const defaultFilters: FiltersState = {
  search: '',
  difficulties: [],
  tags: [],
  status: 'all',
  starredOnly: false,
  reviewOnly: false,
  curatedList: '',
}

export default function TrackerPage() {
  const navigate = useNavigate()
  const params = useParams<{ platform: Platform }>()
  const platform = (params.platform ?? 'lc') as Platform
  const { pushToast } = useToast()
  const { isLoading } = useProblems()
  const { questions, cfMeta, acMeta, usernames, interviewDate, setUsername } = usePlatformStore(useShallow((state) => ({
    questions: state.questions,
    cfMeta: state.cfMeta,
    acMeta: state.acMeta,
    usernames: state.usernames,
    interviewDate: state.interviewDate,
    setUsername: state.setUsername,
  })))
  const progress = useProgressStore((state) => state.platforms[platform])
  const { toggleSolved, toggleBookmark, setNote, markProblemReviewed, setSolveTime } = useProgressStore(useShallow((state) => ({
    toggleSolved: state.toggleSolved,
    toggleBookmark: state.toggleBookmark,
    setNote: state.setNote,
    markProblemReviewed: state.markProblemReviewed,
    setSolveTime: state.setSolveTime,
  })))
  const notePanelProblemId = useUiStore((state) => state.notePanelProblemId)
  const setNotePanelProblemId = useUiStore((state) => state.setNotePanelProblemId)
  const setActivePlatform = useUiStore((state) => state.setActivePlatform)
  const [filters, setFilters] = useState<FiltersState>(defaultFilters)
  const [pageByPlatform, setPageByPlatform] = useState<Record<Platform, number>>({ lc: 1, cf: 1, ac: 1 })
  const currentPage = pageByPlatform[platform]
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)
  const [fullSyncDialogOpen, setFullSyncDialogOpen] = useState(false)

  const lcSync = useLCSync(questions)
  const lcFullSync = useLCFullSync(questions)
  const cfSync = useCFSync()
  const acSync = useACSync()

  useEffect(() => {
    if (!['lc', 'cf', 'ac'].includes(platform)) navigate('/tracker/lc', { replace: true })
    setActivePlatform(platform)
  }, [navigate, platform, setActivePlatform])

  const allProblems = platform === 'lc' ? questions : platform === 'cf' ? cfMeta : acMeta
  const difficulties = useMemo(() => Array.from(new Set(allProblems.map((problem) => getDifficultyLabel(problem)))).sort(), [allProblems])
  const tags = useMemo(() => Array.from(new Set(allProblems.flatMap((problem) => ('tags' in problem ? problem.tags : [])))).sort(), [allProblems])

  const filtered = useMemo(() => {
    return allProblems.filter((problem) => {
      const key = problemKey(problem)
      const solved = Boolean(progress.solved[key])
      const note = progress.notes[key] ?? ''
      const searchNeedle = filters.search.trim().toLowerCase()
      const haystacks = [problem.title.toLowerCase(), 'tags' in problem ? problem.tags.join(' ').toLowerCase() : '', 'contestId' in problem ? String(problem.contestId).toLowerCase() : '', problem.id.toString().toLowerCase(), note.toLowerCase()]
      if (searchNeedle && !haystacks.some((item) => item.includes(searchNeedle))) return false
      if (filters.status === 'solved' && !solved) return false
      if (filters.status === 'unsolved' && solved) return false
      if (filters.status === 'premium' && !('isPremium' in problem && problem.isPremium)) return false
      if (filters.status === 'free' && ('isPremium' in problem && problem.isPremium)) return false
      if (filters.starredOnly && !progress.bookmarks[key]) return false
      if (filters.reviewOnly && !isReviewDue(progress.reviewData[key])) return false
      if (filters.difficulties.length && !filters.difficulties.includes(getDifficultyLabel(problem))) return false
      if (filters.tags.length && ('tags' in problem) && !filters.tags.every((tag) => problem.tags.includes(tag))) return false
      if (filters.tags.length && !('tags' in problem)) return false
      if (filters.curatedList && !CURATED_LOOKUPS[filters.curatedList as keyof typeof CURATED_LOOKUPS]?.has(String(key))) return false
      return true
    })
  }, [allProblems, filters, progress])

  const selectedProblem = useMemo(() => filtered.concat(allProblems).find((problem) => problemKey(problem) === notePanelProblemId) ?? null, [allProblems, filtered, notePanelProblemId])

  const handleSync = async (overrideHandle?: string) => {
    const handle = (overrideHandle ?? usernames[platform])?.trim()
    if (!handle) {
      setSyncDialogOpen(true)
      return
    }
    // Save username if provided via dialog
    if (overrideHandle) setUsername(platform, overrideHandle)
    pushToast({ title: `Syncing ${platform.toUpperCase()}…`, description: `Fetching progress for ${handle}`, variant: 'info' })
    try {
      if (platform === 'lc') await lcSync.mutateAsync(handle)
      if (platform === 'cf') await cfSync.mutateAsync(handle)
      if (platform === 'ac') await acSync.mutateAsync(handle)
      setSyncDialogOpen(false)
      pushToast({ title: `${platform.toUpperCase()} sync complete ✓`, description: `Progress for ${handle} imported.`, variant: 'success' })
    } catch (error) {
      pushToast({ title: 'Sync failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' })
    }
  }

  useEffect(() => {
    const listener = () => void handleSync()
    window.addEventListener('algotrack:sync-current', listener)
    return () => window.removeEventListener('algotrack:sync-current', listener)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, usernames])

  const isSyncing = lcSync.isPending || lcFullSync.isPending || cfSync.isPending || acSync.isPending

  const handleFullSync = async (session: string) => {
    const handle = usernames['lc']?.trim()
    if (!handle) return
    pushToast({ title: 'Full sync started…', description: 'Fetching all LC submission history. This may take a moment.', variant: 'info' })
    try {
      await lcFullSync.mutateAsync({ username: handle, session })
      setFullSyncDialogOpen(false)
      pushToast({ title: 'LC full sync complete ✓', description: `All submissions for ${handle} imported.`, variant: 'success' })
    } catch (error) {
      pushToast({ title: 'Full sync failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' })
    }
  }

  const interviewCountdown = useMemo(() => {
    if (!interviewDate) return null
    const daysUntilInterview = Math.ceil((new Date(interviewDate).getTime() - Date.now()) / 86400000)
    if (Number.isNaN(daysUntilInterview) || daysUntilInterview <= 0) return null
    return `Interview in ${daysUntilInterview} day${daysUntilInterview === 1 ? '' : 's'}`
  }, [interviewDate])

  return (
    <Layout>
      <div className="space-y-4">
        <PlatformTabs platform={platform} basePath="tracker" />
        <SyncBar platform={platform} username={usernames[platform]} onUsernameChange={(value) => setUsername(platform, value)} onSync={() => void handleSync()} onFullSync={platform === 'lc' ? () => setFullSyncDialogOpen(true) : undefined} isSyncing={isSyncing} lastSyncAt={progress.lastSyncAt} />
        <StatsBar platform={platform} problems={allProblems} progress={progress} />
        {interviewCountdown && (
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-sm text-accent">
            <CalendarDays size={14} />
            <span>{interviewCountdown}</span>
          </div>
        )}
        <FilterBar
          platform={platform}
          search={filters.search}
          onSearchChange={(search) => setFilters((state) => ({ ...state, search }))}
          difficulties={difficulties}
          selectedDifficulties={filters.difficulties}
          onDifficultyToggle={(value) => setFilters((state) => ({ ...state, difficulties: state.difficulties.includes(value) ? state.difficulties.filter((item) => item !== value) : [...state.difficulties, value] }))}
          tags={tags}
          selectedTags={filters.tags}
          onTagToggle={(value) => setFilters((state) => ({ ...state, tags: state.tags.includes(value) ? state.tags.filter((item) => item !== value) : [...state.tags, value] }))}
          status={filters.status}
          onStatusChange={(status) => setFilters((state) => ({ ...state, status }))}
          starredOnly={filters.starredOnly}
          onStarredOnlyChange={(starredOnly) => setFilters((state) => ({ ...state, starredOnly }))}
          reviewOnly={filters.reviewOnly}
          onReviewOnlyChange={(reviewOnly) => setFilters((state) => ({ ...state, reviewOnly }))}
          curatedList={filters.curatedList}
          onCuratedChange={(curatedList) => setFilters((state) => ({ ...state, curatedList }))}
          onExport={() => downloadCsv(`algotrack-${platform}.csv`, [
            ['id', 'title', 'difficulty', 'solved_at', 'bookmarked', 'note', 'solve_time_seconds'],
            ...filtered.map((problem) => {
              const id = problemKey(problem)
              return [
                id,
                problem.title,
                getDifficultyLabel(problem),
                progress.solved[id] ?? '',
                progress.bookmarks[id] ? 'yes' : 'no',
                progress.notes[id] ?? '',
                String(progress.solveTimes?.[id] ?? ''),
              ]
            }),
          ])}
          onClearAll={() => {
            setFilters(defaultFilters)
            setPageByPlatform((state) => ({ ...state, [platform]: 1 }))
          }}
        />
        <div className="flex min-h-[32rem] min-w-0 gap-4">
          <div className="min-w-0 flex-1">
            <ProblemTable
              platform={platform}
              problems={filtered}
              progress={progress}
              currentPage={currentPage}
              onPageChange={(page) => setPageByPlatform((state) => ({ ...state, [platform]: page }))}
              isLoading={isLoading}
              onToggleSolved={(id) => toggleSolved(platform, id)}
              onToggleBookmark={(id) => toggleBookmark(platform, id)}
              onOpenNote={(id) => setNotePanelProblemId(id)}
              onMarkReviewed={(id) => markProblemReviewed(platform, id)}
              onTagFilter={(tag) => setFilters((s) => ({ ...s, tags: s.tags.includes(tag) ? s.tags.filter((t) => t !== tag) : [...s.tags, tag] }))}
              activeTagFilters={filters.tags}
            />
          </div>
        </div>
        {selectedProblem && (
          <>
            <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setNotePanelProblemId(null)} />
            <NotePanel key={`${platform}-${notePanelProblemId}`} problem={selectedProblem} progress={progress} onClose={() => setNotePanelProblemId(null)} onSaveNote={(id, note) => setNote(platform, id, note)} onMarkReviewed={(id) => markProblemReviewed(platform, id)} onSaveTime={(id, secs) => setSolveTime(platform, id, secs)} />
          </>
        )}
        <SyncUsernameDialog
          open={syncDialogOpen}
          platform={platform}
          onOpenChange={setSyncDialogOpen}
          onConfirm={(username) => void handleSync(username)}
          isSyncing={isSyncing}
        />
        <LCFullSyncDialog
          open={fullSyncDialogOpen}
          username={usernames['lc']}
          onOpenChange={setFullSyncDialogOpen}
          onConfirm={(session) => void handleFullSync(session)}
          isSyncing={lcFullSync.isPending}
        />
      </div>
    </Layout>
  )
}
