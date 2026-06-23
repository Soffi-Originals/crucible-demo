import * as React from 'react'
import { cn } from '@/lib/cn'

export interface HeatMapCell {
  day: string      // e.g. "Mon"
  hour: number     // 0–23
  passed: number
  failed: number
  total: number
}

export interface HeatMapProps {
  cells: HeatMapCell[]
  days: string[]
  activeDay?: string | null
  onDayClick?: (day: string | null) => void
  className?: string
  /** Animate-in new cell highlights when a run lands */
  flashKey?: string | null
}

const HOURS = [0, 3, 6, 9, 12, 15, 18, 21]
const HOUR_LABELS = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p']

function cellColor(cell: HeatMapCell): string {
  if (cell.total === 0) return 'transparent'
  const failRate = cell.failed / cell.total
  if (failRate >= 0.5) return `rgba(248,113,113,${Math.min(0.15 + cell.total * 0.07, 0.85)})`
  if (failRate > 0) return `rgba(251,191,36,${Math.min(0.15 + cell.total * 0.07, 0.85)})`
  return `rgba(52,211,153,${Math.min(0.12 + cell.total * 0.07, 0.9)})`
}

function cellBorder(cell: HeatMapCell): string {
  if (cell.total === 0) return 'rgba(255,255,255,0.04)'
  const failRate = cell.failed / cell.total
  if (failRate >= 0.5) return 'rgba(248,113,113,0.4)'
  if (failRate > 0) return 'rgba(251,191,36,0.35)'
  return 'rgba(52,211,153,0.35)'
}

export function HeatMap({
  cells,
  days,
  activeDay,
  onDayClick,
  className,
  flashKey,
}: HeatMapProps) {
  const [flashedKey, setFlashedKey] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!flashKey) return
    setFlashedKey(flashKey)
    const t = setTimeout(() => setFlashedKey(null), 800)
    return () => clearTimeout(t)
  }, [flashKey])

  // Build lookup: "Mon-14" → HeatMapCell
  const lookup = React.useMemo(() => {
    const m: Record<string, HeatMapCell> = {}
    cells.forEach((c) => {
      const bucket = Math.floor(c.hour / 3) * 3
      const key = `${c.day}-${bucket}`
      if (!m[key]) m[key] = { ...c, hour: bucket }
      else {
        m[key].passed += c.passed
        m[key].failed += c.failed
        m[key].total += c.total
      }
    })
    return m
  }, [cells])

  const maxTotal = React.useMemo(() => {
    return Math.max(...Object.values(lookup).map((c) => c.total), 1)
  }, [lookup])

  const [tooltip, setTooltip] = React.useState<{
    x: number; y: number; cell: HeatMapCell
  } | null>(null)

  return (
    <div className={cn('flex flex-col gap-2 select-none', className)}>
      {/* Day headers */}
      <div className="flex ml-7">
        {days.map((day) => {
          const isActive = !activeDay || activeDay === day
          return (
            <button
              key={day}
              type="button"
              onClick={() => onDayClick?.(activeDay === day ? null : day)}
              className={cn(
                'flex-1 text-center transition-opacity duration-150 focus-visible:outline-none',
              )}
              style={{ opacity: isActive ? 1 : 0.3 }}
            >
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: activeDay === day ? '#34d399' : 'rgba(255,255,255,0.45)',
                display: 'block',
                paddingBottom: 4,
              }}>
                {day}
              </span>
            </button>
          )
        })}
      </div>

      {/* Grid rows = 3-hour buckets */}
      <div className="flex flex-col gap-0.5">
        {HOURS.map((hourStart, hi) => (
          <div key={hourStart} className="flex items-center gap-1">
            {/* Hour label */}
            <span style={{
              width: 24,
              fontSize: '9px',
              color: 'rgba(255,255,255,0.3)',
              textAlign: 'right',
              flexShrink: 0,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {HOUR_LABELS[hi]}
            </span>

            {/* Cells */}
            {days.map((day) => {
              const key = `${day}-${hourStart}`
              const cell = lookup[key] ?? { day, hour: hourStart, passed: 0, failed: 0, total: 0 }
              const isFlashing = flashedKey === key
              const isDayActive = !activeDay || activeDay === day

              return (
                <div
                  key={key}
                  className="flex-1 relative"
                  onMouseEnter={(e) => {
                    if (cell.total > 0) {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setTooltip({ x: rect.left + rect.width / 2, y: rect.top, cell })
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <div
                    style={{
                      height: 18,
                      borderRadius: 3,
                      backgroundColor: cellColor(cell),
                      border: `1px solid ${cellBorder(cell)}`,
                      opacity: isDayActive ? 1 : 0.2,
                      transition: 'background-color 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s',
                      boxShadow: isFlashing
                        ? `0 0 0 2px #34d399, 0 0 8px rgba(52,211,153,0.6)`
                        : cell.failed > 0
                          ? '0 0 4px rgba(248,113,113,0.2)'
                          : 'none',
                      cursor: cell.total > 0 ? 'pointer' : 'default',
                      transform: isFlashing ? 'scale(1.15)' : 'scale(1)',
                    }}
                    onClick={() => cell.total > 0 && onDayClick?.(activeDay === day ? null : day)}
                  />
                  {/* Intensity dot for counts > 3 */}
                  {cell.total >= 3 && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: cell.failed > 0 ? '#f87171' : '#34d399',
                      opacity: 0.9,
                      pointerEvents: 'none',
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-1 ml-7">
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Less</span>
        {[0.1, 0.3, 0.55, 0.75, 0.95].map((alpha) => (
          <div key={alpha} style={{
            width: 12, height: 12, borderRadius: 2,
            backgroundColor: `rgba(52,211,153,${alpha})`,
            border: '1px solid rgba(52,211,153,0.3)',
          }} />
        ))}
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>More</span>
        <span style={{ width: 8 }} />
        <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: 'rgba(248,113,113,0.7)', border: '1px solid rgba(248,113,113,0.4)' }} />
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Failures</span>
      </div>

      {/* Floating tooltip via portal-ish approach */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
            pointerEvents: 'none',
            backgroundColor: '#1c1c1c',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 11,
            color: 'rgba(255,255,255,0.85)',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 2 }}>
            {tooltip.cell.day} {HOUR_LABELS[Math.floor(tooltip.cell.hour / 3)]}–{HOUR_LABELS[Math.floor(tooltip.cell.hour / 3) + 1] ?? '12a'}
          </div>
          <div style={{ color: '#34d399' }}>{tooltip.cell.passed} passed</div>
          {tooltip.cell.failed > 0 && (
            <div style={{ color: '#f87171' }}>{tooltip.cell.failed} failed</div>
          )}
          <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{tooltip.cell.total} total</div>
        </div>
      )}
    </div>
  )
}
