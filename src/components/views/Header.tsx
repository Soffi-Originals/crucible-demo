import { Bell, Mail, Menu, Moon, Search, Sun } from 'lucide-react'
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
  page,
  description,
  theme,
  onToggleTheme,
  onMenuClick,
}: HeaderProps) {
  return (
    <div className="flex w-full items-center gap-4">
      {/* Mobile hamburger */}
      {onMenuClick ? (
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenuClick}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-(--color-fg-muted) hover:bg-(--color-surface-subtle) lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
      ) : null}

      {/* Page title — left */}
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-bold text-(--color-fg) leading-tight">{page}</h1>
        {description && (
          <p className="hidden text-xs text-(--color-fg-subtle) sm:block">{description}</p>
        )}
      </div>

      {/* Search bar — center on desktop */}
      <div className="hidden flex-1 max-w-sm md:flex">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--color-fg-subtle)" />
          <input
            type="text"
            placeholder="Search tasks, agents, runs…"
            className="h-9 w-full rounded-xl border border-(--color-border) bg-(--color-surface-subtle) pl-9 pr-4 text-sm text-(--color-fg) placeholder:text-(--color-fg-subtle) outline-none transition-colors focus:border-(--color-border-focus) focus:bg-(--color-surface)"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        {/* Theme toggle */}
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={onToggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-(--color-fg-muted) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-fg)"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Mail */}
        <button
          type="button"
          aria-label="Messages"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-(--color-fg-muted) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-fg)"
        >
          <Mail className="h-4 w-4" />
        </button>

        {/* Bell with unread dot */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-(--color-fg-muted) transition-colors hover:bg-(--color-surface-subtle) hover:text-(--color-fg)"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-(--color-danger)" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-(--color-border)" />

        {/* User */}
        <button
          type="button"
          aria-label="User profile"
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-(--color-surface-subtle)"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
            BL
          </div>
          <div className="hidden flex-col text-left lg:flex">
            <span className="text-xs font-semibold text-(--color-fg) leading-tight">Brayden Love</span>
            <span className="text-xs text-(--color-fg-subtle) leading-tight">brayden@soffi.ai</span>
          </div>
        </button>
      </div>
    </div>
  )
}
