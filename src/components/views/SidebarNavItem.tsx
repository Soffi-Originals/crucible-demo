import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'

// eslint-disable-next-line react-refresh/only-export-components
export const sidebarNavItemVariants = cva(
  'flex items-center gap-2.5 w-full text-left rounded-(--radius-md) border-l-2 border-l-transparent transition-[background-color,border-color] duration-150 ease-in-out',
  {
    variants: {
      state: {
        default:
          'text-(--color-fg-muted) hover:bg-(--color-surface-subtle) hover:text-(--color-fg)',
        active:
          'bg-(--color-surface-subtle) text-(--color-fg) border-l-(--color-accent) font-medium',
        muted: 'opacity-50',
      },
      size: {
        sm: 'pl-[calc(0.5rem-2px)] pr-2 pt-1.5 pb-9 text-sm',
        md: 'pl-[calc(0.625rem-2px)] pr-2.5 pt-2 pb-9 text-sm',
      },
    },
    defaultVariants: { state: 'default', size: 'md' },
  },
)

export interface SidebarNavItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof sidebarNavItemVariants> {
  label: string
  icon?: React.ReactNode
  count?: number
  shortcut?: string
}

export const SidebarNavItem = React.forwardRef<
  HTMLButtonElement,
  SidebarNavItemProps
>(function SidebarNavItem(
  { className, state, size, label, icon, count, shortcut, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(sidebarNavItemVariants({ state, size }), className)}
      {...props}
    >
      {icon ? (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          {icon}
        </span>
      ) : null}
      <Text size="sm" weight="medium" className="flex-1 text-current">
        {label}
      </Text>
      {typeof count === 'number' ? (
        <Badge variant="neutral" size="sm">
          {count}
        </Badge>
      ) : null}
      {shortcut ? (
        <Text size="xs" tone="subtle" family="mono">
          {shortcut}
        </Text>
      ) : null}
    </button>
  )
})
