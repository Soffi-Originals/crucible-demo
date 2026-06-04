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

function Sparkline({ data, sentiment, width = 80, height = 28 }: SparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const pad = 2
  const innerW = width - pad * 2
  const innerH = height - pad * 2

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * innerW
    const y = pad + (1 - (v - min) / range) * innerH
    return [x, y] as [number, number]
  })

  // Smooth polyline via cubic bezier
  const d = points.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x},${y}`
    const [px, py] = points[i - 1]
    const cpx = (px + x) / 2
    return `${acc} C ${cpx},${py} ${cpx},${y} ${x},${y}`
  }, '')

  // Area fill path (close down to baseline)
  const lastX = points[points.length - 1][0]
  const firstX = points[0][0]
  const baseline = pad + innerH
  const areaD = `${d} L ${lastX},${baseline} L ${firstX},${baseline} Z`

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
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Terminal dot */}
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r="2"
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
          {sparkline && sparkline.length >= 2 && (
            <Sparkline data={sparkline} sentiment={sentiment} />
          )}
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
      </Card>
    )
  },
)
