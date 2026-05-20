import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const cardVariants = cva('flex flex-col bg-(--color-surface)', {
  variants: {
    variant: {
      default: 'border border-(--color-border)',
      elevated: 'border border-(--color-border) shadow-(--shadow-md)',
      outlined: 'border border-(--color-border-strong) bg-transparent',
      subtle: 'border border-(--color-border-subtle) bg-(--color-surface-subtle)',
      raised: 'bg-(--color-surface-raised) shadow-(--shadow-sm)',
    },
    padding: {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-7',
    },
    radius: {
      sm: 'rounded-(--radius-sm)',
      md: 'rounded-(--radius-md)',
      lg: 'rounded-(--radius-lg)',
      xl: 'rounded-(--radius-xl)',
      '2xl': 'rounded-(--radius-2xl)',
    },
    interactive: {
      true: 'transition-colors hover:border-(--color-border-strong) cursor-pointer',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
    radius: 'lg',
    interactive: false,
  },
})

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, variant, padding, radius, interactive, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, padding, radius, interactive }),
        className,
      )}
      {...props}
    />
  )
})

export const cardSectionVariants = cva('flex', {
  variants: {
    align: {
      row: 'flex-row items-center',
      column: 'flex-col',
    },
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-5',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-7',
    },
    border: {
      none: '',
      top: 'border-t border-(--color-border-subtle)',
      bottom: 'border-b border-(--color-border-subtle)',
    },
  },
  defaultVariants: {
    align: 'column',
    gap: 'sm',
    padding: 'none',
    border: 'none',
  },
})

export interface CardSectionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardSectionVariants> {}

export const CardSection = React.forwardRef<HTMLDivElement, CardSectionProps>(
  function CardSection({ className, align, gap, padding, border, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          cardSectionVariants({ align, gap, padding, border }),
          className,
        )}
        {...props}
      />
    )
  },
)
