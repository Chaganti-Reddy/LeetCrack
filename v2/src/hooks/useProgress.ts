import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { usePlatformStore } from '@/stores/platformStore'
import { useProgressStore } from '@/stores/progressStore'
import type { PersistedProgressRow } from '@/types'

export function useProgress() {
  const user = useAuthStore((state) => state.user)
  const hydrateRemote = useProgressStore((state) => state.hydrateRemote)
  const progress = useProgressStore((state) => state.platforms)
  const touchedAt = useProgressStore((state) => state.lastTouchedAt)
  const usernames = usePlatformStore((state) => state.usernames)
  const cfUserInfo = usePlatformStore((state) => state.cfUserInfo)
  const acUserInfo = usePlatformStore((state) => state.acUserInfo)
  const rivals = usePlatformStore((state) => state.rivals)
  const interviewDate = usePlatformStore((state) => state.interviewDate)
  const hydrateRemoteProfile = usePlatformStore((state) => state.hydrateRemoteProfile)
  const [saveError, setSaveError] = useState<string | null>(null)
  const hydratedRef = useRef(false)

  const query = useQuery({
    queryKey: ['progress', user?.id],
    enabled: Boolean(user?.id && supabase),
    queryFn: async () => {
      if (!supabase || !user) return null
      const { data, error } = await supabase
        .from('users_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle<PersistedProgressRow>()

      if (error) throw error
      return data
    },
    staleTime: 1000 * 60,
  })

  useEffect(() => {
    if (!query.data) return
    hydrateRemote(query.data)
    hydrateRemoteProfile({
      usernames: { lc: query.data.lc_username, cf: query.data.cf_username, ac: query.data.ac_username },
      cfUserInfo: query.data.cf_user_info ?? undefined,
      acUserInfo: query.data.ac_user_info ?? undefined,
      interviewDate: query.data.interview_date,
      cfRivals: query.data.cf_rivals ?? undefined,
      acRivals: query.data.ac_rivals ?? undefined,
    })
    hydratedRef.current = true
  }, [hydrateRemote, hydrateRemoteProfile, query.data])

  const payload = useMemo(
    () => ({
      user_id: user?.id,
      lc_username: usernames.lc || null,
      cf_username: usernames.cf || null,
      ac_username: usernames.ac || null,
      solved: progress.lc.solved,
      activity: progress.lc.activity,
      bookmarks: progress.lc.bookmarks,
      notes: progress.lc.notes,
      review_data: progress.lc.reviewData,
      cf_solved: progress.cf.solved,
      cf_activity: progress.cf.activity,
      cf_bookmarks: progress.cf.bookmarks,
      cf_notes: progress.cf.notes,
      cf_review_data: progress.cf.reviewData,
      cf_user_info: cfUserInfo,
      ac_solved: progress.ac.solved,
      ac_activity: progress.ac.activity,
      ac_bookmarks: progress.ac.bookmarks,
      ac_notes: progress.ac.notes,
      ac_review_data: progress.ac.reviewData,
      ac_user_info: acUserInfo,
      lc_last_sync: progress.lc.lastSyncAt,
      cf_rivals: rivals.cf,
      ac_rivals: rivals.ac,
      interview_date: interviewDate,
      updated_at: new Date().toISOString(),
    }),
    [acUserInfo, cfUserInfo, interviewDate, progress, rivals, user?.id, usernames],
  )

  useEffect(() => {
    const client = supabase
    if (!client || !user?.id) return
    if (!hydratedRef.current && query.isFetching) return
    const timeout = window.setTimeout(async () => {
      const { error } = await client.from('users_progress').upsert(payload)
      if (error) setSaveError(error.message)
      else setSaveError(null)
    }, 700)
    return () => window.clearTimeout(timeout)
  }, [payload, query.isFetching, touchedAt, user?.id])

  return { ...query, saveError }
}
