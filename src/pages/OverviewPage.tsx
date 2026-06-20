import * as React from 'react'
import {
  Pause, Play, Zap, Activity, Bell, X, ChevronUp, ChevronDown,
  CheckCircle, XCircle, Timer, Users, Cpu, TrendingUp,
  Save, Maximize2, Minimize2,
} from 'lucide-react'
import { type RunRecord } from '@/data/runHistory'
import { useLiveFeed, type SpeedSetting } from '@/hooks/useLiveFeed'
import { CategoryHeatMap, type HeatCell } from '@/components/charts/CategoryHeatMap'
import { AnimatedDonut, type DonutSegment } from '@/components/charts/AnimatedDonut'
import { TimeSeriesChart, type TimeSeriesPoint } from '@/components/charts/TimeSeriesChart'
import { LogsExplorer, type LogEntry } from '@/components/views/LogsExplorer'
import { NotificationDrawer, type Notification } from '@/components/views/NotificationDrawer'
import { RunDetailPanel } from '@/components/views/RunDetailPanel'

// ── palette ───────────────────────────────────────────────────────────────────
const AGENT_COLOR: Record<string, string> = {
  Navigator: '#60a5fa',
  Explorer:  '#f87171',
  Pioneer:   '#34d399',
  Voyager:   '#fbbf24',
}
const STATUS_COLOR: Record<string, string> = {
  passed:   '#34d399',
  failed:   '#f87171',
  cancelled:'#fbbf24',
  running:  '#60a5fa',
  queued:   '#737373',
}

function categorize(scenario: string): string {
  const s = scenario.toLowerCase()
  if (s.startsWith('refund'))   return 'Refund'
  if (s.startsWith('renewal'))  return 'Renewal'
  if (s.startsWith('escalat'))  return 'Escalation'
  if (s.startsWith('onboard'))  return 'Onboarding'
  if (s.startsWith('qualify'))  return 'Qualify'
  return 'Other'
}

const CATEGORIES = ['Refund', 'Renewal', 'Escalation', 'Onboarding', 'Qualify']
const AGENTS     = ['Navigator', 'Explorer', 'Pioneer', 'Voyager']

// ── time series builder ───────────────────────────────────────────────────────
function buildTimeSeries(records: RunRecord[]): TimeSeriesPoint[] {
  const NUM = 120
  const now = Date.now()
  const startMs = now - NUM * 1000
  const buckets: TimeSeriesPoint[] = Array.from({ length: NUM }, (_, i) => {
    const tMs = startMs + i * 1000
    const d = new Date(tMs)
    const ss = d.getSeconds().toString().padStart(2, '0')
    const mm = d.getMinutes().toString().padStart(2, '0')
    return { label: `${mm}:${ss}`, passed: 0, failed: 0, total: 0, tsMs: tMs }
  })
  records.forEach((r) => {
    if (r.startedAtMs < startMs) return
    const idx = Math.min(Math.max(Math.floor((r.startedAtMs - startMs) / 1000), 0), NUM - 1)
    buckets[idx].total++
    if (r.status === 'passed') buckets[idx].passed++
    else if (r.status === 'failed') buckets[idx].failed++
  })
  return buckets
}

function buildHeatCells(records: RunRecord[]): HeatCell[] {
  const m: Record<string, HeatCell> = {}
  records.forEach((r) => {
    const col = categorize(r.scenario)
    const k = `${r.agent}|${col}`
    if (!m[k]) m[k] = { rowKey: r.agent, colKey: col, passed: 0, failed: 0, total: 0 }
    m[k].total++
    if (r.status === 'passed') m[k].passed++
    else if (r.status === 'failed') m[k].failed++
  })
  return Object.values(m)
}

