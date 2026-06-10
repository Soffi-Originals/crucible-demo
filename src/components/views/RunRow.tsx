import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'
import { StatusDot } from '@/components/ui/StatusDot'

export const runRowVariants = cva(
  'transition-colors',
  {
    variants: {
      density: {
        compact: '',
        comfortable: '',
        loose: '',
      },
      interactive: {
        true: 'hover:bg-(--color-surface-subtle) cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      density: 'comfortable',
      interactive: true,
    },
  },
)

export type RunStatus = 'queued' | 'running' | 'passed' | 'failed' | 'cancelled'

const statusMap: Record<
  RunStatus,
  { dot: 'idle' | 'running' | 'success' | 'warning' | 'error'; label: string; badge: 'neutral' | 'success' | 'warning' | 'danger' | 'accent' }
> = {
  queued: { dot: 'idle', label: 'Queued', badge: 'neutral' },
  running: { dot: 'running', label: 'Running', badge: 'accent' },
  passed: { dot: 'success', label: 'Passed', badge: 'success' },
  failed: { dot: 'error', label: 'Failed', badge: 'danger' },
  cancelled: { dot: 'warning', label: 'Cancelled', badge: 'warning' },
}

export interface RunRowProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'id'>,
    VariantProps<typeof runRowVariants> {
  runId: string
  agent: string
  scenario: string
  status: RunStatus
  duration: string
  startedAt: string
}

export const RunRow = React.forwardRef<HTMLDivElement, RunRowProps>(function RunRow(
  {
    className,
    density,
    interactive,
    runId,
    agent,
    scenario,
    status,
    duration,
    startedAt,
    ...props
  },
  ref,
) {
  const meta = statusMap[status]
  return (
    <div
      ref={ref}
      className={cn(runRowVariants({ density, interactive }), className)}
      {...props}
    >
      {/* Mobile layout (< sm) */}
      <div className="flex items-start gap-3 px-4 py-3 sm:hidden">
        <StatusDot status={meta.dot} size="md" className="mt-0.5 shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <Text size="sm" weight="medium" truncate className="flex-1">
              {scenario}
            </Text>
            <Badge variant={meta.badge} size="sm" shape="pill" className="shrink-0">
              {meta.label}
            </Badge>
          </div>
          <Text size="xs" tone="subtle" family="mono" truncate>
            {runId}
          </Text>
          <div className="flex items-center gap-2 flex-wrap">
            <Text size="xs" tone="muted">
              {agent}
            </Text>
            <span className="text-(--color-border-subtle) text-xs">·</span>
            <Text size="xs" tone="subtle" family="mono">
              {duration}
            </Text>
            <span className="text-(--color-border-subtle) text-xs">·</span>
            <Text size="xs" tone="subtle">
              {startedAt}
            </Text>
          </div>
        </div>
      </div>

      {/* Desktop layout (>= sm) — original 6-column grid */}
      <div className="hidden sm:grid sm:grid-cols-[16px_minmax(0,1fr)_160px_72px_88px_104px] sm:items-center sm:gap-4 sm:px-4 sm:py-3">
        <StatusDot status={meta.dot} size="md" className="justify-self-center" />
        <div className="flex min-w-0 flex-col">
          <Text size="sm" weight="medium" truncate>
            {scenario}
          </Text>
          <Text size="xs" tone="subtle" family="mono" truncate>
            {runId}
          </Text>
        </div>
        <Text size="sm" tone="muted" truncate>
          {agent}
        </Text>
        <Text size="sm" tone="muted" family="mono" className="justify-self-end tabular-nums">
          {duration}
        </Text>
        <Text size="xs" tone="subtle" className="justify-self-end">
          {startedAt}
        </Text>
        <div className="flex justify-self-end">
          <Badge variant={meta.badge} size="sm" shape="pill">
            {meta.label}
          </Badge>
        </div>
      </div>
    </div>
  )
})
