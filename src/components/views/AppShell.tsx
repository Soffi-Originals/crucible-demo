import * as React from 'react'
import { cn } from '@/lib/cn'

export interface AppShellProps {
  sidebar: React.ReactNode
  header: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function AppShell({ sidebar, header, children, className }: AppShellProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen w-full bg-(--color-canvas) text-(--color-fg)',
        className,
      )}
    >
      <aside className="flex w-64 shrink-0 flex-col border-r border-(--color-border-subtle) bg-(--color-surface)">
        {sidebar}
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-(--color-border-subtle) bg-(--color-surface) px-6">
          {header}
        </header>
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  )
}
