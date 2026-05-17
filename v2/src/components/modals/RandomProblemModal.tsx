import * as Dialog from '@radix-ui/react-dialog'
import { ExternalLink, Shuffle, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { usePlatformStore } from '@/stores/platformStore'
import { useProgressStore } from '@/stores/progressStore'
import { useUiStore } from '@/stores/uiStore'
import type { Platform } from '@/types'

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-green-400 bg-green-400/10',
  Medium: 'text-yellow-400 bg-yellow-400/10',
  Hard: 'text-red-400 bg-red-400/10',
}

function cfRatingColor(rating: number) {
  if (rating >= 2400) return 'text-red-400'
  if (rating >= 1900) return 'text-purple-400'
  if (rating >= 1600) return 'text-blue-400'
  if (rating >= 1400) return 'text-cyan-400'
  if (rating >= 1200) return 'text-green-400'
  return 'text-text-muted'
}

interface PickedProblem {
  platform: Platform
  title: string
  link: string
  badge?: string
  badgeCls?: string
  tags?: string[]
  solvedCount?: number
  alreadySolved: boolean
}

function pickLC(questions: ReturnType<typeof usePlatformStore.getState>['questions'], solved: Record<string, string>): PickedProblem | null {
  if (!questions.length) return null
  const unsolved = questions.filter((q) => !solved[String(q.id)])
  const pool = unsolved.length ? unsolved : questions
  const q = pool[Math.floor(Math.random() * pool.length)]
  return {
    platform: 'lc',
    title: q.title,
    link: `https://leetcode.com/problems/${q.slug}/`,
    badge: q.difficulty,
    badgeCls: DIFFICULTY_COLORS[q.difficulty] ?? '',
    tags: q.tags.slice(0, 3),
    alreadySolved: Boolean(solved[String(q.id)]),
  }
}

function pickCF(cfMeta: ReturnType<typeof usePlatformStore.getState>['cfMeta'], solved: Record<string, string>): PickedProblem | null {
  if (!cfMeta.length) return null
  const unsolved = cfMeta.filter((p) => !solved[`${p.contestId}${p.index}`])
  const pool = unsolved.length ? unsolved : cfMeta
  const p = pool[Math.floor(Math.random() * pool.length)]
  const key = `${p.contestId}${p.index}`
  return {
    platform: 'cf',
    title: p.name,
    link: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
    badge: p.rating ? String(p.rating) : 'Unrated',
    badgeCls: p.rating ? cfRatingColor(p.rating) + ' bg-bg-4' : 'text-text-muted bg-bg-4',
    tags: (p.tags ?? []).slice(0, 3),
    solvedCount: p.solvedCount,
    alreadySolved: Boolean(solved[key]),
  }
}

function pickAC(acMeta: ReturnType<typeof usePlatformStore.getState>['acMeta'], solved: Record<string, string>): PickedProblem | null {
  if (!acMeta.length) return null
  const unsolved = acMeta.filter((p) => !solved[p.id])
  const pool = unsolved.length ? unsolved : acMeta
  const p = pool[Math.floor(Math.random() * pool.length)]
  return {
    platform: 'ac',
    title: p.title,
    link: `https://atcoder.jp/tasks/${p.id}`,
    badge: p.difficulty != null ? `Diff ${p.difficulty}` : 'Unrated',
    badgeCls: 'text-text-muted bg-bg-4',
    alreadySolved: Boolean(solved[p.id]),
  }
}

const TABS: { id: Platform; label: string }[] = [
  { id: 'lc', label: 'LeetCode' },
  { id: 'cf', label: 'Codeforces' },
  { id: 'ac', label: 'AtCoder' },
]

export function RandomProblemModal() {
  const open = useUiStore((state) => state.randomModalOpen)
  const setOpen = useUiStore((state) => state.setRandomModalOpen)
  const activePlatform = useUiStore((state) => state.activePlatform)

  const { questions, cfMeta, acMeta } = usePlatformStore()
  const platforms = useProgressStore((state) => state.platforms)

  const [tab, setTab] = useState<Platform>(activePlatform)
  const [picks, setPicks] = useState<Partial<Record<Platform, PickedProblem | null>>>({})

  const pick = picks[tab] ?? null

  const doPick = useCallback((platform: Platform) => {
    const solved = platforms[platform].solved
    let result: PickedProblem | null = null
    if (platform === 'lc') result = pickLC(questions, solved)
    else if (platform === 'cf') result = pickCF(cfMeta, solved)
    else result = pickAC(acMeta, solved)
    setPicks((prev) => ({ ...prev, [platform]: result }))
  }, [platforms, questions, cfMeta, acMeta])

  useEffect(() => {
    if (open) {
      setTab(activePlatform)
      setPicks({})
      doPick(activePlatform)
    }
  }, [open, activePlatform, doPick])

  // Re-pick if data arrives after modal already open and pick is still null
  useEffect(() => {
    if (open && picks[tab] === null) doPick(tab)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length, cfMeta.length, acMeta.length])

  const handleTabChange = (platform: Platform) => {
    setTab(platform)
    // Only auto-pick if this tab hasn't been visited yet
    if (!(platform in picks)) doPick(platform)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-bg-2 p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Shuffle size={18} strokeWidth={1.5} />
              </div>
              <div>
                <Dialog.Title className="font-display text-lg font-bold">Random Problem</Dialog.Title>
                <Dialog.Description className="mt-0.5 text-sm text-text-muted">Pick a random unsolved problem.</Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-text-muted hover:bg-bg-4 hover:text-text transition-colors" aria-label="Close">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Platform tabs */}
          <div className="mb-4 flex gap-1 rounded-xl bg-bg-3 p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={cn('flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors', tab === t.id ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text')}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Problem card */}
          <div className="min-h-[120px] rounded-xl border border-border bg-bg-3 p-4">
            {pick ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', pick.badgeCls)}>{pick.badge}</span>
                  {pick.alreadySolved && <span className="rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-400">✓ Solved</span>}
                  {pick.solvedCount != null && (
                    <span className="text-xs text-text-dim">{pick.solvedCount >= 1000 ? (pick.solvedCount / 1000).toFixed(1) + 'k' : pick.solvedCount} solves</span>
                  )}
                </div>
                <p className="font-display text-base font-bold leading-snug">{pick.title}</p>
                {pick.tags && pick.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {pick.tags.map((tag) => (
                      <span key={tag} className="rounded bg-bg-4 px-1.5 py-0.5 text-xs text-text-dim">{tag}</span>
                    ))}
                  </div>
                )}
                <a
                  href={pick.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/90 transition-colors"
                >
                  Open problem <ExternalLink size={12} />
                </a>
              </div>
            ) : (
              <div className="flex h-full min-h-[100px] items-center justify-center text-sm text-text-muted">
                No {tab.toUpperCase()} problems loaded. Sync your account first.
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <Button className="flex-1" onClick={() => doPick(tab)}>
              <Shuffle size={15} /> Pick another
            </Button>
            <Dialog.Close asChild>
              <Button variant="secondary">Close</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
