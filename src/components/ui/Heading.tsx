import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

export const headingVariants = cva('text-(--color-fg) tracking-tight', {
  variants: {
    size: {
      xs: 'text-sm',
      sm: 'text-md',
      md: 'text-lg',
      lg: 'text-xl',
      xl: 'text-2xl',
      '2xl': 'text-3xl',
      '3xl': 'text-4xl',
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
      inverse: 'text-(--color-fg-inverse)',
    },
  },
  defaultVariants: {
    size: 'lg',
    weight: 'semibold',
    tone: 'default',
  },
})

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div' | 'span'

export interface HeadingProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof headingVariants> {
  as?: HeadingTag
}

export const Heading = React.forwardRef<HTMLElement, HeadingProps>(
  function Heading(
    { as = 'h2', className, size, weight, tone, ...props },
    ref,
  ) {
    const Component = as as React.ElementType
    return (
      <Component
        ref={ref}
        className={cn(headingVariants({ size, weight, tone }), className)}
        {...props}
      />
    )
  },
)
