import * as React from 'react'
import {
  Activity,
  Bot,
  Box,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CreditCard,
  Flame,
  Gauge,
  Plug,
  Search,
  Settings,
  X,
} from 'lucide-react'
import { SidebarNavItem } from './SidebarNavItem'
import { Avatar } from '@/components/ui/Avatar'
import { Text } from '@/components/ui/Text'
import { Input } from '@/components/ui/Input'
import { Kbd } from '@/components/ui/Kbd'
import { Divider } from '@/components/ui/Divider'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/lib/cn'

export type PageId =
  | 'overview'
  | 'agents'
  | 'simulations'
  | 'evals'
  | 'connectors'
  | 'plans'

export interface SidebarProps {
  current: PageId
  onNavigate: (id: PageId) => void
  onClose?: () => void
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

const items: {
  id: PageId
  label: string
  icon: React.ReactNode
  count?: number
  shortcut?: string
}[] = [
  { id: 'overview', label: 'Overview', icon: <Gauge className="h-4 w-4" />, shortcut: '⌘1' },
  { id: 'agents', label: 'Agents', icon: <Bot className="h-4 w-4" />, count: 4, shortcut: '⌘2' },
  { id: 'simulations', label: 'Simulations', icon: <Activity className="h-4 w-4" />, count: 12, shortcut: '⌘3' },
  { id: 'evals', label: 'Eval packs', icon: <Box className="h-4 w-4" />, shortcut: '⌘4' },
  { id: 'connectors', label: 'Connectors', icon: <Plug className="h-4 w-4" />, shortcut: '⌘5' },
  { id: 'plans', label: 'Plans & billing', icon: <CreditCard className="h-4 w-4" />, shortcut: '⌘6' },
]

/** Simple tooltip that appears to the right of an icon in collapsed mode */
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative flex items-center">
      {children}
      <div
        className={cn(
          'pointer-events-none absolute left-full ml-2 z-50',
          'whitespace-nowrap rounded-(--radius-md) bg-(--color-fg) px-2 py-1',
          'text-xs font-medium text-(--color-canvas)',
          'opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100',
        )}
      >
        {label}
      </div>
    </div>
  )
}

export function Sidebar({
  current,
  onNavigate,
  onClose,
  collapsed = false,
  onCollapsedChange,
}: SidebarProps) {
  return (
    <div className={cn('flex h-full flex-col gap-4 py-4', collapsed ? 'px-2' : 'px-4')}>

      {/* Workspace header */}
      <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
        {collapsed ? (
          <Tooltip label="Crucible! · Acme Production">
            <button
              type="button"
              aria-label="Workspace"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-(--radius-md) bg-(--color-fg) text-(--color-warning) transition-opacity hover:opacity-80"
            >
              <Flame className="h-4 w-4" strokeWidth={2.25} fill="currentColor" />
            </button>
          </Tooltip>
        ) : (
          <>
            <button
              type="button"
              className="flex flex-1 items-center gap-2.5 rounded-(--radius-md) p-1.5 -m-1.5 text-left transition-colors hover:bg-(--color-surface-subtle)"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-(--radius-md) bg-(--color-fg) text-(--color-warning)">
                <Flame className="h-4 w-4" strokeWidth={2.25} fill="currentColor" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <Text size="sm" weight="semibold" truncate>
                  Crucible!
                </Text>
                <Text size="xs" tone="subtle" truncate>
                  Acme · Production
                </Text>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 text-(--color-fg-subtle)" />
            </button>
            {onClose ? (
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="Close menu"
                onClick={onClose}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </IconButton>
            ) : null}
          </>
        )}
      </div>

      {/* Search — hidden when collapsed */}
      {!collapsed && (
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-(--color-fg-subtle)" />
          <Input
            variant="ghost"
            size="sm"
            placeholder="Search…"
            className="pl-7 pr-12"
          />
          <Kbd size="sm" className="absolute right-2">
            ⌘K
          </Kbd>
        </div>
      )}

      {/* Nav items */}
      <nav className={cn('flex flex-col', collapsed ? 'gap-1 items-center' : 'gap-0.5')}>
        {items.map((item) => {
          const isActive = current === item.id
          if (collapsed) {
            return (
              <Tooltip key={item.id} label={item.label}>
                <button
                  type="button"
                  aria-label={item.label}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-(--radius-md) transition-colors',
                    isActive
                      ? 'bg-(--color-surface-subtle) text-(--color-fg) ring-1 ring-(--color-border)'
                      : 'text-(--color-fg-muted) hover:bg-(--color-surface-subtle) hover:text-(--color-fg)',
                  )}
                >
                  {item.icon}
                </button>
              </Tooltip>
            )
          }
          return (
            <SidebarNavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              count={item.count}
              shortcut={item.shortcut}
              state={isActive ? 'active' : 'default'}
              onClick={() => onNavigate(item.id)}
            />
          )
        })}
      </nav>

      {/* Footer */}
      <div className={cn('mt-auto flex flex-col gap-2', collapsed && 'items-center')}>
        <Divider tone="subtle" className={collapsed ? 'w-full' : undefined} />

        {/* Settings */}
        {collapsed ? (
          <Tooltip label="Settings">
            <button
              type="button"
              aria-label="Settings"
              className="flex h-9 w-9 items-center justify-center rounded-(--radius-md) text-(--color-fg-muted) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-fg)"
            >
              <Settings className="h-4 w-4" />
            </button>
          </Tooltip>
        ) : (
          <SidebarNavItem
            label="Settings"
            icon={<Settings className="h-4 w-4" />}
            state="default"
          />
        )}

        {/* User */}
        {collapsed ? (
          <Tooltip label="Brayden Love · brayden@soffi.ai">
            <button
              type="button"
              aria-label="User profile"
              className="flex h-9 w-9 items-center justify-center rounded-(--radius-md) transition-colors hover:bg-(--color-surface-subtle)"
            >
              <Avatar variant="accent" shape="circle" size="sm" initials="BL" />
            </button>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-2 px-2 py-2">
            <Avatar variant="accent" shape="circle" size="sm" initials="BL" />
            <div className="flex min-w-0 flex-1 flex-col">
              <Text size="sm" weight="medium" truncate>
                Brayden Love
              </Text>
              <Text size="xs" tone="subtle" truncate>
                brayden@soffi.ai
              </Text>
            </div>
          </div>
        )}

        {/* Collapse toggle — desktop only */}
        {onCollapsedChange && (
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => onCollapsedChange(!collapsed)}
            className={cn(
              'hidden lg:flex items-center justify-center rounded-(--radius-md)',
              'h-7 w-full text-(--color-fg-subtle) transition-colors',
              'hover:bg-(--color-surface-subtle) hover:text-(--color-fg)',
              collapsed ? 'w-9' : 'gap-1.5 px-2',
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <>
                <ChevronLeft className="h-3.5 w-3.5" />
                <Text size="xs" tone="subtle" className="text-current">
                  Collapse
                </Text>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
