import * as React from 'react'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { cn } from '@/lib/cn'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

export type BarMetric = {
  label: string
  value: string
  unit?: string
  displayValue: number   // 0–100, used to size the bar
  delta?: string
  trend?: 'up' | 'down' | 'flat'
  sentiment?: 'positive' | 'negative' | 'neutral'
  barColor: string       // CSS var string, e.g. 'var(--color-accent)'
  barColorDark: string   // darker face
  barColorTop: string    // top face
}

const DEPTH = 12    // isometric depth in px
const BAR_W = 56    // bar footprint width
const MAX_H = 140   // max bar height in px
const GAP = 36      // gap between bars

// Isometric 3-face bar drawn with polygon
function IsoBar({
  x,
  baseY,
  height,
  width,
  depth,
  fill,
  fillDark,
  fillTop,
}: {
  x: number
  baseY: number
  height: number
  width: number
  depth: number
  fill: string
  fillDark: string
  fillTop: string
}) {
  if (height < 2) height = 2

  // Front face corners (bottom-left, bottom-right, top-right, top-left)
  const frontFace = [
    [x, baseY],
    [x + width, baseY],
    [x + width, baseY - height],
    [x, baseY - height],
  ]

  // Right face (depth going up-right)
  const rightFace = [
    [x + width, baseY],
    [x + width + depth, baseY - depth / 2],
    [x + width + depth, baseY - height - depth / 2],
    [x + width, baseY - height],
  ]

  // Top face
  const topFace = [
    [x, baseY - height],
    [x + width, baseY - height],
    [x + width + depth, baseY - height - depth / 2],
    [x + depth, baseY - height - depth / 2],
  ]

  const pts = (coords: number[][]) => coords.map((p) => p.join(',')).join(' ')

  return (
    <g>
      <polygon points={pts(frontFace)} fill={fill} />
      <polygon points={pts(rightFace)} fill={fillDark} />
      <polygon points={pts(topFace)} fill={fillTop} />
    </g>
  )
}

const sentimentClass: Record<string, string> = {
  positive: 'text-(--color-success-fg)',
  negative: 'text-(--color-danger-fg)',
  neutral: 'text-(--color-fg-muted)',
}

const trendIcon = {
  up: <ArrowUpRight className="h-3 w-3 shrink-0" />,
  down: <ArrowDownRight className="h-3 w-3 shrink-0" />,
  flat: <Minus className="h-3 w-3 shrink-0" />,
}

interface MetricsBarChartProps {
  metrics: BarMetric[]
  className?: string
}

export function MetricsBarChart({ metrics, className }: MetricsBarChartProps) {
  const count = metrics.length
  const svgWidth = count * (BAR_W + GAP) + DEPTH + 16
  const svgHeight = MAX_H + DEPTH + 24  // extra room for depth on top face

  const baseY = MAX_H + 16  // y-coordinate of the ground line

  return (
    <Card
      variant="elevated"
      padding="lg"
      radius="sm"
      className={cn('flex flex-col gap-4', className)}
    >
      {/* Chart */}
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width="100%"
        height={svgHeight}
        style={{ overflow: 'visible' }}
        aria-hidden
      >
        {/* Baseline */}
        <line
          x1={0}
          y1={baseY}
          x2={svgWidth}
          y2={baseY}
          stroke="var(--color-border)"
          strokeWidth={1}
        />

        {metrics.map((m, i) => {
          const barH = Math.round((m.displayValue / 100) * MAX_H)
          const x = i * (BAR_W + GAP) + 8
          return (
            <IsoBar
              key={m.label}
              x={x}
              baseY={baseY}
              height={barH}
              width={BAR_W}
              depth={DEPTH}
              fill={m.barColor}
              fillDark={m.barColorDark}
              fillTop={m.barColorTop}
            />
          )
        })}
      </svg>

      {/* Labels row */}
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}
      >
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-0.5 px-1">
            <Text size="xs" tone="muted" weight="medium" className="uppercase tracking-wide truncate">
              {m.label}
            </Text>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-semibold text-(--color-text-base) tabular-nums">
                {m.value}
              </span>
              {m.unit && (
                <Text size="xs" tone="muted">
                  {m.unit}
                </Text>
              )}
            </div>
            {m.delta && (
              <div
                className={cn(
                  'flex items-center gap-0.5',
                  sentimentClass[m.sentiment ?? 'neutral'],
                )}
              >
                {trendIcon[m.trend ?? 'flat']}
                <Text size="xs" weight="medium" className="text-current truncate">
                  {m.delta}
                </Text>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
