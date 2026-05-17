import { GitBranch as Github, X } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'

const DISMISSED_KEY = 'algotrack:guest-banner-dismissed'

export function GuestBanner() {
  const user = useAuthStore((state) => state.user)
  const login = useAuthStore((state) => state.login)
  const loading = useAuthStore((state) => state.loading)
  const initialized = useAuthStore((state) => state.initialized)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === '1')

  if (!initialized || user || dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="relative flex items-center justify-between gap-4 bg-gradient-to-r from-accent/10 via-accent-2/10 to-transparent px-4 py-2.5 text-sm border-b border-border">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-3 px-2.5 py-0.5 text-xs font-semibold text-text-muted border border-border">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
          Guest mode
        </span>
        <span className="text-text-muted">
          Progress saved locally. Sign in to sync across devices and unlock all features.
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => void login()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-bg-3 border border-border px-3 py-1.5 text-xs font-semibold text-text hover:bg-bg-4 hover:border-accent/50 transition-colors disabled:opacity-50"
        >
          <Github size={13} />
          Sign in with GitHub
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-lg p-1 text-text-dim hover:text-text hover:bg-bg-4 transition-colors"
          aria-label="Dismiss banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
