import { differenceInCalendarDays, parseISO } from 'date-fns'
import { BellRing, CalendarClock, Search, RefreshCw } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { usePlatformStore } from '@/stores/platformStore'
import { useUiStore } from '@/stores/uiStore'

function toTitle(segment: string) {
  if (!segment) return 'Tracker'
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function Header() {
  const location = useLocation()
  const interviewDate = usePlatformStore((state) => state.interviewDate)
  const setCommandPaletteOpen = useUiStore((state) => state.setCommandPaletteOpen)
  const segments = location.pathname.split('/').filter(Boolean)
  const page = segments[0] ?? 'tracker'
  const platform = segments[1] ?? 'lc'
  const countdown = interviewDate ? differenceInCalendarDays(parseISO(interviewDate), new Date()) : null

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-text-dim">AlgoTrack / {toTitle(platform)}</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">{toTitle(page)}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {countdown !== null ? (
            <div className="hidden items-center gap-2 rounded-xl border border-border bg-bg-2 px-3 py-2 text-sm text-text-muted lg:flex">
              <CalendarClock size={16} className="text-accent" />
              <span>{countdown >= 0 ? `${countdown} day${countdown === 1 ? '' : 's'} to interview` : 'Interview day passed'}</span>
            </div>
          ) : null}
          <Button variant="secondary" onClick={() => setCommandPaletteOpen(true)}>
            <Search size={16} /> Search
          </Button>
          <Button variant="ghost" onClick={() => window.dispatchEvent(new CustomEvent('algotrack:sync-current'))}>
            <RefreshCw size={16} /> Sync
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-bg-2 text-text-muted">
            <BellRing size={16} />
          </div>
        </div>
      </div>
    </header>
  )
}
