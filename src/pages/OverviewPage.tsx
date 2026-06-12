import * as React from 'react'
import {
  Pause, Play, Zap, Activity, Bell, X, ChevronUp, ChevronDown,
  CheckCircle, XCircle, Timer, Users, Cpu, TrendingUp,
} from 'lucide-react'
import { type RunRecord } from '@/data/runHistory'
import { useLiveFeed, type SpeedSetting } from '@/hooks/useLiveFeed'
import { CategoryHeatMap, type HeatCell } from '@/components/charts/CategoryHeatMap'
import { AnimatedDonut, type DonutSegment } from '@/components/charts/AnimatedDonut'
import { TimeSeriesChart, type TimeSeriesPoint } from '@/components/charts/TimeSeriesChart'
import { LogsExplorer, type LogEntry } from '@/components/views/LogsExplorer'
import { NotificationDrawer, type Notification } from '@/components/views/NotificationDrawer'
import { RunDetailPanel } from '@/components/views/RunDetailPanel'

// ── constants ─────────────────────────────────────────────────────────────────
const AGENT_COLOR: Record<string, string> = {
  Navigator: '#60a5fa',
  Explorer: '#f87171',
  Pioneer: '#34d399',
  Voyager: '#fbbf24',
}

const STATUS_COLOR: Record<string, string> = {
  passed: '#34d399',
  failed: '#f87171',
  cancelled: '#fbbf24',
  running: '#60a5fa',
  queued: '#737373',
}

function categorize(scenario: string): string {
  const s = scenario.toLowerCase()
  if (s.startsWith('refund')) return 'Refund'
  if (s.startsWith('renewal')) return 'Renewal'
  if (s.startsWith('escalat')) return 'Escalation'
  if (s.startsWith('onboard')) return 'Onboarding'
  if (s.startsWith('qualify')) return 'Qualify'
  return 'Other'
}

const CATEGORIES = ['Refund', 'Renewal', 'Escalation', 'Onboarding', 'Qualify']
const AGENTS = ['Navigator', 'Explorer', 'Pioneer', 'Voyager']

// ── time-series: 120 one-second buckets ───────────────────────────────────────
function buildTimeSeries(records: RunRecord[]): TimeSeriesPoint[] {
  const NUM = 120
  const BUCKET_MS = 1000
  const now = Date.now()
  const startMs = now - NUM * BUCKET_MS

  const buckets: TimeSeriesPoint[] = Array.from({ length: NUM }, (_, i) => {
    const tMs = startMs + i * BUCKET_MS
    const d = new Date(tMs)
    const ss = d.getSeconds().toString().padStart(2, '0')
    const mm = d.getMinutes().toString().padStart(2, '0')
    // Label: show MM:SS, but only emit label on every 10th bucket to avoid crowding
    return { label: `${mm}:${ss}`, passed: 0, failed: 0, total: 0, tsMs: tMs }
  })

  records.forEach((r) => {
    if (r.startedAtMs < startMs) return
    const idx = Math.floor((r.startedAtMs - startMs) / BUCKET_MS)
    const clamped = Math.min(Math.max(idx, 0), NUM - 1)
    buckets[clamped].total++
    if (r.status === 'passed') buckets[clamped].passed++
    else if (r.status === 'failed') buckets[clamped].failed++
  })
  return buckets
}

function buildHeatCells(records: RunRecord[]): HeatCell[] {
  const buckets: Record<string, HeatCell> = {}
  records.forEach((r) => {
    const col = categorize(r.scenario)
    const key = `${r.agent}|${col}`
    if (!buckets[key]) buckets[key] = { rowKey: r.agent, colKey: col, passed: 0, failed: 0, total: 0 }
    buckets[key].total++
    if (r.status === 'passed') buckets[key].passed++
    else if (r.status === 'failed') buckets[key].failed++
  })
  return Object.values(buckets)
}

// ── log builder ───────────────────────────────────────────────────────────────
let voyagerFailCount = 0

