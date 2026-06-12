import * as React from 'react'
import { Pause, Play, X, Zap, Activity } from 'lucide-react'
import { type RunRecord } from '@/data/runHistory'
import { useLiveFeed, type SpeedSetting } from '@/hooks/useLiveFeed'
import { HeatMap, type HeatMapCell } from '@/components/charts/HeatMap'
import { AnimatedDonut, type DonutSegment } from '@/components/charts/AnimatedDonut'
import { LiveToast, type ToastItem } from '@/components/views/LiveToast'
import { RunDetailPanel } from '@/components/views/RunDetailPanel'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'

// ── colours ────────────────────────────────────────────────────────────────────
const AGENT_COLOR: Record<string, string> = {
  Navigator: '#60a5fa',
  Explorer:  '#f87171',
  Pioneer:   '#34d399',
  Voyager:   '#fbbf24',
}
const STATUS_COLOR: Record<string, string> = {
  passed:    '#34d399',
  failed:    '#f87171',
  cancelled: '#fbbf24',
  running:   '#60a5fa',
  queued:    '#737373',
}

// ── toast message generator ────────────────────────────────────────────────────
let voyagerFails = 0
function toastMessage(run: RunRecord): string {
  if (run.status === 'passed') {
    return `✅ ${run.agent} passed in ${(run.durationMs / 1000).toFixed(1)}s`
  }
  if (run.status === 'failed') {
    if (run.agent === 'Voyager') {
      voyagerFails++
      if (voyagerFails >= 2) return `💀 Voyager is having a day. (${run.scenario})`
    }
    return `💀 ${run.agent} fumbled: ${run.scenario} (${(run.durationMs / 1000).toFixed(1)}s)`
  }
  if (run.status === 'cancelled') return `⚠️ ${run.agent} was cancelled mid-run`
  return `⏳ ${run.agent} started: ${run.scenario}`
}

// ── heatmap builder ────────────────────────────────────────────────────────────
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function buildHeatCells(records: RunRecord[]): HeatMapCell[] {
  const now = Date.now()
  const buckets: Record<string, HeatMapCell> = {}

  // Pre-fill 7 days × 8 time buckets so empty cells exist
  for (let d = 6; d >= 0; d--) {
    const dayMs = now - d * 86_400_000
    const dayLabel = DAY_LABELS[new Date(dayMs).getDay()]
    for (let h = 0; h < 24; h += 3) {
      const key = `${dayLabel}-${h}`
      if (!buckets[key]) buckets[key] = { day: dayLabel, hour: h, passed: 0, failed: 0, total: 0 }
    }
  }

  records.forEach((r) => {
    const d = new Date(r.startedAtMs)
    const dayLabel = DAY_LABELS[d.getDay()]
    const hourBucket = Math.floor(d.getHours() / 3) * 3
    const key = `${dayLabel}-${hourBucket}`
    if (!buckets[key]) buckets[key] = { day: dayLabel, hour: hourBucket, passed: 0, failed: 0, total: 0 }
    buckets[key].total++
    if (r.status === 'passed') buckets[key].passed++
    else if (r.status === 'failed') buckets[key].failed++
  })

  return Object.values(buckets)
}

function orderedDays(): string[] {
  const now = new Date()
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000)
    days.push(DAY_LABELS[d.getDay()])
  }
  return days
}

// ── filters ────────────────────────────────────────────────────────────────────
function applyFilters(
  records: RunRecord[],
  day: string | null,
  status: string | null,
  agent: string | null,
): RunRecord[] {
  return records.filter((r) => {
    if (day) {
      const d = new Date(r.startedAtMs)
      if (DAY_LABELS[d.getDay()] !== day) return false
    }
    if (status && r.status !== status) return false
    if (agent && r.agent !== agent) return false
    return true
  })
}

