import * as React from 'react'
import { cn } from '@/lib/cn'

export interface AppShellProps {
  sidebar: React.ReactNode
  header: React.ReactNode
  children: React.ReactNode
  sidebarOpen?: boolean
  onSidebarOpenChange?: (open: boolean) => void
  sidebarCollapsed?: boolean
  className?: string
}

export function AppShell({
  sidebar,
  header,
  children,
  sidebarOpen = false,
  onSidebarOpenChange,
  sidebarCollapsed = false,
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
      {/* Mobile overlay */}
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => onSidebarOpenChange?.(false)}
        />
      ) : null}

      {/* Sidebar — always dark slate */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col transition-[width,transform] duration-200 ease-out lg:static lg:z-auto lg:shrink-0',
          // Mobile: slide in/out
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // Desktop width
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64',
          // Mobile always full-width overlay
          'w-72',
        )}
        style={{ backgroundColor: 'var(--color-sidebar-bg)' }}
      >
        {sidebar}
      </aside>

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col bg-(--color-canvas)">
        <header
          className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-(--color-border) bg-(--color-surface) px-4 sm:px-6"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
          {header}
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  )
}
