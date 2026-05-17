import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { RivalSeries } from '@/types'

interface RivalsTableProps {
  rivals: string[]
  series: RivalSeries[]
  onAdd: (handle: string) => void
  onRemove: (handle: string) => void
}

export function RivalsTable({ rivals, series, onAdd, onRemove }: RivalsTableProps) {
  const [value, setValue] = useState('')
  const latestMap = Object.fromEntries(series.map((item) => [item.handle, item.points[item.points.length - 1]?.rating ?? null]))

  return (
    <div className="card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-title">Rivals</h3>
        <p className="muted">Compare live handles</p>
      </div>
      <div className="mb-4 flex gap-2">
        <Input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Add rival handle" />
        <Button onClick={() => { onAdd(value); setValue('') }} disabled={!value.trim()}>
          <Plus size={16} /> Add
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-bg-3/60 text-left text-xs uppercase tracking-[0.18em] text-text-dim">
            <tr>
              <th className="px-3 py-3">Handle</th>
              <th className="px-3 py-3">Latest rating</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rivals.length ? rivals.map((rival) => (
              <tr key={rival} className="border-t border-border">
                <td className="px-3 py-3 font-semibold">{rival}</td>
                <td className="px-3 py-3 text-text-muted">{latestMap[rival] ?? '—'}</td>
                <td className="px-3 py-3 text-right">
                  <button className="rounded-lg p-2 text-text-muted hover:bg-bg-4 hover:text-[var(--red)]" onClick={() => onRemove(rival)} aria-label={`Remove ${rival}`}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-text-muted">No rivals yet. Add a handle to compare rating trajectories.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
