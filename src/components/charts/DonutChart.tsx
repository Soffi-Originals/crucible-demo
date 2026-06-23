import * as React from 'react'
import { cn } from '@/lib/cn'
import { Text } from '@/components/ui/Text'

export interface DonutSlice {
  key: string
  label: string
  value: number
  color: string
}

export interface DonutChartProps {
  slices: DonutSlice[]
  size?: number
  thickness?: number
  activeKey?: string | null
  onSliceClick?: (key: string | null) => void
  centerLabel?: string
  centerSub?: string
  className?: string
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const clampedEnd = Math.min(endAngle, startAngle + 359.999)
  const start = polarToCartesian(cx, cy, r, clampedEnd)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = clampedEnd - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

export function DonutChart({
  slices,
  size = 120,
  thickness = 18,
  activeKey,
  onSliceClick,
  centerLabel,
  centerSub,
  className,
}: DonutChartProps) {
  const total = slices.reduce((s, d) => s + d.value, 0)
  const cx = size / 2
  const cy = size / 2
  const r = (size - thickness) / 2

  let cursor = 0
  const arcs = slices.map((slice) => {
    const pct = total === 0 ? 0 : slice.value / total
    const startAngle = cursor * 360
    const endAngle = (cursor + pct) * 360
    cursor += pct
    return { ...slice, startAngle, endAngle, pct }
  })

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {total === 0 && (
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              strokeWidth={thickness}
              stroke="var(--color-border-subtle)"
            />
          )}
          {arcs.map((arc) => {
            const isActive = activeKey === null || activeKey === undefined || activeKey === arc.key
            return (
              <path
                key={arc.key}
                d={describeArc(cx, cy, r, arc.startAngle, arc.endAngle)}
                fill="none"
                strokeWidth={activeKey === arc.key ? thickness + 4 : thickness}
                stroke={arc.color}
                strokeLinecap="round"
                opacity={isActive ? 1 : 0.25}
                style={{ transition: 'opacity 150ms, stroke-width 150ms' }}
                className="cursor-pointer"
                onClick={() => onSliceClick?.(activeKey === arc.key ? null : arc.key)}
              />
            )
          })}
        </svg>
        {(centerLabel || centerSub) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            {centerLabel && (
              <Text size="sm" weight="semibold">
                {centerLabel}
              </Text>
            )}
            {centerSub && (
              <Text size="xs" tone="subtle">
                {centerSub}
              </Text>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
        {slices.map((slice) => {
          const isActive = activeKey === null || activeKey === undefined || activeKey === slice.key
          return (
            <button
              key={slice.key}
              type="button"
              onClick={() => onSliceClick?.(activeKey === slice.key ? null : slice.key)}
              className={cn(
                'flex items-center gap-1.5 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus) rounded',
                !isActive && 'opacity-30',
              )}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <Text size="xs" tone="muted">
                {slice.label}
              </Text>
              <Text size="xs" tone="subtle">
                {slice.value}
              </Text>
            </button>
          )
        })}
      </div>
    </div>
  )
}
