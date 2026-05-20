import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Divider } from '@/components/ui/Divider'
import { SimulationConversation } from '@/components/views/SimulationConversation'
import { simulationSteps } from '@/data/demo'

export function SimulationsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <Heading as="h1" size="xl" weight="semibold" className="sm:text-2xl">
            Simulations
          </Heading>
          <Text size="sm" tone="muted">
            Replay a customer interaction or scaffold a new scenario.
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Import from production
          </Button>
          <Button variant="primary" size="sm">
            New simulation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Card variant="default" padding="lg" radius="xl">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <Heading as="h2" size="md" weight="semibold">
                sim_4892
              </Heading>
              <Text size="xs" tone="subtle">
                Navigator · last-minute cancellation
              </Text>
            </div>
            <Badge variant="success" size="sm" shape="pill">
              Resolved
            </Badge>
          </div>

          <Divider tone="subtle" spacing="md" />

          <SimulationConversation
            customerInitials="L"
            customerMessage="My stay was cancelled last minute. I need a full refund."
            agentInitials="N"
            agentName="Navigator"
            agentMessage="Refund of $487 issued to card •••• 4242. Arrives in 3–5 business days. Confirmation sent."
            steps={simulationSteps}
          />

          <Divider tone="subtle" spacing="md" />

          <div className="flex items-center justify-between">
            <Text size="xs" tone="subtle">
              Replay against 4 evals · 3 connectors invoked
            </Text>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                Trace
              </Button>
              <Button variant="secondary" size="sm">
                Branch scenario
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Heading as="h2" size="md" weight="semibold">
            Live simulations
          </Heading>
          <Card variant="default" padding="md" radius="lg" className="gap-3">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-0.5">
                <Text size="sm" weight="medium">
                  Refund · partial — damaged room
                </Text>
                <Text size="xs" tone="subtle" family="mono">
                  sim_4893 · Navigator
                </Text>
              </div>
              <Badge variant="accent" size="sm" shape="pill">
                Running
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              <SimulationStepCondensed label="Booking located" state="done" />
              <SimulationStepCondensed label="Reviewing policy" state="running" />
              <SimulationStepCondensed label="Refund pending approval" state="pending" />
            </div>
          </Card>

          <Card variant="default" padding="md" radius="lg" className="gap-3">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-0.5">
                <Text size="sm" weight="medium">
                  Escalation · billing dispute &gt; $1k
                </Text>
                <Text size="xs" tone="subtle" family="mono">
                  sim_4894 · Navigator
                </Text>
              </div>
              <Badge variant="warning" size="sm" shape="pill">
                Awaiting human
              </Badge>
            </div>
            <div className="flex flex-col gap-2">
              <SimulationStepCondensed label="Customer verified" state="done" />
              <SimulationStepCondensed label="Policy exceeded — escalating" state="done" />
              <SimulationStepCondensed label="Handoff queued" state="pending" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { SimulationStep, type SimulationStepProps } from '@/components/views/SimulationStep'

function SimulationStepCondensed({
  label,
  state,
}: {
  label: string
  state: SimulationStepProps['state']
}) {
  return <SimulationStep label={label} state={state} showConnector={false} />
}
