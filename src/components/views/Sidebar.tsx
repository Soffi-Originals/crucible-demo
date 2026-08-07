import * as React from 'react'
import {
  Activity,
  Bot,
  Box,
  CreditCard,
  Flame,
  Gauge,
  Plug,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Avatar } from '@/components/ui/Avatar'

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
}

const navItems: {
  id: PageId
  label: string
  icon: React.ReactNode
}[] = [
  { id: 'overview', label: 'Overview', icon: <Gauge className="h-5 w-5" /> },
  { id: 'agents', label: 'Agents', icon: <Bot className="h-5 w-5" /> },
  { id: 'simulations', label: 'Simulations', icon: <Activity className="h-5 w-5" /> },
  { id: 'evals', label: 'Eval packs', icon: <Box className="h-5 w-5" /> },
  { id: 'connectors', label: 'Connectors', icon: <Plug className="h-5 w-5" /> },
  { id: 'plans', label: 'Plans & billing', icon: <CreditCard className="h-5 w-5" /> },
]

export function Sidebar({ current, onNavigate, onClose }: SidebarProps) {
  return (
    <div
      className="flex h-full flex-col items-center py-4 gap-2 bg-canvas"
    >
      {/* Logo */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-(--radius-md) mb-2 bg-surface">
        <Flame className="h-5 w-5 text-white" strokeWidth={2.25} fill="currentColor" />
      </div>

      {/* Close button — mobile only */}
      {onClose ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-(--radius-md) text-white/60 hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-1 flex-1 w-full px-2 mt-2">
        {navItems.map((item) => {
          const isActive = current === item.id
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              title={item.label}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-(--radius-md) transition-colors',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:bg-white/10 hover:text-white',
              )}
            >
              {item.icon}
            </button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="flex flex-col items-center gap-2 w-full px-2">
        <button
          type="button"
          aria-label="Settings"
          title="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-(--radius-md) text-white/50 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Settings className="h-5 w-5" />
        </button>
        <Avatar variant="accent" shape="circle" size="sm" initials="BL" />
      </div>
    </div>
  )
}
