import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral:
          'bg-(--color-surface-subtle) text-(--color-fg-muted) border border-(--color-border-subtle)',
        accent:
          'bg-(--color-accent-soft) text-(--color-info-fg) border border-(--color-info)/20',
        success:
          'bg-(--color-success-soft) text-(--color-success-fg) border border-(--color-success)/20',
        warning:
          'bg-(--color-warning-soft) text-(--color-warning-fg) border border-(--color-warning)/20',
        danger:
          'bg-(--color-danger-soft) text-(--color-danger-fg) border border-(--color-danger)/20',
        outline:
          'bg-transparent text-(--color-fg-muted) border border-(--color-border)',
        solid:
          'bg-(--color-fg) text-(--color-fg-inverse) border border-transparent',
      },
      size: {
        sm: 'h-5 px-1.5 text-xs rounded-(--radius-xs)',
        md: 'h-6 px-2 text-xs rounded-(--radius-sm)',
        lg: 'h-7 px-2.5 text-sm rounded-(--radius-sm)',
      },
      shape: {
        rect: '',
        pill: 'rounded-(--radius-full)',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
      shape: 'rect',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ className, variant, size, shape, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, shape }), className)}
        {...props}
      />
    )
  },
)
