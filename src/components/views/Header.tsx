import { Bell, ChevronRight, Menu, Moon, Plus, Search, Sun } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Avatar } from '@/components/ui/Avatar'
import type { Theme } from '@/lib/theme'

export interface HeaderProps {
  workspace: string
  page: string
  description?: string
  badge?: string
  theme: Theme
  onToggleTheme: () => void
  primaryAction?: { label: string; onClick?: () => void }
  onMenuClick?: () => void
}

export function Header({
  workspace,
  page,
  description,
  badge,
  theme,
  onToggleTheme,
  primaryAction,
  onMenuClick,
}: HeaderProps) {
  return (
    <div className="flex w-full items-center gap-2 sm:gap-4">
      {/* Mobile menu button */}
      {onMenuClick ? (
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Open menu"
          onClick={onMenuClick}
          className="-ml-1 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </IconButton>
      ) : null}

      {/* Breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <Text size="sm" tone="subtle" className="hidden truncate sm:inline">
            {workspace}
          </Text>
          <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-(--color-fg-subtle) sm:inline" />
          <Heading as="span" size="sm" weight="semibold" className="truncate">
            {page}
          </Heading>
        </div>
        {description ? (
          <Text size="sm" tone="muted" truncate className="hidden md:inline">
            · {description}
          </Text>
        ) : null}
        {badge ? (
          <Badge
            variant="accent"
            size="sm"
            shape="pill"
            className="hidden sm:inline-flex"
          >
            {badge}
          </Badge>
        ) : null}
      </div>

      {/* Right side actions */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

        {/* Search — icon-only on mobile */}
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Search"
          className="hidden sm:inline-flex"
        >
          <Search className="h-4 w-4" />
        </IconButton>

        {/* Bell notification */}
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {/* Unread dot */}
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-(--color-danger)" />
        </IconButton>

        {/* Theme toggle */}
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Toggle theme"
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </IconButton>

        {/* Primary action */}
        {primaryAction ? (
          <>
            <IconButton
              variant="solid"
              size="sm"
              aria-label={primaryAction.label}
              onClick={primaryAction.onClick}
              className="sm:hidden"
            >
              <Plus className="h-3.5 w-3.5" />
            </IconButton>
            <Button
              variant="primary"
              size="sm"
              leadingIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={primaryAction.onClick}
              className="hidden sm:inline-flex"
            >
              {primaryAction.label}
            </Button>
          </>
        ) : null}

        {/* Divider + user avatar — like the reference */}
        <div className="ml-1 hidden h-5 w-px bg-(--color-border) sm:block" />
        <button
          type="button"
          className="hidden sm:flex items-center gap-2 rounded-(--radius-md) px-1.5 py-1 transition-colors hover:bg-(--color-surface-subtle)"
          aria-label="User profile"
        >
          <Avatar variant="accent" shape="circle" size="sm" initials="BL" />
          <div className="hidden flex-col text-left lg:flex">
            <Text size="xs" weight="medium">Brayden Love</Text>
            <Text size="xs" tone="subtle">brayden@soffi.ai</Text>
          </div>
        </button>
      </div>
    </div>
  )
}