// ── rolling number animation ───────────────────────────────────────────────────
function useRollingNumber(target: number, duration = 400) {
  const [display, setDisplay] = React.useState(target)
  const rafRef = React.useRef<number | null>(null)
  const startRef = React.useRef<{ from: number; to: number; t: number } | null>(null)

  React.useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = { from: display, to: target, t: performance.now() }

    function tick(now: number) {
      const s = startRef.current!
      const pct = Math.min((now - s.t) / duration, 1)
      const eased = 1 - Math.pow(1 - pct, 3) // ease-out cubic
      const val = Math.round(s.from + (s.to - s.from) * eased)
      setDisplay(val)
      if (pct < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  return display
}

// ── KPI card ───────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string
  value: number
  unit?: string
  color?: string
  shake?: boolean
  streak?: boolean
  sub?: string
}
function KpiCard({ label, value, unit, color, shake, streak, sub }: KpiCardProps) {
  const display = useRollingNumber(value)
  const [isShaking, setIsShaking] = React.useState(false)

  React.useEffect(() => {
    if (shake) {
      setIsShaking(true)
      const t = setTimeout(() => setIsShaking(false), 500)
      return () => clearTimeout(t)
    }
  }, [shake, value])

  return (
    <div style={{
      backgroundColor: '#161616',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '16px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      position: 'relative',
      overflow: 'hidden',
      animation: isShaking ? 'kpiShake 0.45s cubic-bezier(0.36,0.07,0.19,0.97)' : 'none',
    }}>
      {streak && (
        <div style={{
          position: 'absolute', top: 10, right: 12,
          fontSize: 11, fontWeight: 700, color: '#fbbf24',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          🔥 streak
        </div>
      )}
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontSize: 28, fontWeight: 700,
          color: color ?? '#fafafa',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {display}
        </span>
        {unit && <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{unit}</span>}
      </div>
      {sub && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{sub}</span>}
    </div>
  )
}

// ── live run row ───────────────────────────────────────────────────────────────
interface LiveRunRowProps {
  run: RunRecord
  isNew: boolean
  isSelected: boolean
  onClick: () => void
}
function LiveRunRow({ run, isNew, isSelected, onClick }: LiveRunRowProps) {
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

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '8px 1fr 120px 70px 80px 90px',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        cursor: 'pointer',
        backgroundColor: flashing
          ? isPassed ? 'rgba(52,211,153,0.08)' : isFailed ? 'rgba(248,113,113,0.08)' : 'transparent'
          : isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
        boxShadow: isSelected ? 'inset 0 0 0 1px rgba(255,255,255,0.1)' : 'none',
        borderRadius: isSelected ? 6 : 0,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(-6px)',
        transition: flashing
          ? 'background-color 0.8s ease, opacity 0.25s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)'
          : 'background-color 0.4s ease, opacity 0.25s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease',
      }}
    >
      {/* Status dot */}
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        backgroundColor: STATUS_COLOR[run.status] ?? '#737373',
        boxShadow: isFailed ? '0 0 6px #f87171' : isPassed ? '0 0 4px #34d399' : 'none',
        flexShrink: 0,
        animation: run.status === 'running' ? 'pulse 1.5s ease-in-out infinite' : 'none',
      }} />

      {/* Scenario + run ID */}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {run.scenario}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {run.runId}
        </span>
      </div>

      {/* Agent */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: agentColor, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {run.agent}
        </span>
      </div>

      {/* Duration */}
      <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {run.durationMs > 0 ? `${(run.durationMs / 1000).toFixed(1)}s` : '—'}
      </span>

      {/* Started */}
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>
        {run.startedAt}
      </span>

      {/* Status badge */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 999,
          backgroundColor: isPassed ? 'rgba(52,211,153,0.12)' : isFailed ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.06)',
          color: isPassed ? '#34d399' : isFailed ? '#f87171' : 'rgba(255,255,255,0.5)',
          border: `1px solid ${isPassed ? 'rgba(52,211,153,0.25)' : isFailed ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.1)'}`,
        }}>
          {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
        </span>
      </div>
    </div>
  )
}

// ── chart panel wrapper ────────────────────────────────────────────────────────
function ChartPanel({ title, sub, children, style }: {
  title: string; sub?: string; children: React.ReactNode; style?: React.CSSProperties
}) {
  return (
    <div style={{
      backgroundColor: '#161616',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      ...style,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fafafa', marginBottom: 2 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{sub}</div>}
      </div>
      {children}
    </div>
  )
}

// ── ripple overlay ─────────────────────────────────────────────────────────────
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
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 500,
      border: '2px solid rgba(248,113,113,0.5)',
      borderRadius: 0,
      boxShadow: 'inset 0 0 60px rgba(248,113,113,0.15)',
      animation: 'rippleFade 0.7s ease-out forwards',
    }} />
  )
}

