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
  if (!cell || cell.total === 0) return 'rgba(255,255,255,0.04)'
  const failRatio = cell.failed / cell.total
  const intensity = Math.min(cell.total / 10, 1)
  if (failRatio > 0.4) return `rgba(248,113,113,${0.20 + intensity * 0.52})`
  if (failRatio > 0.15) return `rgba(251,191,36,${0.20 + intensity * 0.48})`
  return `rgba(52,211,153,${0.16 + intensity * 0.54})`
}

function cellBorderColor(cell: HeatCell | undefined): string {
  if (!cell || cell.total === 0) return 'rgba(255,255,255,0.06)'
  const failRatio = cell.failed / cell.total
  if (failRatio > 0.4) return 'rgba(248,113,113,0.45)'
  if (failRatio > 0.15) return 'rgba(251,191,36,0.45)'
  return 'rgba(52,211,153,0.40)'
}

function cellGlow(cell: HeatCell | undefined): string {
  if (!cell || cell.total === 0) return 'none'
  const failRatio = cell.failed / cell.total
  if (failRatio > 0.4) return '0 0 14px rgba(248,113,113,0.28)'
  if (failRatio > 0.15) return '0 0 14px rgba(251,191,36,0.22)'
  return '0 0 14px rgba(52,211,153,0.22)'
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

  const ROW_H = 52

  return (
    <div style={{ overflowX: 'auto', position: 'relative' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `100px repeat(${cols.length}, 1fr)`,
        gap: 5,
        minWidth: 420,
      }}>
        {/* Corner */}
        <div />

        {/* Column headers */}
        {cols.map((col) => (
          <button
            key={col}
            type="button"
            onClick={() => onColClick?.(activeCol === col ? null : col)}
            style={{
              background: activeCol === col
                ? 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.16))'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${activeCol === col ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8,
              padding: '7px 4px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (activeCol !== col) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
              }
            }}
            onMouseLeave={(e) => {
              if (activeCol !== col) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }
            }}
          >
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: activeCol === col ? '#a78bfa' : 'rgba(255,255,255,0.65)',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {col}
            </span>
          </button>
        ))}

        {/* Rows */}
        {rows.map((row) => (
          <React.Fragment key={row}>
            <button
              type="button"
              onClick={() => onRowClick?.(activeRow === row ? null : row)}
              style={{
                background: activeRow === row ? 'rgba(99,102,241,0.14)' : 'transparent',
                border: activeRow === row ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                borderRadius: 8,
                padding: '4px 12px',
                cursor: 'pointer',
                textAlign: 'right',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: ROW_H,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (activeRow !== row) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeRow !== row) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: activeRow === row ? '#a78bfa' : 'rgba(255,255,255,0.75)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
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
                    height: ROW_H,
                    borderRadius: 10,
                    backgroundColor: cellColor(cell),
                    border: `1px solid ${cellBorderColor(cell)}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    opacity: (!activeRow && !activeCol) ? 1 : isActive ? 1 : 0.1,
                    transition: 'opacity 0.25s ease, box-shadow 0.3s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    boxShadow: isFlashing
                      ? '0 0 0 2px rgba(52,211,153,0.9), 0 0 24px rgba(52,211,153,0.5)'
                      : cellGlow(cell),
                    transform: isFlashing ? 'scale(1.08)' : 'scale(1)',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: cell?.total ? 'default' : 'default',
                  }}
                >
                  {/* Flash shimmer */}
                  {isFlashing && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, rgba(52,211,153,0.35) 0%, transparent 60%)',
                      borderRadius: 10,
                    }} />
                  )}

                  {cell && cell.total > 0 ? (
                    <>
                      <span style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: '#ffffff',
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '-0.02em',
                      }}>
                        {cell.total}
                      </span>
                      {cell.failed > 0 ? (
                        <span style={{
                          fontSize: 10,
                          color: '#fca5a5',
                          fontWeight: 700,
                          letterSpacing: '0.02em',
                        }}>
                          {cell.failed}✗
                        </span>
                      ) : passRate !== null ? (
                        <span style={{
                          fontSize: 10,
                          color: 'rgba(52,211,153,0.85)',
                          fontWeight: 600,
                        }}>
                          100%
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.10)' }}>·</span>
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
        const pr = cell.total > 0 ? Math.round((cell.passed / cell.total) * 100) : 0
        return (
          <div style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
            background: '#1C1C26',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: 10,
            padding: '10px 14px',
            pointerEvents: 'none',
            zIndex: 9999,
            minWidth: 150,
            boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
          }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: 8,
            }}>
              {rowKey} × {colKey}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.45)',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 20,
              }}>
                <span>Total runs</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>{cell.total}</span>
              </div>
              <div style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.45)',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 20,
              }}>
                <span>Pass rate</span>
                <span style={{
                  color: pr >= 80 ? '#34d399' : pr >= 60 ? '#fbbf24' : '#f87171',
                  fontWeight: 700,
                }}>
                  {pr}%
                </span>
              </div>
              {cell.passed > 0 && (
                <div style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.45)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 20,
                }}>
                  <span>Passed</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>{cell.passed}</span>
                </div>
              )}
              {cell.failed > 0 && (
                <div style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.45)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 20,
                }}>
                  <span>Failures</span>
                  <span style={{ color: '#f87171', fontWeight: 600 }}>{cell.failed}</span>
                </div>
              )}
            </div>
            {/* Mini progress bar */}
            <div style={{
              marginTop: 8,
              height: 3,
              borderRadius: 99,
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${pr}%`,
                height: '100%',
                borderRadius: 99,
                background: pr >= 80 ? '#34d399' : pr >= 60 ? '#fbbf24' : '#f87171',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )
      })()}

      {/* Legend */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        marginTop: 14,
        paddingLeft: 105,
        flexWrap: 'wrap',
      }}>
        {[
          { color: 'rgba(52,211,153,0.65)',  border: 'rgba(52,211,153,0.45)',  label: 'All passed' },
          { color: 'rgba(251,191,36,0.60)',  border: 'rgba(251,191,36,0.45)',  label: 'Mixed results' },
          { color: 'rgba(248,113,113,0.65)', border: 'rgba(248,113,113,0.45)', label: 'High failures' },
          { color: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)', label: 'No data' },
        ].map(({ color, border, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 11,
              height: 11,
              borderRadius: 4,
              backgroundColor: color,
              border: `1px solid ${border}`,
            }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 500 }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
