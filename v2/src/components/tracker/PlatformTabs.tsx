import * as Tabs from '@radix-ui/react-tabs'
import { useNavigate } from 'react-router-dom'
import type { Platform } from '@/types'

const items: Array<{ value: Platform; label: string }> = [
  { value: 'lc', label: 'LeetCode' },
  { value: 'cf', label: 'Codeforces' },
  { value: 'ac', label: 'AtCoder' },
]

export function PlatformTabs({ platform, basePath }: { platform: Platform; basePath: 'tracker' | 'profile' | 'insights' }) {
  const navigate = useNavigate()

  return (
    <Tabs.Root className="inline-flex" value={platform} onValueChange={(value) => navigate(`/${basePath}/${value}`)}>
      <Tabs.List className="inline-flex w-fit items-center rounded-xl border border-border bg-bg-2 p-1">
        {items.map((item) => (
          <Tabs.Trigger key={item.value} value={item.value} className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-text-muted data-[state=active]:bg-bg-4 data-[state=active]:text-accent-2">
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  )
}
