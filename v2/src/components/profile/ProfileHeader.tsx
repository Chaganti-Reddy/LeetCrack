import { Trophy, UserRound } from 'lucide-react'
import { formatNumber, getPlatformLabel } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import type { Platform, UserPlatformInfo } from '@/types'

const emptyInfo: UserPlatformInfo = {
  username: null,
  avatar: null,
  ranking: null,
  solvedCount: null,
  rating: null,
  peakRating: null,
  rankLabel: null,
  contests: null,
}

export function ProfileHeader({ platform, info }: { platform: Platform; info: UserPlatformInfo | null | undefined }) {
  const profile = info ?? emptyInfo
  const hasProfileStats = Boolean(profile.username || profile.rankLabel || profile.rating || profile.solvedCount || profile.ranking || profile.peakRating || profile.contests)

  return (
    <div className="card flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent-dim text-accent-2">
          {profile.avatar ? <img src={profile.avatar} alt={profile.username ?? 'profile'} className="h-full w-full object-cover" /> : <UserRound size={28} />}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-text-dim">{getPlatformLabel(platform)} profile</p>
          <h2 className="mt-1 font-display text-3xl font-bold">{profile.username ?? 'No profile synced yet'}</h2>
          <p className="mt-2 text-sm text-text-muted">
            {hasProfileStats ? 'Synced account stats and recent progress.' : `Add your ${getPlatformLabel(platform)} handle in Tracker and sync to load account stats.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.rankLabel ? <Badge variant="accent">{profile.rankLabel}</Badge> : null}
            {profile.rating ? <Badge variant="outline">Rating {formatNumber(profile.rating)}</Badge> : null}
            {profile.solvedCount ? <Badge variant="outline">Solved {formatNumber(profile.solvedCount)}</Badge> : null}
            {!hasProfileStats ? <Badge variant="muted">Waiting for first sync</Badge> : null}
          </div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-bg-3 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-text-dim">Ranking</p>
          <p className="mt-2 text-xl font-semibold">{formatNumber(profile.ranking)}</p>
        </div>
        <div className="rounded-xl border border-border bg-bg-3 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-text-dim">Peak rating</p>
          <p className="mt-2 text-xl font-semibold">{formatNumber(profile.peakRating)}</p>
        </div>
        <div className="rounded-xl border border-border bg-bg-3 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-text-dim">Contests</p>
          <p className="mt-2 flex items-center gap-2 text-xl font-semibold"><Trophy size={18} className="text-accent" /> {formatNumber(profile.contests)}</p>
        </div>
      </div>
    </div>
  )
}
