import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'

export const sidebarNavItemVariants = cva(
  'flex items-center w-full text-left rounded-(--radius-md) transition-[background-color,color] duration-150 ease-in-out',
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
      collapsed: {
        true: 'justify-center px-0 py-2',
        false: 'gap-2.5',
      },
    },
    defaultVariants: { state: 'default', size: 'md', collapsed: false },
  },
)

export interface SidebarNavItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof sidebarNavItemVariants> {
  label: string
  icon?: React.ReactNode
  count?: number
  shortcut?: string
  collapsed?: boolean
}

export const SidebarNavItem = React.forwardRef<
  HTMLButtonElement,
  SidebarNavItemProps
>(function SidebarNavItem(
  { className, state, size, label, icon, count, shortcut, collapsed = false, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      title={collapsed ? label : undefined}
      className={cn(sidebarNavItemVariants({ state, size, collapsed }), className)}
      {...props}
    >
      {icon ? (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          {icon}
        </span>
      ) : null}
      {!collapsed && (
        <>
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
        </>
      )}
      {collapsed && (
        <span className="sr-only">{label}</span>
      )}
    </button>
  )
})