// ── log helpers ───────────────────────────────────────────────────────────────
let voyagerFailCount = 0
function runToLogEntry(run: RunRecord): LogEntry {
  const level = run.status === 'failed' ? 'error' : run.status === 'cancelled' ? 'warn' : 'info'
  const dur = (run.durationMs / 1000).toFixed(1)
  const message =
    run.status === 'passed'   ? `✓ ${run.scenario} completed in ${dur}s`
    : run.status === 'failed' ? `✗ ${run.scenario} — evaluation failed`
    : run.status === 'cancelled' ? `⊘ ${run.scenario} — cancelled after ${dur}s`
    : `→ ${run.scenario} — ${run.status}`
  return {
    id: `log-${run.runId}`, runId: run.runId, agent: run.agent, scenario: run.scenario,
    status: run.status as LogEntry['status'], level, message,
    timestamp: run.startedAtMs, durationMs: run.durationMs,
    steps: run.steps, tokenCount: run.tokenCount, evalScores: run.evalScores,
  }
}
function runToNotification(run: RunRecord): Notification {
  if (run.status === 'failed') {
    if (run.agent === 'Voyager') {
      voyagerFailCount++
      return {
        id: `notif-${run.runId}`, type: 'fail', read: false, timestamp: Date.now(),
        title: voyagerFailCount >= 2 ? 'Voyager is having a day' : `${run.agent} failed`,
        body: voyagerFailCount >= 2 ? `Failed again: ${run.scenario}` : run.scenario,
      }
    }
    return { id: `notif-${run.runId}`, type: 'fail', title: `${run.agent} failed`, body: run.scenario, timestamp: Date.now(), read: false }
  }
  if (run.status === 'cancelled') return { id: `notif-${run.runId}`, type: 'warn', title: `${run.agent} cancelled`, body: run.scenario, timestamp: Date.now(), read: false }
  return { id: `notif-${run.runId}`, type: 'pass', title: `${run.agent} passed`, body: `${run.scenario} · ${(run.durationMs / 1000).toFixed(1)}s`, timestamp: Date.now(), read: false }
}

function applyFilters(records: RunRecord[], af: string | null, cf: string | null, sf: string | null) {
  return records.filter((r) => {
    if (af && r.agent !== af) return false
    if (cf && categorize(r.scenario) !== cf) return false
    if (sf && r.status !== sf) return false
    return true
  })
}

// ── rolling number ────────────────────────────────────────────────────────────
function useRollingNumber(target: number, duration = 450) {
  const [display, setDisplay] = React.useState(target)
  const rafRef = React.useRef<number | null>(null)
  const startRef = React.useRef<{ from: number; to: number; t: number } | null>(null)
  React.useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = { from: display, to: target, t: performance.now() }
    const tick = (now: number) => {
      const s = startRef.current!
      const pct = Math.min((now - s.t) / duration, 1)
      const eased = 1 - (1 - pct) ** 3
      setDisplay(Math.round(s.from + (s.to - s.from) * eased))
      if (pct < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])
  return display
}

// ── glassmorphic KPI card ─────────────────────────────────────────────────────
interface KpiProps {
  label: string; value: number; unit?: string; color: string
  icon: React.ReactNode; shake?: boolean; streak?: boolean
  sub?: string; trend?: 'up' | 'down' | null; hero?: boolean
  accentGradient?: string
}

