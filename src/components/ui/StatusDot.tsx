import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const statusDotVariants = cva('inline-block rounded-full shrink-0', {
  variants: {
    status: {
      idle: 'bg-(--color-fg-subtle)',
      running: 'bg-(--color-info) animate-pulse',
      success: 'bg-(--color-success)',
      warning: 'bg-(--color-warning)',
      error: 'bg-(--color-danger)',
    },
    size: {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5',
    },
    ring: {
      none: '',
      soft: 'ring-4 ring-(--color-border-subtle)',
    },
  },
  defaultVariants: {
    status: 'idle',
    size: 'md',
    ring: 'none',
  },
})

export interface StatusDotProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusDotVariants> {}

export const StatusDot = React.forwardRef<HTMLSpanElement, StatusDotProps>(
  function StatusDot({ className, status, size, ring, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn(statusDotVariants({ status, size, ring }), className)}
        aria-hidden="true"
        {...props}
      />
    )
  },
)
