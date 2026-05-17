import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AcProblem, CfProblem, LcProblem, Platform, RatingHistoryPoint, RivalSeries, UserPlatformInfo } from '@/types'

interface PlatformStore {
  questions: LcProblem[]
  cfMeta: CfProblem[]
  acMeta: AcProblem[]
  lcUserInfo: UserPlatformInfo
  cfUserInfo: UserPlatformInfo
  acUserInfo: UserPlatformInfo
  usernames: Record<Platform, string>
  rivals: Record<'cf' | 'ac', string[]>
  rivalSeries: Record<'cf' | 'ac', RivalSeries[]>
  ratingHistory: Record<'cf' | 'ac', RatingHistoryPoint[]>
  interviewDate: string | null
  setProblems: <T extends Platform>(platform: T, problems: T extends 'lc' ? LcProblem[] : T extends 'cf' ? CfProblem[] : AcProblem[]) => void
  setUsername: (platform: Platform, username: string) => void
  setUserInfo: (platform: Platform, info: Partial<UserPlatformInfo>) => void
  clearUserInfo: (platform: Platform) => void
  setRivals: (platform: 'cf' | 'ac', rivals: string[]) => void
  addRival: (platform: 'cf' | 'ac', rival: string) => void
  removeRival: (platform: 'cf' | 'ac', rival: string) => void
  setRivalSeries: (platform: 'cf' | 'ac', series: RivalSeries[]) => void
  setRatingHistory: (platform: 'cf' | 'ac', history: RatingHistoryPoint[]) => void
  setInterviewDate: (date: string | null) => void
  hydrateRemoteProfile: (payload: { usernames?: Partial<Record<Platform, string | null>>; cfUserInfo?: Partial<UserPlatformInfo>; acUserInfo?: Partial<UserPlatformInfo>; interviewDate?: string | null; cfRivals?: string[]; acRivals?: string[] }) => void
}

const emptyInfo: UserPlatformInfo = {
  username: null,
  avatar: null,
  ranking: null,
  solvedCount: null,
  rating: null,
  peakRating: null,
  rankLabel: null,
  contests: null,
}

export const usePlatformStore = create<PlatformStore>()(
  persist(
    (set) => ({
      questions: [],
      cfMeta: [],
      acMeta: [],
      lcUserInfo: emptyInfo,
      cfUserInfo: emptyInfo,
      acUserInfo: emptyInfo,
      usernames: { lc: '', cf: '', ac: '' },
      rivals: { cf: [], ac: [] },
      rivalSeries: { cf: [], ac: [] },
      ratingHistory: { cf: [], ac: [] },
      interviewDate: null,
      setProblems: (platform, problems) => set(() => {
        if (platform === 'lc') return { questions: problems as LcProblem[] }
        if (platform === 'cf') return { cfMeta: problems as CfProblem[] }
        return { acMeta: problems as AcProblem[] }
      }),
      setUsername: (platform, username) => set((state) => ({ usernames: { ...state.usernames, [platform]: username } })),
      setUserInfo: (platform, info) => set((state) => {
        if (platform === 'lc') return { lcUserInfo: { ...state.lcUserInfo, ...info } }
        if (platform === 'cf') return { cfUserInfo: { ...state.cfUserInfo, ...info } }
        return { acUserInfo: { ...state.acUserInfo, ...info } }
      }),
      clearUserInfo: (platform) => set((state) => {
        if (platform === 'lc') return { lcUserInfo: { ...emptyInfo }, usernames: { ...state.usernames, lc: '' } }
        if (platform === 'cf') return { cfUserInfo: { ...emptyInfo }, usernames: { ...state.usernames, cf: '' } }
        return { acUserInfo: { ...emptyInfo }, usernames: { ...state.usernames, ac: '' } }
      }),
      setRivals: (platform, rivals) => set((state) => ({ rivals: { ...state.rivals, [platform]: Array.from(new Set(rivals.filter(Boolean))) } })),
      addRival: (platform, rival) => set((state) => ({ rivals: { ...state.rivals, [platform]: Array.from(new Set([...state.rivals[platform], rival.trim()])).filter(Boolean) } })),
      removeRival: (platform, rival) => set((state) => ({ rivals: { ...state.rivals, [platform]: state.rivals[platform].filter((item) => item !== rival) } })),
      setRivalSeries: (platform, series) => set((state) => ({ rivalSeries: { ...state.rivalSeries, [platform]: series } })),
      setRatingHistory: (platform, history) => set((state) => ({ ratingHistory: { ...state.ratingHistory, [platform]: history } })),
      setInterviewDate: (interviewDate) => set({ interviewDate }),
      hydrateRemoteProfile: (payload) => set((state) => ({
        usernames: {
          lc: payload.usernames?.lc ?? state.usernames.lc,
          cf: payload.usernames?.cf ?? state.usernames.cf,
          ac: payload.usernames?.ac ?? state.usernames.ac,
        },
        cfUserInfo: payload.cfUserInfo ? { ...state.cfUserInfo, ...payload.cfUserInfo } : state.cfUserInfo,
        acUserInfo: payload.acUserInfo ? { ...state.acUserInfo, ...payload.acUserInfo } : state.acUserInfo,
        rivals: {
          cf: payload.cfRivals ?? state.rivals.cf,
          ac: payload.acRivals ?? state.rivals.ac,
        },
        interviewDate: payload.interviewDate ?? state.interviewDate,
      })),
    }),
    {
      name: 'algo-track-platform',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        usernames: state.usernames,
        rivals: state.rivals,
        interviewDate: state.interviewDate,
        lcUserInfo: state.lcUserInfo,
        cfUserInfo: state.cfUserInfo,
        acUserInfo: state.acUserInfo,
      }),
    },
  ),
)
