import * as React from 'react'
import { Upload, Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RunRow } from '@/components/views/RunRow'
import { DonutChart } from '@/components/views/DonutChart'
import { SparklineChart } from '@/components/views/SparklineChart'
import { runs, evals } from '@/data/demo'

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

const RUN_SERIES = [
  { label: 'This year', color: 'var(--color-accent)', values: [420, 390, 460, 510, 490, 540, 580, 620, 590, 650, 700, 730] },
  { label: 'Last year', color: 'var(--color-info)', values: [310, 340, 300, 360, 380, 350, 400, 420, 390, 430, 460, 480] },
  { label: '2 yrs ago', color: 'var(--color-fg-subtle)', values: [200, 220, 190, 240, 210, 250, 270, 260, 280, 290, 310, 330] },
]

// Donut rings: outer = pass rate, middle = eval coverage, inner = uptime
const DONUT_RINGS = [
  { pct: 94, color: 'var(--color-accent)', trackColor: 'var(--color-accent-soft)', r: 62, stroke: 5 },
  { pct: 80, color: 'var(--color-success)', trackColor: 'var(--color-success-soft)', r: 52, stroke: 5 },
  { pct: 99, color: 'var(--color-info)', trackColor: 'var(--color-info-soft)', r: 42, stroke: 5 },
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
        <DonutChart
          title="Active evals"
          value={`${passPct}%`}
          label="passing"
          rings={DONUT_RINGS}
          legend={[
            { label: 'Passing', color: 'var(--color-accent)', count: passEvals },
            { label: 'Warning', color: 'var(--color-warning)', count: evals.filter(e => e.severity === 'warn').length },
            { label: 'Failing', color: 'var(--color-danger)', count: evals.filter(e => e.severity === 'fail').length },
          ]}
          showMenu
        />

        {/* Sparkline — Run volume */}
        <SparklineChart
          title="Simulation runs"
          series={RUN_SERIES}
          xLabels={MONTHS}
          showMenu
          size="lg"
        />
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
              e.severity === 'pass' ? 'var(--color-accent)' : e.severity === 'warn' ? 'var(--color-warning)' : 'var(--color-danger)'
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
