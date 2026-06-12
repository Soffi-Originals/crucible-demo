import * as React from 'react'

export interface DonutSegment {
  key: string
  label: string
  value: number
  color: string
}

export interface AnimatedDonutProps {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  activeKey?: string | null
  onSegmentClick?: (key: string | null) => void
  centerLabel?: string
  centerSub?: string
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polarToXY(cx, cy, r, end)
  const e = polarToXY(cx, cy, r, start)
  const large = end - start > 180 ? 1 : 0
  return `M ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${r} ${r} 0 ${large} 0 ${e.x.toFixed(3)} ${e.y.toFixed(3)}`
}

export function AnimatedDonut({
  segments,
  size = 140,
  thickness = 22,
  activeKey,
  onSegmentClick,
  centerLabel,
  centerSub,
}: AnimatedDonutProps) {
  const total = segments.reduce((s, d) => s + d.value, 0)
  const cx = size / 2
  const cy = size / 2
  const r = (size - thickness) / 2

  const [displayTotal, setDisplayTotal] = React.useState(0)
  React.useEffect(() => {
    if (total === displayTotal) return
    const diff = total - displayTotal
    const step = Math.sign(diff)
    const delay = Math.max(8, 60 / Math.abs(diff))
    const t = setTimeout(() => setDisplayTotal((p) => p + step), delay)
    return () => clearTimeout(t)
  }, [total, displayTotal])

  let cursor = 0
  const GAP = 2
  const arcs = segments.map((seg) => {
    const pct = total === 0 ? 0 : seg.value / total
    const startAngle = cursor * 360
    const endAngle = (cursor + pct) * 360
    cursor += pct
    return { ...seg, startAngle, endAngle, pct }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            {segments.map((seg) => (
              <filter key={`glow-${seg.key}`} id={`glow-${seg.key}`}>
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            ))}
          </defs>
          {/* Track */}
          <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={thickness} stroke="rgba(255,255,255,0.04)" />
          {total === 0 && (
            <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={thickness} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 8" />
          )}
          {arcs.map((arc) => {
            const isActive = !activeKey || activeKey === arc.key
            const span = Math.max(0, arc.endAngle - arc.startAngle - GAP)
            if (span <= 0) return null
            const d = arcPath(cx, cy, r, arc.startAngle + GAP / 2, arc.startAngle + GAP / 2 + span)
            const sw = activeKey === arc.key ? thickness + 6 : thickness
            return (
              <path
                key={arc.key}
                d={d}
                fill="none"
                strokeWidth={sw}
                stroke={arc.color}
                strokeLinecap="butt"
                opacity={isActive ? 1 : 0.12}
                filter={activeKey === arc.key ? `url(#glow-${arc.key})` : undefined}
                style={{
                  transition: 'opacity 250ms ease, stroke-width 250ms cubic-bezier(0.34,1.56,0.64,1)',
                  cursor: 'pointer',
                }}
                onClick={() => onSegmentClick?.(activeKey === arc.key ? null : arc.key)}
              />
            )
          })}
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 2, pointerEvents: 'none',
        }}>
          <span style={{
            fontSize: 22, fontWeight: 800, color: '#fafafa',
            fontVariantNumeric: 'tabular-nums', lineHeight: 1,
            letterSpacing: '-0.04em',
          }}>
            {centerLabel ?? displayTotal}
          </span>
          {centerSub && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>{centerSub}</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '5px 12px' }}>
        {segments.map((seg) => {
          const isActive = !activeKey || activeKey === seg.key
          return (
            <button
              key={seg.key}
              type="button"
              onClick={() => onSegmentClick?.(activeKey === seg.key ? null : seg.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                opacity: isActive ? 1 : 0.25,
                transition: 'opacity 200ms',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                backgroundColor: seg.color, flexShrink: 0,
                boxShadow: `0 0 6px ${seg.color}88`,
              }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{seg.label}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontVariantNumeric: 'tabular-nums' }}>{seg.value}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
