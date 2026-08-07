import * as React from 'react'
import { Upload, Plus, Search, SlidersHorizontal, X, MoreVertical } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RunRow } from '@/components/views/RunRow'
import { runs, evals } from '@/data/demo'

// ---------------------------------------------------------------------------
// Donut ring chart — rendered with SVG, no library needed
// ---------------------------------------------------------------------------
function DonutChart({
  value,
  label,
  rings,
}: {
  value: string
  label: string
  rings: { pct: number; color: string; trackColor: string; r: number; stroke: number }[]
}) {
  const size = 160
  const cx = size / 2
  const cy = size / 2
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {rings.map((ring, i) => {
            const circumference = 2 * Math.PI * ring.r
            const dash = (ring.pct / 100) * circumference
            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={ring.r}
                  fill="none"
                  stroke={ring.trackColor}
                  strokeWidth={ring.stroke}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={ring.r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={ring.stroke}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={circumference * 0.25}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                />
              </g>
            )
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-(--color-fg)" style={{ fontFeatureSettings: '"tnum"' }}>
            {value}
          </span>
          <span className="text-xs text-(--color-fg-subtle)">{label}</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sparkline area chart — SVG, no library
// ---------------------------------------------------------------------------
function SparklineChart({
  series,
  months,
}: {
  series: { color: string; values: number[] }[]
  months: string[]
}) {
  const W = 520
  const H = 120
  const padL = 0
  const padR = 0
  const padT = 8
  const padB = 24

  const allVals = series.flatMap((s) => s.values)
  const minV = Math.min(...allVals)
  const maxV = Math.max(...allVals)
  const range = maxV - minV || 1

  const pts = (values: number[]) =>
    values.map((v, i) => {
      const x = padL + (i / (values.length - 1)) * (W - padL - padR)
      const y = padT + (1 - (v - minV) / range) * (H - padT - padB)
      return [x, y] as [number, number]
    })

  const toPath = (points: [number, number][]) =>
    points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ')

  const toArea = (points: [number, number][]) => {
    const line = toPath(points)
    const last = points[points.length - 1]
    const first = points[0]
    return `${line} L${last[0]},${H - padB} L${first[0]},${H - padB} Z`
  }

  return (
    <div className="flex flex-col gap-2">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full">
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>
        {series.map((s, i) => {
          const points = pts(s.values)
          return (
            <g key={i}>
              <path d={toArea(points)} fill={`url(#grad-${i})`} />
              <path
                d={toPath(points)}
                fill="none"
                stroke={s.color}
                strokeWidth={i === 0 ? 2 : 1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          )
        })}
        {/* X-axis labels */}
        {months.map((m, i) => {
          const x = padL + (i / (months.length - 1)) * (W - padL - padR)
          return (
            <text
              key={m}
              x={x}
              y={H - 4}
              textAnchor="middle"
              fontSize={10}
              fill="var(--color-fg-subtle)"
              fontFamily="var(--font-sans)"
            >
              {m}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter chip
// ---------------------------------------------------------------------------
function FilterChip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-(--radius-full) border border-(--color-border) bg-(--color-surface) px-2.5 py-1 text-xs font-medium text-(--color-fg)">
      {label}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 text-(--color-fg-subtle) hover:text-(--color-fg) transition-colors">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Static demo data for charts
// ---------------------------------------------------------------------------
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Run volume per month across 3 "years" — purely illustrative
const RUN_SERIES = [
  { color: 'var(--color-accent)', values: [420, 390, 460, 510, 490, 540, 580, 620, 590, 650, 700, 730] },
  { color: 'var(--color-info)', values: [310, 340, 300, 360, 380, 350, 400, 420, 390, 430, 460, 480] },
  { color: 'var(--color-accent-soft)', values: [200, 220, 190, 240, 210, 250, 270, 260, 280, 290, 310, 330] },
]

const LEGEND = [
  { label: 'This year', color: 'var(--color-accent)' },
  { label: 'Last year', color: 'var(--color-info)' },
  { label: '2 yrs ago', color: 'var(--color-fg-subtle)' },
]

// Donut rings: outer = pass rate, middle = eval coverage, inner = uptime
const DONUT_RINGS = [
  { pct: 94, color: 'var(--color-accent)', trackColor: 'var(--color-accent-soft)', r: 62, stroke: 12 },
  { pct: 80, color: 'var(--color-success)', trackColor: 'var(--color-success-soft)', r: 46, stroke: 10 },
  { pct: 99, color: 'var(--color-info)', trackColor: 'var(--color-info-soft)', r: 32, stroke: 8 },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export function OverviewPage() {
  const passEvals = evals.filter((e) => e.severity === 'pass').length
  const totalEvals = evals.length
  const passPct = Math.round((passEvals / totalEvals) * 100)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <Heading as="h1" size="2xl" weight="semibold">
          Overview
        </Heading>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" leadingIcon={<Upload className="h-4 w-4" />}>
            Export
          </Button>
          <Button variant="accent" size="md" leadingIcon={<Plus className="h-4 w-4" />}>
            New simulation
          </Button>
        </div>
      </div>

      {/* ── Two stat panels ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">

        {/* Donut — Active evals */}
        <div className="rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) p-5 shadow-(--shadow-xs)">
          <div className="mb-4 flex items-center justify-between">
            <Text size="sm" weight="semibold" tone="muted">Active evals</Text>
            <button className="text-(--color-fg-subtle) hover:text-(--color-fg) transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
          <div className="flex justify-center">
            <DonutChart
              value={`${passPct}%`}
              label="passing"
              rings={DONUT_RINGS}
            />
          </div>
          <div className="mt-4 flex justify-center gap-4">
            {[
              { label: 'Passing', color: 'var(--color-accent)', count: passEvals },
              { label: 'Warning', color: 'var(--color-warning)', count: evals.filter(e => e.severity === 'warn').length },
              { label: 'Failing', color: 'var(--color-danger)', count: evals.filter(e => e.severity === 'fail').length },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <Text size="xs" tone="muted">{item.label}</Text>
                <Text size="xs" weight="semibold">{item.count}</Text>
              </div>
            ))}
          </div>
        </div>

        {/* Sparkline — Run volume */}
        <div className="rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) p-5 shadow-(--shadow-xs)">
          <div className="mb-3 flex items-center justify-between">
            <Text size="sm" weight="semibold" tone="muted">Simulation runs</Text>
            <div className="flex items-center gap-4">
              {LEGEND.map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                  <Text size="xs" tone="subtle">{l.label}</Text>
                </div>
              ))}
              <button className="text-(--color-fg-subtle) hover:text-(--color-fg) transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
          <SparklineChart series={RUN_SERIES} months={MONTHS} />
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" leadingIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}>
          More filters
        </Button>
        <FilterChip label="All time" />
        <FilterChip label="Passed, Failed" />
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--color-fg-subtle)" />
            <Input
              size="sm"
              placeholder="Search runs…"
              className="w-56 pl-8"
            />
          </div>
        </div>
      </div>

      {/* ── Runs table ── */}
      <div className="rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) shadow-(--shadow-xs) overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[16px_minmax(0,1fr)_160px_72px_88px_104px] items-center gap-4 border-b border-(--color-border) px-4 py-2.5">
          <span />
          <Text size="xs" tone="subtle" weight="medium" className="uppercase tracking-wide">Scenario</Text>
          <Text size="xs" tone="subtle" weight="medium" className="uppercase tracking-wide">Agent</Text>
          <Text size="xs" tone="subtle" weight="medium" className="justify-self-end uppercase tracking-wide">Duration</Text>
          <Text size="xs" tone="subtle" weight="medium" className="justify-self-end uppercase tracking-wide">Started</Text>
          <Text size="xs" tone="subtle" weight="medium" className="justify-self-end uppercase tracking-wide">Status</Text>
        </div>
        <div className="flex flex-col divide-y divide-(--color-border-subtle)">
          {runs.map((run) => (
            <RunRow key={run.runId} {...run} />
          ))}
        </div>
      </div>

      {/* ── Eval health strip ── */}
      <div className="rounded-(--radius-xl) border border-(--color-border) bg-(--color-surface) shadow-(--shadow-xs)">
        <div className="flex items-center justify-between border-b border-(--color-border) px-5 py-3.5">
          <Text size="sm" weight="semibold">Eval health</Text>
          <Badge variant="warning" size="sm" shape="pill">2 regressing</Badge>
        </div>
        <div className="divide-y divide-(--color-border-subtle)">
          {evals.map((e) => {
            const pct = Math.round((e.score / e.total) * 100)
            const barColor =
              e.severity === 'pass' ? '#7c3aed' : e.severity === 'warn' ? '#f59e0b' : '#ef4444'
            const badgeVariant =
              e.severity === 'pass' ? 'success' : e.severity === 'warn' ? 'warning' : 'danger'
            const badgeLabel =
              e.severity === 'pass' ? 'Passing' : e.severity === 'warn' ? 'Review' : 'Failing'
            return (
              <div key={e.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <Text size="sm" weight="medium">{e.name}</Text>
                    <Badge variant={badgeVariant} size="sm" shape="pill">{badgeLabel}</Badge>
                  </div>
                  <Text size="xs" tone="subtle" truncate>{e.description}</Text>
                </div>
                <div className="flex w-40 flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <Text size="xs" tone="muted" family="mono">{e.score}/{e.total}</Text>
                    <Text size="xs" tone="muted" family="mono">{pct}%</Text>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--color-surface-muted)">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
                <Text size="xs" tone="subtle" className="w-20 shrink-0 text-right">
                  {e.lastRun}
                </Text>
              </div>
            )
          })}
        </div>
      </div>

      <Text size="xs" tone="subtle">
        Data shown is from the production workspace. Synced 38 seconds ago.
      </Text>
    </div>
  )
}
