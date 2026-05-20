import { ChevronRight, Moon, Plus, Sun } from 'lucide-react'
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
}

export function Header({
  workspace,
  page,
  description,
  badge,
  theme,
  onToggleTheme,
  primaryAction,
}: HeaderProps) {
  return (
    <div className="flex w-full items-center gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Text size="sm" tone="subtle">
            {workspace}
          </Text>
          <ChevronRight className="h-3.5 w-3.5 text-(--color-fg-subtle)" />
          <Heading as="span" size="sm" weight="semibold">
            {page}
          </Heading>
        </div>
        {description ? (
          <Text size="sm" tone="muted" truncate>
            · {description}
          </Text>
        ) : null}
        {badge ? (
          <Badge variant="accent" size="sm" shape="pill">
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
          <Button
            variant="primary"
            size="sm"
            leadingIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
