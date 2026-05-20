import { ChevronRight, Menu, Moon, Plus, Sun } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
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

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <Text
            size="sm"
            tone="subtle"
            className="hidden truncate sm:inline"
          >
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

      <div className="flex shrink-0 items-center gap-2">
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
      </div>
    </div>
  )
}
