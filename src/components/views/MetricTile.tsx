import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { Heading } from '@/components/ui/Heading'

interface SparklineProps {
  data: number[]
  sentiment?: TrendSentiment
  width?: number
  height?: number
}

function Sparkline({ data, sentiment = 'neutral', width = 80, height = 32 }: SparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height * 0.8) - height * 0.1
    return `${x},${y}`
  })

  const strokeColor =
    sentiment === 'positive'
      ? 'var(--color-success-fg)'
      : sentiment === 'negative'
        ? 'var(--color-danger-fg)'
        : 'var(--color-fg-muted)'

  // Build a closed fill path: line points + bottom-right + bottom-left
  const fillPath =
    `M ${points.join(' L ')} L ${width},${height} L 0,${height} Z`

  const fillColor =
    sentiment === 'positive'
      ? 'var(--color-success)'
      : sentiment === 'negative'
        ? 'var(--color-danger)'
        : 'var(--color-fg-subtle)'

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      className="shrink-0 opacity-70"
    >
      <path d={fillPath} fill={fillColor} fillOpacity={0.15} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const metricTileVariants = cva('flex flex-col gap-2', {
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
        className={cn(metricTileVariants({ emphasis }), className)}
        {...props}
      >
        <Text size="xs" tone="muted" weight="medium" className="uppercase tracking-wide">
          {label}
        </Text>
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-2 min-w-0">
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
            {(delta || hint) && (
              <div className="flex items-center justify-between">
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
          {sparkline && sparkline.length >= 2 ? (
            <Sparkline data={sparkline} sentiment={sentiment} />
          ) : null}
        </div>
      </Card>
    )
  },
)
