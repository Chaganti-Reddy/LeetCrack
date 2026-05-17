import { useQueries, useQuery } from '@tanstack/react-query'
import { addSeconds, compareAsc, isAfter } from 'date-fns'
import type { ContestItem, Platform, RatingHistoryPoint, RivalSeries } from '@/types'

function normalizeCfContests(data: Array<Record<string, unknown>>): ContestItem[] {
  return data.map((item) => {
    const startTime = new Date(Number(item.startTimeSeconds ?? 0) * 1000).toISOString()
    const duration = Number(item.durationSeconds ?? 0)
    const phase = String(item.phase ?? '').toLowerCase().includes('before') ? 'upcoming' : isAfter(new Date(), addSeconds(new Date(startTime), duration)) ? 'past' : 'ongoing'
    return {
      id: String(item.id ?? item.name ?? startTime),
      title: String(item.name ?? 'Contest'),
      startTime,
      endTime: duration ? addSeconds(new Date(startTime), duration).toISOString() : null,
      durationMinutes: duration ? Math.round(duration / 60) : null,
      url: `https://codeforces.com/contests/${item.id}`,
      phase,
      platform: 'cf',
    }
  })
}

function normalizeAcContests(data: Array<Record<string, unknown>>): ContestItem[] {
  return data.map((item) => {
    const startTime = new Date(Number(item.start_epoch_second ?? 0) * 1000).toISOString()
    const durationSeconds = Number(item.duration_second ?? 0)
    const endTime = durationSeconds ? addSeconds(new Date(startTime), durationSeconds).toISOString() : null
    const phase: ContestItem['phase'] = isAfter(new Date(startTime), new Date()) ? 'upcoming' : endTime && isAfter(new Date(), new Date(endTime)) ? 'past' : 'ongoing'
    return {
      id: String(item.id ?? item.title ?? startTime),
      title: String(item.title ?? 'Contest'),
      startTime,
      endTime,
      durationMinutes: durationSeconds ? Math.round(durationSeconds / 60) : null,
      url: `https://atcoder.jp/contests/${item.id}`,
      phase,
      platform: 'ac',
    }
  })
}

function normalizeCfHistory(data: Array<Record<string, unknown>>): RatingHistoryPoint[] {
  return data.map((item) => ({
    contestId: String(item.contestId ?? item.contestName ?? ''),
    contestName: String(item.contestName ?? 'Contest'),
    rank: Number(item.rank ?? 0) || null,
    oldRating: Number(item.oldRating ?? 0) || null,
    newRating: Number(item.newRating ?? 0) || null,
    delta: Number(item.newRating ?? 0) - Number(item.oldRating ?? 0) || null,
    rating: Number(item.newRating ?? 0) || null,
    date: new Date(Number(item.ratingUpdateTimeSeconds ?? 0) * 1000).toISOString(),
  }))
}

function normalizeAcHistory(data: Array<Record<string, unknown>>): RatingHistoryPoint[] {
  return data.map((item) => ({
    contestId: String(item.ContestScreenName ?? item.ContestName ?? ''),
    contestName: String(item.ContestName ?? 'Contest'),
    rank: Number(item.Place ?? 0) || null,
    oldRating: Number(item.OldRating ?? 0) || null,
    newRating: Number(item.NewRating ?? 0) || null,
    delta: Number(item.NewRating ?? 0) - Number(item.OldRating ?? 0) || null,
    rating: Number(item.NewRating ?? 0) || null,
    date: new Date(String(item.EndTime ?? item.EndTimeRaw ?? new Date().toISOString())).toISOString(),
  }))
}

export function useContests(platform: Extract<Platform, 'cf' | 'ac'>, handle?: string) {
  const contestQuery = useQuery({
    queryKey: ['contests', platform],
    queryFn: async () => {
      const response = await fetch(`/api/contests-proxy?platform=${platform}`)
      if (!response.ok) throw new Error('Failed to load contests')
      const data = (await response.json()) as Array<Record<string, unknown>>
      const contests = platform === 'cf' ? normalizeCfContests(data) : normalizeAcContests(data)
      return {
        upcoming: contests.filter((contest) => contest.phase !== 'past').sort((left, right) => compareAsc(new Date(left.startTime), new Date(right.startTime))).slice(0, 8),
        past: contests.filter((contest) => contest.phase === 'past').sort((left, right) => compareAsc(new Date(right.startTime), new Date(left.startTime))).slice(0, 12),
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  const historyQuery = useQuery({
    queryKey: ['contest-history', platform, handle],
    enabled: Boolean(handle),
    queryFn: async () => {
      const response = await fetch(`/api/contests-proxy?platform=${platform}-history&handle=${encodeURIComponent(handle ?? '')}`)
      if (!response.ok) throw new Error('Failed to load contest history')
      const data = (await response.json()) as Array<Record<string, unknown>>
      return platform === 'cf' ? normalizeCfHistory(data) : normalizeAcHistory(data)
    },
    staleTime: 1000 * 60 * 5,
  })

  return { contestQuery, historyQuery }
}

export function useRivalSeries(platform: Extract<Platform, 'cf' | 'ac'>, rivals: string[]) {
  const queries = useQueries({
    queries: rivals.map((handle) => ({
      queryKey: ['rival-history', platform, handle],
      enabled: Boolean(handle),
      queryFn: async () => {
        const response = await fetch(`/api/contests-proxy?platform=${platform}-history&handle=${encodeURIComponent(handle)}`)
        if (!response.ok) throw new Error(`Failed to load rival ${handle}`)
        const data = (await response.json()) as Array<Record<string, unknown>>
        const history = platform === 'cf' ? normalizeCfHistory(data) : normalizeAcHistory(data)
        const points = history.flatMap((item) => item.rating && item.date ? [{ date: item.date, rating: item.rating }] : [])
        return { handle, points } satisfies RivalSeries
      },
      staleTime: 1000 * 60 * 5,
    })),
  })

  return {
    data: queries.flatMap((query) => (query.data ? [query.data] : [])),
    isLoading: queries.some((query) => query.isLoading),
  }
}
