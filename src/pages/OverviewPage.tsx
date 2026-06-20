import * as React from 'react'
import {
  ArrowDown, ArrowUp, CheckCircle2, Clock, GripVertical,
  Pause, Play, RotateCcw, Users, Zap, XCircle, Activity,
  TrendingUp, AlertTriangle,
} from 'lucide-react'
import { type RunRecord } from '@/data/runHistory'
import { useLiveFeed } from '@/hooks/useLiveFeed'
import { CategoryHeatMap, type HeatCell } from '@/components/charts/CategoryHeatMap'
import { DonutChart } from '@/components/charts/DonutChart'
import { TimeSeriesChart, type TimeSeriesPoint } from '@/components/charts/TimeSeriesChart'
import { LogsExplorer, type LogEntry } from '@/components/views/LogsExplorer'

// ── constants ─────────────────────────────────────────────────────────────────

const AGENTS = ['Navigator', 'Explorer', 'Pioneer', 'Voyager'] as const
const SCENARIOS = ['Refund', 'Renewal', 'Escalation', 'Onboarding', 'Qualify'] as const

const AGENT_COLOR: Record<string, string> = {
  Navigator: '#10B981',
  Explorer:  '#3B82F6',
  Pioneer:   '#F59E0B',
  Voyager:   '#8B5CF6',
}

const AGENT_INITIALS: Record<string, string> = {
  Navigator: 'NA',
  Explorer:  'EX',
  Pioneer:   'PI',
  Voyager:   'VO',
}

// ── helpers ───────────────────────────────────────────────────────────────────

function categorize(scenario: string): string {
  const s = scenario.toLowerCase()
  if (s.startsWith('refund'))    return 'Refund'
  if (s.startsWith('renewal'))   return 'Renewal'
  if (s.startsWith('escalat'))   return 'Escalation'
  if (s.startsWith('onboard'))   return 'Onboarding'
  if (s.startsWith('qualify'))   return 'Qualify'
  return 'Other'
}

