import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowDownRight, ArrowUpRight, Minus, MoreVertical } from 'lucide-react'
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
  /** Optional sparkline data points (normalised 0–100) */
  sparkline?: number[]
}

const trendIcon: Record<TrendDirection, React.ReactNode> = {
  up: <ArrowUpRight className="h-4 w-4" />,
  down: <ArrowDownRight className="h-4 w-4" />,
  flat: <Minus className="h-4 w-4" />,
}

const sentimentColor: Record<TrendSentiment, string> = {
  positive: 'text-(--color-success-fg)',
  negative: 'text-(--color-danger-fg)',
  neutral: 'text-(--color-fg-muted)',
}

const sentimentStroke: Record<TrendSentiment, string> = {
  positive: 'var(--color-success)',
  negative: 'var(--color-danger)',
  neutral: 'var(--color-fg-muted)',
}

const sentimentFill: Record<TrendSentiment, string> = {
  positive: 'var(--color-success-soft)',
  negative: 'var(--color-danger-soft)',
  neutral: 'transparent',
}

function Sparkline({
  points,
  sentiment,
}: {
  points: number[]
  sentiment: TrendSentiment
}) {
  const w = 80
  const h = 36
  const pad = 2

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1

  const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (w - pad * 2))
  const ys = points.map((v) => h - pad - ((v - min) / range) * (h - pad * 2))

  const linePath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ')
  const areaPath = `${linePath} L${xs[xs.length - 1]},${h} L${xs[0]},${h} Z`

  const stroke = sentimentStroke[sentiment]
  const fill = sentimentFill[sentiment]

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden>
      <path d={areaPath} fill={fill} />
      <path d={linePath} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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
      sparkline,
      ...props
    },
    ref,
  ) {
    return (
      <Card
        ref={ref}
        variant="elevated"
        padding="md"
        radius="lg"
        className={cn(metricTileVariants({ emphasis }), className)}
        {...props}
      >
        {/* Header row: label + menu icon */}
        <div className="flex items-start justify-between gap-2">
          <Text size="sm" tone="muted" weight="medium">
            {label}
          </Text>
          <button
            type="button"
            className="flex-shrink-0 text-(--color-fg-subtle) hover:text-(--color-fg-muted) transition-colors"
            aria-label="More options"
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

        {/* Bottom row: trend delta + sparkline */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            {delta ? (
              <div className={cn('flex items-center gap-1', sentimentColor[sentiment])}>
                {trendIcon[trend]}
                <Text size="sm" weight="semibold" className="text-current">
                  {delta}
                </Text>
              </div>
            ) : (
              <span />
            )}
            {hint ? (
              <Text size="xs" tone="subtle">
                {hint}
              </Text>
            ) : null}
          </div>

          {sparkline && sparkline.length > 1 ? (
            <Sparkline points={sparkline} sentiment={sentiment} />
          ) : null}
        </div>
      </Card>
    )
  },
)
