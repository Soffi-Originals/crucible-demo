import * as React from 'react'
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MetricTile } from '@/components/views/MetricTile'
import { EvalScoreCard } from '@/components/views/EvalScoreCard'
import { RunRow } from '@/components/views/RunRow'
import { RunsFilterBar, type RunsFilters } from '@/components/views/RunsFilterBar'
import { evals, runs } from '@/data/demo'
import type { RunStatus } from '@/components/views/RunRow'

const PAGE_SIZE = 10

// ─── URL param helpers ─────────────────────────────────────────────────────────

function getParam(params: URLSearchParams, key: string): string {
  return params.get(key) ?? ''
}

function getParamList(params: URLSearchParams, key: string): string[] {
  const val = params.get(key)
  return val ? val.split(',').filter(Boolean) : []
}

function filtersToParams(filters: RunsFilters): URLSearchParams {
  const p = new URLSearchParams()
  if (filters.search) p.set('q', filters.search)
  if (filters.agents.length) p.set('agent', filters.agents.join(','))
  if (filters.statuses.length) p.set('status', filters.statuses.join(','))
  return p
}

// ─── OverviewPage ──────────────────────────────────────────────────────────────

export function OverviewPage() {
  // Initialise from URL params on mount
  const [filters, setFilters] = React.useState<RunsFilters>(() => {
    const p = new URLSearchParams(window.location.search)
    return {
      search: getParam(p, 'q'),
      agents: getParamList(p, 'agent'),
      statuses: getParamList(p, 'status') as RunStatus[],
    }
  })

  // Debounced search value (300 ms)
  const [debouncedSearch, setDebouncedSearch] = React.useState(filters.search)
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), 300)
    return () => clearTimeout(t)
  }, [filters.search])

  // Sync URL params whenever filters change (uses debounced search for URL too)
  React.useEffect(() => {
    const effective: RunsFilters = { ...filters, search: debouncedSearch }
    const params = filtersToParams(effective)
    const search = params.toString()
    const url = search ? `?${search}` : window.location.pathname
    window.history.replaceState(null, '', url)
  }, [debouncedSearch, filters])

  const [page, setPage] = React.useState(1)

  // Filtered runs — also resets page to 1 when filters change
  const { filteredRuns, resetKey } = React.useMemo(() => {
    const result = runs.filter((run) => {
      const matchSearch =
        debouncedSearch === '' ||
        run.scenario.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchAgent =
        filters.agents.length === 0 || filters.agents.includes(run.agent)
      const matchStatus =
        filters.statuses.length === 0 || filters.statuses.includes(run.status)
      return matchSearch && matchAgent && matchStatus
    })
    return { filteredRuns: result, resetKey: `${debouncedSearch}|${filters.agents.join()}|${filters.statuses.join()}` }
  }, [debouncedSearch, filters.agents, filters.statuses])

  // Keep page in bounds when filters change
  const clampedPage = React.useMemo(() => {
    const total = Math.max(1, Math.ceil(filteredRuns.length / PAGE_SIZE))
    return Math.min(page, total)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, filteredRuns.length, page])

  React.useLayoutEffect(() => {
    setPage(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  const totalPages = Math.max(1, Math.ceil(filteredRuns.length / PAGE_SIZE))
  const pagedRuns = filteredRuns.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE)

  function handleSearchChange(value: string) {
    setFilters((f) => ({ ...f, search: value }))
  }
  function handleAgentsChange(agents: string[]) {
    setFilters((f) => ({ ...f, agents }))
  }
  function handleStatusesChange(statuses: RunStatus[]) {
    setFilters((f) => ({ ...f, statuses }))
  }
  function handleClearAll() {
    setFilters({ search: '', agents: [], statuses: [] })
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-1">
        <Heading as="h1" size="xl" weight="semibold" className="sm:text-2xl">
          Production overview
        </Heading>
        <Text size="sm" tone="accent">
          How your agents are behaving across simulations and live traffic.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Eval pass rate"
          value="94.2"
          unit="%"
          delta="+1.4 vs. last week"
          trend="up"
          sentiment="positive"
          sparkline={[91.2, 91.8, 92.5, 92.1, 93.0, 93.7, 94.2]}
        />
        <MetricTile
          label="Simulations / 24h"
          value="12,481"
          delta="−2.1 vs. last week"
          trend="down"
          sentiment="negative"
          sparkline={[13100, 13420, 12980, 13600, 13200, 12890, 12481]}
        />
        <MetricTile
          label="P95 latency"
          value="1.8"
          unit="s"
          delta="flat"
          trend="flat"
          sentiment="neutral"
          sparkline={[1.9, 1.75, 1.82, 1.78, 1.85, 1.77, 1.8]}
        />
        <MetricTile
          label="Escalation rate"
          value="3.1"
          unit="%"
          delta="−0.6 vs. last week"
          trend="down"
          sentiment="positive"
          sparkline={[3.9, 3.7, 3.5, 3.8, 3.4, 3.2, 3.1]}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <Heading as="h2" size="md" weight="semibold">
              Recent runs
            </Heading>
            <Text size="sm" tone="muted" className="flex items-center gap-1">
              View all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Text>
          </div>

          <RunsFilterBar
            filters={filters}
            totalCount={runs.length}
            filteredCount={filteredRuns.length}
            onSearchChange={handleSearchChange}
            onAgentsChange={handleAgentsChange}
            onStatusesChange={handleStatusesChange}
            onClearAll={handleClearAll}
          />

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
                <div className="flex flex-col divide-y divide-(--color-border-subtle)">
                  {pagedRuns.length > 0 ? (
                    pagedRuns.map((run) => <RunRow key={run.runId} {...run} />)
                  ) : (
                    <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
                      <Text size="sm" weight="medium">No runs match your filters</Text>
                      <Text size="xs" tone="subtle">Try adjusting the search or clearing a filter.</Text>
                    </div>
                  )}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-(--color-border-subtle) px-4 py-2.5">
                    <Text size="xs" tone="subtle">
                      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredRuns.length)} of {filteredRuns.length} runs
                    </Text>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        leadingIcon={<ChevronLeft className="h-3.5 w-3.5" />}
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Prev
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        trailingIcon={<ChevronRight className="h-3.5 w-3.5" />}
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-3">
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
      </div>

      <Divider tone="subtle" />

      <Text size="xs" tone="subtle">
        Data shown is from the production workspace. Synced 38 seconds ago.
      </Text>
    </div>
  )
}
