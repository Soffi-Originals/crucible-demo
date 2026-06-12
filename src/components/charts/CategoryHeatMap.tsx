import * as React from 'react'

export interface HeatCell {
  rowKey: string
  colKey: string
  passed: number
  failed: number
  total: number
}

interface CategoryHeatMapProps {
  cells: HeatCell[]
  rows: string[]
  cols: string[]
  activeRow?: string | null
  activeCol?: string | null
  onRowClick?: (row: string | null) => void
  onColClick?: (col: string | null) => void
  flashKey?: string | null
}

function cellColor(cell: HeatCell | undefined): string {
  if (!cell || cell.total === 0) return 'rgba(255,255,255,0.025)'
  const failRatio = cell.failed / cell.total
  const intensity = Math.min(cell.total / 10, 1)
  if (failRatio > 0.4) return `rgba(248,113,113,${0.18 + intensity * 0.5})`
  if (failRatio > 0.15) return `rgba(251,191,36,${0.18 + intensity * 0.45})`
  return `rgba(52,211,153,${0.14 + intensity * 0.52})`
}

function cellBorderColor(cell: HeatCell | undefined): string {
  if (!cell || cell.total === 0) return 'rgba(255,255,255,0.04)'
  const failRatio = cell.failed / cell.total
  if (failRatio > 0.4) return 'rgba(248,113,113,0.4)'
  if (failRatio > 0.15) return 'rgba(251,191,36,0.4)'
  return 'rgba(52,211,153,0.35)'
}

function cellGlow(cell: HeatCell | undefined): string {
  if (!cell || cell.total === 0) return 'none'
  const failRatio = cell.failed / cell.total
  if (failRatio > 0.4) return '0 0 12px rgba(248,113,113,0.25)'
  if (failRatio > 0.15) return '0 0 12px rgba(251,191,36,0.2)'
  return '0 0 12px rgba(52,211,153,0.2)'
}

export function CategoryHeatMap({
  cells, rows, cols,
  activeRow, activeCol,
  onRowClick, onColClick,
  flashKey,
}: CategoryHeatMapProps) {
  const [flashedKey, setFlashedKey] = React.useState<string | null>(null)
  const [tooltip, setTooltip] = React.useState<{ key: string; x: number; y: number } | null>(null)

  React.useEffect(() => {
    if (!flashKey) return
    setFlashedKey(flashKey)
    const t = setTimeout(() => setFlashedKey(null), 900)
    return () => clearTimeout(t)
  }, [flashKey])

  const index = React.useMemo(() => {
    const m: Record<string, HeatCell> = {}
    cells.forEach((c) => { m[`${c.rowKey}|${c.colKey}`] = c })
    return m
  }, [cells])

  const ROW_H = 44

  return (
    <div style={{ overflowX: 'auto', position: 'relative' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `90px repeat(${cols.length}, 1fr)`,
        gap: 4,
      }}>
        {/* Corner */}
        <div />
        {cols.map((col) => (
          <button
            key={col}
            type="button"
            onClick={() => onColClick?.(activeCol === col ? null : col)}
            style={{
              background: activeCol === col
                ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))'
                : 'transparent',
              border: `1px solid ${activeCol === col ? 'rgba(99,102,241,0.5)' : 'transparent'}`,
              borderRadius: 7,
              padding: '5px 4px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s',
            }}
          >
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
              color: activeCol === col ? '#a78bfa' : 'rgba(255,255,255,0.38)',
              display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {col}
            </span>
          </button>
        ))}

        {rows.map((row) => (
          <React.Fragment key={row}>
            <button
              type="button"
              onClick={() => onRowClick?.(activeRow === row ? null : row)}
              style={{
                background: activeRow === row ? 'rgba(99,102,241,0.12)' : 'transparent',
                border: 'none', borderRadius: 7, padding: '4px 10px',
                cursor: 'pointer', textAlign: 'right',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                height: ROW_H, transition: 'all 0.15s',
              }}
            >
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: activeRow === row ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {row}
              </span>
            </button>

            {cols.map((col) => {
              const key = `${row}|${col}`
              const cell = index[key]
              const isFlashing = flashedKey === key
              const isActive = (!activeRow || activeRow === row) && (!activeCol || activeCol === col)
              const passRate = cell && cell.total > 0
                ? Math.round((cell.passed / cell.total) * 100)
                : null

              return (
                <div
                  key={col}
                  onMouseEnter={(e) => {
                    if (cell?.total) {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setTooltip({ key, x: rect.left + rect.width / 2, y: rect.top })
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    height: ROW_H, borderRadius: 8,
                    backgroundColor: cellColor(cell),
                    border: `1px solid ${cellBorderColor(cell)}`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 2,
                    opacity: (!activeRow && !activeCol) ? 1 : isActive ? 1 : 0.12,
                    transition: 'opacity 0.25s ease, box-shadow 0.3s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1), background-color 0.4s ease',
                    boxShadow: isFlashing
                      ? '0 0 0 2px rgba(52,211,153,0.9), 0 0 20px rgba(52,211,153,0.5)'
                      : cellGlow(cell),
                    transform: isFlashing ? 'scale(1.08)' : 'scale(1)',
                    cursor: cell?.total ? 'default' : 'default',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Subtle shimmer on flash */}
                  {isFlashing && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(135deg, rgba(52,211,153,0.3) 0%, transparent 60%)',
                      borderRadius: 8,
                      animation: 'shimmerFade 0.9s ease-out forwards',
                    }} />
                  )}
                  {cell && cell.total > 0 ? (
                    <>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
                        {cell.total}
                      </span>
                      {cell.failed > 0 ? (
                        <span style={{ fontSize: 9, color: '#f87171', fontWeight: 700, letterSpacing: '0.02em' }}>
                          {cell.failed}✗
                        </span>
                      ) : passRate !== null ? (
                        <span style={{ fontSize: 9, color: 'rgba(52,211,153,0.8)', fontWeight: 600 }}>
                          100%
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.08)' }}>·</span>
                  )}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (() => {
        const cell = index[tooltip.key]
        if (!cell) return null
        const [rowKey, colKey] = tooltip.key.split('|')
        const passRate = cell.total > 0 ? Math.round((cell.passed / cell.total) * 100) : 0
        return (
          <div style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
            background: '#1a1a1a',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            padding: '8px 12px',
            pointerEvents: 'none',
            zIndex: 9999,
            minWidth: 140,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#fafafa', marginBottom: 5 }}>
              {rowKey} × {colKey}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <span>Total runs</span>
                <span style={{ color: '#fafafa', fontWeight: 600 }}>{cell.total}</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <span>Pass rate</span>
                <span style={{ color: passRate >= 80 ? '#34d399' : passRate >= 60 ? '#fbbf24' : '#f87171', fontWeight: 700 }}>
                  {passRate}%
                </span>
              </div>
              {cell.failed > 0 && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span>Failures</span>
                  <span style={{ color: '#f87171', fontWeight: 600 }}>{cell.failed}</span>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, paddingLeft: 94 }}>
        {[
          { color: 'rgba(52,211,153,0.6)', label: 'All passed', glow: 'rgba(52,211,153,0.3)' },
          { color: 'rgba(251,191,36,0.6)', label: 'Mixed', glow: 'rgba(251,191,36,0.3)' },
          { color: 'rgba(248,113,113,0.6)', label: 'High failures', glow: 'rgba(248,113,113,0.3)' },
          { color: 'rgba(255,255,255,0.06)', label: 'No data', glow: 'none' },
        ].map(({ color, label, glow }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color, boxShadow: `0 0 6px ${glow}` }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