function fmtMs(ms: number): string {
  if (ms === 0) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function fmtK(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// ── rolling counter ───────────────────────────────────────────────────────────

function useRolling(target: number, duration = 500) {
  const [val, setVal] = React.useState(target)
  const raf = React.useRef<number | null>(null)
  const state = React.useRef<{ from: number; to: number; t0: number } | null>(null)

  React.useEffect(() => {
    if (raf.current) cancelAnimationFrame(raf.current)
    state.current = { from: val, to: target, t0: performance.now() }
    const tick = (now: number) => {
      const s = state.current!
      const p = Math.min((now - s.t0) / duration, 1)
      const e = 1 - (1 - p) ** 3
      setVal(Math.round(s.from + (s.to - s.from) * e))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return val
}

// ── KPI drag-and-drop ─────────────────────────────────────────────────────────

type KpiId = 'passRate' | 'failures' | 'totalRuns' | 'avgDuration' | 'avgTokens' | 'activeAgents'

const DEFAULT_ORDER: KpiId[] = [
  'passRate', 'failures', 'totalRuns', 'avgDuration', 'avgTokens', 'activeAgents',
]

const KPI_KEY = 'crucible-kpi-order-v2'

function loadOrder(): KpiId[] {
  try {
    const raw = localStorage.getItem(KPI_KEY)
    if (!raw) return DEFAULT_ORDER
    const p = JSON.parse(raw) as KpiId[]
    if (Array.isArray(p) && p.length === DEFAULT_ORDER.length && DEFAULT_ORDER.every((id) => p.includes(id))) return p
  } catch { /* noop */ }
  return DEFAULT_ORDER
}

function saveOrder(o: KpiId[]) {
  try { localStorage.setItem(KPI_KEY, JSON.stringify(o)) } catch { /* noop */ }
}

function useDragOrder(init: KpiId[]) {
  const [order, setOrder] = React.useState<KpiId[]>(init)
  const dragging = React.useRef<KpiId | null>(null)
  const [draggingId, setDraggingId] = React.useState<KpiId | null>(null)
  const [overId, setOverId] = React.useState<KpiId | null>(null)

  const bind = React.useCallback((id: KpiId) => ({
    draggable: true as const,
    onDragStart: (e: React.DragEvent) => {
      dragging.current = id
      setDraggingId(id)
      e.dataTransfer.effectAllowed = 'move'
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setOverId(id)
    },
    onDragLeave: () => setOverId(null),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      const from = dragging.current
      if (!from || from === id) { setOverId(null); return }
      setOrder((prev) => {
        const next = [...prev]
        const fi = next.indexOf(from)
        const ti = next.indexOf(id)
        next.splice(fi, 1)
        next.splice(ti, 0, from)
        saveOrder(next)
        return next
      })
      setOverId(null)
    },
    onDragEnd: () => {
      dragging.current = null
      setDraggingId(null)
      setOverId(null)
    },
  }), [])

  const reset = React.useCallback(() => {
    setOrder(DEFAULT_ORDER)
    saveOrder(DEFAULT_ORDER)
  }, [])

  return { order, draggingId, overId, bind, reset }
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  rawValue: number
  display?: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  trend?: 'up' | 'down' | null
  trendLabel?: string
  trendGood?: boolean
  dragging?: boolean
  dragOver?: boolean
  bindProps: ReturnType<ReturnType<typeof useDragOrder>['bind']>
}

function KpiCard({
  label, rawValue, display, icon, iconBg, iconColor,
  trend, trendLabel, trendGood = true,
  dragging, dragOver, bindProps,
}: KpiCardProps) {
  const rolled = useRolling(rawValue)
  const shown = display ?? String(rolled)
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      {...bindProps}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden rounded-2xl bg-white p-5 transition-all duration-200 select-none"
      style={{
        border: dragOver ? '2px dashed #10B981' : '1px solid #E2E8F0',
        boxShadow: dragging
          ? '0 16px 40px rgba(0,0,0,0.14)'
          : hovered
          ? '0 6px 20px rgba(15,23,42,0.09)'
          : '0 1px 3px rgba(15,23,42,0.06)',
        transform: dragging ? 'scale(1.04) rotate(0.6deg)' : dragOver ? 'scale(1.01)' : 'none',
        opacity: dragging ? 0.55 : 1,
        cursor: 'grab',
      }}
    >
      {hovered && !dragging && (
        <div className="absolute right-3 top-3">
          <GripVertical className="h-3.5 w-3.5 text-slate-300" />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="text-3xl font-extrabold leading-none tabular-nums text-slate-900">{shown}</p>
          {trend && trendLabel && (
            <div className={`flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              (trend === 'up') === trendGood
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-500'
            }`}>
              {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {trendLabel}
            </div>
          )}
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBg }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
      </div>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title, subtitle, right, children, dark = false,
}: {
  title: string
  subtitle?: string
  right?: React.ReactNode
  children: React.ReactNode
  dark?: boolean
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        background: dark ? '#0F1117' : 'white',
        border: dark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E2E8F0',
        boxShadow: dark
          ? '0 4px 20px rgba(0,0,0,0.25)'
          : '0 1px 3px rgba(15,23,42,0.06)',
      }}
    >
      <div
        className="flex items-start justify-between gap-4 px-5 py-4"
        style={{
          borderBottom: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9',
        }}
      >
        <div>
          <h3 className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
          {subtitle && (
            <p className={`mt-0.5 text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{subtitle}</p>
          )}
        </div>
        {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

// ── Live pulse dot ────────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-xs font-semibold text-emerald-600">Live</span>
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    passed:    { bg: '#D1FAE5', color: '#059669' },
    failed:    { bg: '#FEE2E2', color: '#DC2626' },
    running:   { bg: '#DBEAFE', color: '#1D4ED8' },
    queued:    { bg: '#FEF3C7', color: '#B45309' },
    cancelled: { bg: '#F1F5F9', color: '#64748B' },
  }
  const s = styles[status] ?? styles.cancelled
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {status}
    </span>
  )
}

// ── Agent health bar ──────────────────────────────────────────────────────────

function AgentHealthBar({
  agent, passed, failed, total, color,
}: {
  agent: string; passed: number; failed: number; total: number; color: string
}) {
  const rate = total > 0 ? Math.round((passed / total) * 100) : 0
  const failing = total > 0 ? Math.round((failed / total) * 100) : 0

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {AGENT_INITIALS[agent] ?? agent[0]}
          </div>
          <span className="text-sm font-semibold text-slate-800">{agent}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tabular-nums text-slate-700">{rate}%</span>
          <div
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: rate >= 80 ? '#10B981' : rate >= 60 ? '#F59E0B' : '#EF4444',
              boxShadow: `0 0 5px ${rate >= 80 ? 'rgba(16,185,129,0.5)' : rate >= 60 ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.5)'}`,
            }}
          />
        </div>
      </div>

      {/* Stacked bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="flex h-full">
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${rate}%`, backgroundColor: color }}
          />
          {failing > 0 && (
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${failing}%`, backgroundColor: '#FCA5A5' }}
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="tabular-nums"><span className="font-semibold text-emerald-600">{passed}</span> passed</span>
        <span className="tabular-nums"><span className="font-semibold text-red-500">{failed}</span> failed</span>
        <span className="tabular-nums text-slate-300">{total} total</span>
      </div>
    </div>
  )
}

// ── Build time-series data ────────────────────────────────────────────────────

function buildTimeSeries(records: RunRecord[]): TimeSeriesPoint[] {
  const BUCKETS = 120
  const nowMs = Date.now()
  const windowMs = 120 * 1000
  const bucketMs = windowMs / BUCKETS

  const pts: TimeSeriesPoint[] = Array.from({ length: BUCKETS }, (_, i) => {
    const tsMs = nowMs - (BUCKETS - 1 - i) * bucketMs
    const sec = Math.round((BUCKETS - 1 - i) * (windowMs / BUCKETS / 1000))
    const label = sec === 0 ? 'now' : `${sec}s`
    return { label, passed: 0, failed: 0, total: 0, tsMs }
  })

  records.forEach((r) => {
    const age = nowMs - r.startedAtMs
    if (age < 0 || age > windowMs) return
    const idx = Math.min(BUCKETS - 1, Math.floor((1 - age / windowMs) * BUCKETS))
    if (pts[idx]) {
      pts[idx].total++
      if (r.status === 'passed') pts[idx].passed++
      else if (r.status === 'failed') pts[idx].failed++
    }
  })

  return pts
}

// ── Build heatmap cells ───────────────────────────────────────────────────────

function buildHeatCells(records: RunRecord[]): HeatCell[] {
  const acc: Record<string, HeatCell> = {}
  records.forEach((r) => {
    const col = categorize(r.scenario)
    if (col === 'Other') return
    const key = `${r.agent}|${col}`
    if (!acc[key]) acc[key] = { rowKey: r.agent, colKey: col, passed: 0, failed: 0, total: 0 }
    acc[key].total++
    if (r.status === 'passed') acc[key].passed++
    else if (r.status === 'failed') acc[key].failed++
  })
  return Object.values(acc)
}

// ── Build log entries ─────────────────────────────────────────────────────────

function toLogEntry(r: RunRecord): LogEntry {
  const level: LogEntry['level'] =
    r.status === 'failed' ? 'error' :
    r.status === 'cancelled' ? 'warn' :
    r.status === 'running' || r.status === 'queued' ? 'info' : 'info'

  const message =
    r.status === 'passed'    ? `[done] ${r.scenario} — passed in ${fmtMs(r.durationMs)}` :
    r.status === 'failed'    ? `[fail] ${r.scenario} — eval threshold not met` :
    r.status === 'running'   ? `[run]  ${r.scenario} — in progress` :
    r.status === 'queued'    ? `[queue] ${r.scenario} — waiting` :
                               `[done] ${r.scenario} — ${r.status}`

  return {
    id: r.runId,
    runId: r.runId,
    agent: r.agent,
    scenario: r.scenario,
    status: r.status as LogEntry['status'],
    level,
    message,
    timestamp: r.startedAtMs,
    durationMs: r.durationMs,
    steps: r.steps,
    tokenCount: r.tokenCount,
    evalScores: r.evalScores,
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function OverviewPage() {
  const { arrived, isPlaying, speed, setSpeed, togglePlay } = useLiveFeed()

  // Track newest run for highlights
  const [newestId, setNewestId] = React.useState<string | null>(null)
  const prevLen = React.useRef(0)
  React.useEffect(() => {
    if (arrived.length <= prevLen.current) return
    prevLen.current = arrived.length
    setNewestId(arrived[0]?.runId ?? null)
    const t = setTimeout(() => setNewestId(null), 1500)
    return () => clearTimeout(t)
  }, [arrived.length])

  // Heatmap flash key for newest run
  const heatFlashKey = React.useMemo(() => {
    if (!arrived[0] || arrived[0].runId !== newestId) return null
    const col = categorize(arrived[0].scenario)
    return `${arrived[0].agent}|${col}`
  }, [newestId, arrived])

  // Chart brush
  const [brushRange, setBrushRange] = React.useState<[number, number] | null>(null)

  // Heatmap filters
  const [heatRow, setHeatRow] = React.useState<string | null>(null)
  const [heatCol, setHeatCol] = React.useState<string | null>(null)

  // Donut filter
  const [activeStatusKey, setActiveStatusKey] = React.useState<string | null>(null)
  const [activeAgentKey, setActiveAgentKey] = React.useState<string | null>(null)

  // Derived stats
  const total = arrived.length
  const passed = arrived.filter((r) => r.status === 'passed').length
  const failed = arrived.filter((r) => r.status === 'failed').length
  const running = arrived.filter((r) => r.status === 'running' || r.status === 'queued').length
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0

  const avgDur = React.useMemo(() => {
    const done = arrived.filter((r) => r.durationMs > 0)
    return done.length > 0
      ? Math.round(done.reduce((s, r) => s + r.durationMs, 0) / done.length)
      : 0
  }, [arrived])

  const avgTokens = React.useMemo(() => {
    const done = arrived.filter((r) => r.tokenCount > 0)
    return done.length > 0
      ? Math.round(done.reduce((s, r) => s + r.tokenCount, 0) / done.length)
      : 0
  }, [arrived])

  const activeAgentCount = React.useMemo(() => {
    return new Set(arrived.filter((r) => r.status === 'running').map((r) => r.agent)).size
  }, [arrived])

  // Per-agent stats for health bars
  const agentStats = React.useMemo(() => {
    return AGENTS.map((agent) => {
      const runs = arrived.filter((r) => r.agent === agent)
      const p = runs.filter((r) => r.status === 'passed').length
      const f = runs.filter((r) => r.status === 'failed').length
      return { agent, passed: p, failed: f, total: runs.length }
    })
  }, [arrived])

  // Time series
  const timePoints = React.useMemo(() => buildTimeSeries(arrived), [arrived])

  // Heatmap
  const heatCells = React.useMemo(() => buildHeatCells(arrived), [arrived])

  // Donut slices
  const statusSlices = [
    { key: 'passed',  label: 'Passed',   value: passed,  color: '#10B981' },
    { key: 'failed',  label: 'Failed',   value: failed,  color: '#EF4444' },
    { key: 'running', label: 'Running',  value: running, color: '#3B82F6' },
    { key: 'other',   label: 'Other',    value: Math.max(0, total - passed - failed - running), color: '#94A3B8' },
  ].filter((s) => s.value > 0)

  const agentSlices = AGENTS.map((agent) => ({
    key: agent,
    label: agent,
    value: arrived.filter((r) => r.agent === agent).length,
    color: AGENT_COLOR[agent],
  })).filter((s) => s.value > 0)

  // Log entries
  const logEntries = React.useMemo(
    () => arrived.map(toLogEntry),
    [arrived],
  )

  // KPI drag-and-drop
  const kpiInit = React.useMemo(() => loadOrder(), [])
  const { order: kpiOrder, draggingId, overId, bind: kpiBind, reset: kpiReset } = useDragOrder(kpiInit)
  const isReordered = kpiOrder.join(',') !== DEFAULT_ORDER.join(',')

  const kpiDefs: Record<KpiId, {
    label: string
    rawValue: number
    display?: string
    icon: React.ReactNode
    iconBg: string
    iconColor: string
    trend?: 'up' | 'down'
    trendLabel?: string
    trendGood?: boolean
  }> = {
    passRate: {
      label: 'Pass Rate',
      rawValue: passRate,
      display: `${passRate}%`,
      icon: <CheckCircle2 className="h-5 w-5" />,
      iconBg: '#D1FAE5',
      iconColor: '#059669',
      trend: passRate >= 80 ? 'up' : 'down',
      trendLabel: passRate >= 80 ? 'On target' : 'Below target',
      trendGood: true,
    },
    failures: {
      label: 'Failures',
      rawValue: failed,
      icon: <XCircle className="h-5 w-5" />,
      iconBg: '#FEE2E2',
      iconColor: '#DC2626',
      trend: failed > 5 ? 'up' : undefined,
      trendLabel: failed > 5 ? `${failed} failures` : undefined,
      trendGood: false,
    },
    totalRuns: {
      label: 'Total Runs',
      rawValue: total,
      icon: <Activity className="h-5 w-5" />,
      iconBg: '#EDE9FE',
      iconColor: '#7C3AED',
      trend: total > 0 ? 'up' : undefined,
      trendLabel: total > 0 ? `${running} running` : undefined,
      trendGood: true,
    },
    avgDuration: {
      label: 'Avg Duration',
      rawValue: Math.round(avgDur / 100),
      display: fmtMs(avgDur),
      icon: <Clock className="h-5 w-5" />,
      iconBg: '#DBEAFE',
      iconColor: '#1D4ED8',
    },
    avgTokens: {
      label: 'Avg Tokens',
      rawValue: Math.round(avgTokens / 10),
      display: avgTokens > 0 ? fmtK(avgTokens) : '—',
      icon: <Zap className="h-5 w-5" />,
      iconBg: '#FEF3C7',
      iconColor: '#B45309',
    },
    activeAgents: {
      label: 'Active Agents',
      rawValue: activeAgentCount,
      icon: <Users className="h-5 w-5" />,
      iconBg: '#F0FDF4',
      iconColor: '#15803D',
      trend: activeAgentCount > 0 ? 'up' : undefined,
      trendLabel: activeAgentCount > 0 ? `${activeAgentCount} live` : undefined,
      trendGood: true,
    },
  }

  return (
    <div className="min-h-full bg-slate-50/60 px-4 py-6 sm:px-6 lg:px-8">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Dashboard</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Realtime agent evaluation — pass rates, failures, and run activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Speed selector */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            {(['1x', '2x', 'ludicrous'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold transition-all"
                style={{
                  backgroundColor: speed === s ? '#10B981' : 'transparent',
                  color: speed === s ? 'white' : '#94A3B8',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {isReordered && (
            <button
              type="button"
              onClick={kpiReset}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm transition-colors hover:bg-slate-50"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}

          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all"
            style={{
              background: isPlaying
                ? 'linear-gradient(135deg,#10B981,#059669)'
                : 'linear-gradient(135deg,#64748B,#475569)',
              boxShadow: isPlaying ? '0 4px 14px rgba(16,185,129,0.35)' : 'none',
            }}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────── */}
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Key Metrics</span>
        <span className="text-xs text-slate-300">· drag to reorder</span>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpiOrder.map((id) => {
          const d = kpiDefs[id]
          return (
            <KpiCard
              key={id}
              label={d.label}
              rawValue={d.rawValue}
              display={d.display}
              icon={d.icon}
              iconBg={d.iconBg}
              iconColor={d.iconColor}
              trend={d.trend}
              trendLabel={d.trendLabel}
              trendGood={d.trendGood}
              dragging={draggingId === id}
              dragOver={overId === id && draggingId !== null && draggingId !== id}
              bindProps={kpiBind(id)}
            />
          )
        })}
      </div>

      {/* ── Row 1: Heatmap + Donuts ──────────────────────────────────────── */}
      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">

        {/* Heatmap — spans 2 cols */}
        <div className="xl:col-span-2">
          <Section
            dark
            title="Agent × Scenario Heatmap"
            subtitle="Pass/fail rate for each agent across all scenario types — click rows or columns to filter"
            right={
              (heatRow || heatCol) ? (
                <button
                  type="button"
                  onClick={() => { setHeatRow(null); setHeatCol(null) }}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Clear filter
                </button>
              ) : null
            }
          >
            <div className="p-5">
              <CategoryHeatMap
                cells={heatCells}
                rows={[...AGENTS]}
                cols={[...SCENARIOS]}
                activeRow={heatRow}
                activeCol={heatCol}
                onRowClick={setHeatRow}
                onColClick={setHeatCol}
                flashKey={heatFlashKey}
              />
            </div>
          </Section>
        </div>

        {/* Donuts */}
        <div className="flex flex-col gap-4">
          {/* By Status */}
          <Section title="By Status" subtitle="Run outcomes">
            <div className="flex justify-center py-5">
              <DonutChart
                slices={statusSlices.length > 0 ? statusSlices : [{ key: 'empty', label: 'No data', value: 1, color: '#E2E8F0' }]}
                size={130}
                thickness={20}
                activeKey={activeStatusKey}
                onSliceClick={setActiveStatusKey}
                centerLabel={total > 0 ? `${passRate}%` : '—'}
                centerSub="pass rate"
              />
            </div>
          </Section>

          {/* By Agent */}
          <Section title="By Agent" subtitle="Run distribution">
            <div className="flex justify-center py-5">
              <DonutChart
                slices={agentSlices.length > 0 ? agentSlices : [{ key: 'empty', label: 'No data', value: 1, color: '#E2E8F0' }]}
                size={130}
                thickness={20}
                activeKey={activeAgentKey}
                onSliceClick={setActiveAgentKey}
                centerLabel={total > 0 ? String(total) : '—'}
                centerSub="total runs"
              />
            </div>
          </Section>
        </div>
      </div>

      {/* ── Row 2: Run Activity chart ────────────────────────────────────── */}
      <div className="mb-4">
        <Section
          dark
          title="Run Activity — Last 120s"
          subtitle="Realtime pass/fail counts per second — drag to select a window for log analysis"
          right={
            <div className="flex items-center gap-3">
              {brushRange && (
                <button
                  type="button"
                  onClick={() => setBrushRange(null)}
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-400 transition-colors hover:bg-white/10"
                >
                  Clear selection
                </button>
              )}
              <LiveDot />
            </div>
          }
        >
          <div className="px-4 py-3">
            <TimeSeriesChart
              points={timePoints}
              height={160}
              onBrush={setBrushRange}
              brushRange={brushRange}
            />
          </div>
        </Section>
      </div>

      {/* ── Row 3: Live Runs + Agent Health ─────────────────────────────── */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Live Runs table */}
        <Section
          title="Live Runs"
          subtitle={`${total} total`}
          right={<LiveDot />}
        >
          <div className="max-h-80 overflow-y-auto">
            {arrived.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-xs text-slate-300">
                Waiting for runs…
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Scenario</th>
                    <th className="hidden px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 sm:table-cell">Agent</th>
                    <th className="hidden px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">Duration</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {arrived.slice(0, 50).map((run, i) => {
                    const isNew = run.runId === newestId
                    const color = AGENT_COLOR[run.agent] ?? '#94A3B8'
                    return (
                      <tr
                        key={run.runId}
                        className="border-b border-slate-50 transition-colors last:border-0"
                        style={{
                          backgroundColor: isNew
                            ? run.status === 'passed'
                              ? 'rgba(16,185,129,0.05)'
                              : run.status === 'failed'
                              ? 'rgba(239,68,68,0.05)'
                              : 'transparent'
                            : i % 2 === 0 ? 'transparent' : 'rgba(248,250,252,0.5)',
                        }}
                      >
                        <td className="px-4 py-2.5">
                          <p className="max-w-[180px] truncate font-medium text-slate-700">{run.scenario}</p>
                        </td>
                        <td className="hidden px-3 py-2.5 sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-slate-500">{run.agent}</span>
                          </div>
                        </td>
                        <td className="hidden px-3 py-2.5 text-right tabular-nums text-slate-400 md:table-cell">
                          {fmtMs(run.durationMs)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <StatusPill status={run.status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Section>

        {/* Agent Health */}
        <Section
          title="Agent Health"
          subtitle="Pass rate and run counts per agent"
          right={
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-semibold text-slate-600">All time</span>
            </div>
          }
        >
          <div className="flex flex-col gap-3 p-4">
            {agentStats.map(({ agent, passed: p, failed: f, total: t }) => (
              <AgentHealthBar
                key={agent}
                agent={agent}
                passed={p}
                failed={f}
                total={t}
                color={AGENT_COLOR[agent] ?? '#94A3B8'}
              />
            ))}
            {agentStats.every((a) => a.total === 0) && (
              <div className="flex items-center justify-center py-8 text-xs text-slate-300">
                Waiting for agent runs…
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* ── Row 4: Failure alert banner (conditional) ────────────────────── */}
      {failed > 0 && passRate < 70 && (
        <div
          className="mb-4 flex items-center gap-3 rounded-2xl px-5 py-3.5"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))',
            border: '1px solid rgba(239,68,68,0.15)',
          }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">
              Pass rate is {passRate}% — below the 70% threshold
            </p>
            <p className="text-xs text-red-400">
              {failed} failures detected · Review the Logs Explorer below for details
            </p>
          </div>
          <div className="flex gap-2">
            {AGENTS.filter((a) => {
              const s = agentStats.find((x) => x.agent === a)
              return s && s.total > 0 && s.failed / s.total > 0.4
            }).map((a) => (
              <span
                key={a}
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ backgroundColor: `${AGENT_COLOR[a]}20`, color: AGENT_COLOR[a] }}
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Row 5: Logs Explorer ─────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Logs Explorer</span>
          {brushRange && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
              Chart selection active
            </span>
          )}
        </div>
        <LogsExplorer
          entries={logEntries}
          newestId={newestId}
          brushRange={brushRange}
        />
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs tabular-nums text-slate-300">
          {total} runs · {isPlaying ? 'live feed' : 'paused'} · synthetic demo data
        </p>
        <div className="flex items-center gap-4">
          {[
            { color: '#10B981', label: 'Passed' },
            { color: '#EF4444', label: 'Failed' },
            { color: '#3B82F6', label: 'Running' },
            { color: '#F59E0B', label: 'Queued' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
