import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Text } from '@/components/ui/Text'

// eslint-disable-next-line react-refresh/only-export-components
export const donutChartVariants = cva(
  'rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) shadow-(--shadow-xs)',
  {
    variants: {
      size: {
        sm: 'p-4',
        md: 'p-5',
        lg: 'p-6',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

export interface DonutRing {
  /** 0–100 fill percentage */
  pct: number
  /** CSS color string for the filled arc */
  color: string
  /** CSS color string for the empty track */
  trackColor: string
  /** Circle radius in SVG units */
  r: number
  /** Stroke width in SVG units */
  stroke: number
}

export interface DonutLegendItem {
  label: string
  color: string
  count?: number
}

export interface DonutChartProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof donutChartVariants> {
  /** Panel heading */
  title?: string
  /** Large center text */
  value: string
  /** Small center sub-label */
  label: string
  /** Concentric rings to render, outermost first */
  rings: DonutRing[]
  /** Legend items shown below the chart */
  legend?: DonutLegendItem[]
  /** Diameter in px (default 160) */
  diameter?: number
  /** Show the ⋮ menu button */
  showMenu?: boolean
  onMenuClick?: () => void
}

export const DonutChart = React.forwardRef<HTMLDivElement, DonutChartProps>(
  function DonutChart(
    {
      className,
      size,
      title,
      value,
      label,
      rings,
      legend,
      diameter = 160,
      showMenu = false,
      onMenuClick,
      ...props
    },
    ref,
  ) {
    const cx = diameter / 2
    const cy = diameter / 2

    return (
      <div
        ref={ref}
        className={cn(donutChartVariants({ size }), className)}
        {...props}
      >
        {/* Header */}
        {(title || showMenu) && (
          <div className="mb-4 flex items-center justify-between">
            {title && (
              <Text size="sm" weight="semibold" tone="muted">
                {title}
              </Text>
            )}
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
        )}

        {/* Ring chart */}
        <div className="flex justify-center">
          <div className="relative" style={{ width: diameter, height: diameter }}>
            <svg
              width={diameter}
              height={diameter}
              viewBox={`0 0 ${diameter} ${diameter}`}
            >
              {rings.map((ring, i) => {
                const circumference = 2 * Math.PI * ring.r
                const dash = (ring.pct / 100) * circumference
                return (
                  <g key={i}>
                    {/* Track */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={ring.r}
                      fill="none"
                      stroke={ring.trackColor}
                      strokeWidth={ring.stroke}
                    />
                    {/* Fill arc */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={ring.r}
                      fill="none"
                      stroke={ring.color}
                      strokeWidth={ring.stroke}
                      strokeDasharray={`${dash} ${circumference - dash}`}
                      strokeDashoffset={circumference * 0.25}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.6s ease' }}
                    />
                  </g>
                )
              })}
            </svg>

            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
              <span
                className="text-lg font-semibold leading-none text-(--color-fg)"
                style={{ fontFeatureSettings: '"tnum"' }}
              >
                {value}
              </span>
              <span className="text-[10px] leading-none text-(--color-fg-subtle)">
                {label}
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        {legend && legend.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {legend.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <Text size="xs" tone="muted">
                  {item.label}
                </Text>
                {item.count !== undefined && (
                  <Text size="xs" weight="semibold">
                    {item.count}
                  </Text>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  },
)
