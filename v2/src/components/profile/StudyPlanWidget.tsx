import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { LcProblem } from '@/types'

const BLIND_75_IDS = [1, 2, 3, 11, 15, 19, 20, 21, 23, 33, 39, 48, 49, 53, 55, 56, 57, 62, 70, 73, 76, 79, 84, 91, 98, 100, 102, 104, 105, 121, 124, 125, 128, 133, 139, 141, 143, 152, 153, 190, 191, 198, 200, 206, 207, 208, 210, 211, 212, 213, 217, 226, 230, 235, 238, 239, 242, 252, 253, 268, 271, 295, 297, 300, 322, 323, 338, 347, 371, 377, 424, 435, 543, 572, 647].map(String)
const NEETCODE_150_IDS = [1, 2, 3, 11, 15, 17, 19, 20, 21, 22, 23, 33, 36, 39, 40, 43, 45, 46, 48, 49, 51, 53, 54, 55, 56, 57, 58, 62, 66, 70, 73, 74, 76, 78, 79, 84, 88, 91, 97, 98, 100, 102, 104, 105, 110, 115, 121, 124, 125, 127, 128, 131, 133, 135, 136, 138, 139, 141, 143, 146, 150, 152, 153, 155, 167, 188, 190, 191, 198, 199, 200, 202, 206, 207, 208, 209, 210, 211, 212, 213, 215, 217, 224, 226, 230, 235, 238, 239, 242, 253, 261, 268, 271, 278, 282, 286, 287, 289, 295, 297, 300, 309, 312, 322, 323, 332, 338, 347, 355, 371, 377, 380, 417, 424, 435, 445, 496, 503, 543, 567, 572, 621, 647, 678, 703, 704, 713, 739, 743, 746, 787, 820, 844, 875, 876, 904, 981, 994, 1046, 1143].map(String)

const PLAN_DEFINITIONS = [
  { key: 'blind75', title: 'Blind 75', ids: BLIND_75_IDS },
  { key: 'neet150', title: 'NeetCode 150', ids: NEETCODE_150_IDS },
] as const

const DIFFICULTY_COLORS: Record<LcProblem['difficulty'], string> = {
  Easy: 'text-green-400',
  Medium: 'text-yellow-400',
  Hard: 'text-red-400',
}

interface StudyPlanWidgetProps {
  questions: LcProblem[]
  solved: Record<string, string>
}

export function StudyPlanWidget({ questions, solved }: StudyPlanWidgetProps) {
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({})

  const plans = useMemo(() => {
    const questionById = Object.fromEntries(questions.map((question) => [String(question.id), question]))

    return PLAN_DEFINITIONS.map((plan) => {
      const solvedCount = plan.ids.filter((id) => Boolean(solved[id])).length
      const unsolved = plan.ids
        .filter((id) => !solved[id])
        .map((id) => {
          const question = questionById[id]
          return {
            id,
            title: question?.title ?? `Problem #${id}`,
            difficulty: question?.difficulty,
          }
        })

      return {
        ...plan,
        solvedCount,
        total: plan.ids.length,
        percent: Math.round((solvedCount / plan.ids.length) * 100),
        unsolved,
      }
    })
  }, [questions, solved])

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {plans.map((plan) => {
        const expanded = Boolean(expandedPlans[plan.key])
        const visibleUnsolved = expanded ? plan.unsolved : plan.unsolved.slice(0, 5)
        const hiddenCount = Math.max(0, plan.unsolved.length - 5)
        const complete = plan.solvedCount === plan.total

        return (
          <div key={plan.key} className="rounded-2xl border border-border bg-bg-2 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-text">{plan.title}</h3>
                <p className="mt-1 text-sm text-text-muted">{plan.solvedCount} / {plan.total} solved ({plan.percent}%)</p>
              </div>
              <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', complete ? 'bg-green-400/10 text-green-400' : 'bg-blue-400/10 text-blue-400')}>
                {complete ? 'Complete' : 'In progress'}
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-bg-4">
              <div
                className={cn('h-full rounded-full transition-all', complete ? 'bg-green-400' : 'bg-blue-400')}
                style={{ width: `${plan.percent}%` }}
              />
            </div>

            <div className="mt-4 rounded-xl border border-border/70 bg-bg-3/40 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-text">Unsolved</p>
                {plan.unsolved.length > 5 && (
                  <button
                    type="button"
                    className="text-xs font-medium text-accent transition hover:text-accent/80"
                    onClick={() => setExpandedPlans((state) => ({ ...state, [plan.key]: !expanded }))}
                  >
                    {expanded ? 'Show less' : 'View all unsolved'}
                  </button>
                )}
              </div>

              {plan.unsolved.length ? (
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {visibleUnsolved.map((problem) => (
                    <div key={`${plan.key}-${problem.id}`} className="flex items-center justify-between gap-3 rounded-lg bg-bg-4/50 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate text-text">{problem.title}</span>
                      <span className={cn('shrink-0 text-xs font-semibold', problem.difficulty ? DIFFICULTY_COLORS[problem.difficulty] : 'text-text-dim')}>
                        {problem.difficulty ?? 'Unknown'}
                      </span>
                    </div>
                  ))}
                  {!expanded && hiddenCount > 0 && <p className="text-xs text-text-muted">...and {hiddenCount} more</p>}
                </div>
              ) : (
                <p className="text-sm text-green-400">Everything in this plan is solved. Nice work.</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
