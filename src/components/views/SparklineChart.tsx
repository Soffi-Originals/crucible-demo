import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Text } from '@/components/ui/Text'

// eslint-disable-next-line react-refresh/only-export-components
export const sparklineChartVariants = cva(
  'rounded-(--radius-xl) border border-(--color-border)',
  {
    variants: {
      size: {
        sm: 'p-4',
        md: 'p-5',
        lg: 'p-6',
      },
      variant: {
        default: 'bg-(--color-surface) shadow-(--shadow-xs)',
        outlined: 'bg-transparent',
        ghost: 'border-transparent bg-transparent',
      },
    },
    defaultVariants: { size: 'md', variant: 'default' },
  },
)

export interface SparklineSeries {
  /** Display label for the legend */
  label: string
  /** CSS color string */
  color: string
  /** Data values (must all have the same length) */
  values: number[]
  /** Stroke width override (default 2 for first series, 1.5 for rest) */
  strokeWidth?: number
}

export interface SparklineChartProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sparklineChartVariants> {
  /** Panel heading */
  title?: string
  /** All series to render */
  series: SparklineSeries[]
  /** X-axis tick labels (one per data point) */
  xLabels?: string[]
  /** Show the ⋮ menu button */
  showMenu?: boolean
  onMenuClick?: () => void
  /** Internal SVG viewport width (default 520) */
  viewWidth?: number
  /** Internal SVG viewport height including x-axis (default 120) */
  viewHeight?: number
}

export const SparklineChart = React.forwardRef<HTMLDivElement, SparklineChartProps>(
  function SparklineChart(
    {
      className,
      size,
      variant,
      title,
      series,
      xLabels,
      showMenu = false,
      onMenuClick,
      viewWidth = 520,
      viewHeight = 120,
      ...props
    },
    ref,
  ) {
    const W = viewWidth
    const H = viewHeight
    const padL = 0
    const padR = 0
    const padT = 8
    const padB = xLabels && xLabels.length ? 24 : 0

    const allVals = series.flatMap((s) => s.values)
    const minV = Math.min(...allVals)
    const maxV = Math.max(...allVals)
    const range = maxV - minV || 1

    const pts = (values: number[]): [number, number][] =>
      values.map((v, i) => {
        const x = padL + (i / Math.max(values.length - 1, 1)) * (W - padL - padR)
        const y = padT + (1 - (v - minV) / range) * (H - padT - padB)
        return [x, y]
      })

    const toPath = (points: [number, number][]) =>
      points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')

    const toArea = (points: [number, number][]) => {
      const line = toPath(points)
      const last = points[points.length - 1]
      const first = points[0]
      return `${line} L${last[0]},${H - padB} L${first[0]},${H - padB} Z`
    }

    return (
      <div
        ref={ref}
        className={cn(sparklineChartVariants({ size }), className)}
        {...props}
      >
        {/* Header */}
        {(title || showMenu || series.length > 0) && (
          <div className="mb-3 flex items-center justify-between">
            {title ? (
              <Text size="sm" weight="semibold" tone="muted">
                {title}
              </Text>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-4">
              {series.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <Text size="xs" tone="subtle">
                    {s.label}
                  </Text>
                </div>
              ))}
              {showMenu && (
                <button
                  onClick={onMenuClick}
                  className="text-(--color-fg-subtle) transition-colors hover:text-(--color-fg)"
                  aria-label="More options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Chart */}
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full"
        >
          <defs>
            {series.map((s, i) => (
              <linearGradient key={i} id={`sparkline-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
              </linearGradient>
            ))}
          </defs>

          {series.map((s, i) => {
            const points = pts(s.values)
            return (
              <g key={i}>
                <path d={toArea(points)} fill={`url(#sparkline-grad-${i})`} />
                <path
                  d={toPath(points)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={s.strokeWidth ?? (i === 0 ? 2 : 1.5)}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
            )
          })}

          {/* X-axis labels */}
          {xLabels &&
            xLabels.map((m, i) => {
              const x = padL + (i / Math.max(xLabels.length - 1, 1)) * (W - padL - padR)
              return (
                <text
                  key={m}
                  x={x}
                  y={H - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--color-fg-subtle)"
                  fontFamily="var(--font-sans)"
                >
                  {m}
                </text>
              )
            })}
        </svg>
      </div>
    )
  },
)
