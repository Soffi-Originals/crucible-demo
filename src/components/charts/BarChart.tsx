import * as React from 'react'
import { cn } from '@/lib/cn'
import { Text } from '@/components/ui/Text'

export interface BarChartDatum {
  label: string
  segments: { value: number; color: string; key: string }[]
  total: number
}

export interface BarChartProps {
  data: BarChartDatum[]
  height?: number
  activeLabel?: string | null
  onBarClick?: (label: string | null) => void
  className?: string
}

export function BarChart({
  data,
  height = 120,
  activeLabel,
  onBarClick,
  className,
}: BarChartProps) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((datum) => {
          const isActive = activeLabel === null || activeLabel === datum.label
          const barH = (datum.total / maxTotal) * height

          return (
            <button
              key={datum.label}
              type="button"
              onClick={() =>
                onBarClick?.(activeLabel === datum.label ? null : datum.label)
              }
              className={cn(
                'group relative flex flex-1 flex-col justify-end rounded-t-sm transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus)',
                !isActive && 'opacity-30',
              )}
              style={{ height }}
              aria-pressed={activeLabel === datum.label}
              aria-label={`Filter by ${datum.label}`}
            >
              <div
                className="flex w-full flex-col-reverse overflow-hidden rounded-t-sm transition-all duration-300"
                style={{ height: barH }}
              >
                {datum.segments.map((seg) => {
                  const segH = datum.total === 0 ? 0 : (seg.value / datum.total) * barH
                  return (
                    <div
                      key={seg.key}
                      style={{ height: segH, backgroundColor: seg.color }}
                    />
                  )
                })}
              </div>
              {/* Hover tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2 py-1 shadow-(--shadow-md) group-hover:flex group-focus-visible:flex">
                <Text size="xs" tone="muted">
                  {datum.label}: <span className="font-medium text-(--color-fg)">{datum.total}</span>
                </Text>
              </div>
            </button>
          )
        })}
      </div>
      <div className="flex gap-1.5">
        {data.map((datum) => (
          <div key={datum.label} className="flex-1 text-center">
            <Text size="xs" tone="subtle" className="truncate block">
              {datum.label}
            </Text>
          </div>
        ))}
      </div>
    </div>
  )
}