function runToLogEntry(run: RunRecord): LogEntry {
  const level = run.status === 'failed' ? 'error' : run.status === 'cancelled' ? 'warn' : 'info'
  let message = ''
  if (run.status === 'passed') message = `✓ ${run.scenario} completed in ${(run.durationMs / 1000).toFixed(1)}s`
  else if (run.status === 'failed') message = `✗ ${run.scenario} — evaluation failed`
  else if (run.status === 'cancelled') message = `⊘ ${run.scenario} — cancelled after ${(run.durationMs / 1000).toFixed(1)}s`
  else message = `→ ${run.scenario} — ${run.status}`
  return {
    id: `log-${run.runId}`,
    runId: run.runId,
    agent: run.agent,
    scenario: run.scenario,
    status: run.status as LogEntry['status'],
    level, message,
    timestamp: run.startedAtMs,
    durationMs: run.durationMs,
    steps: run.steps,
    tokenCount: run.tokenCount,
    evalScores: run.evalScores,
  }
}

function runToNotification(run: RunRecord): Notification {
  if (run.status === 'failed') {
    if (run.agent === 'Voyager') {
      voyagerFailCount++
      return {
        id: `notif-${run.runId}`,
        type: 'fail',
        title: voyagerFailCount >= 2 ? 'Voyager is having a day' : `${run.agent} failed`,
        body: voyagerFailCount >= 2 ? `Failed again: ${run.scenario}` : run.scenario,
        timestamp: Date.now(), read: false,
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
function useRollingNumber(target: number, duration = 400) {
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

// ── KPI card ──────────────────────────────────────────────────────────────────
interface KpiProps {
  label: string
  value: number
  unit?: string
  color?: string
  icon?: React.ReactNode
  shake?: boolean
  streak?: boolean
  sub?: string
  trend?: 'up' | 'down' | 'flat' | null
  hero?: boolean
}

function KpiCard({ label, value, unit, color, icon, shake, streak, sub, trend, hero }: KpiProps) {
  const display = useRollingNumber(value)
  const [isShaking, setIsShaking] = React.useState(false)

  React.useEffect(() => {
    if (!shake) return
    setIsShaking(true)
    const t = setTimeout(() => setIsShaking(false), 500)
    return () => clearTimeout(t)
  }, [shake, value])

  return (
    <div style={{
      backgroundColor: '#161616',
      border: `1px solid ${hero ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10,
      padding: hero ? '18px 20px' : '13px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: hero ? 8 : 5,
      position: 'relative',
      overflow: 'hidden',
      animation: isShaking ? 'kpiShake 0.45s cubic-bezier(0.36,0.07,0.19,0.97)' : 'none',
    }}>
      {/* Subtle glow for hero */}
      {hero && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #34d399, transparent)', opacity: 0.5 }} />
      )}

      {streak && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 10, fontWeight: 700, color: '#fbbf24',
          background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
          borderRadius: 5, padding: '2px 6px',
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          🔥 streak
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <span style={{ color: 'rgba(255,255,255,0.3)', display: 'flex' }}>{icon}</span>}
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>
          {label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontSize: hero ? 34 : 24,
          fontWeight: 700,
          color: color ?? '#fafafa',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          letterSpacing: '-0.025em',
        }}>
          {display}
        </span>
        {unit && <span style={{ fontSize: hero ? 15 : 13, color: 'rgba(255,255,255,0.35)' }}>{unit}</span>}
        {trend && (
          <div style={{ marginLeft: 4, color: trend === 'up' ? '#34d399' : trend === 'down' ? '#f87171' : 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center' }}>
            {trend === 'up' ? <ChevronUp size={14} /> : trend === 'down' ? <ChevronDown size={14} /> : null}
          </div>
        )}
      </div>

      {sub && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)' }}>{sub}</span>}
    </div>
  )
}

// ── Agent health scoreboard ───────────────────────────────────────────────────
function AgentScoreboard({ records }: { records: RunRecord[] }) {
  const stats = React.useMemo(() => {
    return AGENTS.map((agent) => {
      const runs = records.filter((r) => r.agent === agent)
      const finished = runs.filter((r) => r.durationMs > 0)
      const passed = runs.filter((r) => r.status === 'passed').length
      const failed = runs.filter((r) => r.status === 'failed').length
      const total = passed + failed
      const passRate = total > 0 ? Math.round((passed / total) * 100) : 0
      const avgDur = finished.length > 0
        ? finished.reduce((s, r) => s + r.durationMs, 0) / finished.length / 1000
        : 0
      return { agent, passed, failed, total, passRate, avgDur }
    }).sort((a, b) => b.total - a.total)
  }, [records])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {stats.map(({ agent, passed, failed, total, passRate, avgDur }) => {
        const color = AGENT_COLOR[agent] ?? '#737373'
        return (
          <div key={agent} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', width: 72, flexShrink: 0 }}>{agent}</span>
            <div style={{ flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                width: `${total > 0 ? passRate : 0}%`,
                height: '100%',
                backgroundColor: passRate >= 80 ? '#34d399' : passRate >= 60 ? '#fbbf24' : '#f87171',
                borderRadius: 99,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums', width: 34, textAlign: 'right' }}>
              {total > 0 ? `${passRate}%` : '—'}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', width: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {total > 0 ? `${avgDur.toFixed(1)}s` : '—'}
            </span>
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

  React.useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  React.useEffect(() => {
    if (!isNew) return
    setFlashing(true)
    const t = setTimeout(() => setFlashing(false), 900)
    return () => clearTimeout(t)
  }, [isNew])

  const agentColor = AGENT_COLOR[run.agent] ?? '#737373'
  const isPassed = run.status === 'passed'
  const isFailed = run.status === 'failed'
  const cat = categorize(run.scenario)

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '8px 1fr 96px 54px 64px',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        cursor: 'pointer',
        backgroundColor: flashing
          ? isPassed ? 'rgba(52,211,153,0.07)' : isFailed ? 'rgba(248,113,113,0.07)' : 'transparent'
          : isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
        borderRadius: isSelected ? 5 : 0,
        boxShadow: isSelected ? 'inset 0 0 0 1px rgba(255,255,255,0.08)' : 'none',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(-5px)',
        transition: 'background-color 0.5s ease, opacity 0.2s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        backgroundColor: STATUS_COLOR[run.status] ?? '#737373',
        boxShadow: isFailed ? '0 0 5px #f87171' : isPassed ? '0 0 4px rgba(52,211,153,0.5)' : 'none',
        flexShrink: 0,
      }} />

      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#e8e8e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {run.scenario}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontFamily: 'monospace' }}>{run.runId}</span>
          <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.28)' }}>
            {cat}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: agentColor, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{run.agent}</span>
      </div>

      <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.32)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {run.durationMs > 0 ? `${(run.durationMs / 1000).toFixed(1)}s` : '—'}
      </span>

      <span style={{
        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999, textAlign: 'center',
        backgroundColor: isPassed ? 'rgba(52,211,153,0.1)' : isFailed ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.05)',
        color: isPassed ? '#34d399' : isFailed ? '#f87171' : 'rgba(255,255,255,0.4)',
        border: `1px solid ${isPassed ? 'rgba(52,211,153,0.2)' : isFailed ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.08)'}`,
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
    const t = setTimeout(() => setActive(false), 700)
    return () => clearTimeout(t)
  }, [trigger])
  if (!active) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 500,
      border: '2px solid rgba(248,113,113,0.35)',
      boxShadow: 'inset 0 0 80px rgba(248,113,113,0.06)',
      animation: 'rippleFade 0.7s ease-out forwards',
    }} />
  )
}

// ── Panel wrapper ─────────────────────────────────────────────────────────────
function Panel({ title, sub, children, action }: {
  title: string; sub?: string; children: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div style={{
      backgroundColor: '#161616',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>{title}</div>
          {sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{sub}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────
export function OverviewPage() {
  const { arrived, isPlaying, speed, isLudicrous, togglePlay, setSpeed } = useLiveFeed()

  const [agentFilter, setAgentFilter] = React.useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = React.useState<string | null>(null)
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null)

  const [selectedRun, setSelectedRun] = React.useState<RunRecord | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [failRipple, setFailRipple] = React.useState(0)
  const streakRef = React.useRef(0)
  const [streakCount, setStreakCount] = React.useState(0)
  const [newestRunId, setNewestRunId] = React.useState<string | null>(null)
  const [newestLogId, setNewestLogId] = React.useState<string | null>(null)
  const [hmFlashKey, setHmFlashKey] = React.useState<string | null>(null)
  const [logEntries, setLogEntries] = React.useState<LogEntry[]>([])
  const [shakeKey, setShakeKey] = React.useState(0)
  const [chartBrush, setChartBrush] = React.useState<[number, number] | null>(null)

  // Re-build time series every second so the x-axis slides in real time
  const [timeSeries, setTimeSeries] = React.useState<TimeSeriesPoint[]>([])
  React.useEffect(() => {
    const update = () => setTimeSeries(buildTimeSeries(arrived))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [arrived])

  const prevLengthRef = React.useRef(0)
  React.useEffect(() => {
    if (arrived.length <= prevLengthRef.current) return
    const run = arrived[0]
    prevLengthRef.current = arrived.length

    setNewestRunId(run.runId)
    setTimeout(() => setNewestRunId(null), 1000)

    const entry = runToLogEntry(run)
    setNewestLogId(entry.id)
    setTimeout(() => setNewestLogId(null), 1000)
    setLogEntries((p) => [entry, ...p].slice(0, 300))

    const notif = runToNotification(run)
    setNotifications((p) => [notif, ...p].slice(0, 60))

    if (run.status === 'failed') {
      setFailRipple((n) => n + 1)
      setShakeKey((k) => k + 1)
      streakRef.current = 0
      setStreakCount(0)
    } else if (run.status === 'passed') {
      streakRef.current++
      setStreakCount(streakRef.current)
    }

    const col = categorize(run.scenario)
    setHmFlashKey(`${run.agent}|${col}`)
    setTimeout(() => setHmFlashKey(null), 900)
  }, [arrived.length])

  const filtered = React.useMemo(
    () => applyFilters(arrived, agentFilter, categoryFilter, statusFilter),
    [arrived, agentFilter, categoryFilter, statusFilter],
  )

  const passCount = React.useMemo(() => filtered.filter((r) => r.status === 'passed').length, [filtered])
  const failCount = React.useMemo(() => filtered.filter((r) => r.status === 'failed').length, [filtered])
  const totalFinished = passCount + failCount
  const passRatePct = totalFinished === 0 ? 0 : Math.round((passCount / totalFinished) * 100)

  const avgDurS = React.useMemo(() => {
    const fin = filtered.filter((r) => r.durationMs > 0)
    if (!fin.length) return 0
    return Math.round(fin.reduce((s, r) => s + r.durationMs, 0) / fin.length / 100) / 10
  }, [filtered])

  const totalTokens = React.useMemo(() =>
    filtered.filter((r) => r.tokenCount > 0).reduce((s, r) => s + r.tokenCount, 0),
    [filtered])

  const avgTokens = React.useMemo(() => {
    const fin = filtered.filter((r) => r.tokenCount > 0)
    return fin.length > 0 ? Math.round(fin.reduce((s, r) => s + r.tokenCount, 0) / fin.length) : 0
  }, [filtered])

  const heatCells = React.useMemo(() => buildHeatCells(arrived), [arrived])

  const statusSegments: DonutSegment[] = React.useMemo(() => {
    const counts: Record<string, number> = {}
    filtered.forEach((r) => { counts[r.status] = (counts[r.status] ?? 0) + 1 })
    return (['passed', 'failed', 'cancelled', 'running', 'queued'] as const)
      .filter((s) => (counts[s] ?? 0) > 0)
      .map((s) => ({ key: s, label: s.charAt(0).toUpperCase() + s.slice(1), value: counts[s] ?? 0, color: STATUS_COLOR[s] }))
  }, [filtered])

  const agentSegments: DonutSegment[] = React.useMemo(() => {
    const counts: Record<string, number> = {}
    filtered.forEach((r) => { counts[r.agent] = (counts[r.agent] ?? 0) + 1 })
    return Object.entries(counts).map(([agent, value]) => ({
      key: agent, label: agent, value, color: AGENT_COLOR[agent] ?? '#737373',
    }))
  }, [filtered])

  const hasFilter = agentFilter !== null || categoryFilter !== null || statusFilter !== null
  const clearFilters = () => { setAgentFilter(null); setCategoryFilter(null); setStatusFilter(null) }

  const unreadNotifs = notifications.filter((n) => !n.read).length
  const isEmpty = arrived.length === 0
  const isPaused = !isPlaying

  return (
    <>
      <style>{`
        @keyframes kpiShake {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-4px) rotate(-0.8deg); }
          30% { transform: translateX(4px) rotate(0.8deg); }
          50% { transform: translateX(-3px); }
          70% { transform: translateX(3px); }
          90% { transform: translateX(-1px); }
        }
        @keyframes rippleFade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
      `}</style>

      <FailureRipple trigger={failRipple} />

      {isLudicrous && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 400, boxShadow: 'inset 0 0 100px rgba(251,191,36,0.09)', border: '1px solid rgba(251,191,36,0.06)' }} />
      )}

      <div style={{
        minHeight: '100%',
        backgroundColor: '#0d0d0d',
        color: '#fafafa',
        fontFamily: 'Inter, ui-sans-serif, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* ══ TOP BAR ══ */}
        <div style={{
          padding: '11px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          backgroundColor: '#111111',
          position: 'sticky',
          top: 0,
          zIndex: 200,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={14} color="#34d399" />
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' }}>Production Overview</span>
            {isLudicrous && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 4, padding: '2px 6px' }}>
                LUDICROUS
              </span>
            )}
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
              {isEmpty
                ? isPaused ? 'the agents are on a union-mandated break' : 'agents are stretching...'
                : `${arrived.length} runs · ${isPaused ? 'paused' : 'live'}`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ display: 'flex', gap: 3 }}>
              {(['1x', '2x', 'ludicrous'] as SpeedSetting[]).map((s) => (
                <button key={s} type="button" onClick={() => setSpeed(s)} style={{
                  padding: '4px 9px', borderRadius: 5,
                  border: `1px solid ${speed === s ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  backgroundColor: speed === s ? 'rgba(96,165,250,0.1)' : 'transparent',
                  color: speed === s ? '#60a5fa' : 'rgba(255,255,255,0.3)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 3,
                  transition: 'all 0.12s',
                }}>
                  {s === 'ludicrous' && <Zap size={9} />}
                  {s}
                </button>
              ))}
            </div>

            <button type="button" onClick={togglePlay} style={{
              padding: '5px 12px', borderRadius: 7,
              border: `1px solid ${isPlaying ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'}`,
              backgroundColor: isPlaying ? 'rgba(52,211,153,0.07)' : 'rgba(255,255,255,0.03)',
              color: isPlaying ? '#34d399' : 'rgba(255,255,255,0.4)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
            }}>
              {isPlaying ? <Pause size={11} /> : <Play size={11} />}
              {isPlaying ? 'Pause' : 'Resume'}
            </button>

            <button type="button" onClick={() => setDrawerOpen(true)} style={{
              position: 'relative', padding: '5px 8px', borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.07)',
              backgroundColor: unreadNotifs > 0 ? 'rgba(248,113,113,0.06)' : 'rgba(255,255,255,0.02)',
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.12s',
            }}>
              <Bell size={13} color={unreadNotifs > 0 ? '#f87171' : 'rgba(255,255,255,0.35)'} />
              {unreadNotifs > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#f87171' }}>
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ══ BODY ══ */}
        <div style={{ flex: 1, padding: '16px 20px 36px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── KPI row: Pass Rate (hero) + 5 supporting cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr 1fr 1fr', gap: 10 }}>
            <KpiCard
              label="Pass rate"
              value={passRatePct}
              unit="%"
              color={passRatePct >= 80 ? '#34d399' : passRatePct >= 60 ? '#fbbf24' : '#f87171'}
              icon={<CheckCircle size={12} />}
              streak={streakCount >= 3}
              sub={totalFinished > 0 ? `${passCount} passed · ${failCount} failed` : 'no finished runs'}
              trend={passRatePct >= 80 ? 'up' : passRatePct < 60 ? 'down' : 'flat'}
              hero
            />
            <KpiCard
              label="Failures"
              value={failCount}
              color={failCount > 0 ? '#f87171' : 'rgba(255,255,255,0.55)'}
              icon={<XCircle size={12} />}
              shake={shakeKey > 0}
              sub={totalFinished > 0 ? `${Math.round((failCount / totalFinished) * 100)}% fail rate` : 'none yet'}
              trend={failCount > 3 ? 'down' : null}
            />
            <KpiCard
              label="Total runs"
              value={filtered.length}
              color="#fafafa"
              icon={<TrendingUp size={12} />}
              sub={hasFilter ? `of ${arrived.length} total` : 'all runs'}
            />
            <KpiCard
              label="Avg duration"
              value={Math.round(avgDurS * 10) / 10}
              unit="s"
              color="#60a5fa"
              icon={<Timer size={12} />}
              sub="finished runs"
            />
            <KpiCard
              label="Avg tokens"
              value={avgTokens}
              color="#a78bfa"
              icon={<Cpu size={12} />}
              sub={`${totalTokens.toLocaleString()} total`}
            />
            <KpiCard
              label="Active agents"
              value={agentSegments.length}
              color="#fbbf24"
              icon={<Users size={12} />}
              sub="with runs so far"
            />
          </div>

          {/* ── Filter chips ── */}
          {hasFilter && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, animation: 'fadeIn 0.18s ease' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>
                Filters
              </span>
              {[
                agentFilter && { label: `Agent: ${agentFilter}`, clear: () => setAgentFilter(null) },
                categoryFilter && { label: `Category: ${categoryFilter}`, clear: () => setCategoryFilter(null) },
                statusFilter && { label: `Status: ${statusFilter}`, clear: () => setStatusFilter(null) },
              ].filter(Boolean).map((chip: any) => (
                <button key={chip.label} type="button" onClick={chip.clear} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer',
                }}>
                  {chip.label} <X size={10} />
                </button>
              ))}
              <button type="button" onClick={clearFilters} style={{
                padding: '3px 10px', borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.06)',
                backgroundColor: 'transparent',
                color: 'rgba(255,255,255,0.28)', fontSize: 11, cursor: 'pointer',
              }}>
                Clear all
              </button>
            </div>
          )}

          {/* ── Charts: Heatmap (wide) + two donuts stacked ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            {/* Left: heatmap */}
            <Panel
              title="Agent × Scenario heatmap"
              sub="Colour = pass ratio · intensity = volume · click to cross-filter"
            >
              {arrived.length === 0 ? (
                <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>
                  ⏳ waiting for runs...
                </div>
              ) : (
                <CategoryHeatMap
                  cells={heatCells}
                  rows={AGENTS}
                  cols={CATEGORIES}
                  activeRow={agentFilter}
                  activeCol={categoryFilter}
                  onRowClick={setAgentFilter}
                  onColClick={setCategoryFilter}
                  flashKey={hmFlashKey}
                />
              )}
            </Panel>

            {/* Right: two donuts stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Panel title="By status" sub="Click to filter">
                {arrived.length === 0 ? (
                  <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>⏳</div>
                ) : (
                  <AnimatedDonut
                    segments={statusSegments}
                    size={110}
                    thickness={16}
                    activeKey={statusFilter}
                    onSegmentClick={setStatusFilter}
                    centerSub="runs"
                  />
                )}
              </Panel>

              <Panel title="By agent" sub="Click to filter">
                {arrived.length === 0 ? (
                  <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>⏳</div>
                ) : (
                  <AnimatedDonut
                    segments={agentSegments}
                    size={110}
                    thickness={16}
                    activeKey={agentFilter}
                    onSegmentClick={setAgentFilter}
                    centerSub="agents"
                  />
                )}
              </Panel>
            </div>
          </div>

          {/* ── Time series: 120s live window ── */}
          <Panel
            title="Run activity — last 120 seconds"
            sub={chartBrush
              ? `Selection: ${new Date(chartBrush[0]).toLocaleTimeString()} – ${new Date(chartBrush[1]).toLocaleTimeString()} · click anywhere to clear`
              : '1-second buckets · drag to select a range and analyse it in the Logs panel below'
            }
            action={chartBrush ? (
              <button type="button" onClick={() => setChartBrush(null)} style={{
                padding: '3px 9px', borderRadius: 5, border: '1px solid rgba(96,165,250,0.3)',
                backgroundColor: 'rgba(96,165,250,0.08)', color: '#60a5fa',
                fontSize: 11, cursor: 'pointer',
              }}>
                Clear selection
              </button>
            ) : undefined}
          >
            <TimeSeriesChart
              points={timeSeries}
              height={110}
              onBrush={(from, to) => setChartBrush([from, to])}
              brushRange={chartBrush}
            />
          </Panel>

          {/* ── Bottom: run table + agent scoreboard + optional detail panel ── */}
          <div style={{ display: 'grid', gridTemplateColumns: selectedRun ? '1.2fr 1fr' : '2fr 1fr', gap: 12, alignItems: 'start' }}>

            {/* Run table */}
            <Panel
              title={`Runs${hasFilter && filtered.length !== arrived.length ? ` · ${filtered.length} of ${arrived.length}` : ''}`}
              sub={isPaused && arrived.length > 0 ? 'paused · historical view' : undefined}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: '8px 1fr 96px 54px 64px',
                gap: 10, padding: '0 0 6px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                {['', 'Scenario', 'Agent', 'Dur', 'Status'].map((h, i) => (
                  <span key={i} style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.2)', textAlign: i >= 3 ? 'right' : 'left',
                  }}>
                    {h}
                  </span>
                ))}
              </div>

              <div style={{ maxHeight: 300, overflowY: 'auto', margin: '0 -16px' }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: '36px 24px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                    {isEmpty
                      ? isPaused
                        ? '😴 the agents are on a union-mandated break.'
                        : '⏳ agents are warming up...'
                      : 'No runs match the current filters.'}
                    {!isEmpty && hasFilter && (
                      <div style={{ marginTop: 10 }}>
                        <button type="button" onClick={clearFilters} style={{
                          padding: '4px 12px', borderRadius: 6,
                          border: '1px solid rgba(255,255,255,0.08)',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer',
                        }}>
                          Clear filters
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  filtered.slice(0, 40).map((run, i) => (
                    <RunRow
                      key={run.runId}
                      run={run}
                      isNew={i === 0 && run.runId === newestRunId}
                      isSelected={selectedRun?.runId === run.runId}
                      onClick={() => setSelectedRun((p) => p?.runId === run.runId ? null : run)}
                    />
                  ))
                )}
              </div>
            </Panel>

            {/* Detail panel or Agent Scoreboard */}
            {selectedRun ? (
              <RunDetailPanel run={selectedRun} onClose={() => setSelectedRun(null)} />
            ) : (
              <Panel title="Agent health" sub="Pass rate + avg duration · sorted by volume">
                {arrived.length === 0 ? (
                  <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>
                    ⏳ no data yet
                  </div>
                ) : (
                  <AgentScoreboard records={filtered} />
                )}
              </Panel>
            )}
          </div>

          {/* ── Logs explorer ── */}
          <LogsExplorer
            entries={logEntries}
            newestId={newestLogId}
            brushRange={chartBrush}
          />

        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '9px 20px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.16)' }}>
            Live feed · {speed === '1x' ? '1.8s' : speed === '2x' ? '0.9s' : '0.3s'} interval · synthetic demo data
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.16)' }}>
            {arrived.length} runs · {logEntries.length} log entries
          </span>
        </div>
      </div>

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
