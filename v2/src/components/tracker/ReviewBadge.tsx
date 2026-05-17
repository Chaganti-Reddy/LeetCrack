import { RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

export function ReviewBadge({ due }: { due: boolean }) {
  if (!due) return null
  return (
    <Badge variant="accent" className="gap-1">
      <RotateCcw size={10} /> Due
    </Badge>
  )
}
