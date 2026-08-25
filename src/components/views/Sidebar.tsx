import * as React from 'react'
import {
  Activity,
  Bot,
  Box,
  ChevronsUpDown,
  CreditCard,
  Flame,
  Gauge,
  LifeBuoy,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Search,
  Settings,
} from 'lucide-react'
import { SidebarNavItem } from './SidebarNavItem'
import { Avatar } from '@/components/ui/Avatar'
import { Text } from '@/components/ui/Text'
import { Input } from '@/components/ui/Input'
import { Kbd } from '@/components/ui/Kbd'
import { Divider } from '@/components/ui/Divider'

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

export function Sidebar({
  current,
  onNavigate,
  onClose: _onClose,
  collapsed = false,
  onCollapsedChange,
}: SidebarProps) {
  const CollapseIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <div className={`flex h-full flex-col gap-4 ${collapsed ? 'p-2' : 'p-4'}`}>
      {/* Workspace header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          title={collapsed ? 'Crucible · Acme Production' : undefined}
          className={`flex items-center gap-2.5 rounded-(--radius-md) p-1.5 -m-1.5 text-left transition-colors hover:bg-(--color-surface-subtle) ${collapsed ? 'justify-center w-full' : 'flex-1'}`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-(--radius-md) bg-(--color-fg) text-(--color-warning)">
            <Flame className="h-4 w-4" strokeWidth={2.25} fill="currentColor" />
          </span>
          {!collapsed && (
            <>
              <div className="flex min-w-0 flex-1 flex-col">
                <Text size="sm" weight="semibold" truncate>
                  Crucible
                </Text>
                <Text size="xs" tone="subtle" truncate>
                  Acme · Production
                </Text>
              </div>
              <ChevronsUpDown className="h-3.5 w-3.5 text-(--color-fg-subtle)" />
            </>
          )}
        </button>

        {/* Collapse toggle — desktop only */}
        {!collapsed && (
          <button
            type="button"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="hidden lg:flex h-7 w-7 shrink-0 items-center justify-center rounded-(--radius-md) text-(--color-fg-subtle) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-fg)"
            onClick={() => onCollapsedChange?.(!collapsed)}
          >
            <CollapseIcon className="h-4 w-4" />
          </button>
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
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => (
          <SidebarNavItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            count={collapsed ? undefined : item.count}
            shortcut={collapsed ? undefined : item.shortcut}
            collapsed={collapsed}
            state={current === item.id ? 'active' : 'default'}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto flex flex-col gap-2">
        <Divider tone="subtle" />

        {/* Help / Docs */}
        <SidebarNavItem
          label="Help & docs"
          icon={<LifeBuoy className="h-4 w-4" />}
          collapsed={collapsed}
          state="default"
          onClick={() => window.open('https://docs.soffi.ai', '_blank', 'noopener,noreferrer')}
        />

        {/* Settings */}
        <SidebarNavItem
          label="Settings"
          icon={<Settings className="h-4 w-4" />}
          collapsed={collapsed}
          state="default"
        />

        {/* User row */}
        {collapsed ? (
          <div className="flex justify-center py-1">
            <Avatar variant="accent" shape="circle" size="sm" initials="BL" title="Brayden Love" />
          </div>
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

        {/* Expand toggle — desktop only, shown only when collapsed */}
        {collapsed && (
          <button
            type="button"
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="hidden lg:flex h-7 w-7 mx-auto shrink-0 items-center justify-center rounded-(--radius-md) text-(--color-fg-subtle) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-fg)"
            onClick={() => onCollapsedChange?.(!collapsed)}
          >
            <CollapseIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
