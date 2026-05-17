import { useEffect, useMemo, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table'
import { CheckCircle2, Circle, ExternalLink, MessageSquare, RotateCcw, Star } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ReviewBadge } from '@/components/tracker/ReviewBadge'
import { buildProblemUrl, dateStr, formatNumber, problemKey } from '@/lib/utils'
import { isReviewDue as isDue } from '@/lib/sm2'
import type { Platform, PlatformProgress, Problem } from '@/types'

interface ProblemTableProps {
  platform: Platform
  problems: Problem[]
  progress: PlatformProgress
  currentPage: number
  onPageChange: (page: number) => void
  isLoading: boolean
  onToggleSolved: (id: string) => void
  onToggleBookmark: (id: string) => void
  onOpenNote: (id: string) => void
  onMarkReviewed: (id: string) => void
  onTagFilter: (tag: string) => void
  activeTagFilters: string[]
}

function cfRatingColor(rating: number | null): string {
  if (rating === null) return 'text-text-dim'
  if (rating < 1200) return 'text-text-muted'
  if (rating < 1400) return 'text-[var(--green)]'
  if (rating < 1600) return 'text-[#03c3c3]'
  if (rating < 1900) return 'text-[#3b82f6]'
  if (rating < 2100) return 'text-[#a855f7]'
  if (rating < 2400) return 'text-[#f97316]'
  return 'text-[var(--red)]'
}

function acDifficultyColor(diff: number | null): string {
  if (diff === null) return 'text-text-dim'
  if (diff < 400) return 'text-text-muted'
  if (diff < 800) return 'text-[var(--green)]'
  if (diff < 1200) return 'text-[#03c3c3]'
  if (diff < 1600) return 'text-[#3b82f6]'
  if (diff < 2000) return 'text-[#a855f7]'
  return 'text-[var(--red)]'
}

/** Extract problem letter from AC title like "A. Something" or ID like "abc001_1" → "A" */
function acProblemLabel(problem: { title: string; id: string }): string {
  const titleMatch = /^([A-Z])\.\s/.exec(problem.title)
  if (titleMatch) return titleMatch[1]
  const idMatch = /_([a-z\d]+)$/.exec(problem.id)
  if (idMatch) return idMatch[1].toUpperCase()
  return '?'
}

function difficultyBadge(problem: Problem) {
  if (problem.platform === 'lc') {
    const variant = problem.difficulty === 'Easy' ? 'easy' : problem.difficulty === 'Medium' ? 'medium' : 'hard'
    return <Badge variant={variant}>{problem.difficulty}</Badge>
  }
  if (problem.platform === 'cf') {
    return (
      <span className={`inline-flex items-center rounded-lg border border-border bg-bg-3 px-2 py-0.5 text-xs font-bold tabular-nums ${cfRatingColor(problem.rating)}`}>
        {problem.rating ?? 'Unrated'}
      </span>
    )
  }
  // AtCoder
  if (problem.difficulty !== null) {
    return (
      <span className={`inline-flex items-center rounded-lg border border-border bg-bg-3 px-2 py-0.5 text-xs font-bold tabular-nums ${acDifficultyColor(problem.difficulty)}`}>
        {problem.difficulty}
      </span>
    )
  }
  const label = acProblemLabel(problem)
  return (
    <span className="inline-flex items-center rounded-lg border border-border bg-bg-3 px-2 py-0.5 text-xs font-semibold text-text-muted">
      {label}
    </span>
  )
}

function columnClass(id: string) {
  if (id === 'solved') return 'w-10 px-3 py-3 text-center align-middle'
  if (id === 'primary') return 'w-16 px-4 py-3 align-middle'
  if (id === 'title') return 'px-4 py-3 align-middle'
  if (id === 'difficulty') return 'hidden md:table-cell w-28 px-4 py-3 align-middle'
  if (id === 'acceptance') return 'hidden lg:table-cell w-28 px-4 py-3 align-middle'
  if (id === 'solvedDate') return 'hidden lg:table-cell w-28 px-4 py-3 align-middle'
  if (id === 'actions') return 'w-32 px-4 py-3 text-right align-middle'
  return 'px-4 py-3 align-middle'
}

