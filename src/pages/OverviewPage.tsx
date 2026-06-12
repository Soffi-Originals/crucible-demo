import * as React from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MetricTile } from '@/components/views/MetricTile'
import { EvalScoreCard } from '@/components/views/EvalScoreCard'
import { RunRow } from '@/components/views/RunRow'
import { RunDetailPanel } from '@/components/views/RunDetailPanel'
import { BarChart, type BarChartDatum } from '@/components/charts/BarChart'
import { DonutChart, type DonutSlice } from '@/components/charts/DonutChart'
import { evals } from '@/data/demo'
import { runHistory, type RunRecord } from '@/data/runHistory'
import { cn } from '@/lib/cn'

// ─── colour tokens (CSS vars resolved to strings for SVG) ─────────────────────
const COLOR = {
  passed: 'var(--color-success)',
  failed: 'var(--color-danger)',
  cancelled: 'var(--color-warning)',
  running: 'var(--color-accent)',
  queued: 'var(--color-border)',
  Navigator: 'var(--color-accent)',
  Explorer: 'var(--color-danger)',
  Pioneer: 'var(--color-success)',
  Voyager: 'var(--color-warning)',
} as const

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildDayBars(records: RunRecord[]): BarChartDatum[] {
  const days: Record<string, { passed: number; failed: number; other: number }> = {}

  // Build 7-day buckets
  const now = Date.now()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000)
    const label = d.toLocaleDateString('en-US', { weekday: 'short' })
    days[label] = { passed: 0, failed: 0, other: 0 }
  }

  records.forEach((r) => {
    const d = new Date(r.startedAtMs)
    const label = d.toLocaleDateString('en-US', { weekday: 'short' })
    if (!(label in days)) return
    if (r.status === 'passed') days[label].passed++
    else if (r.status === 'failed') days[label].failed++
    else days[label].other++
  })

  return Object.entries(days).map(([label, counts]) => ({
    label,
    total: counts.passed + counts.failed + counts.other,
    segments: [
      { key: 'passed', value: counts.passed, color: 'var(--color-success)' },
      { key: 'failed', value: counts.failed, color: 'var(--color-danger)' },
      { key: 'other', value: counts.other, color: 'var(--color-border)' },
    ],
  }))
}

function buildStatusSlices(records: RunRecord[]): DonutSlice[] {
  const counts: Record<string, number> = {}
  records.forEach((r) => {
    counts[r.status] = (counts[r.status] ?? 0) + 1
  })
  return (
    (['passed', 'failed', 'running', 'cancelled', 'queued'] as const)
      .filter((s) => (counts[s] ?? 0) > 0)
      .map((s) => ({
        key: s,
        label: s.charAt(0).toUpperCase() + s.slice(1),
        value: counts[s] ?? 0,
        color: COLOR[s],
      }))
  )
}

function buildAgentSlices(records: RunRecord[]): DonutSlice[] {
  const counts: Record<string, number> = {}
  records.forEach((r) => {
    counts[r.agent] = (counts[r.agent] ?? 0) + 1
  })
  return Object.entries(counts).map(([agent, value]) => ({
    key: agent,
    label: agent,
    value,
    color: COLOR[agent as keyof typeof COLOR] ?? 'var(--color-border)',
  }))
}

// ─── filter helpers ───────────────────────────────────────────────────────────

function applyFilters(
  records: RunRecord[],
  {
    day,
    status,
    agent,
  }: { day: string | null; status: string | null; agent: string | null },
): RunRecord[] {
  return records.filter((r) => {
    if (day !== null) {
      const d = new Date(r.startedAtMs)
      const label = d.toLocaleDateString('en-US', { weekday: 'short' })
      if (label !== day) return false
    }
    if (status !== null && r.status !== status) return false
    if (agent !== null && r.agent !== agent) return false
    return true
  })
}

// ─── component ────────────────────────────────────────────────────────────────

