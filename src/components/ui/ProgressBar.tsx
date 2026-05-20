import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const progressBarVariants = cva(
  'relative w-full overflow-hidden bg-(--color-surface-muted)',
  {
    variants: {
      size: {
        sm: 'h-1 rounded-(--radius-full)',
        md: 'h-1.5 rounded-(--radius-full)',
        lg: 'h-2 rounded-(--radius-full)',
      },
      tone: {
        accent: '',
        success: '',
        warning: '',
        danger: '',
      },
    },
    defaultVariants: {
      size: 'md',
      tone: 'accent',
    },
  },
)

const fillTone: Record<
  NonNullable<VariantProps<typeof progressBarVariants>['tone']>,
  string
> = {
  accent: 'bg-(--color-accent)',
  success: 'bg-(--color-success)',
  warning: 'bg-(--color-warning)',
  danger: 'bg-(--color-danger)',
}

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressBarVariants> {
  value: number
  max?: number
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  function ProgressBar(
    { className, size, tone, value, max = 100, ...props },
    ref,
  ) {
    const clamped = Math.max(0, Math.min(max, value))
    const pct = (clamped / max) * 100
    const toneKey = tone ?? 'accent'

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped}
        className={cn(progressBarVariants({ size, tone }), className)}
        {...props}
      >
        <div
          className={cn(
            'h-full transition-[width] duration-300 ease-out',
            fillTone[toneKey],
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    )
  },
)
