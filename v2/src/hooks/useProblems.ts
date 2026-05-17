import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { usePlatformStore } from '@/stores/platformStore'
import type { AcProblem, CfProblem, LcProblem } from '@/types'

const endpoints = {
  lc: '/data/leetcode-meta.json',
  cf: '/data/cf-meta.json',
  ac: '/data/atcoder-meta.json',
} as const

export function useProblems() {
  const setProblems = usePlatformStore((state) => state.setProblems)

  const lcQuery = useQuery({
    queryKey: ['problems', 'lc'],
    queryFn: async () => {
      const response = await fetch(endpoints.lc)
      if (!response.ok) throw new Error('Failed to load LeetCode problems')
      const json = (await response.json()) as Record<string, Omit<LcProblem, 'platform'>>
      return Object.values(json).map((problem) => ({ ...problem, platform: 'lc' as const }))
    },
    staleTime: 1000 * 60 * 60,
  })

  const cfQuery = useQuery({
    queryKey: ['problems', 'cf'],
    queryFn: async () => {
      const response = await fetch(endpoints.cf)
      if (!response.ok) throw new Error('Failed to load Codeforces problems')
      const json = (await response.json()) as Record<string, Omit<CfProblem, 'platform' | 'id' | 'title'>>
      return Object.entries(json).map(([id, problem]) => ({ ...problem, id, title: problem.name, platform: 'cf' as const }))
    },
    staleTime: 1000 * 60 * 60,
  })

  const acQuery = useQuery({
    queryKey: ['problems', 'ac'],
    queryFn: async () => {
      const response = await fetch(endpoints.ac)
      if (!response.ok) throw new Error('Failed to load AtCoder problems')
      const json = (await response.json()) as Record<string, Omit<AcProblem, 'platform'>>
      return Object.values(json).map((problem) => ({ ...problem, platform: 'ac' as const }))
    },
    staleTime: 1000 * 60 * 60,
  })

  useEffect(() => {
    if (lcQuery.data) setProblems('lc', lcQuery.data)
  }, [lcQuery.data, setProblems])

  useEffect(() => {
    if (cfQuery.data) setProblems('cf', cfQuery.data)
  }, [cfQuery.data, setProblems])

  useEffect(() => {
    if (acQuery.data) setProblems('ac', acQuery.data)
  }, [acQuery.data, setProblems])

  return {
    lcQuery,
    cfQuery,
    acQuery,
    isLoading: lcQuery.isLoading || cfQuery.isLoading || acQuery.isLoading,
    isError: lcQuery.isError || cfQuery.isError || acQuery.isError,
  }
}
