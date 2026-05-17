import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  login: () => Promise<void>
  logout: () => Promise<void>
}

let authSubscribed = false

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,
  initialize: async () => {
    if (!supabase) {
      set({ initialized: true })
      return
    }
    set({ loading: true })
    const { data } = await supabase.auth.getSession()
    set({ session: data.session, user: data.session?.user ?? null, loading: false, initialized: true })
    if (!authSubscribed) {
      authSubscribed = true
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null, initialized: true })
      })
    }
  },
  login: async () => {
    if (!supabase) return
    set({ loading: true })
    await supabase.auth.signInWithOAuth({ provider: 'github' })
    set({ loading: false })
  },
  logout: async () => {
    if (!supabase) return
    set({ loading: true })
    await supabase.auth.signOut()
    set({ loading: false, user: null, session: null })
  },
}))
