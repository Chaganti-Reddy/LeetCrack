import * as Dialog from '@radix-ui/react-dialog'
import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useProgressStore } from '@/stores/progressStore'
import { useUiStore } from '@/stores/uiStore'

const STEPS = [
  {
    icon: '🔐',
    title: 'Sign in with GitHub',
    desc: 'Your progress syncs to the cloud automatically. Sign in once and access your data from any device.',
  },
  {
    icon: '🔗',
    title: 'Connect your accounts',
    desc: 'Link LeetCode, Codeforces, and AtCoder from the Tracker page. AlgoTrack will sync your solved problems.',
  },
  {
    icon: '✓',
    title: 'Track solves across all platforms',
    desc: 'Problems you solve on LC, CF, and AC appear as solved here. You can also manually mark any problem solved.',
  },
  {
    icon: '↺',
    title: 'SM2 Spaced Repetition',
    desc: 'Problems are scheduled for review at 1, 3, 7, 14, 30, and 90 day intervals. Hit the 🔁 Review filter to see what\'s due today.',
  },
  {
    icon: '⚡',
    title: 'Keyboard shortcuts',
    desc: null,
    shortcuts: [
      { key: '/', desc: 'Search' },
      { key: 'R', desc: 'Random problem' },
      { key: '1 2 3', desc: 'Switch pages' },
      { key: 'Esc', desc: 'Close modals' },
    ],
  },
]

const STORAGE_KEY = 'algotrack_onboarding_done'

export function OnboardingModal() {
  const open = useUiStore((state) => state.onboardingOpen)
  const setOpen = useUiStore((state) => state.setOnboardingOpen)
  const platforms = useProgressStore((state) => state.platforms)

  // Auto-show on first use when no solved problems
  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      const totalSolved =
        Object.keys(platforms.lc.solved).length +
        Object.keys(platforms.cf.solved).length +
        Object.keys(platforms.ac.solved).length
      if (totalSolved === 0) {
        setTimeout(() => setOpen(true), 800)
      }
    }
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setOpen(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-bg-2 p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="font-display text-2xl font-extrabold tracking-tight">
              Algo<span className="text-accent">Track</span>
            </div>
            <Dialog.Title className="sr-only">Welcome to AlgoTrack</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-text-muted">
              Your multi-platform competitive programming companion
            </Dialog.Description>
          </div>

          {/* Steps */}
          <div className="mb-6 space-y-4">
            {STEPS.map((step) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg-3 text-lg">
                  {step.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  {step.desc && <p className="mt-0.5 text-xs text-text-muted">{step.desc}</p>}
                  {step.shortcuts && (
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                      {step.shortcuts.map(({ key, desc }) => (
                        <span key={key} className="text-xs text-text-muted">
                          <kbd className="rounded bg-bg-4 px-1 py-0.5 font-mono text-[10px] text-text">{key}</kbd>{' '}{desc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full" onClick={handleClose}>
            Let's go! →
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
