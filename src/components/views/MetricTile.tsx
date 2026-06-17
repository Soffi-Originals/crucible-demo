import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { Heading } from '@/components/ui/Heading'

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
  /** 7–14 data points rendered as a sparkline */
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
  neutral: 'var(--color-fg-muted)',
}

const sentimentFill: Record<TrendSentiment, string> = {
  positive: 'var(--color-success)',
  negative: 'var(--color-danger)',
  neutral: 'var(--color-fg-muted)',
}

interface SparklineProps {
  data: number[]
  sentiment: TrendSentiment
  width?: number
  height?: number
}

function Sparkline({ data, sentiment, width = 88, height = 32 }: SparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const pad = 2
  const innerW = width - pad * 2
  const innerH = height - pad * 2

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * innerW
    const y = pad + innerH - ((v - min) / range) * innerH
    return [x, y] as [number, number]
  })

  // Build a smooth polyline path
  const linePath = points
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(' ')

  // Close the area path below the line
  const areaPath =
    linePath +
    ` L${points[points.length - 1][0]},${height} L${points[0][0]},${height} Z`

  const stroke = sentimentStroke[sentiment]
  const fill = sentimentFill[sentiment]
  const gradId = `spark-${sentiment}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.18" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Terminal dot */}
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r="2.5"
        fill={stroke}
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
        className={cn(metricTileVariants({ emphasis }), className)}
        {...props}
      >
        <Text size="xs" tone="muted" weight="medium" className="uppercase tracking-wide">
          {label}
        </Text>

        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col gap-1.5">
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

          {sparkline && sparkline.length >= 2 && (
            <div className="shrink-0 pb-0.5">
              <Sparkline data={sparkline} sentiment={sentiment} />
            </div>
          )}
        </div>
      </Card>
    )
  },
)
