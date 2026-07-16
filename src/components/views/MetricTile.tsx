import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { Heading } from '@/components/ui/Heading'
import type { SparkPoint } from '@/data/demo'

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
  sparkline?: SparkPoint[]
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

// Stroke colors per sentiment, using CSS vars directly so dark mode works
const sparklineStroke: Record<TrendSentiment, string> = {
  positive: 'var(--color-success)',
  negative: 'var(--color-danger)',
  neutral: 'var(--color-fg-subtle)',
}


function Sparkline({
  points,
  sentiment,
}: {
  points: SparkPoint[]
  sentiment: TrendSentiment
}) {
  const W = 100
  const H = 36
  const PAD = 2

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1

  const toSvg = (p: SparkPoint) => ({
    sx: PAD + ((p.x - minX) / rangeX) * (W - PAD * 2),
    sy: H - PAD - ((p.y - minY) / rangeY) * (H - PAD * 2),
  })

  const coords = points.map(toSvg)

  // Straight-line polyline — sharp corners, no bezier smoothing
  const d = coords
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.sx.toFixed(2)} ${pt.sy.toFixed(2)}`)
    .join(' ')

  const last = coords[coords.length - 1]
  const stroke = sparklineStroke[sentiment]
  const TICK = 3

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: H }}
      aria-hidden="true"
    >
      {/* Polyline */}
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="1.25"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {/* Terminal crosshair tick */}
      <line
        x1={last.sx}
        y1={last.sy - TICK}
        x2={last.sx}
        y2={last.sy + TICK}
        stroke={stroke}
        strokeWidth="1.25"
        strokeLinecap="square"
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
        variant="raised"
        padding="md"
        radius="sm"
        className={cn(metricTileVariants({ emphasis }), className)}
        {...props}
      >
        <Text size="xs" tone="muted" weight="medium" className="uppercase tracking-wide">
          {label}
        </Text>
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

        {sparkline && sparkline.length > 1 && (
          <div className="-mx-1 mt-1">
            <Sparkline points={sparkline} sentiment={sentiment} />
          </div>
        )}

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
