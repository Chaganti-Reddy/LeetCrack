import { useMutation } from '@tanstack/react-query'
import { usePlatformStore } from '@/stores/platformStore'
import { useProgressStore } from '@/stores/progressStore'
import { CF_RATING_COLORS } from '@/lib/constants'

interface CfSubmission {
  verdict?: string
  creationTimeSeconds?: number
  problem?: { contestId?: number; index?: string }
}

interface CfUserInfoResponse {
  result?: Array<{ handle?: string; titlePhoto?: string; rating?: number; rank?: string; maxRating?: number }>
  status?: string
  comment?: string
}

interface CfStatusResponse {
  result?: CfSubmission[]
  status?: string
  comment?: string
}

export function useCFSync() {
  const mergeSyncResult = useProgressStore((state) => state.mergeSyncResult)
  const setUserInfo = usePlatformStore((state) => state.setUserInfo)

  return useMutation({
    mutationFn: async (username: string) => {
      const [statusRes, infoRes] = await Promise.all([
        fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(username)}`),
        fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(username)}`),
      ])
      const statusData = (await statusRes.json()) as CfStatusResponse
      const infoData = (await infoRes.json()) as CfUserInfoResponse
      if (!statusRes.ok || statusData.status !== 'OK') throw new Error(statusData.comment ?? 'Codeforces sync failed')
      if (!infoRes.ok || infoData.status !== 'OK') throw new Error(infoData.comment ?? 'Codeforces profile fetch failed')
      return { submissions: statusData.result ?? [], user: infoData.result?.[0] }
    },
    onSuccess: ({ submissions, user }, username) => {
      const solved: Record<string, string> = {}
      const activity: Record<string, number> = {}
      submissions
        .filter((submission) => submission.verdict === 'OK' && submission.problem?.contestId && submission.problem.index)
        .forEach((submission) => {
          const key = `${submission.problem?.contestId}_${submission.problem?.index}`
          const iso = new Date((submission.creationTimeSeconds ?? 0) * 1000).toISOString()
          if (!solved[key] || new Date(iso) < new Date(solved[key])) solved[key] = iso
        })
      Object.values(solved).forEach((date) => {
        const key = date.slice(0, 10)
        activity[key] = (activity[key] ?? 0) + 1
      })
      const ratingColor = CF_RATING_COLORS.find((item) => (user?.rating ?? 0) <= item.max)
      mergeSyncResult('cf', { solved, activity, lastSyncAt: new Date().toISOString() })
      setUserInfo('cf', {
        username: user?.handle ?? username,
        avatar: user?.titlePhoto ?? null,
        rating: user?.rating ?? null,
        peakRating: user?.maxRating ?? null,
        rankLabel: user?.rank ?? ratingColor?.label ?? null,
        solvedCount: Object.keys(solved).length,
      })
    },
  })
}
