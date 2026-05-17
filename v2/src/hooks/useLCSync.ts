import { useMutation } from '@tanstack/react-query'
import { usePlatformStore } from '@/stores/platformStore'
import { useProgressStore } from '@/stores/progressStore'
import type { LcProblem } from '@/types'

interface LcSyncResponse {
  recentAcSubmissionList?: Array<{ titleSlug: string; timestamp: string }>
  userAvatar?: string | null
  ranking?: number | null
  solvedCount?: number | null
  error?: string
}

export function useLCSync(problems: LcProblem[]) {
  const mergeSyncResult = useProgressStore((state) => state.mergeSyncResult)
  const setUserInfo = usePlatformStore((state) => state.setUserInfo)

  return useMutation({
    mutationFn: async (username: string) => {
      const response = await fetch(`/.netlify/functions/lc-sync?username=${encodeURIComponent(username)}`)
      const data = (await response.json()) as LcSyncResponse
      if (!response.ok || data.error) throw new Error(data.error ?? 'LeetCode sync failed')
      return data
    },
    onSuccess: (data, username) => {
      const slugToId = new Map(problems.map((problem) => [problem.slug, String(problem.id)]))
      const solved: Record<string, string> = {}
      const activity: Record<string, number> = {}
      ;(data.recentAcSubmissionList ?? []).forEach((submission) => {
        const problemId = slugToId.get(submission.titleSlug)
        if (!problemId) return
        const iso = new Date(Number(submission.timestamp) * 1000).toISOString()
        if (!solved[problemId] || new Date(iso) < new Date(solved[problemId])) solved[problemId] = iso
      })
      Object.values(solved).forEach((date) => {
        const key = date.slice(0, 10)
        activity[key] = (activity[key] ?? 0) + 1
      })
      const now = new Date().toISOString()
      mergeSyncResult('lc', { solved, activity, lastSyncAt: now })
      setUserInfo('lc', { username, avatar: data.userAvatar ?? null, ranking: data.ranking ?? null, solvedCount: data.solvedCount ?? Object.keys(solved).length })
    },
  })
}

export function useLCFullSync(problems: LcProblem[]) {
  const mergeSyncResult = useProgressStore((state) => state.mergeSyncResult)
  const setUserInfo = usePlatformStore((state) => state.setUserInfo)

  return useMutation({
    mutationFn: async ({ username, session }: { username: string; session: string }) => {
      const url = `/.netlify/functions/lc-sync?username=${encodeURIComponent(username)}&session=${encodeURIComponent(session)}`
      const response = await fetch(url)
      const data = (await response.json()) as LcSyncResponse
      if (!response.ok || data.error) throw new Error(data.error ?? 'LeetCode full sync failed')
      // Also fetch public profile for avatar/ranking
      const profileRes = await fetch(`/.netlify/functions/lc-sync?username=${encodeURIComponent(username)}`)
      const profileData = (await profileRes.json()) as LcSyncResponse
      return { ...data, userAvatar: profileData.userAvatar, ranking: profileData.ranking, solvedCount: profileData.solvedCount }
    },
    onSuccess: (data, { username }) => {
      const slugToId = new Map(problems.map((problem) => [problem.slug, String(problem.id)]))
      const solved: Record<string, string> = {}
      const activity: Record<string, number> = {}
      ;(data.recentAcSubmissionList ?? []).forEach((submission) => {
        const problemId = slugToId.get(submission.titleSlug)
        if (!problemId) return
        const iso = new Date(Number(submission.timestamp) * 1000).toISOString()
        if (!solved[problemId] || new Date(iso) < new Date(solved[problemId])) solved[problemId] = iso
      })
      Object.values(solved).forEach((date) => {
        const key = date.slice(0, 10)
        activity[key] = (activity[key] ?? 0) + 1
      })
      const now = new Date().toISOString()
      mergeSyncResult('lc', { solved, activity, lastSyncAt: now, overwrite: true })
      setUserInfo('lc', { username, avatar: data.userAvatar ?? null, ranking: data.ranking ?? null, solvedCount: data.solvedCount ?? Object.keys(solved).length })
    },
  })
}
