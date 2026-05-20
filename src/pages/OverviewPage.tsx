import { ArrowUpRight } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Divider'
import { Badge } from '@/components/ui/Badge'
import { MetricTile } from '@/components/views/MetricTile'
import { EvalScoreCard } from '@/components/views/EvalScoreCard'
import { RunRow } from '@/components/views/RunRow'
import { evals, runs } from '@/data/demo'

export function OverviewPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <Heading as="h1" size="2xl" weight="semibold">
          Production overview
        </Heading>
        <Text size="sm" tone="muted">
          How your agents are behaving across simulations and live traffic.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Eval pass rate"
          value="94.2"
          unit="%"
          delta="+1.4 vs. last week"
          trend="up"
          sentiment="positive"
        />
        <MetricTile
          label="Simulations / 24h"
          value="12,481"
          delta="−2.1 vs. last week"
          trend="down"
          sentiment="negative"
        />
        <MetricTile
          label="P95 latency"
          value="1.8"
          unit="s"
          delta="flat"
          trend="flat"
          sentiment="neutral"
        />
        <MetricTile
          label="Escalation rate"
          value="3.1"
          unit="%"
          delta="−0.6 vs. last week"
          trend="down"
          sentiment="positive"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-3 xl:col-span-2">
          <div className="flex items-center justify-between">
            <Heading as="h2" size="md" weight="semibold">
              Recent runs
            </Heading>
            <Text size="sm" tone="muted" className="flex items-center gap-1">
              View all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Text>
          </div>
          <Card variant="default" padding="none" radius="lg">
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
                <RunRow key={run.runId} {...run} />
              ))}
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
          <div className="flex flex-col gap-3">
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
