import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { createReviewRecord, markReviewed } from '@/lib/sm2'
import { normalizeDateKey } from '@/lib/utils'
import type { PersistedProgressRow, Platform, PlatformProgress } from '@/types'

const emptyPlatformProgress = (): PlatformProgress => ({
  solved: {},
  activity: {},
  bookmarks: {},
  notes: {},
  reviewData: {},
  solveTimes: {},
  lastSyncAt: null,
})

interface ProgressStore {
  platforms: Record<Platform, PlatformProgress>
  lastTouchedAt: number
  toggleSolved: (platform: Platform, problemId: string, solvedAt?: string) => void
  toggleBookmark: (platform: Platform, problemId: string) => void
  setNote: (platform: Platform, problemId: string, note: string) => void
  markProblemReviewed: (platform: Platform, problemId: string) => void
  mergeSyncResult: (platform: Platform, payload: { solved: Record<string, string>; activity: Record<string, number>; lastSyncAt: string; preserveNotes?: boolean; overwrite?: boolean }) => void
  hydrateRemote: (row: PersistedProgressRow) => void
  setLastSyncAt: (platform: Platform, lastSyncAt: string | null) => void
  setSolveTime: (platform: Platform, problemId: string, seconds: number) => void
  clearPlatform: (platform: Platform) => void
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set) => ({
      platforms: { lc: emptyPlatformProgress(), cf: emptyPlatformProgress(), ac: emptyPlatformProgress() },
      lastTouchedAt: Date.now(),
      toggleSolved: (platform, problemId, solvedAt = new Date().toISOString()) => set((state) => {
        const current = state.platforms[platform]
        const nextSolved = { ...current.solved }
        const nextActivity = { ...current.activity }
        const nextReviewData = { ...current.reviewData }
        if (nextSolved[problemId]) {
          const solvedDate = normalizeDateKey(nextSolved[problemId])
          delete nextSolved[problemId]
          if (nextActivity[solvedDate]) {
            nextActivity[solvedDate] = Math.max(0, nextActivity[solvedDate] - 1)
            if (nextActivity[solvedDate] === 0) delete nextActivity[solvedDate]
          }
          delete nextReviewData[problemId]
        } else {
          nextSolved[problemId] = solvedAt
          const dateKey = normalizeDateKey(solvedAt)
          nextActivity[dateKey] = (nextActivity[dateKey] ?? 0) + 1
          nextReviewData[problemId] = createReviewRecord(new Date(solvedAt))
        }
        return {
          platforms: { ...state.platforms, [platform]: { ...current, solved: nextSolved, activity: nextActivity, reviewData: nextReviewData } },
          lastTouchedAt: Date.now(),
        }
      }),
      toggleBookmark: (platform, problemId) => set((state) => {
        const current = state.platforms[platform]
        const bookmarks = { ...current.bookmarks, [problemId]: !current.bookmarks[problemId] }
        if (!bookmarks[problemId]) delete bookmarks[problemId]
        return { platforms: { ...state.platforms, [platform]: { ...current, bookmarks } }, lastTouchedAt: Date.now() }
      }),
      setNote: (platform, problemId, note) => set((state) => {
        const current = state.platforms[platform]
        const notes = { ...current.notes }
        if (note.trim()) notes[problemId] = note
        else delete notes[problemId]
        return { platforms: { ...state.platforms, [platform]: { ...current, notes } }, lastTouchedAt: Date.now() }
      }),
      markProblemReviewed: (platform, problemId) => set((state) => {
        const current = state.platforms[platform]
        return {
          platforms: {
            ...state.platforms,
            [platform]: {
              ...current,
              reviewData: {
                ...current.reviewData,
                [problemId]: markReviewed(current.reviewData[problemId]),
              },
            },
          },
          lastTouchedAt: Date.now(),
        }
      }),
      mergeSyncResult: (platform, payload) => set((state) => {
        const current = state.platforms[platform]
        const baseSolved = payload.overwrite ? {} : current.solved
        const baseReviewData = payload.overwrite ? {} : current.reviewData
        const mergedReviewData = { ...baseReviewData }
        Object.entries(payload.solved).forEach(([problemId, solvedAt]) => {
          if (!mergedReviewData[problemId]) mergedReviewData[problemId] = createReviewRecord(new Date(solvedAt))
        })
        return {
          platforms: {
            ...state.platforms,
            [platform]: {
              ...current,
              solved: { ...baseSolved, ...payload.solved },
              activity: payload.activity,
              reviewData: mergedReviewData,
              lastSyncAt: payload.lastSyncAt,
            },
          },
          lastTouchedAt: Date.now(),
        }
      }),
      hydrateRemote: (row) => set((state) => ({
        platforms: {
          lc: {
            ...state.platforms.lc,
            solved: row.solved ?? state.platforms.lc.solved,
            activity: row.activity ?? state.platforms.lc.activity,
            bookmarks: row.bookmarks ?? state.platforms.lc.bookmarks,
            notes: row.notes ?? state.platforms.lc.notes,
            reviewData: row.review_data ?? state.platforms.lc.reviewData,
            lastSyncAt: row.lc_last_sync ?? state.platforms.lc.lastSyncAt,
          },
          cf: {
            ...state.platforms.cf,
            solved: row.cf_solved ?? state.platforms.cf.solved,
            activity: row.cf_activity ?? state.platforms.cf.activity,
            bookmarks: row.cf_bookmarks ?? state.platforms.cf.bookmarks,
            notes: row.cf_notes ?? state.platforms.cf.notes,
            reviewData: row.cf_review_data ?? state.platforms.cf.reviewData,
          },
          ac: {
            ...state.platforms.ac,
            solved: row.ac_solved ?? state.platforms.ac.solved,
            activity: row.ac_activity ?? state.platforms.ac.activity,
            bookmarks: row.ac_bookmarks ?? state.platforms.ac.bookmarks,
            notes: row.ac_notes ?? state.platforms.ac.notes,
            reviewData: row.ac_review_data ?? state.platforms.ac.reviewData,
          },
        },
      })),
      setLastSyncAt: (platform, lastSyncAt) => set((state) => ({
        platforms: { ...state.platforms, [platform]: { ...state.platforms[platform], lastSyncAt } },
        lastTouchedAt: Date.now(),
      })),
      setSolveTime: (platform, problemId, seconds) => set((state) => ({
        platforms: { ...state.platforms, [platform]: { ...state.platforms[platform], solveTimes: { ...state.platforms[platform].solveTimes, [problemId]: seconds } } },
        lastTouchedAt: Date.now(),
      })),
      clearPlatform: (platform) => set((state) => ({
        platforms: { ...state.platforms, [platform]: emptyPlatformProgress() },
        lastTouchedAt: Date.now(),
      })),
    }),
    {
      name: 'algo-track-progress',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        for (const platform of ['lc', 'cf', 'ac'] as const) {
          const p = state.platforms[platform]
          if (!p) continue
          // Backfill solveTimes if missing
          if (!p.solveTimes) p.solveTimes = {}
          // Scrub any reviewData records missing nextReviewAt (stale/partial data)
          if (!p.reviewData) continue
          for (const [id, rec] of Object.entries(p.reviewData)) {
            if (!rec || typeof rec.nextReviewAt !== 'string' || !rec.nextReviewAt) {
              const solvedAt = p.solved[id]
              p.reviewData[id] = createReviewRecord(solvedAt ? new Date(solvedAt) : new Date())
            }
          }
        }
      },
    },
  ),
)
