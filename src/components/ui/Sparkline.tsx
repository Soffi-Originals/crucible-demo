import * as React from 'react'
import { cn } from '@/lib/cn'

export interface SparklineProps extends React.SVGAttributes<SVGSVGElement> {
  /** Normalized values 0–1, left to right */
  data: number[]
  /** Visual tone controls the stroke/fill colour */
  tone?: 'positive' | 'negative' | 'neutral'
  height?: number
}

const toneStroke: Record<NonNullable<SparklineProps['tone']>, string> = {
  positive: 'var(--color-success)',
  negative: 'var(--color-danger)',
  neutral: 'var(--color-fg-muted)',
}

const toneFill: Record<NonNullable<SparklineProps['tone']>, string> = {
  positive: 'var(--color-success)',
  negative: 'var(--color-danger)',
  neutral: 'var(--color-fg-muted)',
}

export const Sparkline = React.forwardRef<SVGSVGElement, SparklineProps>(
  function Sparkline({ data, tone = 'neutral', height = 40, className, ...props }, ref) {
    if (!data || data.length < 2) return null

    const width = 100 // SVG user units; viewBox scales to container
    const padY = 2 // vertical padding so stroke isn't clipped

    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = padY + (1 - v) * (height - padY * 2)
      return [x, y] as [number, number]
    })

    const linePath = points
      .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`)
      .join(' ')

    const areaPath =
      linePath +
      ` L${points[points.length - 1][0]},${height} L${points[0][0]},${height} Z`

    const stroke = toneStroke[tone]
    const fill = toneFill[tone]
    const gradId = `spark-${tone}`

    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        aria-hidden
        className={cn('w-full', className)}
        style={{ height }}
        {...props}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity="0.18" />
            <stop offset="100%" stopColor={fill} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  },
)
