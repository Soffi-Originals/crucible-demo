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

const sparklineStroke: Record<TrendSentiment, string> = {
  positive: 'var(--color-success)',
  negative: 'var(--color-danger)',
  neutral: 'var(--color-fg-muted)',
}

const sparklineFill: Record<TrendSentiment, string> = {
  positive: 'var(--color-success)',
  negative: 'var(--color-danger)',
  neutral: 'var(--color-fg-muted)',
}

function Sparkline({
  data,
  sentiment,
}: {
  data: number[]
  sentiment: TrendSentiment
}) {
  const width = 88
  const height = 32
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })

  const polyline = points.join(' ')
  const fillPath = `M${points[0]} L${points.join(' L')} L${width},${height} L0,${height} Z`

  const stroke = sparklineStroke[sentiment]
  const fill = sparklineFill[sentiment]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <path d={fillPath} fill={fill} fillOpacity={0.12} strokeWidth={0} />
      <polyline
        points={polyline}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {(() => {
        const last = points[points.length - 1].split(',')
        return (
          <circle
            cx={parseFloat(last[0])}
            cy={parseFloat(last[1])}
            r={2.5}
            fill={stroke}
          />
        )
      })()}
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
          <div className="flex flex-col gap-1">
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
              <div className="flex items-center justify-between gap-2">
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
