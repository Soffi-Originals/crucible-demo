import { ArrowUpRight } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { MetricsBarChart, type BarMetric } from '@/components/views/MetricsBarChart'
import { EvalScoreCard } from '@/components/views/EvalScoreCard'
import { RunRowExpandable } from '@/components/views/RunRowExpandable'
import { evals, runs } from '@/data/demo'
import type { PageId } from '@/components/views/Sidebar'

const metrics: BarMetric[] = [
  {
    label: 'Eval pass rate',
    value: '94.2',
    unit: '%',
    displayValue: 94,
    delta: '+1.4 vs. last week',
    trend: 'up',
    sentiment: 'positive',
    barColor: 'var(--color-accent)',
    barColorDark: 'color-mix(in srgb, var(--color-accent) 60%, black)',
    barColorTop: 'color-mix(in srgb, var(--color-accent) 80%, white)',
  },
  {
    label: 'Simulations / 24h',
    value: '12,481',
    displayValue: 72,
    delta: '−2.1 vs. last week',
    trend: 'down',
    sentiment: 'negative',
    barColor: 'var(--color-primary)',
    barColorDark: 'color-mix(in srgb, var(--color-primary) 60%, black)',
    barColorTop: 'color-mix(in srgb, var(--color-primary) 80%, white)',
  },
  {
    label: 'P95 latency',
    value: '1.8',
    unit: 's',
    displayValue: 45,
    delta: 'flat',
    trend: 'flat',
    sentiment: 'neutral',
    barColor: 'var(--color-fg-muted)',
    barColorDark: 'color-mix(in srgb, var(--color-fg-muted) 60%, black)',
    barColorTop: 'color-mix(in srgb, var(--color-fg-muted) 80%, white)',
  },
  {
    label: 'Escalation rate',
    value: '3.1',
    unit: '%',
    displayValue: 31,
    delta: '−0.6 vs. last week',
    trend: 'down',
    sentiment: 'positive',
    barColor: 'var(--color-success)',
    barColorDark: 'color-mix(in srgb, var(--color-success) 60%, black)',
    barColorTop: 'color-mix(in srgb, var(--color-success) 80%, white)',
  },
]

export interface OverviewPageProps {
  onNavigate?: (id: PageId) => void
}

export function OverviewPage({ onNavigate }: OverviewPageProps) {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-1">
        <Heading as="h1" size="xl" weight="semibold" className="sm:text-2xl" style={{ color: '#18181B' }}>
          Production overview
        </Heading>
        <Text size="sm" tone="muted">
          How your agents are behaving across simulations and live traffic.
        </Text>
      </div>

      <MetricsBarChart metrics={metrics} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <Heading as="h2" size="md" weight="semibold">
              Recent runs
            </Heading>
            <button
              type="button"
              onClick={() => onNavigate?.('simulations')}
              className="flex items-center gap-1 rounded-(--radius-sm) text-sm text-(--color-fg-muted) transition-colors hover:text-(--color-fg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-accent)"
            >
              View all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
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
                <div className="flex flex-col divide-y divide-(--color-border-subtle)">
                  {runs.map((run) => (
                    <RunRowExpandable key={run.runId} {...run} />
                  ))}
                </div>
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
