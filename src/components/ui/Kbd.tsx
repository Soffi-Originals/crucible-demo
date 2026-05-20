import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const kbdVariants = cva(
  'inline-flex items-center justify-center font-mono font-medium border border-(--color-border) bg-(--color-surface-subtle) text-(--color-fg-muted) shrink-0',
  {
    variants: {
      size: {
        sm: 'h-5 min-w-5 px-1 text-[10px] rounded-(--radius-xs)',
        md: 'h-6 min-w-6 px-1.5 text-xs rounded-(--radius-sm)',
      },
      tone: {
        default: '',
        accent:
          'border-(--color-info)/30 bg-(--color-accent-soft) text-(--color-info-fg)',
      },
    },
    defaultVariants: {
      size: 'sm',
      tone: 'default',
    },
  },
)

export interface KbdProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof kbdVariants> {}

export const Kbd = React.forwardRef<HTMLElement, KbdProps>(function Kbd(
  { className, size, tone, ...props },
  ref,
) {
  return (
    <kbd
      ref={ref as React.RefObject<HTMLElement>}
      className={cn(kbdVariants({ size, tone }), className)}
      {...props}
    />
  )
})