// ── main component ─────────────────────────────────────────────────────────────
export function OverviewPage() {
  const { arrived, isPlaying, speed, isLudicrous, togglePlay, setSpeed } = useLiveFeed()

  // Filters
  const [dayFilter, setDayFilter] = React.useState<string | null>(null)
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null)
  const [agentFilter, setAgentFilter] = React.useState<string | null>(null)

  // Drill-down
  const [selectedRun, setSelectedRun] = React.useState<RunRecord | null>(null)

  // Toasts
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  // Failure ripple counter
  const [failRipple, setFailRipple] = React.useState(0)

  // Streak tracking
  const streakRef = React.useRef(0)
  const [streakCount, setStreakCount] = React.useState(0)

  // Consecutive pass streak badge
  const showStreak = streakCount >= 3

  // Track the newest run ID so we can flash its row
  const [newestId, setNewestId] = React.useState<string | null>(null)

  // Track heatmap flash key
  const [hmFlashKey, setHmFlashKey] = React.useState<string | null>(null)

  // React to new runs
  const prevLengthRef = React.useRef(0)
  React.useEffect(() => {
    if (arrived.length <= prevLengthRef.current) return
    const run = arrived[0] // newest is always at index 0
    prevLengthRef.current = arrived.length

    // Flash row
    setNewestId(run.runId)
    setTimeout(() => setNewestId(null), 1000)

    // Toast
    const msg = toastMessage(run)
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((p) => [{ id, message: msg, passed: run.status === 'passed', timestamp: Date.now() }, ...p].slice(0, 6))

    // Failure ripple + streak reset
    if (run.status === 'failed') {
      setFailRipple((n) => n + 1)
      streakRef.current = 0
      setStreakCount(0)
    } else if (run.status === 'passed') {
      streakRef.current++
      setStreakCount(streakRef.current)
    }

    // Heatmap flash
    const d = new Date(run.startedAtMs)
    const dayLabel = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]
    const hourBucket = Math.floor(d.getHours() / 3) * 3
    setHmFlashKey(`${dayLabel}-${hourBucket}`)
    setTimeout(() => setHmFlashKey(null), 900)
  }, [arrived.length])

  // Filtered data
  const filtered = React.useMemo(
    () => applyFilters(arrived, dayFilter, statusFilter, agentFilter),
    [arrived, dayFilter, statusFilter, agentFilter],
  )

  // Metrics
  const passCount = React.useMemo(() => filtered.filter((r) => r.status === 'passed').length, [filtered])
  const failCount = React.useMemo(() => filtered.filter((r) => r.status === 'failed').length, [filtered])
  const totalFinished = passCount + failCount
  const passRatePct = totalFinished === 0 ? 0 : Math.round((passCount / totalFinished) * 100)
  const avgDurS = React.useMemo(() => {
    const fin = filtered.filter((r) => r.durationMs > 0)
    if (fin.length === 0) return 0
    return Math.round(fin.reduce((s, r) => s + r.durationMs, 0) / fin.length / 100) / 10
  }, [filtered])

  // Heatmap cells (all arrived, filter by day is handled via opacity in chart)
  const heatCells = React.useMemo(() => buildHeatCells(arrived), [arrived])
  const days = React.useMemo(() => orderedDays(), [])

  // Donut: status
  const statusSegments: DonutSegment[] = React.useMemo(() => {
    const counts: Record<string, number> = {}
    filtered.forEach((r) => { counts[r.status] = (counts[r.status] ?? 0) + 1 })
    return (['passed','failed','cancelled','running','queued'] as const)
      .filter((s) => (counts[s] ?? 0) > 0)
      .map((s) => ({ key: s, label: s.charAt(0).toUpperCase() + s.slice(1), value: counts[s] ?? 0, color: STATUS_COLOR[s] }))
  }, [filtered])

  // Donut: agent
  const agentSegments: DonutSegment[] = React.useMemo(() => {
    const counts: Record<string, number> = {}
    filtered.forEach((r) => { counts[r.agent] = (counts[r.agent] ?? 0) + 1 })
    return Object.entries(counts).map(([agent, value]) => ({
      key: agent, label: agent, value, color: AGENT_COLOR[agent] ?? '#737373',
    }))
  }, [filtered])

  const hasFilter = dayFilter !== null || statusFilter !== null || agentFilter !== null
  const clearFilters = () => { setDayFilter(null); setStatusFilter(null); setAgentFilter(null) }

  const isEmpty = arrived.length === 0
  const isPaused = !isPlaying

  // Failure shake trigger for KPI card (changes value = new shake)
  const [shakeKey, setShakeKey] = React.useState(0)
  React.useEffect(() => {
    if (failCount > 0) setShakeKey((k) => k + 1)
  }, [failCount])

  return (
    <>
      {/* Global keyframe animations injected once */}
      <style>{`
        @keyframes kpiShake {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-5px) rotate(-1deg); }
          30% { transform: translateX(5px) rotate(1deg); }
          45% { transform: translateX(-4px); }
          60% { transform: translateX(4px); }
          75% { transform: translateX(-2px); }
        }
        @keyframes rippleFade {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <FailureRipple trigger={failRipple} />

      {/* Ludicrous glow */}
      {isLudicrous && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 400,
          boxShadow: 'inset 0 0 80px rgba(251,191,36,0.12)',
          border: '1px solid rgba(251,191,36,0.08)',
        }} />
      )}

      <div style={{
        minHeight: '100%',
        backgroundColor: '#0d0d0d',
        color: '#fafafa',
        fontFamily: 'Inter, ui-sans-serif, -apple-system, sans-serif',
        padding: '24px 28px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>

        {/* ── Header row ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Activity size={16} color="#34d399" />
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
                Production Overview
              </h1>
              {isLudicrous && (
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 4, padding: '2px 6px' }}>
                  LUDICROUS
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              {isEmpty
                ? isPaused ? "the agents are on a union-mandated break." : "agents are stretching..."
                : `${arrived.length} run${arrived.length !== 1 ? 's' : ''} captured · live feed ${isPaused ? 'paused' : 'active'}`}
            </p>
          </div>

          {/* Feed controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Speed buttons */}
            {(['1x','2x','ludicrous'] as SpeedSetting[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: `1px solid ${speed === s ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  backgroundColor: speed === s ? 'rgba(96,165,250,0.12)' : 'transparent',
                  color: speed === s ? '#60a5fa' : 'rgba(255,255,255,0.4)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {s === 'ludicrous' && <Zap size={10} />}
                {s}
              </button>
            ))}

            {/* Play/pause */}
            <button
              type="button"
              onClick={togglePlay}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.12)',
                backgroundColor: isPlaying ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)',
                color: isPlaying ? '#34d399' : 'rgba(255,255,255,0.5)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              {isPlaying ? 'Pause' : 'Resume'}
            </button>
          </div>
        </div>

        {/* ── KPI tiles ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <KpiCard
            label="Pass rate"
            value={passRatePct}
            unit="%"
            color={passRatePct >= 80 ? '#34d399' : passRatePct >= 60 ? '#fbbf24' : '#f87171'}
            streak={showStreak}
            sub={totalFinished > 0 ? `${totalFinished} finished` : 'no finished runs yet'}
          />
          <KpiCard
            label="Runs in view"
            value={filtered.length}
            color="#fafafa"
            sub={hasFilter ? 'filtered view' : 'live total'}
          />
          <KpiCard
            label="Avg duration"
            value={avgDurS * 10}
            unit="s ÷10"
            color="#60a5fa"
            sub="across finished runs"
          />
          <KpiCard
            label="Failures"
            value={failCount}
            color={failCount > 0 ? '#f87171' : '#fafafa'}
            shake={shakeKey > 0}
            sub={totalFinished > 0 ? `${Math.round((failCount / totalFinished) * 100)}% fail rate` : 'none yet'}
          />
        </div>

        {/* ── Active filter chips ── */}
        {hasFilter && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8,
            animation: 'fadeSlideIn 0.2s ease',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
              Filters
            </span>
            {[
              dayFilter && { label: `Day: ${dayFilter}`, clear: () => setDayFilter(null) },
              statusFilter && { label: `Status: ${statusFilter}`, clear: () => setStatusFilter(null) },
              agentFilter && { label: `Agent: ${agentFilter}`, clear: () => setAgentFilter(null) },
            ].filter(Boolean).map((chip: any) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.clear}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.12)',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {chip.label} <X size={11} />
              </button>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              style={{
                padding: '3px 10px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.08)',
                backgroundColor: 'transparent',
                color: 'rgba(255,255,255,0.35)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Charts row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 14 }}>
          {/* Heatmap */}
          <ChartPanel
            title="Runs by day & time"
            sub="Click a day header to filter · colour = pass/fail ratio"
          >
            {arrived.length === 0 ? (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                ⏳ waiting for agents to do something...
              </div>
            ) : (
              <HeatMap
                cells={heatCells}
                days={days}
                activeDay={dayFilter}
                onDayClick={setDayFilter}
                flashKey={hmFlashKey}
              />
            )}
          </ChartPanel>

          {/* Status donut */}
          <ChartPanel title="Status breakdown" sub="Click to filter">
            {arrived.length === 0 ? (
              <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                ⏳ no data yet
              </div>
            ) : (
              <AnimatedDonut
                segments={statusSegments}
                size={150}
                thickness={22}
                activeKey={statusFilter}
                onSegmentClick={setStatusFilter}
                centerSub="runs"
              />
            )}
          </ChartPanel>

          {/* Agent donut */}
          <ChartPanel title="Runs by agent" sub="Click to filter">
            {arrived.length === 0 ? (
              <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                ⏳ no data yet
              </div>
            ) : (
              <AnimatedDonut
                segments={agentSegments}
                size={150}
                thickness={22}
                activeKey={agentFilter}
                onSegmentClick={setAgentFilter}
                centerSub={agentFilter ? `${filtered.length} runs` : undefined}
              />
            )}
          </ChartPanel>
        </div>

        {/* ── Run table + detail panel ── */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedRun ? '1.6fr 1fr' : '1fr', gap: 16 }}>
          {/* Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Runs</h2>
                {hasFilter && filtered.length !== arrived.length && (
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    padding: '2px 8px', borderRadius: 999,
                    backgroundColor: 'rgba(96,165,250,0.12)',
                    color: '#60a5fa',
                    border: '1px solid rgba(96,165,250,0.25)',
                  }}>
                    {filtered.length} of {arrived.length}
                  </span>
                )}
              </div>
              {arrived.length > 0 && !isPlaying && (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  paused · {arrived.length} runs captured
                </span>
              )}
            </div>

            <div style={{
              backgroundColor: '#161616',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              {/* Column headers */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '8px 1fr 120px 70px 80px 90px',
                alignItems: 'center',
                gap: 12,
                padding: '8px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                {['', 'Scenario', 'Agent', 'Duration', 'Started', 'Status'].map((h, i) => (
                  <span key={i} style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.25)',
                    textAlign: i >= 3 && i <= 4 ? 'right' : 'left',
                    justifySelf: i >= 3 && i <= 4 ? 'end' : 'start',
                  }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Rows */}
              {filtered.length === 0 ? (
                <div style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.25)',
                  fontSize: 13,
                }}>
                  {isEmpty
                    ? isPaused
                      ? "😴 agents are on a union-mandated break."
                      : "⏳ agents are stretching... runs will appear here."
                    : "No runs match the current filters."}
                  {!isEmpty && hasFilter && (
                    <div style={{ marginTop: 12 }}>
                      <button type="button" onClick={clearFilters} style={{
                        padding: '5px 14px', borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.1)',
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: 12, cursor: 'pointer',
                      }}>
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                  {filtered.slice(0, 30).map((run, i) => (
                    <LiveRunRow
                      key={run.runId}
                      run={run}
                      isNew={i === 0 && run.runId === newestId}
                      isSelected={selectedRun?.runId === run.runId}
                      onClick={() => setSelectedRun((prev) => prev?.runId === run.runId ? null : run)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          {selectedRun && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Run detail</h2>
              </div>
              <RunDetailPanel
                run={selectedRun}
                onClose={() => setSelectedRun(null)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            Live feed · runs arrive every {speed === '1x' ? '1.8s' : speed === '2x' ? '0.9s' : '0.3s'} · data is synthetic demo data
          </p>
        </div>
      </div>

      <LiveToast toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </>
  )
}
