import * as React from 'react'

export interface SparklinePoint {
  /** Numeric value to plot */
  value: number
  /** Label shown in the tooltip (e.g. "Jun 14, 2:30 PM") */
  label: string
  /** Pre-formatted value string (e.g. "94.2%", "1.8s") */
  formatted: string
}

export interface SparklineProps {
  points: SparklinePoint[]
  /** Tailwind / CSS color for the line and fill — e.g. "var(--color-accent)" */
  color?: string
  width?: number
  height?: number
  className?: string
}

interface TooltipState {
  x: number
  y: number
  point: SparklinePoint
  lineX: number
}

function buildPath(xs: number[], ys: number[]): string {
  if (xs.length === 0) return ''
  const parts: string[] = [`M ${xs[0]} ${ys[0]}`]
  for (let i = 1; i < xs.length; i++) {
    // Catmull-Rom–style smooth bezier
    const cpX = (xs[i - 1] + xs[i]) / 2
    parts.push(`C ${cpX} ${ys[i - 1]}, ${cpX} ${ys[i]}, ${xs[i]} ${ys[i]}`)
  }
  return parts.join(' ')
}

function buildFill(xs: number[], ys: number[], height: number): string {
  if (xs.length === 0) return ''
  const line = buildPath(xs, ys)
  return `${line} L ${xs[xs.length - 1]} ${height} L ${xs[0]} ${height} Z`
}

export function Sparkline({
  points,
  color = 'var(--color-accent)',
  width = 120,
  height = 36,
  className,
}: SparklineProps) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = React.useState<TooltipState | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  if (points.length < 2) return null

  const values = points.map((p) => p.value)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1

  const padX = 2
  const padY = 4

  const xs = points.map((_, i) => padX + (i / (points.length - 1)) * (width - padX * 2))
  const ys = points.map((p) => padY + (1 - (p.value - minVal) / range) * (height - padY * 2))

  const linePath = buildPath(xs, ys)
  const fillPath = buildFill(xs, ys, height)

  function nearestIndex(clientX: number): number {
    const svgEl = svgRef.current
    if (!svgEl) return 0
    const rect = svgEl.getBoundingClientRect()
    const relX = ((clientX - rect.left) / rect.width) * width
    let best = 0
    let bestDist = Infinity
    xs.forEach((x, i) => {
      const d = Math.abs(x - relX)
      if (d < bestDist) { bestDist = d; best = i }
    })
    return best
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const idx = nearestIndex(e.clientX)
      const svgEl = svgRef.current
      if (!svgEl) return
      const rect = svgEl.getBoundingClientRect()
      // tooltip anchor in viewport coords
      const lineX = xs[idx]
      const pointScreenX = rect.left + (lineX / width) * rect.width
      const pointScreenY = rect.top + (ys[idx] / height) * rect.height
      setTooltip({ x: pointScreenX, y: pointScreenY, point: points[idx], lineX })
    }, 16)
  }

  function handleMouseLeave() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setTooltip(null)
  }

  return (
    <div className={`relative ${className ?? ''}`} style={{ width, height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="overflow-visible cursor-crosshair block"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`spark-fill-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* area fill */}
        <path
          d={fillPath}
          fill={`url(#spark-fill-${color.replace(/[^a-z0-9]/gi, '')})`}
        />

        {/* line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* crosshair */}
        {tooltip !== null && (
          <>
            <line
              x1={tooltip.lineX}
              x2={tooltip.lineX}
              y1={padY - 2}
              y2={height - padY + 2}
              stroke={color}
              strokeWidth="1"
              strokeDasharray="2 2"
              strokeLinecap="round"
            />
            <circle
              cx={tooltip.lineX}
              cy={ys[points.indexOf(tooltip.point)]}
              r="3"
              fill={color}
              stroke="var(--color-surface)"
              strokeWidth="1.5"
            />
          </>
        )}
      </svg>

      {tooltip !== null && (
        <SparklineTooltip
          screenX={tooltip.x}
          screenY={tooltip.y}
          point={tooltip.point}
        />
      )}
    </div>
  )
}

// Portal-free fixed tooltip that avoids card overflow clipping
function SparklineTooltip({
  screenX,
  screenY,
  point,
}: {
  screenX: number
  screenY: number
  point: SparklinePoint
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [dims, setDims] = React.useState({ w: 0, h: 0 })

  React.useLayoutEffect(() => {
    if (ref.current) {
      setDims({ w: ref.current.offsetWidth, h: ref.current.offsetHeight })
    }
  }, [point])

  const gap = 8
  const vp = { w: window.innerWidth, h: window.innerHeight }

  let left = screenX - dims.w / 2
  let top = screenY - dims.h - gap

  // flip below if off the top
  if (top < 4) top = screenY + gap
  // clamp horizontally
  left = Math.max(6, Math.min(left, vp.w - dims.w - 6))

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left, top, pointerEvents: 'none', zIndex: 50 }}
      className="
        flex flex-col gap-0.5
        rounded-(--radius-sm)
        border border-(--color-border)
        bg-(--color-surface-raised)
        px-2 py-1.5
        shadow-(--shadow-md)
        whitespace-nowrap
      "
    >
      <span
        className="text-(--text-xs) font-semibold leading-none text-(--color-fg)"
        style={{ fontSize: 'var(--text-xs)', lineHeight: 'var(--text-xs--line-height)' }}
      >
        {point.formatted}
      </span>
      <span
        className="text-(--color-fg-subtle)"
        style={{ fontSize: 'var(--text-xs)', lineHeight: 'var(--text-xs--line-height)' }}
      >
        {point.label}
      </span>
    </div>
  )
}