function KpiCard({ label, value, unit, color, icon, shake, streak, sub, trend, hero, accentGradient }: KpiProps) {
  const display = useRollingNumber(value)
  const [isShaking, setIsShaking] = React.useState(false)
  const [hovered, setHovered] = React.useState(false)

  React.useEffect(() => {
    if (!shake) return
    setIsShaking(true)
    const t = setTimeout(() => setIsShaking(false), 500)
    return () => clearTimeout(t)
  }, [shake, value])

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hero
          ? 'linear-gradient(135deg, rgba(22,26,35,0.9) 0%, rgba(16,20,28,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(18,18,24,0.85) 0%, rgba(13,13,18,0.9) 100%)',
        border: `1px solid ${hovered ? `${color}30` : hero ? `${color}20` : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 14,
        padding: hero ? '16px 18px' : '12px 14px',
        display: 'flex', flexDirection: 'column', gap: hero ? 8 : 5,
        position: 'relative', overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: hovered
          ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}20, inset 0 1px 0 rgba(255,255,255,0.05)`
          : '0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        animation: isShaking ? 'kpiShake 0.45s cubic-bezier(0.36,0.07,0.19,0.97)' : 'none',
        cursor: 'default',
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: hero ? 2 : 1,
        background: accentGradient ?? `linear-gradient(90deg, transparent, ${color}80, transparent)`,
        opacity: hovered ? 1 : hero ? 0.6 : 0.3,
        transition: 'opacity 0.25s',
      }} />

      {/* Subtle radial glow */}
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 80, height: 80,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        pointerEvents: 'none',
        opacity: hovered ? 1 : 0.5,
        transition: 'opacity 0.25s',
      }} />

      {streak && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 9, fontWeight: 800, color: '#fbbf24',
          background: 'rgba(251,191,36,0.12)',
          border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: 6, padding: '2px 6px',
          display: 'flex', alignItems: 'center', gap: 3,
          boxShadow: '0 0 12px rgba(251,191,36,0.2)',
          letterSpacing: '0.04em',
        }}>
          🔥 streak
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ color: `${color}70`, display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
          {label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontSize: hero ? 30 : 22, fontWeight: 800,
          color, fontVariantNumeric: 'tabular-nums',
          lineHeight: 1, letterSpacing: '-0.035em',
          textShadow: `0 0 20px ${color}40`,
        }}>
          {display}
        </span>
        {unit && <span style={{ fontSize: hero ? 14 : 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{unit}</span>}
        {trend && (
          <div style={{ marginLeft: 2, color: trend === 'up' ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center' }}>
            {trend === 'up' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </div>
        )}
      </div>

      {sub && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', fontWeight: 500, lineHeight: 1.4 }}>{sub}</span>}
    </div>
  )
}

// ── agent health scoreboard ───────────────────────────────────────────────────
function AgentScoreboard({ records }: { records: RunRecord[] }) {
  const stats = React.useMemo(() => AGENTS.map((agent) => {
    const runs = records.filter((r) => r.agent === agent)
    const passed = runs.filter((r) => r.status === 'passed').length
    const failed = runs.filter((r) => r.status === 'failed').length
    const total = passed + failed
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0
    const fin = runs.filter((r) => r.durationMs > 0)
    const avgDur = fin.length > 0 ? fin.reduce((s, r) => s + r.durationMs, 0) / fin.length / 1000 : 0
    return { agent, passed, failed, total, passRate, avgDur }
  }).sort((a, b) => b.total - a.total), [records])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {stats.map(({ agent, total, passRate, avgDur }) => {
        const color = AGENT_COLOR[agent] ?? '#737373'
        const barColor = passRate >= 80 ? '#34d399' : passRate >= 60 ? '#fbbf24' : '#f87171'
        return (
          <div key={agent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 8px ${color}80`, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', flex: 1 }}>{agent}</span>
              <span style={{ fontSize: 11, color: barColor, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {total > 0 ? `${passRate}%` : '—'}
              </span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right' }}>
                {total > 0 ? `${avgDur.toFixed(1)}s` : '—'}
              </span>
            </div>
            <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                width: `${total > 0 ? passRate : 0}%`, height: '100%',
                background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
                borderRadius: 99,
                boxShadow: `0 0 8px ${barColor}60`,
                transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.03em' }}>{total} runs total</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── run row ───────────────────────────────────────────────────────────────────
function RunRow({ run, isNew, isSelected, onClick }: {
  run: RunRecord; isNew: boolean; isSelected: boolean; onClick: () => void
}) {
  const [mounted, setMounted] = React.useState(false)
  const [flashing, setFlashing] = React.useState(isNew)
  const [hovered, setHovered] = React.useState(false)

  React.useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  React.useEffect(() => {
    if (!isNew) return
    setFlashing(true)
    const t = setTimeout(() => setFlashing(false), 1200)
    return () => clearTimeout(t)
  }, [isNew])

  const agentColor = AGENT_COLOR[run.agent] ?? '#737373'
  const isPassed = run.status === 'passed'
  const isFailed = run.status === 'failed'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center', gap: 8,
        padding: '8px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        cursor: 'pointer',
        backgroundColor: flashing
          ? isPassed ? 'rgba(52,211,153,0.08)' : isFailed ? 'rgba(248,113,113,0.08)' : 'transparent'
          : isSelected ? 'rgba(99,102,241,0.08)' : hovered ? 'rgba(255,255,255,0.025)' : 'transparent',
        borderLeft: isSelected ? '2px solid rgba(99,102,241,0.6)' : '2px solid transparent',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'background-color 0.5s ease, opacity 0.2s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1), border-left-color 0.2s ease',
      }}
    >
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        backgroundColor: STATUS_COLOR[run.status] ?? '#737373',
        boxShadow: isFailed ? '0 0 8px #f87171' : isPassed ? '0 0 6px rgba(52,211,153,0.7)' : 'none',
        flexShrink: 0,
        transition: 'box-shadow 0.3s ease',
      }} />

      {/* Scenario + id — takes remaining space */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: hovered ? '#fafafa' : '#d4d4d4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', transition: 'color 0.15s' }}>
          {run.scenario}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', letterSpacing: '-0.01em' }}>{run.runId}</span>
          <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.04em' }}>
            {categorize(run.scenario).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Agent — hidden on very small screens */}
      <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 5 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: agentColor, boxShadow: `0 0 5px ${agentColor}80`, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{run.agent}</span>
      </div>

      {/* Duration — hidden on very small screens */}
      <span className="hidden sm:inline" style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', minWidth: 36 }}>
        {run.durationMs > 0 ? `${(run.durationMs / 1000).toFixed(1)}s` : '—'}
      </span>

      <span style={{
        fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 999, textAlign: 'center', flexShrink: 0,
        backgroundColor: isPassed ? 'rgba(52,211,153,0.1)' : isFailed ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.05)',
        color: isPassed ? '#34d399' : isFailed ? '#f87171' : 'rgba(255,255,255,0.4)',
        border: `1px solid ${isPassed ? 'rgba(52,211,153,0.25)' : isFailed ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isPassed ? '0 0 8px rgba(52,211,153,0.15)' : isFailed ? '0 0 8px rgba(248,113,113,0.15)' : 'none',
        letterSpacing: '0.03em',
      }}>
        {run.status}
      </span>
    </div>
  )
}

// ── failure ripple ────────────────────────────────────────────────────────────
function FailureRipple({ trigger }: { trigger: number }) {
  const [active, setActive] = React.useState(false)
  React.useEffect(() => {
    if (!trigger) return
    setActive(true)
    const t = setTimeout(() => setActive(false), 900)
    return () => clearTimeout(t)
  }, [trigger])
  if (!active) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 500,
      border: '2px solid rgba(248,113,113,0.4)',
      boxShadow: 'inset 0 0 120px rgba(248,113,113,0.08)',
      animation: 'rippleFade 0.9s ease-out forwards',
      borderRadius: 0,
    }} />
  )
}

// ── glassmorphic panel ────────────────────────────────────────────────────────
interface PanelProps {
  title: string; sub?: string; children: React.ReactNode
  action?: React.ReactNode; accent?: string
  noPad?: boolean
}

function Panel({ title, sub, children, action, accent, noPad }: PanelProps) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'linear-gradient(135deg, rgba(16,17,24,0.92) 0%, rgba(11,12,18,0.95) 100%)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 16,
        padding: noPad ? 0 : '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 12,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: hovered
          ? '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Top accent */}
      {accent && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: accent, opacity: hovered ? 0.8 : 0.4, transition: 'opacity 0.3s' }} />
      )}

      <div style={{ padding: noPad ? '14px 16px 0' : 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em' }}>{title}</div>
          {sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 2, letterSpacing: '0.01em' }}>{sub}</div>}
        </div>
        {action}
      </div>
      {noPad ? (
        <div style={{ padding: '0 16px 14px' }}>{children}</div>
      ) : children}
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────
export function OverviewPage() {
  const { arrived, isPlaying, speed, isLudicrous, togglePlay, setSpeed } = useLiveFeed()

  const [agentFilter,    setAgentFilter]    = React.useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = React.useState<string | null>(null)
  const [statusFilter,   setStatusFilter]   = React.useState<string | null>(null)
  const [selectedRun,    setSelectedRun]    = React.useState<RunRecord | null>(null)
  const [drawerOpen,     setDrawerOpen]     = React.useState(false)
  const [notifications,  setNotifications]  = React.useState<Notification[]>([])
  const [failRipple,     setFailRipple]     = React.useState(0)
  const [streakCount,    setStreakCount]     = React.useState(0)
  const streakRef = React.useRef(0)
  const [newestRunId,  setNewestRunId]  = React.useState<string | null>(null)
  const [newestLogId,  setNewestLogId]  = React.useState<string | null>(null)
  const [hmFlashKey,   setHmFlashKey]   = React.useState<string | null>(null)
  const [logEntries,   setLogEntries]   = React.useState<LogEntry[]>([])
  const [shakeKey,     setShakeKey]     = React.useState(0)
  const [chartBrush,   setChartBrush]   = React.useState<[number, number] | null>(null)
  const [timeSeries,   setTimeSeries]   = React.useState<TimeSeriesPoint[]>([])
  const [logsExpanded, setLogsExpanded] = React.useState(false)
  const [savedLayout,  setSavedLayout]  = React.useState(false)
  const prevLengthRef = React.useRef(0)

  // 1-second time series refresh
  React.useEffect(() => {
    const update = () => setTimeSeries(buildTimeSeries(arrived))
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [arrived])

  // React to new run arrivals
  React.useEffect(() => {
    if (arrived.length <= prevLengthRef.current) return
    const run = arrived[0]
    prevLengthRef.current = arrived.length

    setNewestRunId(run.runId)
    setTimeout(() => setNewestRunId(null), 1200)

    const entry = runToLogEntry(run)
    setNewestLogId(entry.id)
    setTimeout(() => setNewestLogId(null), 1200)
    setLogEntries((p) => [entry, ...p].slice(0, 400))

    const notif = runToNotification(run)
    setNotifications((p) => [notif, ...p].slice(0, 80))

    if (run.status === 'failed') {
      setFailRipple((n) => n + 1)
      setShakeKey((k) => k + 1)
      streakRef.current = 0
      setStreakCount(0)
    } else if (run.status === 'passed') {
      streakRef.current++
      setStreakCount(streakRef.current)
    }

    setHmFlashKey(`${run.agent}|${categorize(run.scenario)}`)
    setTimeout(() => setHmFlashKey(null), 1000)
  }, [arrived.length])

  // Derived data
  const filtered = React.useMemo(
    () => applyFilters(arrived, agentFilter, categoryFilter, statusFilter),
    [arrived, agentFilter, categoryFilter, statusFilter],
  )
  const passCount    = React.useMemo(() => filtered.filter((r) => r.status === 'passed').length, [filtered])
  const failCount    = React.useMemo(() => filtered.filter((r) => r.status === 'failed').length, [filtered])
  const totalFin     = passCount + failCount
  const passRatePct  = totalFin === 0 ? 0 : Math.round((passCount / totalFin) * 100)
  const avgDurS      = React.useMemo(() => {
    const fin = filtered.filter((r) => r.durationMs > 0)
    return fin.length ? Math.round(fin.reduce((s, r) => s + r.durationMs, 0) / fin.length / 100) / 10 : 0
  }, [filtered])
  const avgTokens    = React.useMemo(() => {
    const fin = filtered.filter((r) => r.tokenCount > 0)
    return fin.length ? Math.round(fin.reduce((s, r) => s + r.tokenCount, 0) / fin.length) : 0
  }, [filtered])
  const totalTokens  = React.useMemo(() => filtered.reduce((s, r) => s + r.tokenCount, 0), [filtered])
  const heatCells    = React.useMemo(() => buildHeatCells(arrived), [arrived])

  const statusSegs: DonutSegment[] = React.useMemo(() => {
    const c: Record<string, number> = {}
    filtered.forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1 })
    return (['passed','failed','cancelled','running','queued'] as const)
      .filter((s) => (c[s] ?? 0) > 0)
      .map((s) => ({ key: s, label: s.charAt(0).toUpperCase() + s.slice(1), value: c[s] ?? 0, color: STATUS_COLOR[s] }))
  }, [filtered])

  const agentSegs: DonutSegment[] = React.useMemo(() => {
    const c: Record<string, number> = {}
    filtered.forEach((r) => { c[r.agent] = (c[r.agent] ?? 0) + 1 })
    return Object.entries(c).map(([agent, value]) => ({ key: agent, label: agent, value, color: AGENT_COLOR[agent] ?? '#737373' }))
  }, [filtered])

  const hasFilter  = agentFilter !== null || categoryFilter !== null || statusFilter !== null
  const clearAll   = () => { setAgentFilter(null); setCategoryFilter(null); setStatusFilter(null) }
  const isEmpty    = arrived.length === 0
  const isPaused   = !isPlaying
  const unread     = notifications.filter((n) => !n.read).length

  return (
    <>
      <style>{`
        @keyframes kpiShake {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-5px) rotate(-1deg); }
          30% { transform: translateX(5px) rotate(1deg); }
          50% { transform: translateX(-3px); }
          70% { transform: translateX(3px); }
          90% { transform: translateX(-1px); }
        }
        @keyframes rippleFade {
          0% { opacity: 1; box-shadow: inset 0 0 120px rgba(248,113,113,0.12); }
          100% { opacity: 0; box-shadow: inset 0 0 0 rgba(248,113,113,0); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        button { font-family: inherit; }
      `}</style>

      <FailureRipple trigger={failRipple} />

      {/* Ludicrous mode glow */}
      {isLudicrous && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 400,
          boxShadow: 'inset 0 0 150px rgba(251,191,36,0.07)',
          border: '1px solid rgba(251,191,36,0.08)',
          animation: 'pulseGlow 0.6s ease-in-out infinite',
        }} />
      )}

      {/* Subtle grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      <div style={{
        minHeight: '100%', backgroundColor: '#0a0a0a',
        color: '#fafafa', fontFamily: 'Inter, ui-sans-serif, -apple-system, sans-serif',
        display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1,
      }}>

        {/* ══ TOP CONTROL BAR ══ */}
        <div style={{
          padding: '0 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, rgba(10,10,15,0.98) 0%, rgba(10,10,13,0.95) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          position: 'sticky', top: 0, zIndex: 300, flexShrink: 0,
          boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4)',
        }}>
          {/* Status row — always visible */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isPlaying ? '#34d399' : 'rgba(255,255,255,0.25)', boxShadow: isPlaying ? '0 0 8px #34d399' : 'none', animation: isPlaying ? 'pulseGlow 2s ease-in-out infinite' : 'none', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                {isEmpty
                  ? isPaused ? 'agents on break' : 'agents stretching...'
                  : `${arrived.length} runs · ${isPaused ? 'paused' : 'live'}`}
              </span>
              {isLudicrous && (
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 5, padding: '2px 6px' }}>
                  LUDICROUS
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {/* Speed selector */}
              <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
                {(['1x', '2x', 'ludicrous'] as SpeedSetting[]).map((s) => (
                  <button key={s} type="button" onClick={() => setSpeed(s)} style={{
                    padding: '3px 7px', borderRadius: 5, border: 'none',
                    backgroundColor: speed === s ? (s === 'ludicrous' ? 'rgba(251,191,36,0.15)' : 'rgba(96,165,250,0.15)') : 'transparent',
                    color: speed === s ? (s === 'ludicrous' ? '#fbbf24' : '#60a5fa') : 'rgba(255,255,255,0.28)',
                    fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 2,
                    transition: 'all 0.15s',
                  }}>
                    {s === 'ludicrous' && <Zap size={8} />}
                    {s === 'ludicrous' ? '⚡' : s}
                  </button>
                ))}
              </div>

              {/* Play/pause */}
              <button type="button" onClick={togglePlay} style={{
                padding: '4px 10px', borderRadius: 8,
                border: `1px solid ${isPlaying ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.1)'}`,
                background: isPlaying ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.04)',
                color: isPlaying ? '#34d399' : 'rgba(255,255,255,0.5)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                transition: 'all 0.2s',
              }}>
                {isPlaying ? <Pause size={10} /> : <Play size={10} />}
                <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Resume'}</span>
              </button>

              {/* Save view */}
              <button type="button" onClick={() => { setSavedLayout(true); setTimeout(() => setSavedLayout(false), 2000) }} style={{
                padding: '4px 10px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${savedLayout ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.07)'}`,
                background: savedLayout ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.03)',
                color: savedLayout ? '#34d399' : 'rgba(255,255,255,0.35)',
                fontSize: 11, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s',
              }}>
                <Save size={10} />
                <span className="hidden sm:inline">{savedLayout ? 'Saved!' : 'Save'}</span>
              </button>

              {/* Bell */}
              <button type="button" onClick={() => setDrawerOpen(true)} style={{
                position: 'relative', padding: '4px 8px', borderRadius: 8,
                border: `1px solid ${unread > 0 ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.07)'}`,
                background: unread > 0 ? 'rgba(248,113,113,0.06)' : 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
              }}>
                <Bell size={12} color={unread > 0 ? '#f87171' : 'rgba(255,255,255,0.35)'} />
                {unread > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#f87171', fontVariantNumeric: 'tabular-nums' }}>
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ══ BODY ══ */}
        <div className="overview-body" style={{ flex: 1, padding: '14px 12px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── KPI STRIP: 2 cols on mobile, 3 on sm, 6 on lg ── */}
          <div className="kpi-grid" style={{ animation: 'fadeSlideIn 0.4s ease' }}>
            <KpiCard
              label="Pass rate" value={passRatePct} unit="%"
              color={passRatePct >= 80 ? '#34d399' : passRatePct >= 60 ? '#fbbf24' : '#f87171'}
              icon={<CheckCircle size={12} />}
              streak={streakCount >= 3}
              sub={totalFin > 0 ? `${passCount} passed · ${failCount} failed` : 'no finished runs yet'}
              trend={passRatePct >= 80 ? 'up' : passRatePct < 60 && totalFin > 0 ? 'down' : null}
              hero
              accentGradient={`linear-gradient(90deg, transparent, ${passRatePct >= 80 ? '#34d399' : passRatePct >= 60 ? '#fbbf24' : '#f87171'}80, transparent)`}
            />
            <KpiCard
              label="Failures" value={failCount}
              color={failCount > 0 ? '#f87171' : 'rgba(255,255,255,0.4)'}
              icon={<XCircle size={12} />}
              shake={shakeKey > 0}
              sub={totalFin > 0 ? `${Math.round((failCount / totalFin) * 100)}% fail rate` : 'none yet'}
              trend={failCount > 5 ? 'down' : null}
            />
            <KpiCard
              label="Total runs" value={filtered.length}
              color="#e2e8f0"
              icon={<TrendingUp size={12} />}
              sub={hasFilter ? `of ${arrived.length} total` : `${arrived.length} in feed`}
            />
            <KpiCard
              label="Avg duration" value={Math.round(avgDurS * 10) / 10} unit="s"
              color="#60a5fa"
              icon={<Timer size={12} />}
              sub="across finished runs"
            />
            <KpiCard
              label="Avg tokens" value={avgTokens}
              color="#a78bfa"
              icon={<Cpu size={12} />}
              sub={`${totalTokens.toLocaleString()} total`}
            />
            <KpiCard
              label="Active agents" value={agentSegs.length}
              color="#fbbf24"
              icon={<Users size={12} />}
              sub="with runs in feed"
            />
          </div>

          {/* ── FILTER CHIPS ── */}
          {hasFilter && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, animation: 'fadeSlideIn 0.2s ease' }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>
                Filters
              </span>
              {[
                agentFilter    && { label: `Agent: ${agentFilter}`,       clear: () => setAgentFilter(null) },
                categoryFilter && { label: `Category: ${categoryFilter}`, clear: () => setCategoryFilter(null) },
                statusFilter   && { label: `Status: ${statusFilter}`,     clear: () => setStatusFilter(null) },
              ].filter(Boolean).map((chip: any) => (
                <button key={chip.label} type="button" onClick={chip.clear} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 999,
                  border: '1px solid rgba(99,102,241,0.3)',
                  background: 'rgba(99,102,241,0.1)',
                  color: '#a78bfa', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}>
                  {chip.label} <X size={10} />
                </button>
              ))}
              <button type="button" onClick={clearAll} style={{
                padding: '4px 10px', borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'transparent', color: 'rgba(255,255,255,0.3)',
                fontSize: 11, cursor: 'pointer',
              }}>
                Clear all
              </button>
            </div>
          )}

          {/* ── HEATMAP + DONUTS: stack on mobile, side by side on lg ── */}
          <div className="charts-grid">
            <Panel
              title="Agent × Scenario heatmap"
              sub="Colour = pass ratio · click row/col to cross-filter"
              accent="linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)"
            >
              {arrived.length === 0 ? (
                <EmptyState message="waiting for runs to map..." />
              ) : (
                <CategoryHeatMap
                  cells={heatCells} rows={AGENTS} cols={CATEGORIES}
                  activeRow={agentFilter} activeCol={categoryFilter}
                  onRowClick={setAgentFilter} onColClick={setCategoryFilter}
                  flashKey={hmFlashKey}
                />
              )}
            </Panel>

            {/* Donuts: row on mobile, column on lg */}
            <div className="donuts-grid">
              <Panel
                title="By status"
                sub="Click segment to filter"
                accent="linear-gradient(90deg, transparent, rgba(52,211,153,0.5), transparent)"
              >
                {arrived.length === 0 ? <EmptyState message="⏳" small /> : (
                  <AnimatedDonut segments={statusSegs} size={110} thickness={16} activeKey={statusFilter} onSegmentClick={setStatusFilter} centerSub="runs" />
                )}
              </Panel>
              <Panel
                title="By agent"
                sub="Click segment to filter"
                accent="linear-gradient(90deg, transparent, rgba(96,165,250,0.5), transparent)"
              >
                {arrived.length === 0 ? <EmptyState message="⏳" small /> : (
                  <AnimatedDonut segments={agentSegs} size={110} thickness={16} activeKey={agentFilter} onSegmentClick={setAgentFilter} centerSub="agents" />
                )}
              </Panel>
            </div>
          </div>

          {/* ── TIMELINE ── */}
          <Panel
            title="Run activity — last 120 seconds"
            sub={chartBrush
              ? `Selection: ${new Date(chartBrush[0]).toLocaleTimeString()} – ${new Date(chartBrush[1]).toLocaleTimeString()}`
              : '1-second buckets · drag to select a window'
            }
            accent="linear-gradient(90deg, transparent, rgba(52,211,153,0.4), rgba(248,113,113,0.4), transparent)"
            action={chartBrush ? (
              <button type="button" onClick={() => setChartBrush(null)} style={{
                padding: '3px 10px', borderRadius: 6,
                border: '1px solid rgba(99,102,241,0.4)',
                background: 'rgba(99,102,241,0.1)', color: '#a78bfa',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}>
                Clear
              </button>
            ) : undefined}
          >
            <TimeSeriesChart points={timeSeries} height={110} onBrush={(a, b) => setChartBrush([a, b])} brushRange={chartBrush} />
          </Panel>

          {/* ── RUNS TABLE + HEALTH ── */}
          {/* On mobile: full-width runs list, detail panel stacks below when open */}
          <div className="runs-grid" style={{ transition: 'all 0.3s ease' }}>
            <Panel
              title={`Runs${hasFilter && filtered.length !== arrived.length ? ` · ${filtered.length} of ${arrived.length}` : ''}`}
              sub={isPaused && arrived.length > 0 ? 'paused · historical view' : undefined}
              accent="linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)"
              noPad
            >
              {/* Header row — hide agent/dur cols on mobile */}
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 8, padding: '12px 12px 8px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ width: 7, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)' }}>Scenario</span>
                <span className="hidden sm:inline" style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', minWidth: 64 }}>Agent</span>
                <span className="hidden sm:inline" style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', minWidth: 36, textAlign: 'right' }}>Dur</span>
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', minWidth: 52, textAlign: 'center' }}>Status</span>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: 12 }}>
                    {isEmpty
                      ? isPaused ? '😴 the agents are on a union-mandated break.' : '⏳ agents are stretching...'
                      : 'No runs match the current filters.'}
                    {!isEmpty && hasFilter && (
                      <div style={{ marginTop: 10 }}>
                        <button type="button" onClick={clearAll} style={{
                          padding: '5px 14px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer',
                        }}>Clear filters</button>
                      </div>
                    )}
                  </div>
                ) : (
                  filtered.slice(0, 50).map((run, i) => (
                    <RunRow
                      key={run.runId} run={run}
                      isNew={i === 0 && run.runId === newestRunId}
                      isSelected={selectedRun?.runId === run.runId}
                      onClick={() => setSelectedRun((p) => p?.runId === run.runId ? null : run)}
                    />
                  ))
                )}
              </div>
            </Panel>

            {selectedRun ? (
              <RunDetailPanel run={selectedRun} onClose={() => setSelectedRun(null)} />
            ) : (
              <Panel
                title="Agent health"
                sub="Pass rate + avg duration · sorted by volume"
                accent="linear-gradient(90deg, transparent, rgba(251,191,36,0.4), transparent)"
              >
                {arrived.length === 0
                  ? <EmptyState message="no data yet" small />
                  : <AgentScoreboard records={filtered} />
                }
              </Panel>
            )}
          </div>

          {/* ── LOGS EXPLORER ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                Log explorer
              </span>
              <button type="button" onClick={() => setLogsExpanded((p) => !p)} style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6,
                padding: '3px 6px', cursor: 'pointer', color: 'rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
              }}>
                {logsExpanded ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                {logsExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
            <LogsExplorer entries={logEntries} newestId={newestLogId} brushRange={chartBrush} />
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          padding: '8px 12px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6,
          flexShrink: 0,
          background: 'rgba(10,10,13,0.8)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>
              Crucible · Live feed · {speed === '1x' ? '1.8s' : speed === '2x' ? '0.9s' : '0.3s'} · synthetic demo
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: 'Pass', color: '#34d399' },
                { label: 'Fail', color: '#f87171' },
                { label: 'Warn', color: '#fbbf24' },
              ].map(({ label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', fontVariantNumeric: 'tabular-nums' }}>
            {arrived.length} runs · {logEntries.length} logs
          </span>
        </div>
      </div>

      {/* Responsive grid rules injected as a style tag to avoid Tailwind arbitrary-value limitations */}
      <style>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        @media (min-width: 640px) {
          .kpi-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .overview-body { padding: 16px 20px 40px; }
        }
        @media (min-width: 1024px) {
          .kpi-grid { grid-template-columns: 1.3fr 1fr 1fr 1fr 1fr 1fr; gap: 10px; }
          .overview-body { padding: 20px 24px 40px; }
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 1024px) {
          .charts-grid { grid-template-columns: 2fr 0.7fr; }
        }

        .donuts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media (min-width: 1024px) {
          .donuts-grid { grid-template-columns: 1fr; }
        }

        .runs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 768px) {
          .runs-grid { grid-template-columns: 1.4fr 0.6fr; }
        }
      `}</style>

      <NotificationDrawer
        open={drawerOpen}
        notifications={notifications}
        onClose={() => setDrawerOpen(false)}
        onDismiss={(id) => setNotifications((p) => p.filter((n) => n.id !== id))}
        onMarkAllRead={() => setNotifications((p) => p.map((n) => ({ ...n, read: true })))}
      />
    </>
  )
}

// ── empty state ───────────────────────────────────────────────────────────────
function EmptyState({ message, small }: { message: string; small?: boolean }) {
  return (
    <div style={{
      height: small ? 60 : 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'rgba(255,255,255,0.15)', fontSize: small ? 11 : 12,
    }}>
      {message}
    </div>
  )
}
