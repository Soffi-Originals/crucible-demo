import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const textVariants = cva('', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      md: 'text-md',
      lg: 'text-lg',
      xl: 'text-xl',
    },
    weight: {
      regular: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    tone: {
      default: 'text-(--color-fg)',
      muted: 'text-(--color-fg-muted)',
      subtle: 'text-(--color-fg-subtle)',
      inverse: 'text-(--color-fg-inverse)',
      accent: 'text-(--color-accent)',
      success: 'text-(--color-success-fg)',
      warning: 'text-(--color-warning-fg)',
      danger: 'text-(--color-danger-fg)',
    },
    family: {
      sans: 'font-sans',
      mono: 'font-mono',
    },
    truncate: {
      true: 'truncate',
      false: '',
    },
  },
  defaultVariants: {
    size: 'base',
    weight: 'regular',
    tone: 'default',
    family: 'sans',
    truncate: false,
  },
})

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'size'>,
    VariantProps<typeof textVariants> {
  as?: 'span' | 'p' | 'div' | 'label' | 'small'
}

export const Text = React.forwardRef<HTMLElement, TextProps>(function Text(
  { as = 'span', className, size, weight, tone, family, truncate, ...props },
  ref,
) {
  const Component = as as React.ElementType
  return (
    <Component
      ref={ref}
      className={cn(
        textVariants({ size, weight, tone, family, truncate }),
        className,
      )}
      {...props}
    />
  )
})
