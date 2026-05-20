import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const skeletonVariants = cva(
  'block bg-(--color-surface-muted) animate-pulse',
  {
    variants: {
      shape: {
        line: 'h-3 w-full rounded-(--radius-xs)',
        block: 'h-16 w-full rounded-(--radius-md)',
        circle: 'rounded-full',
        pill: 'h-6 w-20 rounded-(--radius-full)',
      },
    },
    defaultVariants: {
      shape: 'line',
    },
  },
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton({ className, shape, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ shape }), className)}
        aria-hidden="true"
        {...props}
      />
    )
  },
)
