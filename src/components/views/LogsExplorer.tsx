import * as React from 'react'
import { Search, ChevronDown, ChevronRight, Terminal } from 'lucide-react'
import type { RunRecord } from '@/data/runHistory'

export interface LogEntry {
  id: string
  runId: string
  agent: string
  scenario: string
  status: 'passed' | 'failed' | 'cancelled' | 'running' | 'queued'
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  timestamp: number
  durationMs: number
  steps: number
  tokenCount: number
  evalScores: RunRecord['evalScores']
}

const LEVEL_COLOR: Record<LogEntry['level'], string> = {
  info: '#60a5fa',
  warn: '#fbbf24',
  error: '#f87171',
  debug: 'rgba(255,255,255,0.3)',
}

const LEVEL_BG: Record<LogEntry['level'], string> = {
  info: 'rgba(96,165,250,0.1)',
  warn: 'rgba(251,191,36,0.1)',
  error: 'rgba(248,113,113,0.1)',
  debug: 'rgba(255,255,255,0.04)',
}

const AGENT_COLOR: Record<string, string> = {
  Navigator: '#60a5fa',
  Explorer: '#f87171',
  Pioneer: '#34d399',
  Voyager: '#fbbf24',
}

function formatTs(ms: number): string {
  const d = new Date(ms)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  const ss = d.getSeconds().toString().padStart(2, '0')
  const ms3 = d.getMilliseconds().toString().padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms3}`
}

function generateLogLines(entry: LogEntry): { level: string; text: string }[] {
  const lines: { level: string; text: string }[] = []
  const s = entry.scenario.toLowerCase()

  lines.push({ level: 'debug', text: `[init] agent=${entry.agent} run=${entry.runId} scenario="${entry.scenario}"` })

  if (s.includes('refund')) {
    lines.push({ level: 'info', text: '[step/1] fetching booking record from CRM...' })
    lines.push({ level: 'info', text: '[step/2] cancellation window: VALID (within 24h policy)' })
    if (entry.status === 'failed') {
      lines.push({ level: 'warn', text: '[step/3] refund amount calculation: EDGE_CASE — loyalty tier discount conflict' })
      lines.push({ level: 'error', text: '[eval] refundPolicy score below threshold: exiting with status=failed' })
    } else {
      lines.push({ level: 'info', text: '[step/3] refund eligibility: CONFIRMED' })
      lines.push({ level: 'info', text: `[step/4] issuing refund: $${(entry.durationMs * 0.07).toFixed(0)}` })
      lines.push({ level: 'info', text: '[step/5] confirmation email queued' })
    }
  } else if (s.includes('renewal')) {
    lines.push({ level: 'info', text: '[step/1] pulling account health score...' })
    lines.push({ level: 'info', text: '[step/2] renewal proposal drafted — tier: standard' })
    if (entry.status === 'failed') {
      lines.push({ level: 'warn', text: '[step/3] customer churn signals: HIGH (usage down 60%)' })
      lines.push({ level: 'error', text: '[eval] toneDeescalation: 50 — failed threshold' })
    } else {
      lines.push({ level: 'info', text: '[step/3] calendar invite sent' })
      lines.push({ level: 'info', text: '[step/4] CRM activity log written' })
    }
  } else if (s.includes('escalat')) {
    lines.push({ level: 'warn', text: '[step/1] customer sentiment: HOSTILE (score: 0.18)' })
    lines.push({ level: 'info', text: '[step/2] policy limits checked — supervisor needed' })
    if (entry.status === 'failed') {
      lines.push({ level: 'error', text: '[step/3] escalation queue full — fallback failed' })
      lines.push({ level: 'error', text: '[eval] escalationTriggers: 28 — critical failure' })
    } else {
      lines.push({ level: 'info', text: '[step/3] supervisor queue pinged — case ID created' })
    }
  } else if (s.includes('onboard')) {
    lines.push({ level: 'info', text: '[step/1] workspace provisioned' })
    lines.push({ level: 'info', text: '[step/2] team members invited' })
    if (entry.status === 'failed') {
      lines.push({ level: 'error', text: '[step/3] integration hook failed: TIMEOUT after 8s' })
    } else {
      lines.push({ level: 'info', text: '[step/3] first integration connected' })
      lines.push({ level: 'info', text: '[step/4] onboarding checklist: COMPLETE' })
    }
  } else {
    lines.push({ level: 'info', text: '[step/1] context retrieved from knowledge base' })
    lines.push({ level: 'info', text: '[step/2] action executed' })
  }

  if (entry.status === 'passed') {
    lines.push({ level: 'info', text: `[done] status=passed duration=${(entry.durationMs / 1000).toFixed(2)}s steps=${entry.steps} tokens=${entry.tokenCount}` })
  } else if (entry.status === 'failed') {
    lines.push({ level: 'error', text: `[done] status=failed duration=${(entry.durationMs / 1000).toFixed(2)}s` })
  } else if (entry.status === 'cancelled') {
    lines.push({ level: 'warn', text: '[done] status=cancelled — manually stopped' })
  }

  return lines
}

function LogRow({ entry, isNew }: { entry: LogEntry; isNew: boolean }) {
  const [expanded, setExpanded] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [flashing, setFlashing] = React.useState(isNew)

  React.useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  React.useEffect(() => {
    if (!isNew) return
    setFlashing(true)
    const t = setTimeout(() => setFlashing(false), 1000)
    return () => clearTimeout(t)
  }, [isNew])

  const agentColor = AGENT_COLOR[entry.agent] ?? '#737373'
  const lines = expanded ? generateLogLines(entry) : []

  return (
    <div style={{
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'none' : 'translateY(-4px)',
      transition: 'opacity 0.2s ease, transform 0.25s ease',
      backgroundColor: flashing
        ? entry.status === 'passed' ? 'rgba(52,211,153,0.05)' : entry.status === 'failed' ? 'rgba(248,113,113,0.05)' : 'transparent'
        : 'transparent',
    }}>
      {/* Summary row */}
      <div
        onClick={() => setExpanded((p) => !p)}
        style={{
          display: 'grid',
          gridTemplateColumns: '16px 130px 16px auto 80px 60px 80px',
          alignItems: 'center',
          gap: 8,
          padding: '7px 12px',
          cursor: 'pointer',
          fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        }}
      >
        {/* Expand chevron */}
        <span style={{ color: 'rgba(255,255,255,0.2)', display: 'flex' }}>
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>

        {/* Timestamp */}
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums' }}>
          {formatTs(entry.timestamp)}
        </span>

        {/* Level indicator */}
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: entry.level === 'error' ? '#f87171' : entry.level === 'warn' ? '#fbbf24' : '#34d399',
          flexShrink: 0,
        }} />

        {/* Message */}
        <span style={{
          fontSize: 11.5,
          color: entry.level === 'error' ? '#fca5a5' : entry.level === 'warn' ? '#fde68a' : 'rgba(255,255,255,0.7)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {entry.message}
        </span>

        {/* Agent */}
        <span style={{ fontSize: 10, color: agentColor, fontWeight: 600, textAlign: 'right' }}>
          {entry.agent}
        </span>

        {/* Duration */}
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {entry.durationMs > 0 ? `${(entry.durationMs / 1000).toFixed(1)}s` : '—'}
        </span>

        {/* Status pill */}
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 7px',
          borderRadius: 999,
          textAlign: 'center',
          backgroundColor: entry.status === 'passed' ? 'rgba(52,211,153,0.12)' : entry.status === 'failed' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.06)',
          color: entry.status === 'passed' ? '#34d399' : entry.status === 'failed' ? '#f87171' : 'rgba(255,255,255,0.4)',
          border: `1px solid ${entry.status === 'passed' ? 'rgba(52,211,153,0.25)' : entry.status === 'failed' ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.1)'}`,
        }}>
          {entry.status}
        </span>
      </div>

      {/* Expanded log lines */}
      {expanded && (
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.4)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          padding: '10px 12px 10px 36px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        }}>
          {/* Eval scores if available */}
          {Object.values(entry.evalScores).some((v) => v !== null) && (
            <div style={{
              display: 'flex',
              gap: 14,
              marginBottom: 8,
              paddingBottom: 8,
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              flexWrap: 'wrap',
            }}>
              {(Object.entries(entry.evalScores) as [string, number | null][]).map(([k, v]) => {
                if (v === null) return null
                const color = v >= 90 ? '#34d399' : v >= 70 ? '#fbbf24' : '#f87171'
                return (
                  <span key={k} style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                    {k}: <span style={{ color, fontWeight: 700 }}>{v}</span>
                  </span>
                )
              })}
            </div>
          )}

          {lines.map((line, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: LEVEL_COLOR[line.level as LogEntry['level']] ?? 'rgba(255,255,255,0.3)',
                background: LEVEL_BG[line.level as LogEntry['level']] ?? 'transparent',
                padding: '1px 5px',
                borderRadius: 3,
                flexShrink: 0,
                letterSpacing: '0.04em',
                minWidth: 38,
                textAlign: 'center',
              }}>
                {line.level}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                {line.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface LogsExplorerProps {
  entries: LogEntry[]
  newestId?: string | null
}

export function LogsExplorer({ entries, newestId }: LogsExplorerProps) {
  const [search, setSearch] = React.useState('')
  const [levelFilter, setLevelFilter] = React.useState<LogEntry['level'] | 'all'>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  const filtered = React.useMemo(() => {
    return entries.filter((e) => {
      if (levelFilter !== 'all' && e.level !== levelFilter) return false
      if (statusFilter !== 'all' && e.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          e.message.toLowerCase().includes(q) ||
          e.agent.toLowerCase().includes(q) ||
          e.scenario.toLowerCase().includes(q) ||
          e.runId.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [entries, search, levelFilter, statusFilter])

  const btnStyle = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '3px 10px',
    borderRadius: 6,
    border: `1px solid ${active ? (color ? `${color}55` : 'rgba(255,255,255,0.2)') : 'rgba(255,255,255,0.08)'}`,
    backgroundColor: active ? (color ? `${color}18` : 'rgba(255,255,255,0.06)') : 'transparent',
    color: active ? (color ?? 'rgba(255,255,255,0.85)') : 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.12s',
  })

  return (
    <div style={{
      backgroundColor: '#0d0d0d',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Toolbar */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        flexShrink: 0,
        backgroundColor: '#111111',
      }}>
        <Terminal size={13} color="rgba(255,255,255,0.3)" />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginRight: 4 }}>Logs</span>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 140, maxWidth: 260, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 8px' }}>
          <Search size={11} color="rgba(255,255,255,0.25)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter logs..."
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              fontSize: 11,
              color: 'rgba(255,255,255,0.7)',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Level filters */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'info', 'warn', 'error', 'debug'] as const).map((l) => (
            <button key={l} type="button" style={btnStyle(levelFilter === l, l === 'error' ? '#f87171' : l === 'warn' ? '#fbbf24' : l === 'info' ? '#60a5fa' : undefined)} onClick={() => setLevelFilter(l)}>
              {l}
            </button>
          ))}
        </div>

        {/* Status filters */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'passed', 'failed'] as const).map((s) => (
            <button key={s} type="button" style={btnStyle(statusFilter === s, s === 'passed' ? '#34d399' : s === 'failed' ? '#f87171' : undefined)} onClick={() => setStatusFilter(s)}>
              {s}
            </button>
          ))}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.2)', fontVariantNumeric: 'tabular-nums' }}>
          {filtered.length} / {entries.length}
        </span>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '16px 130px 16px auto 80px 60px 80px',
        gap: 8,
        padding: '5px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: '#111111',
      }}>
        {['', 'Timestamp', '', 'Message', 'Agent', 'Duration', 'Status'].map((h, i) => (
          <span key={i} style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.2)',
            fontFamily: 'inherit',
            textAlign: i >= 4 ? 'right' : 'left',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* Log rows */}
      <div style={{ maxHeight: 320, overflowY: 'auto', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
            {entries.length === 0
              ? '⏳ No log entries yet — runs will stream in here.'
              : 'No entries match your filters.'}
          </div>
        ) : (
          filtered.slice(0, 60).map((entry, i) => (
            <LogRow key={entry.id} entry={entry} isNew={i === 0 && entry.id === newestId} />
          ))
        )}
      </div>
    </div>
  )
}
