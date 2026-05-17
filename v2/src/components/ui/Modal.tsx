import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}

export function Modal({ open, onOpenChange, title, description, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-bg-2 p-6 shadow-2xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="font-display text-2xl font-bold">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-sm text-text-muted">{description}</Dialog.Description> : null}
            </div>
            <Dialog.Close className="rounded-lg p-2 text-text-muted transition hover:bg-bg-4 hover:text-text" aria-label="Close modal">
              <X size={16} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
