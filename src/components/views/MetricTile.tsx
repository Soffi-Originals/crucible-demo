import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowDown, ArrowUp, Minus, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { Heading } from '@/components/ui/Heading'

export type TrendDirection = 'up' | 'down' | 'flat'
export type TrendSentiment = 'positive' | 'negative' | 'neutral'

// eslint-disable-next-line react-refresh/only-export-components
export const metricTileVariants = cva('flex flex-col gap-3', {
  variants: {
    emphasis: {
      default: '',
      raised: '',
    },
  },
  defaultVariants: { emphasis: 'default' },
})

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
  sparkline?: number[]
}

const trendIcon: Record<TrendDirection, React.ReactNode> = {
  up: <ArrowUp className="h-3.5 w-3.5" />,
  down: <ArrowDown className="h-3.5 w-3.5" />,
  flat: <Minus className="h-3.5 w-3.5" />,
}

const sentimentColor: Record<TrendSentiment, string> = {
  positive: 'text-(--color-success-fg)',
  negative: 'text-(--color-danger-fg)',
  neutral: 'text-(--color-fg-muted)',
}

const sentimentStroke: Record<TrendSentiment, string> = {
  positive: 'var(--color-success)',
  negative: 'var(--color-danger)',
  neutral: 'var(--color-fg-subtle)',
}

const sentimentFill: Record<TrendSentiment, string> = {
  positive: 'var(--color-success-soft)',
  negative: 'var(--color-danger-soft)',
  neutral: 'var(--color-fg-subtle)',
}

interface SparklineProps {
  data: number[]
  sentiment: TrendSentiment
  width?: number
  height?: number
}

function Sparkline({ data, sentiment, width = 120, height = 56 }: SparklineProps) {
  const uid = React.useId()
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const pad = 2
  const innerW = width - pad * 2
  const innerH = height - pad * 2

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * innerW,
    y: pad + (1 - (v - min) / range) * innerH,
  }))

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ')

  const areaPath =
    linePath +
    ` L${points[points.length - 1].x.toFixed(2)},${(pad + innerH).toFixed(2)}` +
    ` L${points[0].x.toFixed(2)},${(pad + innerH).toFixed(2)} Z`

  const lastPoint = points[points.length - 1]
  const gradientId = `spark-${sentiment}-${uid.replace(/:/g, '')}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sentimentFill[sentiment]} stopOpacity="1" />
          <stop offset="100%" stopColor={sentimentFill[sentiment]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={sentimentStroke[sentiment]}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="3"
        fill={sentimentStroke[sentiment]}
      />
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
        variant="default"
        padding="md"
        radius="lg"
        className={cn(
          'overflow-hidden shadow-(--shadow-xs)',
          metricTileVariants({ emphasis }),
          className,
        )}
        {...props}
      >
        {/* Header row: label + overflow icon */}
        <div className="flex items-center justify-between gap-2">
          <Text size="sm" weight="medium" tone="default">
            {label}
          </Text>
          <button
            className="flex h-6 w-6 items-center justify-center rounded-(--radius-sm) text-(--color-fg-subtle) hover:text-(--color-fg) hover:bg-(--color-surface-muted) transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>

        {/* Value + sparkline */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-1">
              <Heading as="div" size="3xl" weight="semibold">
                {value}
              </Heading>
              {unit ? (
                <Text size="lg" tone="muted">
                  {unit}
                </Text>
              ) : null}
            </div>

            {(delta || hint) && (
              <div className="flex items-center gap-1.5">
                {delta ? (
                  <div className={cn('flex items-center gap-0.5 font-semibold text-sm', sentimentColor[sentiment])}>
                    {trendIcon[trend]}
                    <span>{delta}</span>
                  </div>
                ) : (
                  <span />
                )}
                {hint ? (
                  <Text size="sm" tone="muted">
                    {hint}
                  </Text>
                ) : null}
              </div>
            )}
          </div>

          {sparkline && sparkline.length >= 2 && (
            <div className="shrink-0 self-end pb-1">
              <Sparkline data={sparkline} sentiment={sentiment} width={100} height={56} />
            </div>
          )}
        </div>
      </Card>
    )
  },
)
