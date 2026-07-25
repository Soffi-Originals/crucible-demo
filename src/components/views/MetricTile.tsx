import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { Heading } from '@/components/ui/Heading'

export type TrendDirection = 'up' | 'down' | 'flat'
export type TrendSentiment = 'positive' | 'negative' | 'neutral'

// eslint-disable-next-line react-refresh/only-export-components
export const metricTileVariants = cva('flex flex-col gap-2 border-t-2', {
  variants: {
    emphasis: {
      default: '',
      raised: '',
    },
  },
  defaultVariants: { emphasis: 'default' },
})

const sentimentTopBorder: Record<TrendSentiment, string> = {
  positive: 'border-t-(--color-success)',
  negative: 'border-t-(--color-danger)',
  neutral: 'border-t-(--color-border-strong)',
}

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
  up: <ArrowUpRight className="h-3 w-3" />,
  down: <ArrowDownRight className="h-3 w-3" />,
  flat: <Minus className="h-3 w-3" />,
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
  positive: 'var(--color-success)',
  negative: 'var(--color-danger)',
  neutral: 'var(--color-fg-subtle)',
}

interface SparklineProps {
  data: number[]
  sentiment: TrendSentiment
  width?: number
  height?: number
}

function Sparkline({ data, sentiment, width = 120, height = 40 }: SparklineProps) {
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
  const gradientId = `spark-${sentiment}-${Math.random().toString(36).slice(2, 7)}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sentimentFill[sentiment]} stopOpacity="0.25" />
          <stop offset="100%" stopColor={sentimentFill[sentiment]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={sentimentStroke[sentiment]}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="2.5"
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
        variant={emphasis === 'raised' ? 'raised' : 'default'}
        padding="md"
        radius="lg"
        className={cn(
          metricTileVariants({ emphasis }),
          sentimentTopBorder[sentiment],
          className,
        )}
        {...props}
      >
        <Text size="xs" tone="muted" weight="medium" className="uppercase tracking-wide">
          {label}
        </Text>
        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-1">
              <Heading as="div" size="3xl" weight="semibold">
                {value}
              </Heading>
              {unit ? (
                <Text size="md" tone="muted">
                  {unit}
                </Text>
              ) : null}
            </div>
            {(delta || hint) && (
              <div className="flex items-center gap-2">
                {delta ? (
                  <div className={cn('flex items-center gap-1', sentimentColor[sentiment])}>
                    {trendIcon[trend]}
                    <Text size="xs" weight="medium" className="text-current">
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
            )}
          </div>
          {sparkline && sparkline.length >= 2 && (
            <div className="shrink-0 self-end pb-0.5">
              <Sparkline data={sparkline} sentiment={sentiment} width={88} height={40} />
            </div>
          )}
        </div>
      </Card>
    )
  },
)
