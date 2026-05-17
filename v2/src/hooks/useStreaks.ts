import { differenceInCalendarDays, eachDayOfInterval, max, parseISO, subDays } from 'date-fns'

export function useStreaks(activity: Record<string, number>) {
  const days = Object.entries(activity)
    .filter(([, count]) => count > 0)
    .map(([date]) => parseISO(`${date}T00:00:00`))
    .sort((left, right) => left.getTime() - right.getTime())

  if (days.length === 0) {
    return { current: 0, longest: 0, totalDays: 0, last30Days: 0 }
  }

  let longest = 1
  let running = 1
  for (let index = 1; index < days.length; index += 1) {
    if (differenceInCalendarDays(days[index], days[index - 1]) === 1) running += 1
    else running = 1
    longest = Math.max(longest, running)
  }

  const latest = max(days) ?? new Date()
  let current = 0
  for (let offset = 0; offset < days.length; offset += 1) {
    const target = subDays(new Date(), offset)
    if (activity[target.toISOString().slice(0, 10)]) current += 1
    else break
  }

  const last30Days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() }).reduce((total, day) => total + (activity[day.toISOString().slice(0, 10)] ?? 0), 0)

  return { current: latest ? current : 0, longest, totalDays: days.length, last30Days }
}
