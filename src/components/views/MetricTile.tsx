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

const sparklineFill: Record<TrendSentiment, string> = {
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

  // Smooth polyline using cubic bezier control points
  const d = coords.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.sx} ${pt.sy}`
    const prev = coords[i - 1]
    const cpx = (prev.sx + pt.sx) / 2
    return `${acc} C ${cpx} ${prev.sy}, ${cpx} ${pt.sy}, ${pt.sx} ${pt.sy}`
  }, '')

  // Area fill path (close down to bottom)
  const last = coords[coords.length - 1]
  const first = coords[0]
  const fillD = `${d} L ${last.sx} ${H} L ${first.sx} ${H} Z`

  const stroke = sparklineStroke[sentiment]
  const fill = sparklineFill[sentiment]
  const gradId = `spark-grad-${sentiment}`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: H }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.18" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={fillD} fill={`url(#${gradId})`} stroke="none" />
      {/* Line */}
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Terminal dot */}
      <circle cx={last.sx} cy={last.sy} r="2.5" fill={stroke} />
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
        radius="lg"
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
