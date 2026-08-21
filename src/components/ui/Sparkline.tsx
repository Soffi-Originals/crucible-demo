import * as React from 'react'
import { cn } from '@/lib/cn'

export interface SparkPoint {
  x: number
  y: number
}

export interface SparklineProps extends React.SVGAttributes<SVGSVGElement> {
  data: SparkPoint[]
  /** Color of the line. Defaults to current text color via `currentColor`. */
  color?: string
  /** Fill the area under the line. */
  fill?: boolean
  width?: number
  height?: number
  strokeWidth?: number
}

function normalize(points: SparkPoint[], w: number, h: number, pad: number) {
  if (points.length === 0) return []
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1
  return points.map((p) => ({
    cx: pad + ((p.x - minX) / rangeX) * (w - pad * 2),
    cy: h - pad - ((p.y - minY) / rangeY) * (h - pad * 2),
  }))
}

export const Sparkline = React.forwardRef<SVGSVGElement, SparklineProps>(
  function Sparkline(
    {
      data,
      color = 'currentColor',
      fill = true,
      width = 80,
      height = 32,
      strokeWidth = 1.5,
      className,
      ...props
    },
    ref,
  ) {
    if (!data || data.length < 2) return null

    const pad = strokeWidth
    const pts = normalize(data, width, height, pad)
    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.cx},${p.cy}`).join(' ')
    const areaPath = `${linePath} L${pts[pts.length - 1].cx},${height - pad} L${pts[0].cx},${height - pad} Z`

    const fillId = React.useId()

    return (
      <svg
        ref={ref}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        aria-hidden="true"
        className={cn('shrink-0', className)}
        {...props}
      >
        {fill && (
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
        )}
        {fill && (
          <path d={areaPath} fill={`url(#${fillId})`} />
        )}
        <path
          d={linePath}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  },
)
