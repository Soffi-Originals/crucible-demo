import * as React from 'react'

export interface TimeSeriesPoint {
  label: string
  passed: number
  failed: number
  total: number
  tsMs: number // epoch ms for this bucket
}

interface TimeSeriesChartProps {
  points: TimeSeriesPoint[]
  height?: number
  windowSec?: number // how many seconds of data to show
  onBrush?: (from: number, to: number) => void // epoch ms range from brush
  brushRange?: [number, number] | null
}

// Catmull-Rom path builder (no NaN guard)
function buildPath(values: number[], maxVal: number, w: number, h: number): string {
  if (values.length < 2 || w <= 0 || h <= 0) return ''
  const safe = maxVal > 0 ? maxVal : 1
  const step = w / Math.max(values.length - 1, 1)
  const pts = values.map((v, i) => ({ x: i * step, y: h - (v / safe) * h }))
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

function buildArea(values: number[], maxVal: number, w: number, h: number): string {
  const line = buildPath(values, maxVal, w, h)
  if (!line || values.length < 2) return ''
  const step = w / Math.max(values.length - 1, 1)
  const lastX = ((values.length - 1) * step).toFixed(2)
  return `${line} L ${lastX} ${h.toFixed(2)} L 0 ${h.toFixed(2)} Z`
}

// Detect anomaly spikes (value > mean + 2σ)
function anomalyIdxs(values: number[]): Set<number> {
  if (values.length < 4) return new Set()
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  const sigma = Math.sqrt(variance)
  const threshold = mean + 2 * sigma
  const out = new Set<number>()
  values.forEach((v, i) => { if (v > threshold && sigma > 0) out.add(i) })
  return out
}

export function TimeSeriesChart({ points, height = 110, onBrush, brushRange }: TimeSeriesChartProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)
  const [svgW, setSvgW] = React.useState(600)
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
  const [brushStart, setBrushStart] = React.useState<number | null>(null)
  const [brushEnd, setBrushEnd] = React.useState<number | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  React.useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      if (w > 0) setSvgW(w)
    })
    ro.observe(containerRef.current)
    const w = containerRef.current.getBoundingClientRect().width
    if (w > 0) setSvgW(w)
    return () => ro.disconnect()
  }, [])

  const PAD = { top: 10, right: 12, bottom: 28, left: 32 }
  const w = Math.max(svgW - PAD.left - PAD.right, 1)
  const h = Math.max(height - PAD.top - PAD.bottom, 1)

  const totals = points.map((p) => p.total)
  const fails = points.map((p) => p.failed)
  const maxVal = Math.max(...totals, 1)

  const totalPath = buildPath(totals, maxVal, w, h)
  const failPath = buildPath(fails, maxVal, w, h)
  const totalArea = buildArea(totals, maxVal, w, h)

  const yTicks = [0, Math.ceil(maxVal / 2), Math.ceil(maxVal)]
  const anomalies = anomalyIdxs(fails)

  // Only label every Nth bucket to avoid crowding — show ~6 labels
  const step = w / Math.max(points.length - 1, 1)
  const labelEvery = Math.max(1, Math.floor(points.length / 6))

  // Convert pixel X to data index
  const xToIdx = (px: number) => {
    const rel = px - PAD.left
    return Math.max(0, Math.min(points.length - 1, Math.round((rel / w) * (points.length - 1))))
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const relX = e.clientX - rect.left
    const idx = xToIdx(relX)
    setHoverIdx(idx)
    if (isDragging && brushStart !== null) {
      setBrushEnd(relX - PAD.left)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect()
    setBrushStart(e.clientX - rect.left - PAD.left)
    setBrushEnd(null)
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    if (isDragging && brushStart !== null && brushEnd !== null && onBrush && points.length > 1) {
      const i1 = xToIdx(brushStart + PAD.left)
      const i2 = xToIdx(brushEnd + PAD.left)
      const [lo, hi] = i1 <= i2 ? [i1, i2] : [i2, i1]
      if (hi > lo && points[lo] && points[hi]) {
        onBrush(points[lo].tsMs, points[hi].tsMs)
      }
    }
    setIsDragging(false)
    setBrushStart(null)
    setBrushEnd(null)
  }

  // Brush region from external brushRange prop
  const extBrushX1 = React.useMemo(() => {
    if (!brushRange || points.length < 2) return null
    const [from] = brushRange
    const startMs = points[0].tsMs
    const endMs = points[points.length - 1].tsMs
    const span = endMs - startMs || 1
    return ((from - startMs) / span) * w
  }, [brushRange, points, w])

  const extBrushX2 = React.useMemo(() => {
    if (!brushRange || points.length < 2) return null
    const [, to] = brushRange
    const startMs = points[0].tsMs
    const endMs = points[points.length - 1].tsMs
    const span = endMs - startMs || 1
    return ((to - startMs) / span) * w
  }, [brushRange, points, w])

  if (points.length < 2) {
    return (
      <div ref={containerRef} style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>waiting for data...</span>
      </div>
    )
  }

  const hoverPt = hoverIdx !== null ? points[hoverIdx] : null
  const hoverX = hoverIdx !== null ? hoverIdx * step : null
  const hoverY = hoverIdx !== null && totals[hoverIdx] !== undefined
    ? h - (totals[hoverIdx] / maxVal) * h
    : null

  // Drag brush pixel coords
  const dragBrushX1 = brushStart !== null ? Math.min(brushStart, brushEnd ?? brushStart) : null
  const dragBrushW = brushStart !== null && brushEnd !== null ? Math.abs(brushEnd - brushStart) : 0

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHoverIdx(null); setIsDragging(false) }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{ display: 'block', overflow: 'visible', cursor: onBrush ? 'crosshair' : 'default', userSelect: 'none' }}
      >
        <defs>
          <linearGradient id="tsGradTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
          <clipPath id="tsClip">
            <rect x={0} y={0} width={w} height={h} />
          </clipPath>
        </defs>

        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Y grid + ticks */}
          {yTicks.map((tick) => {
            const yy = h - (tick / maxVal) * h
            return (
              <g key={tick}>
                <line x1={0} y1={yy} x2={w} y2={yy} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                <text x={-6} y={yy + 4} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.25)" fontFamily="monospace">
                  {tick}
                </text>
              </g>
            )
          })}

          {/* External brush region */}
          {extBrushX1 !== null && extBrushX2 !== null && (
            <rect
              x={Math.max(0, extBrushX1)}
              y={0}
              width={Math.min(w, extBrushX2) - Math.max(0, extBrushX1)}
              height={h}
              fill="rgba(96,165,250,0.08)"
              stroke="rgba(96,165,250,0.25)"
              strokeWidth={1}
              rx={2}
            />
          )}

          {/* Drag brush region */}
          {dragBrushX1 !== null && dragBrushW > 4 && (
            <rect
              x={dragBrushX1}
              y={0}
              width={dragBrushW}
              height={h}
              fill="rgba(96,165,250,0.07)"
              stroke="rgba(96,165,250,0.2)"
              strokeWidth={1}
              rx={2}
            />
          )}

          {/* Area fill */}
          {totalArea && (
            <path d={totalArea} fill="url(#tsGradTotal)" clipPath="url(#tsClip)" />
          )}

          {/* Total line */}
          {totalPath && (
            <path d={totalPath} fill="none" stroke="#34d399" strokeWidth={1.5} strokeLinecap="round" clipPath="url(#tsClip)" />
          )}

          {/* Failure line */}
          {failPath && (
            <path d={failPath} fill="none" stroke="#f87171" strokeWidth={1.5} strokeLinecap="round" clipPath="url(#tsClip)" />
          )}

          {/* Anomaly markers on failure spikes */}
          {[...anomalies].map((idx) => {
            const safe = maxVal > 0 ? maxVal : 1
            const xx = idx * step
            const yy = h - (fails[idx] / safe) * h
            if (!isFinite(xx) || !isFinite(yy)) return null
            return (
              <g key={`anom-${idx}`}>
                <circle cx={xx} cy={yy} r={5} fill="none" stroke="#f87171" strokeWidth={1.5} opacity={0.7} />
                <circle cx={xx} cy={yy} r={2} fill="#f87171" opacity={0.9} />
              </g>
            )
          })}

          {/* X axis labels */}
          {points.map((pt, i) => {
            if (i % labelEvery !== 0 && i !== points.length - 1) return null
            const xx = i * step
            return (
              <text key={i} x={xx} y={h + 18} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.22)" fontFamily="monospace">
                {pt.label}
              </text>
            )
          })}

          {/* Hover crosshair */}
          {hoverX !== null && hoverY !== null && isFinite(hoverX) && isFinite(hoverY) && (
            <>
              <line x1={hoverX} y1={0} x2={hoverX} y2={h} stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={hoverX} cy={hoverY} r={3} fill="#34d399" />
            </>
          )}
        </g>
      </svg>

      {/* Hover tooltip */}
      {hoverPt && hoverX !== null && (
        <div style={{
          position: 'absolute',
          top: 4,
          left: Math.min(hoverX + PAD.left + 10, svgW - 120),
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6,
          padding: '6px 10px',
          pointerEvents: 'none',
          zIndex: 10,
          minWidth: 100,
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4, fontFamily: 'monospace' }}>{hoverPt.label}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 12, color: '#34d399', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {hoverPt.total} runs
            </span>
            {hoverPt.failed > 0 && (
              <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>
                {hoverPt.failed} failed {anomalies.has(hoverIdx!) ? '⚠ spike' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Legend + drag hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, paddingLeft: PAD.left }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 18, height: 2, backgroundColor: '#34d399', borderRadius: 1 }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>Total</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 18, height: 2, backgroundColor: '#f87171', borderRadius: 1 }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>Failures</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid #f87171', backgroundColor: 'transparent' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>Spike</span>
        </div>
        {onBrush && (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', marginLeft: 'auto' }}>
            drag to select time window
          </span>
        )}
      </div>
    </div>
  )
}
