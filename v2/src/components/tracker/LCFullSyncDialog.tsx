import * as Dialog from '@radix-ui/react-dialog'
import { Database, ExternalLink, RefreshCw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

interface LCFullSyncDialogProps {
  open: boolean
  username: string
  onOpenChange: (open: boolean) => void
  onConfirm: (session: string) => void
  isSyncing: boolean
}

export function LCFullSyncDialog({ open, username, onOpenChange, onConfirm, isSyncing }: LCFullSyncDialogProps) {
  const [session, setSession] = useState('')

  useEffect(() => { if (open) setSession('') }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (session.trim()) onConfirm(session.trim())
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-bg-2 p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500">
                <Database size={18} strokeWidth={1.5} />
              </div>
              <div>
                <Dialog.Title className="font-display text-lg font-bold">Full History Sync</Dialog.Title>
                <Dialog.Description className="mt-0.5 text-sm text-text-muted">
                  Import your complete LeetCode solve history.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-text-muted hover:bg-bg-4 hover:text-text transition-colors" aria-label="Close">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Instructions */}
          <div className="mb-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-text-muted space-y-1.5">
            <p className="font-semibold text-yellow-400">How to get your session cookie:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>
                Open{' '}
                <a href="https://leetcode.com" target="_blank" rel="noreferrer" className="text-accent hover:underline inline-flex items-center gap-0.5">
                  leetcode.com <ExternalLink size={10} />
                </a>{' '}
                and sign in
              </li>
              <li>Open DevTools → Application → Cookies → <code className="bg-bg-4 px-1 rounded">https://leetcode.com</code></li>
              <li>Copy the value of <code className="bg-bg-4 px-1 rounded">LEETCODE_SESSION</code></li>
            </ol>
            <p className="text-yellow-400/80">⚠ This will overwrite your existing LC solve history with full data.</p>
          </div>

          {username && (
            <p className="mb-3 text-xs text-text-dim">
              Syncing as: <span className="font-semibold text-text">{username}</span>
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-text-dim">
                LEETCODE_SESSION cookie value
              </label>
              <textarea
                autoFocus
                value={session}
                onChange={(e) => setSession(e.target.value)}
                placeholder="Paste your LEETCODE_SESSION cookie value here…"
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-bg-3 px-3 py-2 text-xs font-mono text-text placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={!session.trim() || isSyncing} className="flex-1">
                {isSyncing ? <><Spinner /> Syncing all history…</> : <><RefreshCw size={15} /> Full sync</>}
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
