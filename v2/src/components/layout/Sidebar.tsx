import * as Switch from '@radix-ui/react-switch'
import { ChevronLeft, LogIn, LogOut, Moon, PanelLeftClose, PanelLeftOpen, Shuffle, Sun } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useShallow } from 'zustand/shallow'
import { NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'
import { Tooltip } from '@/components/ui/Tooltip'

export function Sidebar() {
  const location = useLocation()
  const { user, login, logout, loading } = useAuthStore(useShallow((state) => ({ user: state.user, login: state.login, logout: state.logout, loading: state.loading })))
  const [confirmLogout, setConfirmLogout] = useState(false)
  const { theme, toggleTheme, sidebarCollapsed, setSidebarCollapsed, setRandomModalOpen, setWeeklyDigestOpen } = useUiStore(useShallow((state) => ({
    theme: state.theme,
    toggleTheme: state.toggleTheme,
    sidebarCollapsed: state.sidebarCollapsed,
    setSidebarCollapsed: state.setSidebarCollapsed,
    setRandomModalOpen: state.setRandomModalOpen,
    setWeeklyDigestOpen: state.setWeeklyDigestOpen,
  })))

  return (
    <aside className={cn('sticky top-0 hidden h-screen shrink-0 flex-col overflow-y-auto border-r border-border bg-bg-2 md:flex', sidebarCollapsed ? 'w-20' : 'w-[var(--sidebar-w)]')}>
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <NavLink to="/tracker/lc" className="flex items-center gap-2 overflow-hidden">
          <span className="font-display text-xl font-extrabold tracking-tight text-text">Algo<span className="text-accent">Track</span></span>
        </NavLink>
        <button className="rounded-lg p-2 text-text-muted hover:bg-bg-4 hover:text-text" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const basePath = '/' + item.to.split('/')[1]
          const content = (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive: exactActive }) => {
                const segmentActive = exactActive || location.pathname.startsWith(basePath + '/')
                return cn(
                  'group flex items-center gap-3 rounded-xl border-l-2 px-3 py-3 text-sm font-semibold transition',
                  segmentActive ? 'border-l-accent bg-bg-4 text-accent-2' : 'border-l-transparent text-text-muted hover:bg-bg-4/80 hover:text-text',
                  sidebarCollapsed && 'justify-center px-0',
                )
              }}
            >
              <item.icon size={18} />
              {!sidebarCollapsed ? <span>{item.label}</span> : null}
            </NavLink>
          )
          return sidebarCollapsed ? <Tooltip key={item.to} content={item.label}>{content}</Tooltip> : content
        })}

        {/* Utility buttons */}
        <div className={cn('flex gap-1 pt-1', sidebarCollapsed ? 'flex-col' : 'flex-row')}>
          {sidebarCollapsed ? (
            <>
              <Tooltip content="Random Problem">
                <button onClick={() => setRandomModalOpen(true)} className="flex w-full items-center justify-center rounded-xl p-2.5 text-text-muted hover:bg-bg-4 hover:text-text transition-colors">
                  <Shuffle size={16} />
                </button>
              </Tooltip>
              <Tooltip content="Weekly Digest">
                <button onClick={() => setWeeklyDigestOpen(true)} className="flex w-full items-center justify-center rounded-xl p-2.5 text-text-muted hover:bg-bg-4 hover:text-text transition-colors">
                  <span className="text-base leading-none">📅</span>
                </button>
              </Tooltip>
            </>
          ) : (
            <>
              <button onClick={() => setRandomModalOpen(true)} className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-bg-3 px-3 py-2 text-xs font-semibold text-text-muted hover:bg-bg-4 hover:text-text transition-colors">
                <Shuffle size={14} /> Random
              </button>
              <button onClick={() => setWeeklyDigestOpen(true)} className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-bg-3 px-3 py-2 text-xs font-semibold text-text-muted hover:bg-bg-4 hover:text-text transition-colors">
                <span className="text-sm leading-none">📅</span> Weekly
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="space-y-3 border-t border-border p-3">
        <div className={cn('flex items-center rounded-xl border border-border bg-bg-3 px-3 py-2', sidebarCollapsed ? 'justify-center' : 'justify-between')}>
          {!sidebarCollapsed ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-dim">Theme</p>
              <p className="text-sm text-text-muted">{theme === 'dark' ? 'Midnight' : 'Morning'}</p>
            </div>
          ) : null}
          <label className="flex items-center gap-2">
            {theme === 'dark' ? <Moon size={16} className="text-accent" /> : <Sun size={16} className="text-accent" />}
            <Switch.Root checked={theme === 'light'} onCheckedChange={toggleTheme} className="relative h-6 w-11 rounded-full bg-bg-4 data-[state=checked]:bg-accent">
              <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
          </label>
        </div>

        <div className={cn('flex items-center rounded-xl border border-border bg-bg-3 px-3 py-2', sidebarCollapsed ? 'justify-center' : 'justify-between')}>
          <div className={cn('flex items-center gap-3 overflow-hidden', sidebarCollapsed && 'hidden')}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-dim text-sm font-bold text-accent-2">
              {user?.user_metadata.user_name?.slice(0, 1)?.toUpperCase() ?? 'G'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.user_metadata.user_name ?? 'Guest mode'}</p>
              <p className="truncate text-xs text-text-muted">{user?.email ?? 'Local progress only'}</p>
            </div>
          </div>
          {user ? (
            confirmLogout ? (
              <div className={cn('flex items-center gap-1', sidebarCollapsed && 'flex-col')}>
                {!sidebarCollapsed && <span className="text-xs text-text-muted">Sure?</span>}
                <button
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                  onClick={() => { void logout(); setConfirmLogout(false) }}
                >
                  Yes
                </button>
                <button
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-text-muted hover:bg-bg-4"
                  onClick={() => setConfirmLogout(false)}
                >
                  No
                </button>
              </div>
            ) : (
              <button className="rounded-lg p-2 text-text-muted hover:bg-bg-4 hover:text-text" onClick={() => setConfirmLogout(true)} aria-label="Sign out">
                <LogOut size={16} />
              </button>
            )
          ) : (
            <button className={cn('rounded-lg p-2 text-text-muted hover:bg-bg-4 hover:text-text', !sidebarCollapsed && 'flex items-center gap-2 px-3')} onClick={() => void login()} disabled={loading}>
              <LogIn size={16} />
              {!sidebarCollapsed ? <span className="text-sm font-semibold">Login</span> : null}
            </button>
          )}
        </div>

        <div className={cn('rounded-xl border border-border bg-bg-3 px-3 py-2 text-xs text-text-muted', sidebarCollapsed && 'hidden')}>
          <p className="flex items-center justify-between">
            <span>Cmd / Ctrl + K</span>
            <ChevronLeft size={14} className="rotate-180 text-text-dim" />
          </p>
        </div>
      </div>
    </aside>
  )
}
