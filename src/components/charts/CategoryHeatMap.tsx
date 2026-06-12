import * as React from 'react'
import { cn } from '@/lib/cn'

export interface HeatCell {
  rowKey: string   // e.g. agent name
  colKey: string   // e.g. scenario category
  passed: number
  failed: number
  total: number
}

interface CategoryHeatMapProps {
  cells: HeatCell[]
  rows: string[]   // ordered row labels
  cols: string[]   // ordered col labels
  activeRow?: string | null
  activeCol?: string | null
  onRowClick?: (row: string | null) => void
  onColClick?: (col: string | null) => void
  flashKey?: string | null  // `${rowKey}|${colKey}`
}

function cellColor(cell: HeatCell | undefined): string {
  if (!cell || cell.total === 0) return 'rgba(255,255,255,0.03)'
  const failRatio = cell.failed / cell.total
  const intensity = Math.min(cell.total / 8, 1) // saturate at 8 runs
  if (failRatio > 0.4) {
    // red-ish
    return `rgba(248,113,113,${0.15 + intensity * 0.45})`
  }
  if (failRatio > 0.15) {
    // amber
    return `rgba(251,191,36,${0.15 + intensity * 0.45})`
  }
  // green
  return `rgba(52,211,153,${0.12 + intensity * 0.48})`
}

function cellBorder(cell: HeatCell | undefined): string {
  if (!cell || cell.total === 0) return 'rgba(255,255,255,0.05)'
  const failRatio = cell.failed / cell.total
  if (failRatio > 0.4) return 'rgba(248,113,113,0.35)'
  if (failRatio > 0.15) return 'rgba(251,191,36,0.35)'
  return 'rgba(52,211,153,0.3)'
}

export function CategoryHeatMap({
  cells,
  rows,
  cols,
  activeRow,
  activeCol,
  onRowClick,
  onColClick,
  flashKey,
}: CategoryHeatMapProps) {
  const [flashedKey, setFlashedKey] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!flashKey) return
    setFlashedKey(flashKey)
    const t = setTimeout(() => setFlashedKey(null), 800)
    return () => clearTimeout(t)
  }, [flashKey])

  // Index cells by rowKey|colKey
  const index = React.useMemo(() => {
    const m: Record<string, HeatCell> = {}
    cells.forEach((c) => { m[`${c.rowKey}|${c.colKey}`] = c })
    return m
  }, [cells])

  const COL_W = Math.max(64, Math.floor(340 / Math.max(cols.length, 1)))
  const ROW_H = 38

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `80px repeat(${cols.length}, ${COL_W}px)`,
        gap: 3,
        minWidth: 80 + cols.length * (COL_W + 3),
      }}>
        {/* Header row */}
        <div /> {/* empty corner */}
        {cols.map((col) => (
          <button
            key={col}
            type="button"
            onClick={() => onColClick?.(activeCol === col ? null : col)}
            style={{
              background: activeCol === col ? 'rgba(96,165,250,0.15)' : 'transparent',
              border: `1px solid ${activeCol === col ? 'rgba(96,165,250,0.4)' : 'transparent'}`,
              borderRadius: 6,
              padding: '4px 4px',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: activeCol === col ? '#60a5fa' : 'rgba(255,255,255,0.4)',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {col}
            </span>
          </button>
        ))}

        {/* Data rows */}
        {rows.map((row) => (
          <React.Fragment key={row}>
            {/* Row label */}
            <button
              type="button"
              onClick={() => onRowClick?.(activeRow === row ? null : row)}
              style={{
                background: activeRow === row ? 'rgba(96,165,250,0.1)' : 'transparent',
                border: 'none',
                borderRadius: 6,
                padding: '4px 8px',
                cursor: 'pointer',
                textAlign: 'right',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: ROW_H,
              }}
            >
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: activeRow === row ? '#60a5fa' : 'rgba(255,255,255,0.55)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {row}
              </span>
            </button>

            {/* Cells */}
            {cols.map((col) => {
              const key = `${row}|${col}`
              const cell = index[key]
              const isFlashing = flashedKey === key
              const isActive = (activeRow === null || activeRow === row) && (activeCol === null || activeCol === col)

              return (
                <div
                  key={col}
                  style={{
                    height: ROW_H,
                    borderRadius: 6,
                    backgroundColor: cellColor(cell),
                    border: `1px solid ${cellBorder(cell)}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    opacity: (!activeRow && !activeCol) ? 1 : isActive ? 1 : 0.25,
                    transition: 'opacity 0.2s ease, background-color 0.4s ease, box-shadow 0.3s ease',
                    boxShadow: isFlashing ? '0 0 0 2px rgba(52,211,153,0.8), 0 0 12px rgba(52,211,153,0.4)' : 'none',
                    transform: isFlashing ? 'scale(1.06)' : 'scale(1)',
                    cursor: cell?.total ? 'default' : 'default',
                  }}
                >
                  {cell && cell.total > 0 ? (
                    <>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                        {cell.total}
                      </span>
                      {cell.failed > 0 && (
                        <span style={{ fontSize: 9, color: '#f87171', fontWeight: 600 }}>
                          {cell.failed}✗
                        </span>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.1)' }}>·</span>
                  )}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10, paddingLeft: 83 }}>
        {[
          { color: 'rgba(52,211,153,0.55)', label: 'All passed' },
          { color: 'rgba(251,191,36,0.55)', label: 'Some failures' },
          { color: 'rgba(248,113,113,0.55)', label: 'High failure rate' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>No runs</span>
        </div>
      </div>
    </div>
  )
}
