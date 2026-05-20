import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-canvas)',
  {
    variants: {
      variant: {
        primary:
          'bg-(--color-primary) text-(--color-primary-fg) hover:bg-(--color-primary-hover)',
        secondary:
          'bg-(--color-surface) text-(--color-fg) border border-(--color-border) hover:bg-(--color-surface-subtle)',
        outline:
          'bg-transparent text-(--color-fg) border border-(--color-border-strong) hover:bg-(--color-surface-subtle)',
        ghost:
          'bg-transparent text-(--color-fg) hover:bg-(--color-surface-subtle)',
        accent:
          'bg-(--color-accent) text-(--color-accent-fg) hover:bg-(--color-accent-hover)',
        danger:
          'bg-(--color-danger) text-white hover:opacity-90',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs rounded-(--radius-sm)',
        md: 'h-9 px-3.5 text-sm rounded-(--radius-md)',
        lg: 'h-11 px-5 text-md rounded-(--radius-lg)',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant,
      size,
      fullWidth,
      leadingIcon,
      trailingIcon,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      >
        {leadingIcon ? (
          <span className="flex shrink-0 items-center">{leadingIcon}</span>
        ) : null}
        {children}
        {trailingIcon ? (
          <span className="flex shrink-0 items-center">{trailingIcon}</span>
        ) : null}
      </button>
    )
  },
)
