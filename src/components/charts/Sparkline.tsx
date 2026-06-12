import * as React from 'react'
import { cn } from '@/lib/cn'

export interface SparklineDatum {
  x: number // epoch ms
  y: number
  label?: string
}

export interface SparklineProps {
  data: SparklineDatum[]
  width?: number
  height?: number
  color?: string
  filled?: boolean
  className?: string
}

export function Sparkline({
  data,
  width = 200,
  height = 48,
  color = 'var(--color-accent)',
  filled = true,
  className,
}: SparklineProps) {
  if (data.length < 2) {
    return <div style={{ width, height }} className={className} />
  }

  const xs = data.map((d) => d.x)
  const ys = data.map((d) => d.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const pad = 4
  const innerW = width - pad * 2
  const innerH = height - pad * 2

  const toSvgX = (x: number) =>
    maxX === minX ? pad + innerW / 2 : pad + ((x - minX) / (maxX - minX)) * innerW
  const toSvgY = (y: number) =>
    maxY === minY ? pad + innerH / 2 : pad + (1 - (y - minY) / (maxY - minY)) * innerH

  const points = data.map((d) => `${toSvgX(d.x)},${toSvgY(d.y)}`).join(' ')
  const polyline = `M ${data.map((d) => `${toSvgX(d.x)} ${toSvgY(d.y)}`).join(' L ')}`
  const area = `${polyline} L ${toSvgX(xs[xs.length - 1])} ${height} L ${toSvgX(xs[0])} ${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      aria-hidden
    >
      {filled && (
        <path
          d={area}
          fill={color}
          opacity={0.12}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
