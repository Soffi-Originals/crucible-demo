import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const dividerVariants = cva('shrink-0', {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'w-px h-full self-stretch',
    },
    tone: {
      default: 'bg-(--color-border)',
      subtle: 'bg-(--color-border-subtle)',
      strong: 'bg-(--color-border-strong)',
    },
    spacing: {
      none: '',
      sm: 'my-2',
      md: 'my-4',
      lg: 'my-6',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    tone: 'default',
    spacing: 'none',
  },
})

export interface DividerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dividerVariants> {}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  function Divider({ className, orientation, tone, spacing, ...props }, ref) {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation ?? 'horizontal'}
        className={cn(
          dividerVariants({ orientation, tone, spacing }),
          className,
        )}
        {...props}
      />
    )
  },
)
