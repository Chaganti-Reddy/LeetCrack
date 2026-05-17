import * as Dialog from '@radix-ui/react-dialog'
import { Command } from 'cmdk'
import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { NAV_ITEMS } from '@/lib/constants'
import { buildProblemUrl, getPlatformLabel, problemKey } from '@/lib/utils'
import { usePlatformStore } from '@/stores/platformStore'
import { useUiStore } from '@/stores/uiStore'

export function CommandPalette() {
  const navigate = useNavigate()
  const location = useLocation()
  const open = useUiStore((state) => state.commandPaletteOpen)
  const setOpen = useUiStore((state) => state.setCommandPaletteOpen)
  const setNotePanelProblemId = useUiStore((state) => state.setNotePanelProblemId)
  const questions = usePlatformStore((state) => state.questions)
  const cfMeta = usePlatformStore((state) => state.cfMeta)
  const acMeta = usePlatformStore((state) => state.acMeta)
  const setRandomModalOpen = useUiStore((state) => state.setRandomModalOpen)

  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(!open)
      }
      const tag = (event.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if ((event.key === 'r' || event.key === 'R') && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        setRandomModalOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, setOpen, setRandomModalOpen])

  const allProblems = useMemo(
    () => [
      ...questions.map((p) => ({ id: problemKey(p), label: p.title, route: '/tracker/lc', meta: getPlatformLabel('lc'), href: buildProblemUrl(p) })),
      ...cfMeta.map((p) => ({ id: problemKey(p), label: p.title, route: '/tracker/cf', meta: getPlatformLabel('cf'), href: buildProblemUrl(p) })),
      ...acMeta.map((p) => ({ id: problemKey(p), label: p.title, route: '/tracker/ac', meta: getPlatformLabel('ac'), href: buildProblemUrl(p) })),
    ],
    [questions, cfMeta, acMeta],
  )

  // Filter client-side and cap at 60 so we never render thousands of DOM nodes
  const filteredProblems = useMemo(() => {
    if (!search.trim()) return allProblems.slice(0, 30)
    const needle = search.trim().toLowerCase()
    const results: typeof allProblems = []
    for (const item of allProblems) {
      if (item.label.toLowerCase().includes(needle)) results.push(item)
      if (results.length >= 60) break
    }
    return results
  }, [allProblems, search])

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-[16vh] z-50 w-[min(92vw,42rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-bg-2 shadow-2xl">
          <Command label="AlgoTrack command palette" shouldFilter={false} className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search size={16} className="text-text-muted" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Jump to page, search a problem…"
                className="h-14 w-full bg-transparent text-sm text-text outline-none placeholder:text-text-dim"
              />
            </div>
            <Command.List className="max-h-[65vh] overflow-y-auto p-2">
              <Command.Empty className="px-4 py-8 text-center text-sm text-text-muted">No matching results.</Command.Empty>
              <Command.Group heading="Navigate" className="px-2 py-2 text-xs text-text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1">
                {NAV_ITEMS.filter((item) => !search || item.label.toLowerCase().includes(search.toLowerCase())).map((item) => (
                  <Command.Item
                    key={item.to}
                    value={`nav-${item.to}`}
                    onSelect={() => { navigate(item.to); setOpen(false) }}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm aria-selected:bg-bg-4"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-text-muted">{item.to}</span>
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Problems" className="px-2 py-2 text-xs text-text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1">
                {filteredProblems.map((item) => (
                  <Command.Item
                    key={`${item.route}-${item.id}`}
                    value={`problem-${item.route}-${item.id}`}
                    onSelect={() => { navigate(item.route); setNotePanelProblemId(item.id); setOpen(false) }}
                    className="flex cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-2 text-sm aria-selected:bg-bg-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate">{item.label}</p>
                      <p className="text-xs text-text-muted">{item.meta}</p>
                    </div>
                    <a href={item.href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-accent">
                      Open
                    </a>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
            <div className="border-t border-border px-4 py-2 text-xs text-text-muted">
              {search ? `${filteredProblems.length} results` : 'Type to search all platforms'} · {location.pathname}
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