export function ProblemTable(props: ProblemTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'primary', desc: false }])

  const columns = useMemo<ColumnDef<Problem>[]>(() => [
    {
      id: 'solved',
      header: '',
      cell: ({ row }) => {
        const id = problemKey(row.original)
        const solved = Boolean(props.progress.solved[id])
        return (
          <button className="rounded-lg p-1 text-text-muted hover:bg-bg-4" onClick={() => props.onToggleSolved(id)} aria-label={solved ? 'Mark unsolved' : 'Mark solved'}>
            {solved ? <CheckCircle2 size={18} className="text-[var(--green)]" /> : <Circle size={18} />}
          </button>
        )
      },
    },
    {
      id: 'primary',
      header: props.platform === 'lc' ? '#' : props.platform === 'cf' ? 'Rating' : 'Difficulty',
      accessorFn: (problem) => (problem.platform === 'lc' ? problem.id : problem.platform === 'cf' ? problem.rating ?? 0 : problem.difficulty ?? 0),
      cell: ({ row }) => row.original.platform === 'lc'
        ? <span className="text-sm text-text-muted">{row.original.id}</span>
        : difficultyBadge(row.original),
    },
    {
      id: 'title',
      header: 'Title',
      accessorFn: (problem) => problem.title,
      cell: ({ row }) => {
        const tags = 'tags' in row.original ? (row.original.tags ?? []) : []
        const firstTag = tags[0]
        const extra = tags.length - 1

        return (
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden whitespace-nowrap">
              <a href={buildProblemUrl(row.original)} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-semibold hover:text-accent-2">
                {'isPremium' in row.original && row.original.isPremium && (
                  <span title="LeetCode Premium required" className="mr-1 text-yellow-500">🔒</span>
                )}
                {row.original.title}
              </a>
              <ExternalLink size={12} className="shrink-0 text-text-dim" />
              {firstTag ? (
                <button
                  onClick={() => props.onTagFilter(firstTag)}
                  className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                    props.activeTagFilters.includes(firstTag)
                      ? 'border-accent/50 bg-accent/10 text-accent-2'
                      : 'border-border bg-bg-3 text-text-dim hover:border-accent/40 hover:text-text'
                  }`}
                >
                  {firstTag}
                </button>
              ) : null}
              {extra > 0 ? (
                <Popover.Root>
                  <Popover.Trigger asChild>
                    <button className="shrink-0 rounded border border-border bg-bg-3 px-1.5 py-0.5 text-[10px] font-medium text-text-dim hover:border-accent/50 hover:text-text transition-colors">
                      +{extra}
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content sideOffset={6} align="start" className="z-50 max-w-[280px] rounded-xl border border-border bg-bg-2 p-3 shadow-2xl">
                      <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-text-dim">Click to filter by tag</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <Popover.Close key={tag} asChild>
                            <button
                              onClick={() => props.onTagFilter(tag)}
                              className={`rounded border px-2 py-0.5 text-[11px] transition-colors ${
                                props.activeTagFilters.includes(tag)
                                  ? 'border-accent/50 bg-accent/10 font-semibold text-accent-2'
                                  : 'border-border bg-bg-3 text-text-muted hover:border-accent/40 hover:bg-bg-4 hover:text-text'
                              }`}
                            >
                              {props.activeTagFilters.includes(tag) ? `✓ ${tag}` : tag}
                            </button>
                          </Popover.Close>
                        ))}
                      </div>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              ) : null}
            </div>
          </div>
        )
      },
    },
    {
      id: 'difficulty',
      header: props.platform === 'lc' ? 'Difficulty' : 'Contest',
      accessorFn: (problem) => {
        if (problem.platform === 'lc') return problem.difficulty
        return problem.contestId
      },
      cell: ({ row }) => row.original.platform === 'lc'
        ? difficultyBadge(row.original)
        : <span className="text-sm text-text-muted">{row.original.contestId}</span>,
    },
    {
      id: 'acceptance',
      header: props.platform === 'lc' ? 'Acceptance' : 'Solves',
      accessorFn: (problem) => {
        if (problem.platform === 'lc') return Number(problem.acceptance.replace('%', ''))
        return problem.solvedCount
      },
      cell: ({ row }) => {
        if (row.original.platform === 'lc') return <span className="text-sm text-text-muted">{row.original.acceptance}</span>
        return <span className="text-sm text-text-muted">{formatNumber(row.original.solvedCount)}</span>
      },
    },
    {
      id: 'solvedDate',
      header: 'Solved',
      accessorFn: (problem) => props.progress.solved[problemKey(problem)] ?? '',
      cell: ({ row }) => <span className="text-sm text-text-muted">{dateStr(props.progress.solved[problemKey(row.original)])}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const id = problemKey(row.original)
        const reviewDue = isDue(props.progress.reviewData[id])

        return (
          <div className="flex items-center justify-end gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
            <button className="rounded-lg p-2 text-text-muted hover:bg-bg-4 hover:text-accent-2" onClick={() => props.onToggleBookmark(id)} aria-label="Toggle bookmark">
              <Star size={15} className={props.progress.bookmarks[id] ? 'fill-current text-accent-2' : ''} />
            </button>
            <button className="rounded-lg p-2 text-text-muted hover:bg-bg-4 hover:text-text" onClick={() => props.onOpenNote(id)} aria-label="Open note panel">
              <MessageSquare size={15} />
            </button>
            <button className="rounded-lg p-2 text-text-muted hover:bg-bg-4 hover:text-accent-2" onClick={() => props.onMarkReviewed(id)} aria-label="Mark reviewed">
              <RotateCcw size={15} />
            </button>
            <ReviewBadge due={reviewDue} />
          </div>
        )
      },
    },
  ], [props])

  const table = useReactTable({
    data: props.problems,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const rows = table.getRowModel().rows
  const pageCount = Math.max(1, Math.ceil(rows.length / 20))
  const currentPage = Math.min(props.currentPage, pageCount)
  const pageRows = rows.slice((currentPage - 1) * 20, currentPage * 20)

  useEffect(() => {
    if (props.currentPage !== currentPage) props.onPageChange(currentPage)
  }, [currentPage, props])

  if (props.isLoading) {
    return (
      <div className="card p-4">
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, index) => <div key={index} className="skeleton h-16 w-full" />)}
        </div>
      </div>
    )
  }

  if (!rows.length) {
    return (
      <div className="card flex min-h-[24rem] items-center justify-center p-6 text-center">
        <div>
          <p className="font-display text-2xl font-bold">No problems found</p>
          <p className="mt-2 text-sm text-text-muted">Try loosening your filters or syncing your account.</p>
        </div>
      </div>
    )
  }

  function buildPageItems(current: number, total: number): (number | 'ellipsis')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const near = new Set([1, total, current - 1, current, current + 1].filter((n) => n >= 1 && n <= total))
    const sorted = Array.from(near).sort((a, b) => a - b)
    const items: (number | 'ellipsis')[] = []

    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) items.push('ellipsis')
      items.push(sorted[i])
    }

    return items
  }

  const pageItems = buildPageItems(currentPage, pageCount)

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-hidden">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-bg-3/95 text-left text-xs uppercase tracking-[0.18em] text-text-dim backdrop-blur">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort() && !header.isPlaceholder
                  const content = header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())

                  return (
                    <th key={header.id} className={`${columnClass(header.id)} font-semibold`}>
                      {canSort ? (
                        <button className={`flex w-full items-center gap-2 ${header.id === 'actions' ? 'justify-end' : header.id === 'solved' ? 'justify-center' : ''}`} onClick={header.column.getToggleSortingHandler()}>
                          {content}
                        </button>
                      ) : content}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id} className="group table-row-hover border-b border-border last:border-b-0">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={columnClass(cell.column.id)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-bg-3/40 px-4 py-3 text-sm">
        <p className="text-text-muted">{rows.length} matching problems</p>
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => props.onPageChange(currentPage - 1)}>‹</Button>
          {pageItems.map((item, index) => (
            item === 'ellipsis'
              ? <span key={`ellipsis-${index}`} className="select-none px-1 text-text-dim">…</span>
              : <Button key={item} variant={item === currentPage ? 'primary' : 'secondary'} size="sm" onClick={() => props.onPageChange(item)}>{item}</Button>
          ))}
          <Button variant="secondary" size="sm" disabled={currentPage === pageCount} onClick={() => props.onPageChange(currentPage + 1)}>›</Button>
        </div>
      </div>
    </div>
  )
}
