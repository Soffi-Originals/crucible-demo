import * as React from 'react'

export interface TimeSeriesPoint {
  label: string      // e.g. "12:04"
  passed: number
  failed: number
  total: number
}

interface TimeSeriesChartProps {
  points: TimeSeriesPoint[]
  height?: number
}

function smooth(pts: number[]): number[] {
  if (pts.length < 3) return pts
  return pts.map((v, i) => {
    if (i === 0 || i === pts.length - 1) return v
    return (pts[i - 1] + v + pts[i + 1]) / 3
  })
}

function buildPath(values: number[], maxVal: number, w: number, h: number): string {
  if (values.length < 2) return ''
  const stepX = w / (values.length - 1)
  const scaleY = maxVal > 0 ? h / maxVal : 1

  const points = values.map((v, i) => ({
    x: i * stepX,
    y: h - v * scaleY,
  }))

  // Catmull-rom to cubic bezier
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`
  }
  return d
}

function buildAreaPath(values: number[], maxVal: number, w: number, h: number): string {
  const line = buildPath(values, maxVal, w, h)
  if (!line) return ''
  const stepX = w / (values.length - 1)
  const lastX = (values.length - 1) * stepX
  return `${line} L ${lastX} ${h} L 0 ${h} Z`
}

export function TimeSeriesChart({ points, height = 80 }: TimeSeriesChartProps) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const [svgW, setSvgW] = React.useState(400)
  const [tooltip, setTooltip] = React.useState<{ x: number; y: number; pt: TimeSeriesPoint } | null>(null)

  React.useEffect(() => {
    if (!svgRef.current) return
    const ro = new ResizeObserver((entries) => {
      setSvgW(entries[0].contentRect.width)
    })
    ro.observe(svgRef.current.parentElement!)
    setSvgW(svgRef.current.parentElement!.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  const PAD = { top: 8, right: 8, bottom: 24, left: 28 }
  const w = svgW - PAD.left - PAD.right
  const h = height - PAD.top - PAD.bottom

  const smoothedTotal = smooth(points.map((p) => p.total))
  const smoothedFailed = smooth(points.map((p) => p.failed))
  const maxVal = Math.max(...smoothedTotal, 1)

  const totalPath = buildPath(smoothedTotal, maxVal, w, h)
  const failPath = buildPath(smoothedFailed, maxVal, w, h)
  const totalArea = buildAreaPath(smoothedTotal, maxVal, w, h)

  // Y-axis ticks
  const yTicks = [0, Math.ceil(maxVal / 2), Math.ceil(maxVal)]

  // X-axis labels (only every Nth to avoid crowding)
  const labelEvery = Math.max(1, Math.floor(points.length / 6))

  // Hover handling
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const relX = e.clientX - rect.left - PAD.left
    const idx = Math.round((relX / w) * (points.length - 1))
    const clamped = Math.max(0, Math.min(points.length - 1, idx))
    const pt = points[clamped]
    const stepX = w / Math.max(1, points.length - 1)
    setTooltip({ x: clamped * stepX + PAD.left, y: PAD.top, pt })
  }

  if (points.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>waiting for data...</span>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ display: 'block', overflow: 'visible', cursor: 'crosshair' }}
      >
        <defs>
          <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Y grid lines */}
          {yTicks.map((tick) => {
            const y = h - (tick / maxVal) * h
            return (
              <g key={tick}>
                <line x1={0} y1={y} x2={w} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                <text x={-6} y={y + 4} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.25)">
                  {tick}
                </text>
              </g>
            )
          })}

          {/* Total area fill */}
          {totalArea && (
            <path d={totalArea} fill="url(#totalGrad)" />
          )}

          {/* Total line */}
          {totalPath && (
            <path
              d={totalPath}
              fill="none"
              stroke="#34d399"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Failed line */}
          {failPath && (
            <path
              d={failPath}
              fill="none"
              stroke="#f87171"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="none"
            />
          )}

          {/* X labels */}
          {points.map((pt, i) => {
            if (i % labelEvery !== 0 && i !== points.length - 1) return null
            const x = (i / Math.max(1, points.length - 1)) * w
            return (
              <text key={i} x={x} y={h + 16} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.25)">
                {pt.label}
              </text>
            )
          })}

          {/* Hover crosshair */}
          {tooltip && (
            <>
              <line
                x1={tooltip.x - PAD.left}
                y1={0}
                x2={tooltip.x - PAD.left}
                y2={h}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle
                cx={tooltip.x - PAD.left}
                cy={h - (smoothedTotal[points.indexOf(tooltip.pt)] / maxVal) * h}
                r={3}
                fill="#34d399"
              />
            </>
          )}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          top: 4,
          left: Math.min(tooltip.x + 8, svgW - 100),
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6,
          padding: '5px 10px',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{tooltip.pt.label}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>▲ {tooltip.pt.total}</span>
            {tooltip.pt.failed > 0 && (
              <span style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>✗ {tooltip.pt.failed}</span>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 4, paddingLeft: PAD.left }}>
        {[
          { color: '#34d399', label: 'Total runs' },
          { color: '#f87171', label: 'Failures' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 20, height: 2, backgroundColor: color, borderRadius: 1 }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
