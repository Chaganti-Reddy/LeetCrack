import { Database, Link2, RefreshCw } from 'lucide-react'
import { formatRelativeTime, getPlatformLabel } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/stores/authStore'
import type { Platform } from '@/types'

interface SyncBarProps {
  platform: Platform
  username: string
  onUsernameChange: (value: string) => void
  onSync: () => void
  onFullSync?: () => void
  isSyncing: boolean
  lastSyncAt: string | null
}

export function SyncBar({ platform, username, onUsernameChange, onSync, onFullSync, isSyncing, lastSyncAt }: SyncBarProps) {
  const user = useAuthStore((state) => state.user)
  const login = useAuthStore((state) => state.login)
  const initialized = useAuthStore((state) => state.initialized)

  return (
    <div className="card flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-text-dim">Connect handle</p>
        <h3 className="mt-1 font-display text-xl font-bold">Sync {getPlatformLabel(platform)} progress</h3>
        {initialized && !user && (
          <p className="mt-0.5 text-xs text-text-dim">
            Data saved locally.{' '}
            <button onClick={() => void login()} className="text-accent hover:underline">Sign in</button>
            {' '}to sync across devices.
          </p>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-end">
        <div className="relative w-full max-w-md">
          <Link2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <Input value={username} onChange={(event) => onUsernameChange(event.target.value)} placeholder={`Enter your ${getPlatformLabel(platform)} username`} className="pl-10" />
        </div>
        <Button onClick={onSync} disabled={!username.trim() || isSyncing}>
          {isSyncing ? <Spinner /> : <RefreshCw size={16} />}
          Sync now
        </Button>
        {platform === 'lc' && onFullSync && (
          <Button variant="secondary" onClick={onFullSync} disabled={!username.trim() || isSyncing} title="Import full submission history using your LeetCode session cookie">
            <Database size={16} />
            Full sync
          </Button>
        )}
        <div className="text-right text-xs text-text-muted">
          <p>Last sync</p>
          <p>{lastSyncAt ? formatRelativeTime(lastSyncAt) : 'never'}</p>
        </div>
      </div>
    </div>
  )
}
