import * as React from 'react'
import { ArrowUpRight, Search, X, ChevronDown } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { MetricTile } from '@/components/views/MetricTile'
import { EvalScoreCard } from '@/components/views/EvalScoreCard'
import { RunCard } from '@/components/views/RunCard'
import { cn } from '@/lib/cn'
import {
  evals,
  runs,
  evalPassRateSeries,
  simulationsSeries,
  latencySeries,
  escalationRateSeries,
} from '@/data/demo'
import type { RunStatus } from '@/components/views/RunRow'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGENTS = ['Navigator', 'Explorer', 'Pioneer', 'Voyager'] as const
const STATUSES: RunStatus[] = ['passed', 'running', 'failed', 'cancelled', 'queued']
const STATUS_LABELS: Record<RunStatus, string> = {
  passed: 'Passed',
  running: 'Running',
  failed: 'Failed',
  cancelled: 'Cancelled',
  queued: 'Queued',
}

// ---------------------------------------------------------------------------
// URL param helpers
// ---------------------------------------------------------------------------

function readParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    q: p.get('q') ?? '',
    agents: p.getAll('agent'),
    statuses: p.getAll('status') as RunStatus[],
  }
}

function writeParams(q: string, agents: string[], statuses: string[]) {
  const p = new URLSearchParams()
  if (q) p.set('q', q)
  agents.forEach((a) => p.append('agent', a))
  statuses.forEach((s) => p.append('status', s))
  const qs = p.toString()
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
}

// ---------------------------------------------------------------------------
// Dropdown component
// ---------------------------------------------------------------------------

interface FilterDropdownProps {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}

