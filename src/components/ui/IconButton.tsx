import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const iconButtonVariants = cva(
  'inline-flex items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-canvas) shrink-0',
  {
    variants: {
      variant: {
        ghost:
          'bg-transparent text-(--color-fg-muted) hover:bg-(--color-surface-subtle) hover:text-(--color-fg)',
        outline:
          'bg-transparent text-(--color-fg) border border-(--color-border) hover:bg-(--color-surface-subtle)',
        solid:
          'bg-(--color-primary) text-(--color-primary-fg) hover:bg-(--color-primary-hover)',
        soft:
          'bg-(--color-surface-subtle) text-(--color-fg) hover:bg-(--color-surface-muted)',
      },
      size: {
        sm: 'h-7 w-7 rounded-(--radius-sm)',
        md: 'h-9 w-9 rounded-(--radius-md)',
        lg: 'h-11 w-11 rounded-(--radius-lg)',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
    },
  },
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  'aria-label': string
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ className, variant, size, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(iconButtonVariants({ variant, size }), className)}
        {...props}
      />
    )
  },
)