export function OverviewPage() {
  // Cross-filter state
  const [dayFilter, setDayFilter] = React.useState<string | null>(null)
  const [statusFilter, setStatusFilter] = React.useState<string | null>(null)
  const [agentFilter, setAgentFilter] = React.useState<string | null>(null)
  // Drill-down
  const [selectedRun, setSelectedRun] = React.useState<RunRecord | null>(null)

  const hasAnyFilter = dayFilter !== null || statusFilter !== null || agentFilter !== null

  // Records after applying filters
  const filtered = React.useMemo(
    () => applyFilters(runHistory, { day: dayFilter, status: statusFilter, agent: agentFilter }),
    [dayFilter, statusFilter, agentFilter],
  )

  // Charts are always built on the full set (dimmed) but show filtered counts
  const allDayBars = React.useMemo(() => buildDayBars(runHistory), [])
  const filteredDayBars = React.useMemo(() => buildDayBars(filtered), [filtered])

  const statusSlices = React.useMemo(() => buildStatusSlices(filtered), [filtered])
  const agentSlices = React.useMemo(() => buildAgentSlices(filtered), [filtered])

  // Summary metrics over filtered set
  const passCount = filtered.filter((r) => r.status === 'passed').length
  const failCount = filtered.filter((r) => r.status === 'failed').length
  const totalFinished = passCount + failCount
  const passRate = totalFinished === 0 ? null : Math.round((passCount / totalFinished) * 100)
  const avgDuration =
    filtered.filter((r) => r.durationMs > 0).length === 0
      ? null
      : (
          filtered.filter((r) => r.durationMs > 0).reduce((s, r) => s + r.durationMs, 0) /
          filtered.filter((r) => r.durationMs > 0).length /
          1000
        ).toFixed(1)

  const handleRowClick = (run: RunRecord) => {
    setSelectedRun((prev) => (prev?.runId === run.runId ? null : run))
  }

  const clearFilters = () => {
    setDayFilter(null)
    setStatusFilter(null)
    setAgentFilter(null)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Page title */}
      <div className="flex flex-col gap-1">
        <Heading as="h1" size="xl" weight="semibold" className="sm:text-2xl">
          Production overview
        </Heading>
        <Text size="sm" tone="muted">
          How your agents are behaving across simulations and live traffic.
        </Text>
      </div>

      {/* Summary metric tiles — react to filter */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Pass rate"
          value={passRate !== null ? String(passRate) : '—'}
          unit={passRate !== null ? '%' : undefined}
          delta={hasAnyFilter ? `${filtered.length} runs selected` : '+1.4 vs. last week'}
          trend={hasAnyFilter ? 'flat' : 'up'}
          sentiment={hasAnyFilter ? 'neutral' : 'positive'}
        />
        <MetricTile
          label="Runs in view"
          value={String(filtered.length)}
          delta={hasAnyFilter ? 'filtered view' : 'last 7 days'}
          trend="flat"
          sentiment="neutral"
        />
        <MetricTile
          label="Avg duration"
          value={avgDuration !== null ? avgDuration : '—'}
          unit={avgDuration !== null ? 's' : undefined}
          delta="P95 latency"
          trend="flat"
          sentiment="neutral"
        />
        <MetricTile
          label="Failures"
          value={String(failCount)}
          delta={totalFinished > 0 ? `${Math.round((failCount / totalFinished) * 100)}% fail rate` : 'no finished runs'}
          trend={failCount > 0 ? 'down' : 'flat'}
          sentiment={failCount > 0 ? 'negative' : 'neutral'}
        />
      </div>

      {/* Active filter chips */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-2">
          <Text size="xs" tone="subtle" weight="medium" className="uppercase tracking-wide">
            Filters
          </Text>
          {dayFilter && (
            <button
              type="button"
              onClick={() => setDayFilter(null)}
              className="flex items-center gap-1 rounded-(--radius-full) border border-(--color-border) bg-(--color-surface-subtle) px-2 py-0.5 text-xs text-(--color-fg-muted) hover:bg-(--color-surface) transition-colors"
            >
              Day: {dayFilter} <X className="h-3 w-3 ml-0.5" />
            </button>
          )}
          {statusFilter && (
            <button
              type="button"
              onClick={() => setStatusFilter(null)}
              className="flex items-center gap-1 rounded-(--radius-full) border border-(--color-border) bg-(--color-surface-subtle) px-2 py-0.5 text-xs text-(--color-fg-muted) hover:bg-(--color-surface) transition-colors"
            >
              Status: {statusFilter} <X className="h-3 w-3 ml-0.5" />
            </button>
          )}
          {agentFilter && (
            <button
              type="button"
              onClick={() => setAgentFilter(null)}
              className="flex items-center gap-1 rounded-(--radius-full) border border-(--color-border) bg-(--color-surface-subtle) px-2 py-0.5 text-xs text-(--color-fg-muted) hover:bg-(--color-surface) transition-colors"
            >
              Agent: {agentFilter} <X className="h-3 w-3 ml-0.5" />
            </button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Runs over time bar chart */}
        <Card variant="default" padding="md" radius="lg" className="lg:col-span-1 flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <Heading as="h2" size="sm" weight="semibold">
              Runs by day
            </Heading>
            <Text size="xs" tone="subtle">
              Click a bar to filter the table below
            </Text>
          </div>
          <BarChart
            data={hasAnyFilter && (statusFilter !== null || agentFilter !== null) ? filteredDayBars : allDayBars}
            height={100}
            activeLabel={dayFilter}
            onBarClick={setDayFilter}
          />
          {/* Legend */}
          <div className="flex items-center gap-4">
            {[
              { label: 'Passed', color: 'var(--color-success)' },
              { label: 'Failed', color: 'var(--color-danger)' },
              { label: 'Other', color: 'var(--color-border)' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                <Text size="xs" tone="subtle">{label}</Text>
              </div>
            ))}
          </div>
        </Card>

        {/* Status donut */}
        <Card variant="default" padding="md" radius="lg" className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <Heading as="h2" size="sm" weight="semibold">
              Status breakdown
            </Heading>
            <Text size="xs" tone="subtle">
              Click a slice to filter
            </Text>
          </div>
          <div className="flex flex-1 items-center justify-center py-2">
            <DonutChart
              slices={statusSlices}
              size={130}
              thickness={20}
              activeKey={statusFilter}
              onSliceClick={setStatusFilter}
              centerLabel={filtered.length > 0 ? String(filtered.length) : '0'}
              centerSub="runs"
            />
          </div>
        </Card>

        {/* Agent donut */}
        <Card variant="default" padding="md" radius="lg" className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <Heading as="h2" size="sm" weight="semibold">
              Runs by agent
            </Heading>
            <Text size="xs" tone="subtle">
              Click a slice to filter
            </Text>
          </div>
          <div className="flex flex-1 items-center justify-center py-2">
            <DonutChart
              slices={agentSlices}
              size={130}
              thickness={20}
              activeKey={agentFilter}
              onSliceClick={setAgentFilter}
              centerLabel={agentFilter ?? undefined}
              centerSub={agentFilter ? `${filtered.length} runs` : undefined}
            />
          </div>
        </Card>
      </div>

      {/* Run table + detail panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Run list */}
        <div className={cn('flex min-w-0 flex-col gap-3', selectedRun ? 'lg:col-span-2' : 'lg:col-span-3')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heading as="h2" size="md" weight="semibold">
                Runs
              </Heading>
              {filtered.length !== runHistory.length && (
                <Badge variant="accent" size="sm">
                  {filtered.length} of {runHistory.length}
                </Badge>
              )}
            </div>
            <Text size="sm" tone="muted" className="flex items-center gap-1">
              View all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Text>
          </div>

          <Card variant="default" padding="none" radius="lg" className="overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[16px_minmax(0,1fr)_160px_72px_88px_104px] items-center gap-4 px-4 py-2.5 border-b border-(--color-border-subtle)">
                  <span />
                  <Text size="xs" tone="subtle" weight="medium" className="uppercase tracking-wide">
                    Scenario
                  </Text>
                  <Text size="xs" tone="subtle" weight="medium" className="uppercase tracking-wide">
                    Agent
                  </Text>
                  <Text size="xs" tone="subtle" weight="medium" className="justify-self-end uppercase tracking-wide">
                    Duration
                  </Text>
                  <Text size="xs" tone="subtle" weight="medium" className="justify-self-end uppercase tracking-wide">
                    Started
                  </Text>
                  <Text size="xs" tone="subtle" weight="medium" className="justify-self-end uppercase tracking-wide">
                    Status
                  </Text>
                </div>

                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-12">
                    <Text size="sm" tone="muted">
                      No runs match the current filters.
                    </Text>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-(--color-border-subtle)">
                    {filtered.slice(0, 12).map((run) => (
                      <div
                        key={run.runId}
                        onClick={() => handleRowClick(run)}
                        className={cn(
                          'transition-colors',
                          selectedRun?.runId === run.runId &&
                            'bg-(--color-surface-subtle) ring-1 ring-inset ring-(--color-border)',
                        )}
                      >
                        <RunRow
                          runId={run.runId}
                          agent={run.agent}
                          scenario={run.scenario}
                          status={run.status}
                          duration={run.durationMs > 0 ? `${(run.durationMs / 1000).toFixed(1)}s` : '—'}
                          startedAt={run.startedAt}
                          interactive
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Drill-down detail panel */}
        {selectedRun && (
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex items-center justify-between">
              <Heading as="h2" size="md" weight="semibold">
                Run detail
              </Heading>
            </div>
            <RunDetailPanel
              run={selectedRun}
              onClose={() => setSelectedRun(null)}
            />
          </div>
        )}

        {/* Eval health sidebar — only shown when detail panel is closed */}
        {!selectedRun && (
          <div className="flex flex-col gap-3 lg:col-span-1">
            <div className="flex items-center justify-between">
              <Heading as="h2" size="md" weight="semibold">
                Eval health
              </Heading>
              <Badge variant="warning" size="sm" shape="pill">
                2 regressing
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {evals.map((evalEntry) => (
                <EvalScoreCard key={evalEntry.id} {...evalEntry} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Divider tone="subtle" />

      <Text size="xs" tone="subtle">
        Data shown is from the production workspace. Synced 38 seconds ago.
      </Text>
    </div>
  )
}
