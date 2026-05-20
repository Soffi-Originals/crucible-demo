import * as React from 'react'
import { cn } from '@/lib/cn'

export interface AppShellProps {
  sidebar: React.ReactNode
  header: React.ReactNode
  children: React.ReactNode
  sidebarOpen?: boolean
  onSidebarOpenChange?: (open: boolean) => void
  className?: string
}

export function AppShell({
  sidebar,
  header,
  children,
  sidebarOpen = false,
  onSidebarOpenChange,
  className,
}: AppShellProps) {
  React.useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <div
      className={cn(
        'flex min-h-screen w-full bg-(--color-canvas) text-(--color-fg)',
        className,
      )}
    >
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => onSidebarOpenChange?.(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-(--color-border-subtle) bg-(--color-surface) shadow-(--shadow-lg) transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0 lg:shadow-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {sidebar}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-(--color-border-subtle) bg-(--color-surface) px-4 sm:px-6">
          {header}
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  )
}
