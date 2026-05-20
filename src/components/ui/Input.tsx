import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const inputVariants = cva(
  'flex w-full bg-(--color-surface) text-(--color-fg) placeholder:text-(--color-fg-subtle) transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus) focus-visible:ring-offset-1 focus-visible:ring-offset-(--color-canvas)',
  {
    variants: {
      variant: {
        default:
          'border border-(--color-border) hover:border-(--color-border-strong)',
        ghost:
          'border border-transparent bg-(--color-surface-subtle) hover:bg-(--color-surface-muted)',
        plain:
          'border-0 bg-transparent px-0',
      },
      size: {
        sm: 'h-7 px-2 text-xs rounded-(--radius-sm)',
        md: 'h-9 px-3 text-sm rounded-(--radius-md)',
        lg: 'h-11 px-3.5 text-md rounded-(--radius-lg)',
      },
      state: {
        default: '',
        error:
          'border-(--color-danger) focus-visible:ring-(--color-danger)',
        success:
          'border-(--color-success) focus-visible:ring-(--color-success)',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
    },
  },
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, variant, size, state, type, ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type ?? 'text'}
        className={cn(inputVariants({ variant, size, state }), className)}
        {...props}
      />
    )
  },
)
