import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Text } from '@/components/ui/Text'

// eslint-disable-next-line react-refresh/only-export-components
export const sidebarNavItemVariants = cva(
  'group flex items-center gap-2.5 w-full text-left rounded-(--radius-md) transition-[background-color,color] duration-150 ease-in-out',
  {
    variants: {
      state: {
        default:
          'text-(--color-fg-muted) hover:bg-(--color-surface-subtle) hover:text-(--color-fg)',
        active:
          'bg-(--color-surface-muted) text-(--color-fg) font-medium',
        muted: 'opacity-50',
      },
      size: {
        sm: 'px-2 py-1.5 text-sm',
        md: 'px-2.5 py-2 text-sm',
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
        <Text size="xs" tone="subtle" family="mono" className="tabular-nums">
          {count}
        </Text>
      ) : null}
      {shortcut ? (
        <Text
          size="xs"
          tone="subtle"
          family="mono"
          className="opacity-0 transition-opacity duration-100 group-hover:opacity-100"
        >
          {shortcut}
        </Text>
      ) : null}
    </button>
  )
})
