import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const toggleVariants = cva(
  'relative inline-flex shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-canvas) disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-4 w-7',
        md: 'h-5 w-9',
        lg: 'h-6 w-11',
      },
      tone: {
        accent: 'data-[on=true]:bg-(--color-accent) data-[on=false]:bg-(--color-surface-muted)',
        success: 'data-[on=true]:bg-(--color-success) data-[on=false]:bg-(--color-surface-muted)',
      },
    },
    defaultVariants: {
      size: 'md',
      tone: 'accent',
    },
  },
)

const knobSize = {
  sm: 'h-3 w-3 data-[on=true]:translate-x-3.5',
  md: 'h-4 w-4 data-[on=true]:translate-x-4',
  lg: 'h-5 w-5 data-[on=true]:translate-x-5',
}

export interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'>,
    VariantProps<typeof toggleVariants> {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  function Toggle(
    { className, size, tone, checked, onCheckedChange, ...props },
    ref,
  ) {
    const sizeKey = size ?? 'md'
    return (
      <button
        ref={ref}
        role="switch"
        type="button"
        aria-checked={checked}
        data-on={checked}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(toggleVariants({ size, tone }), className)}
        {...props}
      >
        <span
          data-on={checked}
          className={cn(
            'inline-block translate-x-0.5 rounded-full bg-white shadow-(--shadow-sm) transition-transform',
            knobSize[sizeKey],
          )}
        />
      </button>
    )
  },
)
