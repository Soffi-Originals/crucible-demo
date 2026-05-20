import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Kbd } from '@/components/ui/Kbd'
import { AgentRow } from '@/components/views/AgentRow'
import { agents } from '@/data/demo'

const statusBadge: Record<
  'production' | 'staging' | 'paused',
  { variant: 'success' | 'warning' | 'neutral'; label: string }
> = {
  production: { variant: 'success', label: 'Production' },
  staging: { variant: 'warning', label: 'Staging' },
  paused: { variant: 'neutral', label: 'Paused' },
}

export function AgentsPage() {
  const [selected, setSelected] = useState('navigator')

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="flex w-full shrink-0 flex-col gap-4 border-b border-(--color-border-subtle) bg-(--color-surface) p-4 sm:p-6 lg:w-96 lg:border-b-0 lg:border-r">
        <div className="flex flex-col gap-1">
          <Heading as="h1" size="lg" weight="semibold">
            Agents
          </Heading>
          <Text size="sm" tone="muted">
            Four agents · 22,770 simulations this month.
          </Text>
        </div>

        <Input
          variant="default"
          size="sm"
          placeholder="Filter agents…"
        />

        <Card variant="default" padding="sm" radius="md" className="gap-1">
          {agents.map((agent) => (
            <AgentRow
              key={agent.id}
              name={agent.name}
              description={agent.description}
              initials={agent.initials}
              tone={agent.tone}
              state={selected === agent.id ? 'selected' : 'default'}
              onClick={() => setSelected(agent.id)}
              trailing={
                <Badge
                  variant={statusBadge[agent.status].variant}
                  size="sm"
                  shape="pill"
                >
                  {statusBadge[agent.status].label}
                </Badge>
              }
            />
          ))}
        </Card>

        <Button variant="secondary" size="md" fullWidth>
          + New agent
        </Button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
        {(() => {
          const agent = agents.find((a) => a.id === selected) ?? agents[0]
          const badge = statusBadge[agent.status]
          return (
            <>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Heading as="h2" size="lg" weight="semibold" className="sm:text-xl">
                      {agent.name}
                    </Heading>
                    <Badge variant={badge.variant} size="sm" shape="pill">
                      {badge.label}
                    </Badge>
                  </div>
                  <Text size="sm" tone="muted">
                    {agent.description}
                  </Text>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                    Logs
                  </Button>
                  <Button variant="secondary" size="sm">
                    Edit prompt
                  </Button>
                  <Button variant="primary" size="sm">
                    Run simulation
                    <Kbd size="sm" tone="accent" className="ml-1 hidden sm:inline-flex">⌘R</Kbd>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Card variant="default" padding="md" radius="lg" className="gap-1">
                  <Text size="xs" tone="subtle" weight="medium" className="uppercase tracking-wide">
                    Lifetime runs
                  </Text>
                  <Heading as="div" size="xl" weight="semibold">
                    {agent.runs.toLocaleString()}
                  </Heading>
                </Card>
                <Card variant="default" padding="md" radius="lg" className="gap-1">
                  <Text size="xs" tone="subtle" weight="medium" className="uppercase tracking-wide">
                    Last 24h pass rate
                  </Text>
                  <Heading as="div" size="xl" weight="semibold">
                    96.1%
                  </Heading>
                </Card>
                <Card variant="default" padding="md" radius="lg" className="gap-1">
                  <Text size="xs" tone="subtle" weight="medium" className="uppercase tracking-wide">
                    Mean latency
                  </Text>
                  <Heading as="div" size="xl" weight="semibold">
                    1.4s
                  </Heading>
                </Card>
              </div>

              <div className="flex flex-col gap-3">
                <Heading as="h3" size="md" weight="semibold">
                  System prompt
                </Heading>
                <Card variant="subtle" padding="md" radius="lg" className="gap-2">
                  <Text family="mono" size="sm" tone="muted" className="leading-5">
                    You are {agent.name}, a {agent.description.toLowerCase()} agent operating inside a regulated workspace.
                    Always cite the policy you applied. Never invent refund amounts.
                    When a customer's request exceeds your authority, escalate using
                    <code className="px-1 rounded bg-(--color-surface-muted)"> handoff(team="human")</code>.
                  </Text>
                </Card>
                <div className="flex items-center justify-between">
                  <Text size="xs" tone="subtle">
                    Edited 3 days ago by Brayden Love
                  </Text>
                  <Text size="xs" tone="muted" className="flex items-center gap-1">
                    View change history
                    <ChevronRight className="h-3 w-3" />
                  </Text>
                </div>
              </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}
