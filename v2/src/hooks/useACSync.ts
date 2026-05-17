import { useMutation } from '@tanstack/react-query'
import { usePlatformStore } from '@/stores/platformStore'
import { useProgressStore } from '@/stores/progressStore'

interface AcSubmission {
  result?: string
  problem_id?: string
  epoch_second?: number
}

interface AcUserProfile {
  currentRating?: number | null
  peakRating?: number | null
  contests?: number | null
}

export function useACSync() {
  const mergeSyncResult = useProgressStore((state) => state.mergeSyncResult)
  const setUserInfo = usePlatformStore((state) => state.setUserInfo)

  return useMutation({
    mutationFn: async (username: string) => {
      const [submissionsRes, profileRes] = await Promise.all([
        fetch(`/.netlify/functions/ac-sync?user=${encodeURIComponent(username)}`),
        fetch(`/api/contests-proxy?platform=ac-user&handle=${encodeURIComponent(username)}`),
      ])
      const submissions = (await submissionsRes.json()) as AcSubmission[] | { error?: string }
      const profile = (await profileRes.json()) as AcUserProfile | { error?: string }
      if (!submissionsRes.ok || !Array.isArray(submissions)) throw new Error('AtCoder sync failed')
      const safeProfile = ('error' in profile ? {} : profile) as AcUserProfile
      return { submissions, profile: safeProfile }
    },
    onSuccess: ({ submissions, profile }, username) => {
      const solved: Record<string, string> = {}
      const activity: Record<string, number> = {}
      submissions
        .filter((submission) => submission.result === 'AC' && submission.problem_id)
        .forEach((submission) => {
          const key = submission.problem_id ?? ''
          const iso = new Date((submission.epoch_second ?? 0) * 1000).toISOString()
          if (!solved[key] || new Date(iso) < new Date(solved[key])) solved[key] = iso
        })
      Object.values(solved).forEach((date) => {
        const key = date.slice(0, 10)
        activity[key] = (activity[key] ?? 0) + 1
      })
      mergeSyncResult('ac', { solved, activity, lastSyncAt: new Date().toISOString() })
      setUserInfo('ac', {
        username,
        rating: profile.currentRating ?? null,
        peakRating: profile.peakRating ?? null,
        contests: profile.contests ?? null,
        solvedCount: Object.keys(solved).length,
      })
    },
  })
}
