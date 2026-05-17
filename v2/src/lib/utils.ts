import { clsx, type ClassValue } from 'clsx'
import { formatDistanceToNowStrict, formatISO, isValid, parseISO } from 'date-fns'
import { twMerge } from 'tailwind-merge'
import type { AcProblem, CfProblem, LcProblem, Platform, Problem } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function dateStr(value: string | number | Date | null | undefined) {
  if (!value) return '—'
  const date = typeof value === 'string' ? parseISO(value) : new Date(value)
  if (!isValid(date)) return '—'
  return formatISO(date, { representation: 'date' })
}

export function escHtml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function formatRelativeTime(value: string | number | Date | null | undefined) {
  if (!value) return 'never'
  const date = typeof value === 'string' ? parseISO(value) : new Date(value)
  if (!isValid(date)) return 'never'
  return formatDistanceToNowStrict(date, { addSuffix: true })
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', { notation: value > 9999 ? 'compact' : 'standard' }).format(value)
}

export function problemKey(problem: Problem | string | number) {
  if (typeof problem === 'string' || typeof problem === 'number') return String(problem)
  return problem.platform === 'lc' ? String(problem.id) : problem.id
}

export function isLcProblem(problem: Problem): problem is LcProblem {
  return problem.platform === 'lc'
}

export function isCfProblem(problem: Problem): problem is CfProblem {
  return problem.platform === 'cf'
}

export function isAcProblem(problem: Problem): problem is AcProblem {
  return problem.platform === 'ac'
}

export function buildProblemUrl(problem: Problem) {
  if (problem.platform === 'lc') return `https://leetcode.com/problems/${problem.slug}/`
  if (problem.platform === 'cf') return `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`
  return `https://atcoder.jp/contests/${problem.contestId}/tasks/${problem.id}`
}

export function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function normalizeDateKey(value: string | number | Date) {
  return dateStr(value)
}

export function getDifficultyLabel(problem: Problem) {
  if (problem.platform === 'lc') return problem.difficulty
  if (problem.platform === 'cf') {
    const rating = problem.rating ?? 0
    if (rating < 1200) return '800-1199'
    if (rating < 1600) return '1200-1599'
    if (rating < 2000) return '1600-1999'
    return '2000+'
  }
  const difficulty = problem.difficulty ?? 0
  if (difficulty < 800) return '0-799'
  if (difficulty < 1600) return '800-1599'
  if (difficulty < 2400) return '1600-2399'
  return '2400+'
}

export function sortProblemsByTitle<T extends Problem>(problems: T[]) {
  return [...problems].sort((left, right) => left.title.localeCompare(right.title))
}

export function getPlatformLabel(platform: Platform) {
  if (platform === 'lc') return 'LeetCode'
  if (platform === 'cf') return 'Codeforces'
  return 'AtCoder'
}
