import * as Dialog from '@radix-ui/react-dialog'
import { Link2, RefreshCw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { getPlatformLabel } from '@/lib/utils'
import type { Platform } from '@/types'

interface SyncUsernameDialogProps {
  open: boolean
  platform: Platform
  onOpenChange: (open: boolean) => void
  onConfirm: (username: string) => void
  isSyncing: boolean
}

export function SyncUsernameDialog({ open, platform, onOpenChange, onConfirm, isSyncing }: SyncUsernameDialogProps) {
  const [value, setValue] = useState('')

  // Reset input when dialog opens
  useEffect(() => { if (open) setValue('') }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) onConfirm(value.trim())
  }

  const platformLabel = getPlatformLabel(platform)
  const placeholder =
    platform === 'lc' ? 'e.g. leetcoder123' :
    platform === 'cf' ? 'e.g. tourist' :
    'e.g. chokudai'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-bg-2 p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Link2 size={18} strokeWidth={1.5} />
              </div>
              <div>
                <Dialog.Title className="font-display text-lg font-bold">Connect {platformLabel}</Dialog.Title>
                <Dialog.Description className="mt-0.5 text-sm text-text-muted">Enter your handle to sync your progress.</Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-text-muted hover:bg-bg-4 hover:text-text transition-colors" aria-label="Close">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-text-dim">
                {platformLabel} username
              </label>
              <div className="relative">
                <Link2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                <Input
                  autoFocus
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={placeholder}
                  className="pl-9"
                />
              </div>
              <p className="mt-1.5 text-xs text-text-dim">
                {platform === 'lc' && 'Find your username on your LeetCode profile page.'}
                {platform === 'cf' && 'Your Codeforces handle — visible on your profile.'}
                {platform === 'ac' && 'Your AtCoder handle — visible on your profile.'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={!value.trim() || isSyncing} className="flex-1">
                {isSyncing ? <><Spinner /> Syncing…</> : <><RefreshCw size={15} /> Sync now</>}
              </Button>
              <Dialog.Close asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </Dialog.Close>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
