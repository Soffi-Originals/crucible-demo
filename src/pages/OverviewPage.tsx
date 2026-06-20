import * as React from 'react'
import {
  ArrowUp, ArrowDown, BarChart2, Bell, CheckCircle2, ChevronRight,
  Clock, FolderKanban, Pause, Play, Plus, Square, TrendingUp, Users,
  Zap, GripVertical, X, RotateCcw,
} from 'lucide-react'
import { type RunRecord } from '@/data/runHistory'
import { useLiveFeed } from '@/hooks/useLiveFeed'

// ── helpers ───────────────────────────────────────────────────────────────────

function categorize(scenario: string): string {
  const s = scenario.toLowerCase()
  if (s.startsWith('refund'))  return 'Refund'
  if (s.startsWith('renewal')) return 'Renewal'
  if (s.startsWith('escalat')) return 'Escalation'
  if (s.startsWith('onboard')) return 'Onboarding'
  if (s.startsWith('qualify')) return 'Qualify'
  return 'Other'
}

const AGENTS = ['Navigator', 'Explorer', 'Pioneer', 'Voyager']
const AGENT_COLOR: Record<string, string> = {
  Navigator: '#10B981',
  Explorer:  '#3B82F6',
  Pioneer:   '#F59E0B',
  Voyager:   '#EF4444',
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

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

// ── KPI drag-and-drop ─────────────────────────────────────────────────────────
type KpiId = 'totalProjects' | 'ended' | 'running' | 'pending'
const DEFAULT_KPI_ORDER: KpiId[] = ['totalProjects', 'ended', 'running', 'pending']
const KPI_STORAGE_KEY = 'crucible-donezo-kpi-order'

function loadKpiOrder(): KpiId[] {
  try {
    const raw = localStorage.getItem(KPI_STORAGE_KEY)
    if (!raw) return DEFAULT_KPI_ORDER
    const parsed = JSON.parse(raw) as KpiId[]
    if (
      Array.isArray(parsed) &&
      parsed.length === DEFAULT_KPI_ORDER.length &&
      DEFAULT_KPI_ORDER.every((id) => parsed.includes(id))
    ) return parsed
  } catch { /* ignore */ }
  return DEFAULT_KPI_ORDER
}

function saveKpiOrder(order: KpiId[]) {
  try { localStorage.setItem(KPI_STORAGE_KEY, JSON.stringify(order)) } catch { /* ignore */ }
}

function useDragOrder(initial: KpiId[]) {
  const [order, setOrder] = React.useState<KpiId[]>(initial)
  const dragIdRef = React.useRef<KpiId | null>(null)
  const [draggingId, setDraggingId] = React.useState<KpiId | null>(null)
  const [overIndex, setOverIndex] = React.useState<number | null>(null)

  const handlers = React.useCallback((id: KpiId, index: number) => ({
    onDragStart: (e: React.DragEvent) => {
      dragIdRef.current = id
      setDraggingId(id)
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', id)
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setOverIndex(index)
    },
    onDragLeave: () => setOverIndex(null),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      const fromId = dragIdRef.current
      if (!fromId || fromId === id) { setOverIndex(null); return }
      setOrder((prev) => {
        const next = [...prev]
        const fi = next.indexOf(fromId)
        const ti = next.indexOf(id)
        if (fi === -1 || ti === -1) return prev
        next.splice(fi, 1)
        next.splice(ti, 0, fromId)
        saveKpiOrder(next)
        return next
      })
      setOverIndex(null)
    },
    onDragEnd: () => {
      dragIdRef.current = null
      setDraggingId(null)
      setOverIndex(null)
    },
  }), [])

  const resetOrder = React.useCallback(() => {
    setOrder(DEFAULT_KPI_ORDER)
    saveKpiOrder(DEFAULT_KPI_ORDER)
  }, [])

  return { order, draggingId, overIndex, handlers, resetOrder }
}

// ── stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  id: KpiId
  label: string
  value: number
  sub?: string
  trend?: 'up' | 'down' | null
  trendLabel?: string
  hero?: boolean
  dragging?: boolean
  dragOver?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
}

