import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const avatarVariants = cva(
  'inline-flex items-center justify-center font-medium select-none shrink-0 overflow-hidden',
  {
    variants: {
      variant: {
        neutral: 'bg-(--color-surface-muted) text-(--color-fg-muted)',
        accent: 'bg-(--color-accent-soft) text-(--color-info-fg)',
        success: 'bg-(--color-success-soft) text-(--color-success-fg)',
        warning: 'bg-(--color-warning-soft) text-(--color-warning-fg)',
        danger: 'bg-(--color-danger-soft) text-(--color-danger-fg)',
        solid: 'bg-(--color-fg) text-(--color-fg-inverse)',
      },
      size: {
        xs: 'h-5 w-5 text-[10px] rounded-(--radius-xs)',
        sm: 'h-7 w-7 text-xs rounded-(--radius-sm)',
        md: 'h-9 w-9 text-sm rounded-(--radius-md)',
        lg: 'h-11 w-11 text-md rounded-(--radius-lg)',
        xl: 'h-14 w-14 text-lg rounded-(--radius-lg)',
      },
      shape: {
        square: '',
        circle: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
      shape: 'square',
    },
  },
)

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  initials?: string
  icon?: React.ReactNode
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  function Avatar(
    { className, variant, size, shape, initials, icon, children, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ variant, size, shape }), className)}
        {...props}
      >
        {children ?? icon ?? initials}
      </div>
    )
  },
)
