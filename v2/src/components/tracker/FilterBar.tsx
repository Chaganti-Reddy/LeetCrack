import * as Checkbox from '@radix-ui/react-checkbox'
import * as Popover from '@radix-ui/react-popover'
import { Check, Download, ListFilter, Search, Star, X } from 'lucide-react'
import { CURATED_OPTIONS } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Platform, TrackerStatus } from '@/types'

interface FilterBarProps {
  platform: Platform
  search: string
  onSearchChange: (value: string) => void
  difficulties: string[]
  selectedDifficulties: string[]
  onDifficultyToggle: (value: string) => void
  tags: string[]
  selectedTags: string[]
  onTagToggle: (value: string) => void
  status: TrackerStatus
  onStatusChange: (value: TrackerStatus) => void
  starredOnly: boolean
  onStarredOnlyChange: (value: boolean) => void
  reviewOnly: boolean
  onReviewOnlyChange: (value: boolean) => void
  curatedList: string
  onCuratedChange: (value: string) => void
  onExport: () => void
  onClearAll: () => void
}

function MultiSelect({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant={selected.length ? 'primary' : 'secondary'} size="sm" className="shrink-0">
          <ListFilter size={14} /> {label} {selected.length ? `(${selected.length})` : ''}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8} className="z-50 w-72 rounded-xl border border-border bg-bg-2 p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-text-muted">{options.length} options</p>
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {options.map((option) => (
              <label key={option} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-bg-4/60">
                <Checkbox.Root checked={selected.includes(option)} onCheckedChange={() => onToggle(option)} className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-bg-4 data-[state=checked]:border-accent data-[state=checked]:bg-accent">
                  <Checkbox.Indicator><Check size={12} className="text-black" /></Checkbox.Indicator>
                </Checkbox.Root>
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 pl-2.5 pr-1.5 py-1 text-xs font-medium text-accent-2">
      {label}
      <button onClick={onRemove} className="ml-0.5 rounded-full p-0.5 hover:bg-accent/20 transition-colors" aria-label={`Remove ${label} filter`}>
        <X size={10} />
      </button>
    </span>
  )
}

export function FilterBar(props: FilterBarProps) {
  const curatedLabel = CURATED_OPTIONS[props.platform].find((o) => o.value === props.curatedList)?.label

  const activeChips = [
    ...props.selectedDifficulties.map((d) => ({ label: d, onRemove: () => props.onDifficultyToggle(d) })),
    ...props.selectedTags.map((t) => ({ label: t, onRemove: () => props.onTagToggle(t) })),
    ...(props.status !== 'all' ? [{ label: props.status === 'premium' ? 'Premium 🔒' : props.status === 'free' ? 'Free only' : `Status: ${props.status}`, onRemove: () => props.onStatusChange('all') }] : []),
    ...(props.starredOnly ? [{ label: '⭐ Starred', onRemove: () => props.onStarredOnlyChange(false) }] : []),
    ...(props.reviewOnly ? [{ label: '🔁 Review due', onRemove: () => props.onReviewOnlyChange(false) }] : []),
    ...(props.curatedList && curatedLabel ? [{ label: curatedLabel, onRemove: () => props.onCuratedChange('') }] : []),
  ]

  return (
    <div className="card space-y-2.5 p-3">
      {/* Row 1: search + controls — always single line */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[160px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <Input
            value={props.search}
            onChange={(event) => props.onSearchChange(event.target.value)}
            placeholder="Search title, tag, contest, slug…"
            className="h-9 pl-9"
          />
        </div>
        <select
          aria-label="Filter status"
          className="h-9 rounded-lg border border-border bg-bg-3 px-2 text-sm text-text outline-none hover:border-accent/40 transition-colors"
          value={props.status}
          onChange={(event) => props.onStatusChange(event.target.value as TrackerStatus)}
        >
          <option value="all">All</option>
          <option value="solved">Solved</option>
          <option value="unsolved">Unsolved</option>
          {props.platform === 'lc' && <option value="premium">Premium 🔒</option>}
          {props.platform === 'lc' && <option value="free">Free only</option>}
        </select>
        <select
          aria-label="Curated list"
          className="h-9 max-w-[160px] rounded-lg border border-border bg-bg-3 px-2 text-sm text-text outline-none hover:border-accent/40 transition-colors"
          value={props.curatedList}
          onChange={(event) => props.onCuratedChange(event.target.value)}
        >
          {CURATED_OPTIONS[props.platform].map((option) => (
            <option key={option.value || 'all'} value={option.value}>{option.label}</option>
          ))}
        </select>
        {props.difficulties.length ? <MultiSelect label="Difficulty" options={props.difficulties} selected={props.selectedDifficulties} onToggle={props.onDifficultyToggle} /> : null}
        {props.tags.length ? <MultiSelect label="Tags" options={props.tags} selected={props.selectedTags} onToggle={props.onTagToggle} /> : null}
        <Button size="sm" variant={props.starredOnly ? 'primary' : 'secondary'} onClick={() => props.onStarredOnlyChange(!props.starredOnly)}>
          <Star size={13} /> Starred
        </Button>
        <Button size="sm" variant={props.reviewOnly ? 'primary' : 'secondary'} onClick={() => props.onReviewOnlyChange(!props.reviewOnly)}>
          Review
        </Button>
        <Button size="sm" variant="ghost" onClick={props.onExport} aria-label="Export CSV">
          <Download size={13} />
        </Button>
      </div>

      {/* Row 2: active filter chips — only when filters are active */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.15em] text-text-dim mr-1">Active:</span>
          {activeChips.map((chip) => (
            <FilterChip key={chip.label} label={chip.label} onRemove={chip.onRemove} />
          ))}
          <button
            onClick={props.onClearAll}
            className="ml-1 text-xs text-text-dim hover:text-text transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
