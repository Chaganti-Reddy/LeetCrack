import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn('h-10 w-full rounded-lg border border-border bg-bg-3 px-3 text-sm text-text outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/20', className)}
    {...props}
  />
))

Input.displayName = 'Input'
