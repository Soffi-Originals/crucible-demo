import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowDown, ArrowUp, Minus, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { Heading } from '@/components/ui/Heading'

export const metricTileVariants = cva('flex flex-col gap-3', {
  variants: {
    emphasis: {
      default: '',
      raised: '',
    },
  },
  defaultVariants: { emphasis: 'default' },
})

export type TrendDirection = 'up' | 'down' | 'flat'
export type TrendSentiment = 'positive' | 'negative' | 'neutral'

export interface MetricTileProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof metricTileVariants> {
  label: string
  value: string
  unit?: string
  hint?: string
  delta?: string
  trend?: TrendDirection
  sentiment?: TrendSentiment
}

const trendIcon: Record<TrendDirection, React.ReactNode> = {
  up: <ArrowUp className="h-3.5 w-3.5 shrink-0" />,
  down: <ArrowDown className="h-3.5 w-3.5 shrink-0" />,
  flat: <Minus className="h-3.5 w-3.5 shrink-0" />,
}

const sentimentColor: Record<TrendSentiment, string> = {
  positive: 'text-(--color-success-fg)',
  negative: 'text-(--color-danger-fg)',
  neutral: 'text-(--color-fg-muted)',
}

export const MetricTile = React.forwardRef<HTMLDivElement, MetricTileProps>(
  function MetricTile(
    {
      className,
      emphasis,
      label,
      value,
      unit,
      hint,
      delta,
      trend = 'flat',
      sentiment = 'neutral',
      ...props
    },
    ref,
  ) {
    return (
      <Card
        ref={ref}
        variant="default"
        padding="md"
        radius="lg"
        className={cn(metricTileVariants({ emphasis }), className)}
        {...props}
      >
        {/* Header row: label + menu */}
        <div className="flex items-start justify-between gap-2">
          <Text size="sm" weight="semibold" tone="default">
            {label}
          </Text>
          <button
            type="button"
            aria-label="More options"
            className="shrink-0 text-(--color-fg-muted) hover:text-(--color-fg) transition-colors -mr-1 -mt-0.5 p-0.5"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1">
          <Heading as="div" size="2xl" weight="semibold">
            {value}
          </Heading>
          {unit ? (
            <Text size="sm" tone="muted">
              {unit}
            </Text>
          ) : null}
        </div>

        {/* Delta + hint inline */}
        {(delta || hint) && (
          <div className="flex items-center gap-1.5">
            {delta ? (
              <span className={cn('flex items-center gap-0.5', sentimentColor[sentiment])}>
                {trendIcon[trend]}
                <Text size="sm" weight="semibold" className="text-current">
                  {delta}
                </Text>
              </span>
            ) : null}
            {hint ? (
              <Text size="sm" tone="muted">
                {hint}
              </Text>
            ) : null}
          </div>
        )}
      </Card>
    )
  },
)
