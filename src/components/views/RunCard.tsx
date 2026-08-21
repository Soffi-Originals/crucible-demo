import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'
import { StatusDot } from '@/components/ui/StatusDot'
import type { RunStatus } from './RunRow'

export const runCardVariants = cva('flex items-start gap-3', {
  variants: {},
  defaultVariants: {},
})

const statusMap: Record<
  RunStatus,
  {
    dot: 'idle' | 'running' | 'success' | 'warning' | 'error'
    label: string
    badge: 'neutral' | 'success' | 'warning' | 'danger' | 'accent'
  }
> = {
  queued: { dot: 'idle', label: 'Queued', badge: 'neutral' },
  running: { dot: 'running', label: 'Running', badge: 'accent' },
  passed: { dot: 'success', label: 'Passed', badge: 'success' },
  failed: { dot: 'error', label: 'Failed', badge: 'danger' },
  cancelled: { dot: 'warning', label: 'Cancelled', badge: 'warning' },
}

export interface RunCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'id'>,
    VariantProps<typeof runCardVariants> {
  runId: string
  agent: string
  scenario: string
  status: RunStatus
  duration: string
  startedAt: string
}

export const RunCard = React.forwardRef<HTMLDivElement, RunCardProps>(function RunCard(
  { className, runId, agent, scenario, status, duration, startedAt, ...props },
  ref,
) {
  const meta = statusMap[status]

  return (
    <Card
      ref={ref}
      variant="default"
      padding="sm"
      radius="lg"
      interactive
      className={cn('cursor-pointer', className)}
      {...props}
    >
      <div className={runCardVariants()}>
        {/* Status dot aligned to the first text line */}
        <div className="mt-0.5 shrink-0">
          <StatusDot status={meta.dot} size="md" />
        </div>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* Top line: scenario name + badge */}
          <div className="flex items-start justify-between gap-2">
            <Text size="sm" weight="semibold" truncate className="flex-1">
              {scenario}
            </Text>
            <Badge variant={meta.badge} size="sm" shape="pill" className="shrink-0">
              {meta.label}
            </Badge>
          </div>

          {/* Bottom line: agent · duration · started */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Text size="xs" tone="muted" truncate>
              {agent}
            </Text>
            <span className="text-(--color-border-strong) select-none text-xs">·</span>
            <Text size="xs" tone="subtle" family="mono">
              {duration}
            </Text>
            <span className="text-(--color-border-strong) select-none text-xs">·</span>
            <Text size="xs" tone="subtle">
              {startedAt}
            </Text>
          </div>
        </div>
      </div>
    </Card>
  )
})
