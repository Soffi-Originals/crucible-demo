import { useState, useMemo } from 'react'
import { ArrowUpRight, Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { Badge, badgeVariants } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { MetricTile } from '@/components/views/MetricTile'
import { EvalScoreCard } from '@/components/views/EvalScoreCard'
import { RunRow } from '@/components/views/RunRow'
import { evals, runs } from '@/data/demo'

export function OverviewPage() {
  const [query, setQuery] = useState('')
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set())

  const agentOptions = useMemo(
    () => Array.from(new Set(runs.map((r) => r.agent))),
    [],
  )

  function toggleAgent(agent: string) {
    setActiveAgents((prev) => {
      const next = new Set(prev)
      if (next.has(agent)) next.delete(agent)
      else next.add(agent)
      return next
    })
  }

  function removeAgent(agent: string) {
    setActiveAgents((prev) => {
      const next = new Set(prev)
      next.delete(agent)
      return next
    })
  }

  const filteredRuns = useMemo(() => {
    const q = query.trim().toLowerCase()
    return runs.filter((run) => {
      const matchesSearch =
        !q ||
        run.scenario.toLowerCase().includes(q) ||
        run.runId.toLowerCase().includes(q)
      const matchesAgent =
        activeAgents.size === 0 || activeAgents.has(run.agent)
      return matchesSearch && matchesAgent
    })
  }, [query, activeAgents])

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Eval pass rate"
          value="94.2"
          unit="%"
          delta="+1.4 vs. last week"
          trend="up"
          sentiment="positive"
          sparkline={[91.2, 91.8, 92.1, 91.9, 92.5, 93.0, 92.8, 93.4, 93.9, 94.2]}
        />
        <MetricTile
          label="Simulations / 24h"
          value="12,481"
          delta="−2.1 vs. last week"
          trend="down"
          sentiment="negative"
          sparkline={[13200, 13050, 12980, 13100, 12870, 12760, 12640, 12590, 12510, 12481]}
        />
        <MetricTile
          label="P95 latency"
          value="1.8"
          unit="s"
          delta="flat"
          trend="flat"
          sentiment="neutral"
          sparkline={[1.75, 1.82, 1.79, 1.84, 1.77, 1.81, 1.76, 1.80, 1.78, 1.80]}
        />
        <MetricTile
          label="Escalation rate"
          value="3.1"
          unit="%"
          delta="−0.6 vs. last week"
          trend="down"
          sentiment="positive"
          sparkline={[3.9, 3.8, 3.7, 3.8, 3.6, 3.5, 3.4, 3.3, 3.2, 3.1]}
        />
      </div>

      {/* Recent runs — full width */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Heading as="h2" size="md" weight="semibold">
            Recent runs
          </Heading>
          <Text size="sm" tone="muted" className="flex items-center gap-1">
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Text>
        </div>

        {/* Search + agent filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--color-fg-subtle)" />
            <Input
              variant="ghost"
              size="sm"
              placeholder="Search scenarios or run IDs…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          {agentOptions.map((agent) => {
            const isActive = activeAgents.has(agent)
            return (
              <button
                key={agent}
                type="button"
                onClick={() => toggleAgent(agent)}
                className={cn(
                  badgeVariants({
                    variant: isActive ? 'solid' : 'outline',
                    size: 'md',
                    shape: 'pill',
                  }),
                  'cursor-pointer transition-colors',
                )}
              >
                {agent}
              </button>
            )
          })}
        </div>

        {/* Active filter chips */}
        {activeAgents.size > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {Array.from(activeAgents).map((agent) => (
              <span
                key={agent}
                className={cn(
                  badgeVariants({ variant: 'neutral', size: 'md', shape: 'pill' }),
                  'flex items-center gap-1',
                )}
              >
                {agent}
                <button
                  type="button"
                  onClick={() => removeAgent(agent)}
                  aria-label={`Remove ${agent} filter`}
                  className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors hover:bg-(--color-border)"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setActiveAgents(new Set())}
              className="text-xs text-(--color-fg-subtle) underline-offset-2 transition-colors hover:text-(--color-fg) hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Table card */}
        <Card variant="default" padding="none" radius="lg" className="overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[16px_minmax(0,1fr)_160px_72px_88px_104px] items-center gap-4 border-b border-(--color-border-subtle) px-4 py-2.5">
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
              {filteredRuns.length > 0 ? (
                <div className="flex flex-col divide-y divide-(--color-border-subtle)">
                  {filteredRuns.map((run) => (
                    <RunRow key={run.runId} {...run} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center px-4 py-10">
                  <Text size="sm" tone="subtle">
                    No runs match your filters.
                  </Text>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Eval health — full width, below runs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Heading as="h2" size="md" weight="semibold">
            Eval health
          </Heading>
          <Badge variant="warning" size="sm" shape="pill">
            2 regressing
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {evals.map((evalEntry) => (
            <EvalScoreCard key={evalEntry.id} {...evalEntry} />
          ))}
        </div>
      </div>

      <Divider tone="subtle" />

      <Text size="xs" tone="subtle">
        Data shown is from the production workspace. Synced 38 seconds ago.
      </Text>
    </div>
  )
}
