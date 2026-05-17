import { type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { GuestBanner } from '@/components/ui/GuestBanner'
import { OnboardingModal } from '@/components/modals/OnboardingModal'
import { RandomProblemModal } from '@/components/modals/RandomProblemModal'
import { WeeklyDigestModal } from '@/components/modals/WeeklyDigestModal'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <GuestBanner />
          <Header />
          <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-8">{children}</main>
        </div>
      </div>
      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-border bg-bg-2/95 p-2 shadow-2xl backdrop-blur md:hidden">
        <div className="grid grid-cols-4 gap-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn('flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold', isActive ? 'bg-bg-4 text-accent-2' : 'text-text-muted')}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      <CommandPalette />
      <RandomProblemModal />
      <WeeklyDigestModal />
      <OnboardingModal />
    </div>
  )
}