function StatCard({
  label, value, sub, trend, trendLabel, hero,
  dragging, dragOver,
  onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
}: StatCardProps) {
  const display = useRollingNumber(value)
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden rounded-2xl transition-all duration-200 select-none"
      style={{
        background: hero
          ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
          : 'white',
        border: dragOver
          ? '2px dashed #10B981'
          : hero
          ? 'none'
          : '1px solid #E2E8F0',
        boxShadow: dragging
          ? '0 20px 40px rgba(0,0,0,0.15)'
          : dragOver
          ? '0 0 0 2px rgba(16,185,129,0.3)'
          : hovered
          ? '0 8px 24px rgba(15,23,42,0.10)'
          : '0 1px 3px rgba(15,23,42,0.06)',
        transform: dragging ? 'scale(1.03) rotate(0.8deg)' : dragOver ? 'scale(1.01)' : 'none',
        opacity: dragging ? 0.6 : 1,
        cursor: 'grab',
        padding: '20px 22px',
      }}
    >
      {/* Drag handle */}
      {hovered && !dragging && (
        <div className="absolute right-3 top-3">
          <GripVertical
            className="h-3.5 w-3.5"
            style={{ color: hero ? 'rgba(255,255,255,0.4)' : '#CBD5E1' }}
          />
        </div>
      )}

      {/* Decorative circle for hero card */}
      {hero && (
        <>
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -right-2 h-16 w-16 rounded-full bg-white/5" />
        </>
      )}

      <div className="relative">
        <p className={`mb-3 text-xs font-semibold uppercase tracking-widest ${hero ? 'text-emerald-100' : 'text-slate-400'}`}>
          {label}
        </p>
        <div className="flex items-end gap-3">
          <span
            className={`text-4xl font-extrabold leading-none tabular-nums ${hero ? 'text-white' : 'text-slate-900'}`}
          >
            {display}
          </span>
          {trend && (
            <div
              className={`mb-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                trend === 'up'
                  ? hero
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-50 text-emerald-600'
                  : hero
                  ? 'bg-red-400/20 text-white'
                  : 'bg-red-50 text-red-500'
              }`}
            >
              {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {trendLabel}
            </div>
          )}
        </div>
        {sub && (
          <p className={`mt-2 text-xs ${hero ? 'text-emerald-100/70' : 'text-slate-400'}`}>
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

// ── project analytics bar chart ───────────────────────────────────────────────
function ProjectAnalyticsChart({ records }: { records: RunRecord[] }) {
  const today = new Date().getDay()
  // Build per-day counts (last 7 days, index 0 = oldest)
  const dayCounts = React.useMemo(() => {
    const counts = Array(7).fill(0)
    records.forEach((r) => {
      const d = new Date(r.startedAtMs)
      const diff = today - d.getDay()
      const idx = 6 - ((diff + 7) % 7)
      counts[idx] = (counts[idx] || 0) + 1
    })
    return counts
  }, [records, today])

  const max = Math.max(...dayCounts, 1)
  // Rotate DAYS so today is last
  const days = Array.from({ length: 7 }, (_, i) => DAYS[(today - 6 + i + 7) % 7])

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Project Analytics</h3>
          <p className="text-xs text-slate-400">Run activity by day of week</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-500">Runs</span>
        </div>
      </div>

      {/* Bars */}
      <div className="flex flex-1 items-end gap-2">
        {days.map((day, i) => {
          const heightPct = max > 0 ? (dayCounts[i] / max) * 100 : 0
          const isToday = i === 6
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end rounded-t-lg overflow-hidden" style={{ minHeight: 60 }}>
                <div
                  className="w-full rounded-xl transition-all duration-700"
                  style={{
                    height: `${Math.max(heightPct, 4)}%`,
                    background: isToday
                      ? 'linear-gradient(180deg, #10B981 0%, #059669 100%)'
                      : 'linear-gradient(180deg, #D1FAE5 0%, #A7F3D0 100%)',
                    minHeight: 6,
                    boxShadow: isToday ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
                  }}
                />
              </div>
              <span className={`text-xs font-semibold ${isToday ? 'text-emerald-600' : 'text-slate-400'}`}>
                {day}
              </span>
            </div>
          )
        })}
      </div>

      {/* Count labels */}
      <div className="mt-2 flex gap-2">
        {dayCounts.map((count, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-xs font-semibold text-slate-400 tabular-nums">
              {count > 0 ? count : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── reminders card ────────────────────────────────────────────────────────────
function RemindersCard({ unread }: { unread: number }) {
  const [timerRunning, setTimerRunning] = React.useState(false)
  const [seconds, setSeconds] = React.useState(0)

  React.useEffect(() => {
    if (!timerRunning) return
    const iv = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(iv)
  }, [timerRunning])

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const ss = (s % 60).toString().padStart(2, '0')
    return `${m}:${ss}`
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">Reminders</h3>
        {unread > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-50 px-1.5 text-xs font-bold text-red-500">
            {unread}
          </span>
        )}
      </div>

      {/* Meeting item */}
      <div className="mb-4 flex items-start gap-3 rounded-xl bg-slate-50 p-3">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
          <Bell className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800">Meeting with Arc Company</p>
          <p className="mt-0.5 text-xs text-slate-400">Today · 2:00 PM</p>
        </div>
      </div>

      {/* Timer display */}
      <div className="mb-4 flex-1 flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-emerald-50/40 py-4">
        <p className="mb-1 text-xs font-medium text-slate-400">Elapsed</p>
        <p className="text-3xl font-extrabold tabular-nums text-slate-900 tracking-tight">
          {fmt(seconds)}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setTimerRunning((r) => !r)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-300"
          >
            {timerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {timerRunning ? 'Pause' : 'Start'}
          </button>
          <button
            type="button"
            onClick={() => { setSeconds(0); setTimerRunning(false) }}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition-colors hover:bg-slate-200"
          >
            <Square className="h-3 w-3" />
          </button>
        </div>
      </div>

      <button
        type="button"
        className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600 active:bg-emerald-700"
        style={{ boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}
      >
        Start Meeting
      </button>
    </div>
  )
}

// ── team collaboration ────────────────────────────────────────────────────────
const TEAM_MEMBERS = [
  { name: 'Navigator', role: 'AI Agent', tasks: 24, color: '#10B981', initials: 'NA', status: 'active' },
  { name: 'Explorer',  role: 'AI Agent', tasks: 18, color: '#3B82F6', initials: 'EX', status: 'active' },
  { name: 'Pioneer',   role: 'AI Agent', tasks: 31, color: '#F59E0B', initials: 'PI', status: 'idle' },
  { name: 'Voyager',   role: 'AI Agent', tasks: 12, color: '#EF4444', initials: 'VO', status: 'error' },
]

function TeamCollaboration({ records }: { records: RunRecord[] }) {
  const agentStats = React.useMemo(() => {
    return AGENTS.map((agent) => {
      const runs = records.filter((r) => r.agent === agent)
      const passed = runs.filter((r) => r.status === 'passed').length
      const total = runs.length
      return { agent, total, passed, rate: total > 0 ? Math.round((passed / total) * 100) : 0 }
    })
  }, [records])

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Team Collaboration</h3>
          <p className="text-xs text-slate-400">Agent performance overview</p>
        </div>
        <button type="button" className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
          View all <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {TEAM_MEMBERS.map((member) => {
          const stat = agentStats.find((s) => s.agent === member.name)
          const tasks = stat?.total ?? member.tasks
          const rate = stat?.rate ?? 0
          const status = stat && stat.total > 0
            ? (rate >= 80 ? 'active' : rate >= 50 ? 'idle' : 'error')
            : member.status

          return (
            <div key={member.name} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-slate-50">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                style={{ backgroundColor: member.color }}
              >
                {member.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800">{member.name}</p>
                <p className="text-xs text-slate-400">{tasks} runs</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-700 tabular-nums">{rate > 0 ? `${rate}%` : '—'}</p>
                  <p className="text-xs text-slate-400">pass rate</p>
                </div>
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      status === 'active' ? '#10B981' :
                      status === 'idle' ? '#F59E0B' : '#EF4444',
                    boxShadow:
                      status === 'active' ? '0 0 6px rgba(16,185,129,0.6)' :
                      status === 'idle' ? '0 0 6px rgba(245,158,11,0.6)' : '0 0 6px rgba(239,68,68,0.6)',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── project progress gauge ────────────────────────────────────────────────────
function ProjectProgressGauge({ records }: { records: RunRecord[] }) {
  const passCount = records.filter((r) => r.status === 'passed').length
  const total = records.length
  const pct = total > 0 ? Math.round((passCount / total) * 100) : 41
  const display = useRollingNumber(pct)

  // SVG semi-circle gauge
  const R = 56
  const CX = 72
  const CY = 72
  const STROKE = 10
  const circumference = Math.PI * R  // half circumference for semi-circle
  const offset = circumference - (display / 100) * circumference

  const legendItems = [
    { label: 'Passed', color: '#10B981', count: passCount },
    { label: 'Failed', color: '#EF4444', count: records.filter((r) => r.status === 'failed').length },
    { label: 'Running', color: '#3B82F6', count: records.filter((r) => r.status === 'running' || r.status === 'queued').length },
  ]

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900">Project Progress</h3>
        <p className="text-xs text-slate-400">Overall pass rate</p>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg width={144} height={80} viewBox="0 0 144 80">
            {/* Track */}
            <path
              d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth={STROKE}
              strokeLinecap="round"
            />
            {/* Progress */}
            <path
              d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
              fill="none"
              stroke="url(#gaugeGrad)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)' }}
            />
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center">
            <span className="text-3xl font-extrabold text-slate-900 leading-none">{display}%</span>
            <span className="text-xs text-slate-400 mt-0.5">completed</span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-5 flex flex-col gap-2 w-full">
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="flex-1 text-xs text-slate-500">{item.label}</span>
              <span className="text-xs font-semibold text-slate-700 tabular-nums">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── time tracker card ─────────────────────────────────────────────────────────
function TimeTrackerCard() {
  const [running, setRunning] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)
  const startRef = React.useRef<number | null>(null)
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed * 1000
      const tick = () => {
        setElapsed(Math.floor((Date.now() - startRef.current!) / 1000))
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0')
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const ss = (s % 60).toString().padStart(2, '0')
    return `${h}:${m}:${ss}`
  }

  return (
    <div
      className="flex flex-col rounded-2xl p-5"
      style={{ background: 'linear-gradient(135deg, #0F2D1E 0%, #064E3B 60%, #065F46 100%)' }}
    >
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Time Tracker</h3>
          <p className="text-xs text-emerald-400/70">Agent evaluation time</p>
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
          <Clock className="h-3.5 w-3.5 text-emerald-300" />
        </div>
      </div>

      <div className="mb-6 flex flex-col items-center">
        <p
          className="text-4xl font-extrabold tabular-nums tracking-tight text-white"
          style={{ fontVariantNumeric: 'tabular-nums', textShadow: '0 0 30px rgba(16,185,129,0.4)' }}
        >
          {fmt(elapsed)}
        </p>
        <p className="mt-1 text-xs text-emerald-400/60">HH:MM:SS</p>
      </div>

      {/* Animated waveform */}
      <div className="mb-6 flex items-center justify-center gap-0.5" style={{ height: 32 }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: 3,
              backgroundColor: i % 3 === 0 ? '#10B981' : 'rgba(16,185,129,0.3)',
              height: running
                ? `${Math.random() * 20 + 8}px`
                : `${(Math.sin(i * 0.8) + 1) * 10 + 4}px`,
              transition: running ? 'height 0.15s ease' : 'none',
            }}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all"
          style={{
            backgroundColor: running ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
            border: `1px solid ${running ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}`,
          }}
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          type="button"
          onClick={() => { setRunning(false); setElapsed(0) }}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-emerald-300 transition-colors hover:bg-white/10"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Square className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── projects list ─────────────────────────────────────────────────────────────
const PROJECTS = [
  { name: 'Refund Automation',  icon: '🔄', date: 'Dec 30, 2024', color: '#10B981' },
  { name: 'Renewal Pipeline',   icon: '🔁', date: 'Jan 05, 2025', color: '#3B82F6' },
  { name: 'Escalation Router',  icon: '📢', date: 'Jan 12, 2025', color: '#F59E0B' },
  { name: 'Onboarding Flow',    icon: '🚀', date: 'Jan 18, 2025', color: '#8B5CF6' },
  { name: 'Qualify Leads',      icon: '🎯', date: 'Jan 25, 2025', color: '#EF4444' },
]

function ProjectsList({ records }: { records: RunRecord[] }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">Projects</h3>
        <button
          type="button"
          className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
        >
          <Plus className="h-3 w-3" /> New
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {PROJECTS.map((project) => {
          const cat = project.name.split(' ')[0]
          const runs = records.filter((r) => categorize(r.scenario) === cat || r.scenario.toLowerCase().includes(cat.toLowerCase()))
          return (
            <div
              key={project.name}
              className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50 cursor-pointer"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
                style={{ backgroundColor: `${project.color}15` }}
              >
                {project.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{project.name}</p>
                <p className="text-xs text-slate-400">{project.date}</p>
              </div>
              <div className="flex items-center gap-2">
                {runs.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-500 tabular-nums">
                    {runs.length}
                  </span>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── runs feed (compact) ───────────────────────────────────────────────────────
function RunsFeed({ records, newest }: { records: RunRecord[]; newest: string | null }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Live Runs</h3>
          <p className="text-xs text-slate-400">{records.length} total</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-600 font-semibold">Live</span>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {records.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-xs text-slate-300">
            Waiting for runs…
          </div>
        ) : (
          records.slice(0, 40).map((run) => {
            const isNew = run.runId === newest
            const isPassed = run.status === 'passed'
            const isFailed = run.status === 'failed'
            const color = AGENT_COLOR[run.agent] ?? '#94A3B8'

            return (
              <div
                key={run.runId}
                className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-50 last:border-0 transition-colors"
                style={{
                  backgroundColor: isNew
                    ? isPassed ? 'rgba(16,185,129,0.04)' : isFailed ? 'rgba(239,68,68,0.04)' : 'transparent'
                    : 'transparent',
                }}
              >
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: isPassed ? '#10B981' : isFailed ? '#EF4444' : '#F59E0B',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-medium text-slate-700">{run.scenario}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs text-slate-400 hidden sm:inline">{run.agent}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      backgroundColor: isPassed ? '#D1FAE5' : isFailed ? '#FEE2E2' : '#FEF3C7',
                      color: isPassed ? '#059669' : isFailed ? '#DC2626' : '#D97706',
                    }}
                  >
                    {run.status}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────
export function OverviewPage() {
  const { arrived, isPlaying, togglePlay } = useLiveFeed()

  const [newestRunId, setNewestRunId] = React.useState<string | null>(null)
  const prevLengthRef = React.useRef(0)

  React.useEffect(() => {
    if (arrived.length <= prevLengthRef.current) return
    const run = arrived[0]
    prevLengthRef.current = arrived.length
    setNewestRunId(run.runId)
    setTimeout(() => setNewestRunId(null), 1500)
  }, [arrived.length])

  // Derived stats
  const passCount = arrived.filter((r) => r.status === 'passed').length
  const failCount = arrived.filter((r) => r.status === 'failed').length
  const runningCount = arrived.filter((r) => r.status === 'running' || r.status === 'queued').length
  const total = arrived.length

  // KPI data
  const kpiData: Record<KpiId, { label: string; value: number; sub?: string; trend?: 'up' | 'down'; trendLabel?: string; hero?: boolean }> = {
    totalProjects: {
      label: 'Total Projects',
      value: total,
      sub: 'All runs in feed',
      trend: total > 0 ? 'up' : undefined,
      trendLabel: total > 0 ? `${passCount} passed` : undefined,
      hero: true,
    },
    ended: {
      label: 'Ended Projects',
      value: passCount + failCount,
      sub: `${failCount} failed`,
      trend: failCount > 5 ? 'down' : undefined,
      trendLabel: failCount > 5 ? 'High failures' : undefined,
    },
    running: {
      label: 'Running',
      value: runningCount,
      sub: 'In progress or queued',
    },
    pending: {
      label: 'Pending',
      value: Math.max(0, total - passCount - failCount - runningCount),
      sub: 'Awaiting execution',
    },
  }

  const { order: kpiOrder, draggingId, overIndex, handlers: kpiHandlers, resetOrder } = useDragOrder(
    React.useMemo(() => loadKpiOrder(), []),
  )

  const isReordered = kpiOrder.join(',') !== DEFAULT_KPI_ORDER.join(',')

  return (
    <div className="min-h-full bg-slate-50/60 p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Dashboard</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Plan, prioritize, and accomplish your tasks with ease.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isReordered && (
            <button
              type="button"
              onClick={resetOrder}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm transition-colors hover:bg-slate-50"
            >
              <RotateCcw className="h-3 w-3" /> Reset order
            </button>
          )}
          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all shadow-sm"
            style={{
              background: isPlaying
                ? 'linear-gradient(135deg, #10B981, #059669)'
                : 'linear-gradient(135deg, #64748B, #475569)',
              boxShadow: isPlaying ? '0 4px 12px rgba(16,185,129,0.35)' : 'none',
            }}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? 'Pause feed' : 'Resume feed'}
          </button>
        </div>
      </div>

      {/* KPI strip — 4 cards, drag-and-drop */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Key metrics
        </span>
        <span className="text-xs text-slate-300">· drag to reorder</span>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiOrder.map((id, index) => {
          const data = kpiData[id]
          const h = kpiHandlers(id, index)
          return (
            <StatCard
              key={id}
              id={id}
              label={data.label}
              value={data.value}
              sub={data.sub}
              trend={data.trend}
              trendLabel={data.trendLabel}
              hero={data.hero}
              dragging={draggingId === id}
              dragOver={overIndex === index && draggingId !== null && draggingId !== id}
              onDragStart={h.onDragStart}
              onDragOver={h.onDragOver}
              onDragLeave={h.onDragLeave}
              onDrop={h.onDrop}
              onDragEnd={h.onDragEnd}
            />
          )
        })}
      </div>

      {/* Row 2: Bar chart + Reminders */}
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="h-56">
            <ProjectAnalyticsChart records={arrived} />
          </div>
        </div>
        <div>
          <RemindersCard unread={arrived.filter((r) => r.status === 'failed').length} />
        </div>
      </div>

      {/* Row 3: Team + Progress gauge + Time tracker */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TeamCollaboration records={arrived} />
        <ProjectProgressGauge records={arrived} />
        <TimeTrackerCard />
      </div>

      {/* Row 4: Live runs + Projects list */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RunsFeed records={arrived} newest={newestRunId} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <ProjectsList records={arrived} />

          {/* Quick stats footer card */}
          <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            {[
              { icon: <TrendingUp className="h-4 w-4 text-emerald-500" />, label: 'Pass rate', value: total > 0 ? `${Math.round((passCount / total) * 100)}%` : '—', bg: 'bg-emerald-50' },
              { icon: <Users className="h-4 w-4 text-blue-500" />, label: 'Agents', value: '4', bg: 'bg-blue-50' },
              { icon: <Zap className="h-4 w-4 text-amber-500" />, label: 'Active', value: isPlaying ? 'Live' : 'Paused', bg: 'bg-amber-50' },
              { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, label: 'Passed', value: passCount.toString(), bg: 'bg-emerald-50' },
              { icon: <BarChart2 className="h-4 w-4 text-slate-400" />, label: 'Total', value: total.toString(), bg: 'bg-slate-50' },
              { icon: <FolderKanban className="h-4 w-4 text-purple-500" />, label: 'Projects', value: '5', bg: 'bg-purple-50' },
            ].map((item) => (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-1.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${item.bg}`}>
                  {item.icon}
                </div>
                <span className="text-sm font-bold text-slate-800 tabular-nums">{item.value}</span>
                <span className="text-xs text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dismiss filter chips if any are active */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-slate-300 tabular-nums">
          {total} runs · {isPlaying ? 'live feed' : 'paused'} · synthetic demo
        </p>
        <div className="flex items-center gap-3">
          {[
            { color: '#10B981', label: 'Pass' },
            { color: '#EF4444', label: 'Fail' },
            { color: '#F59E0B', label: 'Warn' },
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
