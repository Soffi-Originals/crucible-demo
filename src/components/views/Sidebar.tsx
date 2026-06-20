import * as React from 'react'
import {
  Activity,
  Bot,
  Box,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Gauge,
  HelpCircle,
  LogOut,
  Plug,
  Settings,
  Smartphone,
  X,
} from 'lucide-react'
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

const menuItems: {
  id: PageId
  label: string
  icon: React.ReactNode
  count?: number
}[] = [
  { id: 'overview',    label: 'Dashboard',   icon: <Gauge     className="h-4 w-4" /> },
  { id: 'agents',      label: 'Agents',       icon: <Bot       className="h-4 w-4" />, count: 4 },
  { id: 'simulations', label: 'Simulations',  icon: <Activity  className="h-4 w-4" />, count: 12 },
  { id: 'evals',       label: 'Eval packs',   icon: <Box       className="h-4 w-4" /> },
  { id: 'connectors',  label: 'Connectors',   icon: <Plug      className="h-4 w-4" /> },
  { id: 'plans',       label: 'Plans',        icon: <CreditCard className="h-4 w-4" /> },
]

const generalItems = [
  { id: 'settings', label: 'Settings', icon: <Settings  className="h-4 w-4" /> },
  { id: 'help',     label: 'Help',     icon: <HelpCircle className="h-4 w-4" /> },
  { id: 'logout',   label: 'Logout',   icon: <LogOut    className="h-4 w-4" /> },
]

/** Crucible "C" logomark */
function CrucibleMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#10B981" opacity="0.15" />
      <path
        d="M22 9.5A9 9 0 1 0 22 22.5"
        stroke="#10B981"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M19.5 12.5A5 5 0 1 0 19.5 19.5"
        stroke="#10B981"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity="0.5"
        fill="none"
      />
      <circle cx="16" cy="16" r="2" fill="#10B981" />
    </svg>
  )
}

/** Right-side tooltip for collapsed mode */
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative flex items-center">
      {children}
      <div className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 border border-slate-700">
        {label}
      </div>
    </div>
  )
}

interface NavButtonProps {
  icon: React.ReactNode
  label: string
  count?: number
  active?: boolean
  collapsed?: boolean
  onClick?: () => void
}

function NavButton({ icon, label, count, active, collapsed, onClick }: NavButtonProps) {
  const content = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl transition-all duration-150 text-sm font-medium w-full',
        collapsed
          ? 'h-10 w-10 justify-center'
          : 'px-3 py-2.5',
        active
          ? 'bg-emerald-500 text-white shadow-sm'
          : 'text-slate-400 hover:bg-slate-700/60 hover:text-slate-200',
      )}
    >
      <span className={cn('shrink-0', active ? 'text-white' : 'text-slate-400')}>
        {icon}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {typeof count === 'number' && (
            <span className={cn(
              'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
              active
                ? 'bg-white/20 text-white'
                : 'bg-slate-700 text-slate-300',
            )}>
              {count}
            </span>
          )}
        </>
      )}
    </button>
  )

  if (collapsed) {
    return <Tooltip label={label}>{content}</Tooltip>
  }
  return content
}

export function Sidebar({
  current,
  onNavigate,
  onClose,
  collapsed = false,
  onCollapsedChange,
}: SidebarProps) {
  return (
    <div
      className={cn(
        'flex h-full flex-col',
        collapsed ? 'px-3 py-4' : 'px-4 py-5',
      )}
      style={{ color: 'var(--color-sidebar-fg)' }}
    >
      {/* Logo */}
      <div className={cn('flex items-center mb-8', collapsed ? 'justify-center' : 'gap-3 px-1')}>
        {collapsed ? (
          <Tooltip label="Crucible">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl">
              <CrucibleMark size={28} />
            </div>
          </Tooltip>
        ) : (
          <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <CrucibleMark size={28} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-tight">Crucible</span>
              <span className="text-xs text-slate-500 leading-tight">Acme · Production</span>
            </div>
            {onClose && (
              <button
                type="button"
                aria-label="Close menu"
                onClick={onClose}
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-700 hover:text-slate-300 lg:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Menu section */}
      {!collapsed && (
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-slate-600">
          Menu
        </p>
      )}
      <nav className={cn('flex flex-col gap-1', collapsed && 'items-center')}>
        {menuItems.map((item) => (
          <NavButton
            key={item.id}
            icon={item.icon}
            label={item.label}
            count={item.count}
            active={current === item.id}
            collapsed={collapsed}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      {/* General section */}
      <div className={cn('mt-6', !collapsed && '')}>
        {!collapsed && (
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-slate-600">
            General
          </p>
        )}
        <div className={cn('flex flex-col gap-1', collapsed && 'items-center')}>
          {generalItems.map((item) => (
            <NavButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Mobile app download card — hidden when collapsed */}
      {!collapsed && (
        <div
          className="mx-1 mb-4 rounded-2xl p-4"
          style={{ backgroundColor: '#252D3D', border: '1px solid #2D3748' }}
        >
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
            <Smartphone className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mb-0.5 text-sm font-semibold text-white">Download our</p>
          <p className="mb-3 text-sm font-semibold text-white">Mobile App</p>
          <p className="mb-4 text-xs text-slate-500 leading-relaxed">
            Monitor agents and review runs from anywhere.
          </p>
          <button
            type="button"
            className="w-full rounded-xl bg-emerald-500 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Download Now
          </button>
        </div>
      )}

      {/* User row */}
      {!collapsed ? (
        <div className="flex items-center gap-3 px-1 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
            BL
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-semibold text-slate-300">Brayden Love</span>
            <span className="truncate text-xs text-slate-600">brayden@soffi.ai</span>
          </div>
        </div>
      ) : (
        <Tooltip label="Brayden Love">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
            BL
          </div>
        </Tooltip>
      )}

      {/* Collapse toggle */}
      {onCollapsedChange && (
        <button
          type="button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            'mt-3 hidden lg:flex items-center justify-center rounded-xl h-8 text-slate-600 transition-colors hover:bg-slate-700 hover:text-slate-300',
            collapsed ? 'w-10' : 'w-full gap-1.5',
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <>
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
