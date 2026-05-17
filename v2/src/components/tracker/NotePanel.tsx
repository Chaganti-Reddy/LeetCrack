import { useEffect, useMemo, useRef, useState } from 'react'
import { ExternalLink, Pause, Pencil, Play, RotateCcw, Save, Timer, X } from 'lucide-react'
import { buildProblemUrl, dateStr, problemKey } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { isReviewDue } from '@/lib/sm2'
import type { PlatformProgress, Problem } from '@/types'

interface NotePanelProps {
  problem: Problem | null
  progress: PlatformProgress
  onClose: () => void
  onSaveNote: (id: string, note: string) => void
  onMarkReviewed: (id: string) => void
  onSaveTime: (id: string, seconds: number) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function NotePanel({ problem, progress, onClose, onSaveNote, onMarkReviewed, onSaveTime }: NotePanelProps) {
  const problemId = problem ? problemKey(problem) : null
  const initialDraft = problemId ? progress.notes[problemId] ?? '' : ''
  const [draft, setDraft] = useState(initialDraft)

  // Timer state
  const savedTime = problemId ? (progress.solveTimes?.[problemId] ?? 0) : 0
  const [elapsed, setElapsed] = useState(savedTime)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [editingTime, setEditingTime] = useState(false)
  const [timeInput, setTimeInput] = useState('')

  // Reset timer when problem changes
  useEffect(() => {
    setElapsed(problemId ? (progress.solveTimes?.[problemId] ?? 0) : 0)
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  // Save time on pause/close
  const handleToggle = () => {
    if (running && problemId) onSaveTime(problemId, elapsed)
    setRunning((r) => !r)
  }
  const handleReset = () => {
    setRunning(false)
    setElapsed(0)
    if (problemId) onSaveTime(problemId, 0)
  }

  useEffect(() => {
    if (!problemId) return
    const timeout = window.setTimeout(() => {
      onSaveNote(problemId, draft)
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [draft, onSaveNote, problemId])

  const tags = useMemo(() => {
    if (!problem) return []
    return 'tags' in problem ? problem.tags ?? [] : []
  }, [problem])

  if (!problem) return null

  const review = progress.reviewData[problemId ?? '']

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full border-l border-border bg-bg-2 shadow-2xl transition-transform md:w-[420px]">
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between border-b border-border p-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-text-dim">Problem note</p>
            <h3 className="mt-1 truncate font-display text-2xl font-bold">{problem.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.slice(0, 5).map((tag) => <Badge key={tag} variant="muted">{tag}</Badge>)}
            </div>
          </div>
          <button className="rounded-lg p-2 text-text-muted hover:bg-bg-4 hover:text-text" onClick={onClose} aria-label="Close note panel">
            <X size={16} />
          </button>
        </div>
        <div className="grid gap-3 border-b border-border p-4 text-sm text-text-muted">
          <div className="flex items-center justify-between"><span>Solved on</span><span>{dateStr(progress.solved[problemId ?? ''])}</span></div>
          <div className="flex items-center justify-between"><span>Next review</span><span>{dateStr(review?.nextReviewAt)}</span></div>
          <div className="flex items-center justify-between"><span>Status</span><span>{draft === initialDraft ? <span className="inline-flex items-center gap-1 text-[var(--green)]"><Save size={14} /> Saved</span> : 'Saving…'}</span></div>
          <div className="flex items-center justify-between"><span>Review due</span><span>{isReviewDue(review) ? 'Today' : 'Scheduled'}</span></div>

          {/* Solve timer */}
          <div className="flex items-center justify-between rounded-xl bg-bg-3 px-3 py-2">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-accent" />
              {editingTime ? (
                <input
                  autoFocus
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  onBlur={() => {
                    const parts = timeInput.split(':').map(Number)
                    const secs = parts.length === 2 ? (parts[0] * 60 + parts[1]) : parts.length === 1 ? parts[0] : NaN
                    if (!isNaN(secs) && secs >= 0) {
                      setElapsed(secs)
                      if (problemId) onSaveTime(problemId, secs)
                    }
                    setEditingTime(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                    if (e.key === 'Escape') setEditingTime(false)
                  }}
                  placeholder="MM:SS"
                  className="w-20 rounded-lg border border-accent/40 bg-bg-4 px-2 py-0.5 font-mono text-sm text-text outline-none focus:border-accent"
                />
              ) : (
                <span className="font-mono text-base font-bold text-text tabular-nums">{formatTime(elapsed)}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!editingTime && (
                <button
                  onClick={() => { setRunning(false); setTimeInput(formatTime(elapsed)); setEditingTime(true) }}
                  className="rounded-lg p-1.5 hover:bg-bg-4 transition-colors"
                  aria-label="Edit time manually"
                >
                  <Pencil size={12} className="text-text-dim" />
                </button>
              )}
              <button onClick={handleToggle} disabled={editingTime} className="rounded-lg p-1.5 hover:bg-bg-4 transition-colors disabled:opacity-40" aria-label={running ? 'Pause' : 'Start'}>
                {running ? <Pause size={14} className="text-accent" /> : <Play size={14} className="text-green-400" />}
              </button>
              <button onClick={handleReset} disabled={editingTime} className="rounded-lg p-1.5 hover:bg-bg-4 transition-colors disabled:opacity-40" aria-label="Reset timer">
                <RotateCcw size={13} className="text-text-dim" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Capture patterns, edge cases, key intuition, or links…"
            className="h-full min-h-[18rem] w-full resize-none rounded-xl border border-border bg-bg-3 p-4 text-sm text-text outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex flex-wrap gap-3 border-t border-border p-4">
          <Button variant="secondary" onClick={() => problemId && onMarkReviewed(problemId)}>Mark reviewed</Button>
          <Button variant="ghost" onClick={() => window.open(buildProblemUrl(problem), '_blank', 'noopener,noreferrer')}>
            <ExternalLink size={16} /> Open problem
          </Button>
        </div>
      </div>
    </aside>
  )
}
