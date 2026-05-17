import { addDays, isAfter, parseISO } from 'date-fns'
import { SM2_INTERVALS } from '@/lib/constants'
import type { ReviewRecord } from '@/types'

export function createReviewRecord(baseDate = new Date()) : ReviewRecord {
  const nextReview = addDays(baseDate, SM2_INTERVALS[0])
  return {
    intervalIndex: 0,
    intervalDays: SM2_INTERVALS[0],
    nextReviewAt: nextReview.toISOString(),
    lastReviewedAt: baseDate.toISOString(),
    reviewCount: 0,
  }
}

export function markReviewed(record: ReviewRecord | undefined, reviewedAt = new Date()): ReviewRecord {
  const currentIndex = record?.intervalIndex ?? -1
  const nextIndex = Math.min(currentIndex + 1, SM2_INTERVALS.length - 1)
  return {
    intervalIndex: nextIndex,
    intervalDays: SM2_INTERVALS[nextIndex],
    nextReviewAt: addDays(reviewedAt, SM2_INTERVALS[nextIndex]).toISOString(),
    lastReviewedAt: reviewedAt.toISOString(),
    reviewCount: (record?.reviewCount ?? 0) + 1,
  }
}

export function isReviewDue(record: ReviewRecord | undefined, now = new Date()) {
  if (!record || typeof record.nextReviewAt !== 'string' || !record.nextReviewAt) return false
  try {
    return !isAfter(parseISO(record.nextReviewAt), now)
  } catch {
    return false
  }
}