function FilterDropdown({ label, options, selected, onToggle }: FilterDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const menuId = React.useId()

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  // Move focus to first menu item when opened
  React.useEffect(() => {
    if (!open) return
    const menu = ref.current?.querySelector('[role="menu"]') as HTMLElement | null
    const first = menu?.querySelector<HTMLElement>('[role="menuitemcheckbox"]')
    first?.focus()
  }, [open])

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  function handleMenuKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(
      ref.current?.querySelectorAll<HTMLElement>('[role="menuitemcheckbox"]') ?? [],
    )
    const focused = document.activeElement as HTMLElement
    const idx = items.indexOf(focused)

    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(idx + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(idx - 1 + items.length) % items.length]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      items[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      items[items.length - 1]?.focus()
    } else if (e.key === 'Tab') {
      // Close on Tab so focus flows naturally
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-(--radius-md) border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus) focus-visible:ring-offset-1',
          selected.length > 0
            ? 'border-(--color-accent)/40 bg-(--color-accent-soft) text-(--color-info-fg)'
            : 'border-(--color-border) bg-(--color-surface) text-(--color-fg-muted) hover:border-(--color-border-strong) hover:text-(--color-fg)',
        )}
      >
        {label}
        {selected.length > 0 && (
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-info-fg) px-1 text-xs font-medium text-(--color-fg-on-accent)">
            {selected.length}
          </span>
        )}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={`${label} filter`}
          onKeyDown={handleMenuKeyDown}
          className="absolute left-0 top-full z-50 mt-1.5 min-w-[160px] rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) py-1 shadow-lg"
        >
          {options.map((opt) => {
            const active = selected.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                role="menuitemcheckbox"
                aria-checked={active}
                onClick={() => onToggle(opt)}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--color-border-focus)',
                  active
                    ? 'bg-(--color-surface-subtle) text-(--color-fg)'
                    : 'text-(--color-fg-muted) hover:bg-(--color-surface-subtle) hover:text-(--color-fg)',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-(--radius-xs) border transition-colors',
                    active
                      ? 'border-(--color-accent) bg-(--color-accent)'
                      : 'border-(--color-border)',
                  )}
                >
                  {active && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter chip
// ---------------------------------------------------------------------------

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-(--radius-full) border border-(--color-border) bg-(--color-surface-subtle) pl-2.5 pr-1.5 text-xs text-(--color-fg-muted)">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex items-center rounded-full p-0.5 transition-colors hover:bg-(--color-surface-muted) hover:text-(--color-fg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus)"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function OverviewPage() {
  const initial = React.useMemo(() => readParams(), [])

  const [query, setQuery] = React.useState(initial.q)
  const [selectedAgents, setSelectedAgents] = React.useState<string[]>(initial.agents)
  const [selectedStatuses, setSelectedStatuses] = React.useState<RunStatus[]>(initial.statuses)
  const [debouncedQuery, setDebouncedQuery] = React.useState(initial.q)

  // Debounce search query 300ms
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  // Sync URL params whenever filters change
  React.useEffect(() => {
    writeParams(debouncedQuery, selectedAgents, selectedStatuses)
  }, [debouncedQuery, selectedAgents, selectedStatuses])

  // Filtering (AND logic)
  const filteredRuns = React.useMemo(() => {
    return runs.filter((run) => {
      const matchesQuery =
        !debouncedQuery ||
        run.scenario.toLowerCase().includes(debouncedQuery.toLowerCase())
      const matchesAgent =
        selectedAgents.length === 0 || selectedAgents.includes(run.agent)
      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(run.status)
      return matchesQuery && matchesAgent && matchesStatus
    })
  }, [debouncedQuery, selectedAgents, selectedStatuses])

  function toggleAgent(agent: string) {
    setSelectedAgents((prev) =>
      prev.includes(agent) ? prev.filter((a) => a !== agent) : [...prev, agent],
    )
  }

  function toggleStatus(status: string) {
    setSelectedStatuses((prev) => {
      const s = status as RunStatus
      return prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    })
  }

  function clearAll() {
    setQuery('')
    setSelectedAgents([])
    setSelectedStatuses([])
  }

  const hasFilters = debouncedQuery || selectedAgents.length > 0 || selectedStatuses.length > 0

  // Build active chips
  const chips: { key: string; label: string; onRemove: () => void }[] = [
    ...selectedAgents.map((a) => ({
      key: `agent:${a}`,
      label: a,
      onRemove: () => toggleAgent(a),
    })),
    ...selectedStatuses.map((s) => ({
      key: `status:${s}`,
      label: STATUS_LABELS[s],
      onRemove: () => toggleStatus(s),
    })),
  ]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-1">
        <Heading as="h1" size="xl" weight="semibold" className="sm:text-2xl">
          Production overview
        </Heading>
        <Text size="sm" tone="muted">
          How your agents are behaving across simulations and live traffic.
        </Text>
      </div>

      {/* ── Key metrics ──────────────────────────────────────────────────── */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            label="Eval pass rate"
            value="94.2"
            unit="%"
            delta="+1.4 vs. last week"
            trend="up"
            sentiment="positive"
            sparkline={evalPassRateSeries}
            sparklineColor="var(--color-success)"
          />
          <MetricTile
            label="Simulations / 24h"
            value="12,481"
            delta="−2.1 vs. last week"
            trend="down"
            sentiment="negative"
            sparkline={simulationsSeries}
            sparklineColor="var(--color-accent)"
          />
          <MetricTile
            label="P95 latency"
            value="1.8"
            unit="s"
            delta="flat"
            trend="flat"
            sentiment="neutral"
            sparkline={latencySeries}
            sparklineColor="var(--color-fg-subtle)"
          />
          <MetricTile
            label="Escalation rate"
            value="3.1"
            unit="%"
            delta="−0.6 vs. last week"
            trend="down"
            sentiment="positive"
            sparkline={escalationRateSeries}
            sparklineColor="var(--color-warning)"
          />
        </div>
      </section>

      <div className="flex flex-col gap-6">
        {/* ── Recent runs ────────────────────────────────────────────────── */}
        <section aria-labelledby="section-runs-heading" className="flex min-w-0 flex-col gap-3">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <Heading id="section-runs-heading" as="h2" size="md" weight="semibold">
              Recent runs
            </Heading>
            <button
              type="button"
              aria-label="View all recent runs"
              className="inline-flex items-center gap-1 text-sm text-(--color-fg-muted) transition-colors hover:text-(--color-fg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus) focus-visible:ring-offset-1 rounded-(--radius-sm)"
            >
              View all
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--color-fg-subtle)" aria-hidden="true" />
              <Input
                variant="default"
                size="md"
                placeholder="Search scenarios…"
                aria-label="Search scenarios"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <FilterDropdown
              label="Agent"
              options={AGENTS as unknown as string[]}
              selected={selectedAgents}
              onToggle={toggleAgent}
            />
            <FilterDropdown
              label="Status"
              options={STATUSES.map((s) => STATUS_LABELS[s])}
              selected={selectedStatuses.map((s) => STATUS_LABELS[s])}
              onToggle={(label) => {
                const status = STATUSES.find((s) => STATUS_LABELS[s] === label)
                if (status) toggleStatus(status)
              }}
            />
          </div>

          {/* Active chips + result count */}
          {(chips.length > 0 || hasFilters) && (
            <div aria-label="Active filters" className="flex flex-wrap items-center gap-2">
              <Text size="xs" tone="subtle">
                Showing {filteredRuns.length} of {runs.length} runs
              </Text>
              {chips.map((chip) => (
                <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
              ))}
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs text-(--color-fg-subtle) underline-offset-2 transition-colors hover:text-(--color-fg) hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus) focus-visible:ring-offset-1 rounded-(--radius-sm)"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* Run cards */}
          {filteredRuns.length > 0 ? (
            <div className="flex flex-col gap-2">
              {filteredRuns.map((run) => (
                <RunCard key={run.runId} {...run} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 rounded-(--radius-lg) border border-(--color-border-subtle) px-4 py-10 text-center">
              <Text size="sm" weight="medium">No runs match your filters</Text>
              <Text size="sm" tone="muted">
                Try a different search term or{' '}
                <button
                  type="button"
                  onClick={clearAll}
                  className="underline underline-offset-2 transition-colors hover:text-(--color-fg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus) focus-visible:ring-offset-1 rounded-(--radius-sm)"
                >
                  clear all filters
                </button>
                .
              </Text>
            </div>
          )}
        </section>

        {/* ── Eval health ────────────────────────────────────────────────── */}
        <section aria-labelledby="section-evals-heading" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Heading id="section-evals-heading" as="h2" size="md" weight="semibold">
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
        </section>
      </div>

      {/* ── Sync status (live region) ─────────────────────────────────── */}
      <div aria-live="polite" aria-atomic="true">
        <Text size="xs" tone="subtle" className="mt-4">
          Data shown is from the production workspace. Synced 38 seconds ago.
        </Text>
      </div>
    </div>
  )
}
