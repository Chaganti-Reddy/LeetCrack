import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useShallow } from 'zustand/shallow'
import { Link2, TrendingUp, Users } from 'lucide-react'
import { ContestCard } from '@/components/contests/ContestCard'
import { RatingGraph } from '@/components/contests/RatingGraph'
import { RivalsTable } from '@/components/contests/RivalsTable'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { useContests, useRivalSeries } from '@/hooks/useContests'
import { formatNumber, getPlatformLabel } from '@/lib/utils'
import { usePlatformStore } from '@/stores/platformStore'
import { useUiStore } from '@/stores/uiStore'
import type { Platform } from '@/types'

export default function ContestsPage() {
  const navigate = useNavigate()
  const { platform = 'cf' } = useParams<{ platform: Extract<Platform, 'cf' | 'ac'> }>()
  const setActivePlatform = useUiStore((state) => state.setActivePlatform)
  const { usernames, rivals, addRival, removeRival, setUsername } = usePlatformStore(useShallow((state) => ({
    usernames: state.usernames,
    rivals: state.rivals,
    addRival: state.addRival,
    removeRival: state.removeRival,
    setUsername: state.setUsername,
  })))
  const handle = usernames[platform]
  const { contestQuery, historyQuery } = useContests(platform, handle)
  const rivalSeries = useRivalSeries(platform, rivals[platform])
  const [handleInput, setHandleInput] = useState(handle ?? '')

  useEffect(() => {
    if (!['cf', 'ac'].includes(platform)) navigate('/contests/cf', { replace: true })
    setActivePlatform(platform)
  }, [navigate, platform, setActivePlatform])

  // Sync input when platform changes
  useEffect(() => { setHandleInput(usernames[platform] ?? '') }, [platform, usernames])

  const history = historyQuery.data ?? []
  const bestRank = history.reduce((best, item) => best === null ? item.rank : item.rank && item.rank < best ? item.rank : best, null as number | null)
  const bestGain = history.reduce((best, item) => Math.max(best, item.delta ?? 0), 0)
  const hasHandle = Boolean(handle?.trim())

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={platform === 'cf' ? 'primary' : 'secondary'} onClick={() => navigate('/contests/cf')}>Codeforces</Button>
          <Button variant={platform === 'ac' ? 'primary' : 'secondary'} onClick={() => navigate('/contests/ac')}>AtCoder</Button>
        </div>

        {/* Connect handle prompt if no username set */}
        {!hasHandle && (
          <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <TrendingUp size={18} strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-semibold">Connect your {getPlatformLabel(platform)} handle</p>
                <p className="text-xs text-text-muted mt-0.5">Enter your handle to see rating history, contest timeline, and rivals.</p>
              </div>
            </div>
            <div className="flex gap-2 min-w-0 sm:max-w-xs w-full">
              <div className="relative flex-1">
                <Link2 size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                <Input value={handleInput} onChange={(e) => setHandleInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && handleInput.trim()) setUsername(platform, handleInput.trim()) }} placeholder={`${getPlatformLabel(platform)} handle`} className="pl-8" />
              </div>
              <Button onClick={() => handleInput.trim() && setUsername(platform, handleInput.trim())} disabled={!handleInput.trim()}>Connect</Button>
            </div>
          </div>
        )}

        {hasHandle && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="card p-4"><p className="text-xs uppercase tracking-[0.18em] text-text-dim">Best rank</p><p className="mt-3 font-display text-3xl font-bold">{formatNumber(bestRank)}</p></div>
              <div className="card p-4"><p className="text-xs uppercase tracking-[0.18em] text-text-dim">Biggest gain</p><p className="mt-3 font-display text-3xl font-bold text-[var(--green)]">+{formatNumber(bestGain)}</p></div>
              <div className="card p-4"><p className="text-xs uppercase tracking-[0.18em] text-text-dim">Contests played</p><p className="mt-3 font-display text-3xl font-bold">{history.length}</p></div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <RatingGraph history={history} rivals={rivalSeries.data} />
              <RivalsTable rivals={rivals[platform]} series={rivalSeries.data} onAdd={(h) => addRival(platform, h)} onRemove={(h) => removeRival(platform, h)} />
            </div>

            {history.length > 0 ? (
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-4 py-4">
                  <h2 className="section-title">Past contest history</h2>
                  <p className="muted">Recent rating deltas</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-bg-3/60 text-left text-xs uppercase tracking-[0.18em] text-text-dim">
                      <tr>
                        <th className="px-4 py-3">Contest</th>
                        <th className="px-4 py-3">Rank</th>
                        <th className="px-4 py-3">Delta</th>
                        <th className="px-4 py-3">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice(-12).reverse().map((item) => (
                        <tr key={`${item.contestId}-${item.date}`} className="border-t border-border">
                          <td className="px-4 py-3 font-semibold">{item.contestName}</td>
                          <td className="px-4 py-3 text-text-muted">{formatNumber(item.rank)}</td>
                          <td className={`px-4 py-3 ${(item.delta ?? 0) >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>{item.delta ? `${item.delta > 0 ? '+' : ''}${item.delta}` : '—'}</td>
                          <td className="px-4 py-3 text-text-muted">{formatNumber(item.rating)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : historyQuery.isLoading ? (
              <div className="card h-32 animate-pulse bg-bg-3/40" />
            ) : (
              <EmptyState icon={Users} heading="No contest history yet" description={`No rated contests found for "${handle}" on ${getPlatformLabel(platform)}. Participate in a contest to see your rating timeline.`} />
            )}
          </>
        )}

        {/* Upcoming contests — always visible, no auth needed */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Upcoming contests</h2>
            <p className="muted">Plan your next rating jump</p>
          </div>
          {contestQuery.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-24 animate-pulse bg-bg-3/40" />)}</div>
          ) : (contestQuery.data?.upcoming ?? []).length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {(contestQuery.data?.upcoming ?? []).map((contest) => <ContestCard key={contest.id} contest={contest} />)}
            </div>
          ) : (
            <EmptyState icon={TrendingUp} heading="No upcoming contests" description="Check back soon — upcoming Codeforces and AtCoder contests will appear here automatically." className="py-8" />
          )}
        </div>
      </div>
    </Layout>
  )
}
