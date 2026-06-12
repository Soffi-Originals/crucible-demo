import * as React from 'react'

export interface TimeSeriesPoint {
  label: string
  passed: number
  failed: number
  total: number
  tsMs: number
}

interface TimeSeriesChartProps {
  points: TimeSeriesPoint[]
  height?: number
  onBrush?: (from: number, to: number) => void
  brushRange?: [number, number] | null
}

function buildPath(values: number[], maxVal: number, w: number, h: number): string {
  if (values.length < 2 || w <= 0 || h <= 0) return ''
  const safe = maxVal > 0 ? maxVal : 1
  const step = w / Math.max(values.length - 1, 1)
  const pts = values.map((v, i) => ({
    x: i * step,
    y: h - Math.max(0, Math.min(1, v / safe)) * h,
  }))
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

function anomalyIdxs(values: number[]): Set<number> {
  if (values.length < 4) return new Set()
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  const sigma = Math.sqrt(variance)
  const threshold = mean + 2 * sigma
  const out = new Set<number>()
  values.forEach((v, i) => { if (v > threshold && sigma > 0.5) out.add(i) })
  return out
}

/** Deduplicated y-axis ticks — avoids duplicate keys when maxVal is small */
function buildYTicks(maxVal: number): number[] {
  const raw = [0, Math.ceil(maxVal / 2), Math.ceil(maxVal)]
  return [...new Set(raw)]
}

export function TimeSeriesChart({ points, height = 130, onBrush, brushRange }: TimeSeriesChartProps) {
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

  const PAD = { top: 12, right: 14, bottom: 32, left: 36 }
  const w = Math.max(svgW - PAD.left - PAD.right, 1)
  const h = Math.max(height - PAD.top - PAD.bottom, 1)

  const totals = points.map((p) => p.total)
  const fails = points.map((p) => p.failed)
  const maxVal = Math.max(...totals, 1)

  const totalArea = buildArea(totals, maxVal, w, h)
  const totalPath = buildPath(totals, maxVal, w, h)
  const failPath  = buildPath(fails, maxVal, w, h)
  const failArea  = buildArea(fails, maxVal, w, h)

  const yTicks   = buildYTicks(maxVal)
  const anomalies = anomalyIdxs(fails)
  const step = w / Math.max(points.length - 1, 1)

  // ~6 labels across 120 buckets
  const labelEvery = Math.max(1, Math.floor(points.length / 6))

  const xToIdx = (px: number) =>
    Math.max(0, Math.min(points.length - 1, Math.round(((px - PAD.left) / w) * (points.length - 1))))

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const relX = e.clientX - rect.left
    setHoverIdx(xToIdx(relX))
    if (isDragging && brushStart !== null) setBrushEnd(relX - PAD.left)
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
      if (hi > lo && points[lo] && points[hi]) onBrush(points[lo].tsMs, points[hi].tsMs)
    }
    setIsDragging(false)
    setBrushStart(null)
    setBrushEnd(null)
  }

  const toRelX = (tsMs: number) => {
    if (!brushRange || points.length < 2) return null
    const startMs = points[0].tsMs
    const span = (points[points.length - 1].tsMs - startMs) || 1
    return ((tsMs - startMs) / span) * w
  }

  const extBrushX1 = brushRange ? toRelX(brushRange[0]) : null
  const extBrushX2 = brushRange ? toRelX(brushRange[1]) : null

  if (points.length < 2) {
    return (
      <div ref={containerRef} style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>waiting for data...</span>
      </div>
    )
  }

  const hoverPt = hoverIdx !== null ? points[hoverIdx] : null
  const hoverX  = hoverIdx !== null ? hoverIdx * step : null
  const hoverY  = hoverIdx !== null && isFinite(totals[hoverIdx] ?? NaN)
    ? h - (Math.min(totals[hoverIdx], maxVal) / maxVal) * h
    : null

  const dragBrushX1 = brushStart !== null ? Math.min(brushStart, brushEnd ?? brushStart) : null
  const dragBrushW  = brushStart !== null && brushEnd !== null ? Math.abs(brushEnd - brushStart) : 0

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
            <stop offset="0%"  stopColor="#34d399" stopOpacity="0.25" />
            <stop offset="80%" stopColor="#34d399" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="tsGradFail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#f87171" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0"    />
          </linearGradient>
          <filter id="lineGlow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id="tsClip">
            <rect x={0} y={0} width={w} height={h} />
          </clipPath>
        </defs>

        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Y grid — keyed by index to avoid duplicate-key warning when values collide */}
          {yTicks.map((tick, ti) => {
            const yy = h - (tick / maxVal) * h
            return (
              <g key={`ytick-${ti}`}>
                <line x1={0} y1={yy} x2={w} y2={yy}
                  stroke="rgba(255,255,255,0.04)" strokeWidth={1}
                  strokeDasharray={tick === 0 ? undefined : '4 6'}
                />
                <text x={-8} y={yy + 4} textAnchor="end" fontSize={9}
                  fill="rgba(255,255,255,0.22)" fontFamily="monospace"
                >
                  {tick}
                </text>
              </g>
            )
          })}

          {/* External brush */}
          {extBrushX1 !== null && extBrushX2 !== null && (
            <rect
              x={Math.max(0, extBrushX1)} y={0}
              width={Math.max(0, Math.min(w, extBrushX2) - Math.max(0, extBrushX1))}
              height={h}
              fill="rgba(99,102,241,0.08)" stroke="rgba(99,102,241,0.3)"
              strokeWidth={1} rx={3}
            />
          )}

          {/* Drag brush */}
          {dragBrushX1 !== null && dragBrushW > 4 && (
            <rect x={dragBrushX1} y={0} width={dragBrushW} height={h}
              fill="rgba(99,102,241,0.07)" stroke="rgba(99,102,241,0.2)"
              strokeWidth={1} rx={3}
            />
          )}

          {/* Area fills */}
          {totalArea && <path d={totalArea} fill="url(#tsGradTotal)" clipPath="url(#tsClip)" />}
          {failArea  && <path d={failArea}  fill="url(#tsGradFail)"  clipPath="url(#tsClip)" />}

          {/* Lines */}
          {totalPath && (
            <path d={totalPath} fill="none" stroke="#34d399" strokeWidth={2}
              strokeLinecap="round" clipPath="url(#tsClip)" filter="url(#lineGlow)"
            />
          )}
          {failPath && (
            <path d={failPath} fill="none" stroke="#f87171" strokeWidth={1.5}
              strokeLinecap="round" clipPath="url(#tsClip)"
            />
          )}

          {/* Anomaly markers */}
          {[...anomalies].map((idx) => {
            const xx = idx * step
            const safe = maxVal > 0 ? maxVal : 1
            const yy = h - (Math.min(fails[idx], maxVal) / safe) * h
            if (!isFinite(xx) || !isFinite(yy)) return null
            return (
              <g key={`anom-${idx}`}>
                <circle cx={xx.toFixed(2)} cy={yy.toFixed(2)} r={6}
                  fill="none" stroke="#f87171" strokeWidth={1.5} opacity={0.6}
                />
                <circle cx={xx.toFixed(2)} cy={yy.toFixed(2)} r={2.5} fill="#f87171" />
              </g>
            )
          })}

          {/* X axis labels every `labelEvery` buckets */}
          {points.map((pt, i) => {
            if (i % labelEvery !== 0 && i !== points.length - 1) return null
            const xx = (i * step).toFixed(2)
            return (
              <text key={`xlbl-${i}`} x={xx} y={h + 20}
                textAnchor="middle" fontSize={9}
                fill="rgba(255,255,255,0.2)" fontFamily="monospace"
              >
                {pt.label}
              </text>
            )
          })}

          {/* Tick marks every 10 buckets */}
          {points.map((_, i) => {
            if (i % 10 !== 0) return null
            const xx = (i * step).toFixed(2)
            return (
              <line key={`tick-${i}`} x1={xx} y1={h} x2={xx} y2={h + 4}
                stroke="rgba(255,255,255,0.1)" strokeWidth={1}
              />
            )
          })}

          {/* Hover crosshair */}
          {hoverX !== null && hoverY !== null && isFinite(hoverX) && isFinite(hoverY) && (
            <>
              <line x1={hoverX.toFixed(2)} y1={0} x2={hoverX.toFixed(2)} y2={h}
                stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="3 4"
              />
              <circle cx={hoverX.toFixed(2)} cy={hoverY.toFixed(2)} r={4}
                fill="#34d399" stroke="#0a0a0a" strokeWidth={1.5}
              />
            </>
          )}
        </g>
      </svg>

      {/* Hover tooltip */}
      {hoverPt && hoverX !== null && (
        <div style={{
          position: 'absolute', top: 8,
          left: Math.min(hoverX + PAD.left + 12, svgW - 130),
          background: 'rgba(12,12,18,0.96)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '7px 11px',
          pointerEvents: 'none', zIndex: 10, minWidth: 110,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginBottom: 5, fontFamily: 'monospace' }}>
            {hoverPt.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span style={{ fontSize: 13, color: '#34d399', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {hoverPt.total} runs
            </span>
            {hoverPt.failed > 0 && (
              <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>
                {hoverPt.failed} failed {anomalies.has(hoverIdx!) ? '⚠' : ''}
              </span>
            )}
            {hoverPt.passed > 0 && (
              <span style={{ fontSize: 11, color: 'rgba(52,211,153,0.7)' }}>
                {hoverPt.passed} passed
              </span>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, paddingLeft: PAD.left }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 2, backgroundColor: '#34d399', borderRadius: 1, boxShadow: '0 0 4px #34d39988' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>Total runs</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 20, height: 2, backgroundColor: '#f87171', borderRadius: 1, boxShadow: '0 0 4px #f8717188' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>Failures</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid #f87171' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>Spike</span>
        </div>
        {onBrush && (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.14)', marginLeft: 'auto' }}>
            drag to select window → analyse in Logs
          </span>
        )}
      </div>
    </div>
  )
}
