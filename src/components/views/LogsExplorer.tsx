import * as React from 'react'
import { Search, ChevronDown, ChevronRight, Terminal, Clock, AlertTriangle, TrendingUp, Zap } from 'lucide-react'
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

function formatRelative(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 5000) return 'just now'
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`
  return `${Math.round(diff / 60000)}m ago`
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

// ── 2-min analysis panel ──────────────────────────────────────────────────────
interface InsightPanelProps {
  entries: LogEntry[]
  windowMs: number
}

function InsightPanel({ entries, windowMs }: InsightPanelProps) {
  const now = Date.now()
  const inWindow = entries.filter((e) => now - e.timestamp <= windowMs)

  if (inWindow.length === 0) {
    return (
      <div style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.2)', fontSize: 12, textAlign: 'center' }}>
        No runs in the last {Math.round(windowMs / 1000)}s window yet.
      </div>
    )
  }

  const failures = inWindow.filter((e) => e.status === 'failed')
  const passed = inWindow.filter((e) => e.status === 'passed')
  const passRate = inWindow.length > 0 ? Math.round((passed.length / inWindow.length) * 100) : 0

  // Avg duration of finished runs
  const finished = inWindow.filter((e) => e.durationMs > 0)
  const avgDur = finished.length > 0
    ? finished.reduce((s, e) => s + e.durationMs, 0) / finished.length / 1000
    : 0

  // Slowest run
  const slowest = finished.length > 0
    ? finished.reduce((a, b) => (a.durationMs > b.durationMs ? a : b))
    : null

  // Most failing agent
  const agentFails: Record<string, number> = {}
  failures.forEach((e) => { agentFails[e.agent] = (agentFails[e.agent] ?? 0) + 1 })
  const worstAgent = Object.entries(agentFails).sort((a, b) => b[1] - a[1])[0]

  // Consecutive failure streak at head
  let streak = 0
  for (const e of inWindow) {
    if (e.status === 'failed') streak++
    else break
  }

  // Eval score averages
  const evalKeys = ['refundPolicy', 'piiHandling', 'toneDeescalation', 'escalationTriggers'] as const
  const evalAvgs: Record<string, number | null> = {}
  evalKeys.forEach((k) => {
    const vals = inWindow.map((e) => e.evalScores[k]).filter((v): v is number => v !== null)
    evalAvgs[k] = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null
  })

  // Error rate trend: compare first half vs second half of window
  const half = windowMs / 2
  const firstHalf = inWindow.filter((e) => now - e.timestamp > half)
  const secondHalf = inWindow.filter((e) => now - e.timestamp <= half)
  const firstFailRate = firstHalf.length > 0 ? firstHalf.filter((e) => e.status === 'failed').length / firstHalf.length : 0
  const secondFailRate = secondHalf.length > 0 ? secondHalf.filter((e) => e.status === 'failed').length / secondHalf.length : 0
  const trend = secondFailRate > firstFailRate + 0.1 ? 'worsening' : secondFailRate < firstFailRate - 0.1 ? 'improving' : 'stable'

  const statBox = (label: string, value: React.ReactNode, sub?: string, color?: string) => (
    <div style={{
      backgroundColor: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 8,
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
        {label}
      </span>
      <span style={{ fontSize: 18, fontWeight: 700, color: color ?? '#fafafa', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)' }}>{sub}</span>}
    </div>
  )

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Headline summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {trend === 'worsening' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 11, fontWeight: 600 }}>
            <AlertTriangle size={11} /> Failure rate rising
          </div>
        )}
        {trend === 'improving' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, backgroundColor: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', fontSize: 11, fontWeight: 600 }}>
            <TrendingUp size={11} /> Recovering
          </div>
        )}
        {streak >= 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, backgroundColor: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: 11, fontWeight: 600 }}>
            <Zap size={11} /> {streak} consecutive failures
          </div>
        )}
        {worstAgent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
            {worstAgent[0]} failing most ({worstAgent[1]}×)
          </div>
        )}
      </div>

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {statBox('Runs', inWindow.length, `${Math.round(windowMs / 1000)}s window`)}
        {statBox('Pass rate', `${passRate}%`, `${passed.length}p / ${failures.length}f`, passRate >= 80 ? '#34d399' : passRate >= 60 ? '#fbbf24' : '#f87171')}
        {statBox('Avg duration', `${avgDur.toFixed(1)}s`, 'finished runs only', '#60a5fa')}
        {slowest
          ? statBox('Slowest', `${(slowest.durationMs / 1000).toFixed(1)}s`, `${slowest.agent} · ${slowest.scenario.split('·')[0].trim()}`, '#fbbf24')
          : statBox('Slowest', '—', 'no data')}
      </div>

      {/* Eval score averages */}
      {Object.values(evalAvgs).some((v) => v !== null) && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 8 }}>
            Eval averages
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {evalKeys.map((k) => {
              const v = evalAvgs[k]
              if (v === null) return null
              const color = v >= 90 ? '#34d399' : v >= 70 ? '#fbbf24' : '#f87171'
              return (
                <div key={k} style={{
                  flex: 1, minWidth: 90,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: `1px solid rgba(255,255,255,0.06)`,
                  borderRadius: 6,
                  padding: '8px 10px',
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>
                    {k.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
                    <div style={{ flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
                      <div style={{ width: `${v}%`, height: '100%', backgroundColor: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Failure log */}
      {failures.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: 6 }}>
            Failures in window
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {failures.slice(0, 5).map((e) => (
              <div key={e.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 10px',
                borderRadius: 6,
                backgroundColor: 'rgba(248,113,113,0.06)',
                border: '1px solid rgba(248,113,113,0.12)',
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#f87171', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.scenario}
                </span>
                <span style={{ fontSize: 10, color: AGENT_COLOR[e.agent] ?? '#737373', fontWeight: 600, flexShrink: 0 }}>{e.agent}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', flexShrink: 0 }}>
                  {(e.durationMs / 1000).toFixed(1)}s
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{formatRelative(e.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── log row ───────────────────────────────────────────────────────────────────
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
      <div
        onClick={() => setExpanded((p) => !p)}
        style={{
          display: 'grid',
          gridTemplateColumns: '16px 120px 14px 1fr 76px 54px 72px',
          alignItems: 'center',
          gap: 8,
          padding: '7px 12px',
          cursor: 'pointer',
          fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
        }}
      >
        <span style={{ color: 'rgba(255,255,255,0.2)', display: 'flex' }}>
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>

        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', fontVariantNumeric: 'tabular-nums' }}>
          {formatTs(entry.timestamp)}
        </span>

        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: entry.level === 'error' ? '#f87171' : entry.level === 'warn' ? '#fbbf24' : '#34d399',
          flexShrink: 0,
        }} />

        <span style={{
          fontSize: 11.5,
          color: entry.level === 'error' ? '#fca5a5' : entry.level === 'warn' ? '#fde68a' : 'rgba(255,255,255,0.7)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {entry.message}
        </span>

        <span style={{ fontSize: 10, color: agentColor, fontWeight: 600, textAlign: 'right' }}>
          {entry.agent}
        </span>

        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {entry.durationMs > 0 ? `${(entry.durationMs / 1000).toFixed(1)}s` : '—'}
        </span>

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

      {expanded && (
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.4)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          padding: '10px 12px 10px 36px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        }}>
          {Object.values(entry.evalScores).some((v) => v !== null) && (
            <div style={{ display: 'flex', gap: 14, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
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
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                color: LEVEL_COLOR[line.level as LogEntry['level']] ?? 'rgba(255,255,255,0.3)',
                background: LEVEL_BG[line.level as LogEntry['level']] ?? 'transparent',
                padding: '1px 5px', borderRadius: 3, flexShrink: 0,
                letterSpacing: '0.04em', minWidth: 38, textAlign: 'center',
              }}>
                {line.level}
              </span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{line.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────
interface LogsExplorerProps {
  entries: LogEntry[]
  newestId?: string | null
  brushRange?: [number, number] | null // epoch ms range from chart brush
}

type WindowPreset = 30 | 60 | 120

export function LogsExplorer({ entries, newestId, brushRange }: LogsExplorerProps) {
  const [search, setSearch] = React.useState('')
  const [levelFilter, setLevelFilter] = React.useState<LogEntry['level'] | 'all'>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [activeTab, setActiveTab] = React.useState<'logs' | 'insights'>('logs')
  const [windowSec, setWindowSec] = React.useState<WindowPreset>(120)

  // Resolve what time range is active
  const effectiveRange: [number, number] | null = React.useMemo(() => {
    if (brushRange) return brushRange
    const now = Date.now()
    return [now - windowSec * 1000, now]
  }, [brushRange, windowSec])

  const insightEntries = React.useMemo(() => {
    if (!effectiveRange) return entries
    return entries.filter((e) => e.timestamp >= effectiveRange[0] && e.timestamp <= effectiveRange[1])
  }, [entries, effectiveRange])

  const filtered = React.useMemo(() => {
    return insightEntries.filter((e) => {
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
  }, [insightEntries, search, levelFilter, statusFilter])

  const btnStyle = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '3px 9px',
    borderRadius: 5,
    border: `1px solid ${active ? (color ? `${color}55` : 'rgba(255,255,255,0.2)') : 'rgba(255,255,255,0.07)'}`,
    backgroundColor: active ? (color ? `${color}18` : 'rgba(255,255,255,0.05)') : 'transparent',
    color: active ? (color ?? 'rgba(255,255,255,0.85)') : 'rgba(255,255,255,0.28)',
    fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
  })

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px',
    borderRadius: 6,
    border: 'none',
    backgroundColor: active ? 'rgba(255,255,255,0.07)' : 'transparent',
    color: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  })

  const windowMs = effectiveRange ? (effectiveRange[1] - effectiveRange[0]) : windowSec * 1000

  return (
    <div style={{
      backgroundColor: '#0d0d0d',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backgroundColor: '#111111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Terminal size={13} color="rgba(255,255,255,0.3)" />
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2 }}>
            <button type="button" style={tabStyle(activeTab === 'logs')} onClick={() => setActiveTab('logs')}>
              Logs
            </button>
            <button type="button" style={{ ...tabStyle(activeTab === 'insights'), display: 'flex', alignItems: 'center', gap: 5 }} onClick={() => setActiveTab('insights')}>
              <TrendingUp size={11} />
              Analysis
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Time window selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} color="rgba(255,255,255,0.25)" />
            {brushRange ? (
              <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>
                Chart selection · {Math.round(windowMs / 1000)}s
              </span>
            ) : (
              <>
                {([30, 60, 120] as WindowPreset[]).map((s) => (
                  <button key={s} type="button" style={btnStyle(windowSec === s)} onClick={() => setWindowSec(s)}>
                    {s}s
                  </button>
                ))}
              </>
            )}
          </div>

          {activeTab === 'logs' && (
            <>
              {/* Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '4px 8px', minWidth: 130 }}>
                <Search size={11} color="rgba(255,255,255,0.2)" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter logs..."
                  style={{ background: 'none', border: 'none', outline: 'none', fontSize: 11, color: 'rgba(255,255,255,0.7)', width: '100%', fontFamily: 'inherit' }}
                />
              </div>

              {/* Level */}
              <div style={{ display: 'flex', gap: 3 }}>
                {(['all', 'info', 'warn', 'error'] as const).map((l) => (
                  <button key={l} type="button" style={btnStyle(levelFilter === l, l === 'error' ? '#f87171' : l === 'warn' ? '#fbbf24' : l === 'info' ? '#60a5fa' : undefined)} onClick={() => setLevelFilter(l)}>
                    {l}
                  </button>
                ))}
              </div>

              {/* Status */}
              <div style={{ display: 'flex', gap: 3 }}>
                {(['all', 'passed', 'failed'] as const).map((s) => (
                  <button key={s} type="button" style={btnStyle(statusFilter === s, s === 'passed' ? '#34d399' : s === 'failed' ? '#f87171' : undefined)} onClick={() => setStatusFilter(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', fontVariantNumeric: 'tabular-nums' }}>
            {activeTab === 'logs' ? `${filtered.length} / ${entries.length}` : `${insightEntries.length} runs`}
          </span>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'insights' ? (
        <InsightPanel entries={insightEntries} windowMs={windowMs} />
      ) : (
        <>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '16px 120px 14px 1fr 76px 54px 72px',
            gap: 8,
            padding: '5px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            backgroundColor: '#111111',
          }}>
            {['', 'Timestamp', '', 'Message', 'Agent', 'Dur', 'Status'].map((h, i) => (
              <span key={i} style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.18)', textAlign: i >= 4 ? 'right' : 'left',
              }}>
                {h}
              </span>
            ))}
          </div>

          <div style={{ maxHeight: 340, overflowY: 'auto', fontFamily: '"JetBrains Mono", "Fira Code", monospace' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                {entries.length === 0
                  ? '⏳ No log entries yet — runs will stream in here.'
                  : 'No entries match your filters.'}
              </div>
            ) : (
              filtered.slice(0, 80).map((entry, i) => (
                <LogRow key={entry.id} entry={entry} isNew={i === 0 && entry.id === newestId} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
