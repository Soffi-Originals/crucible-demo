import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Avatar } from '@/components/ui/Avatar'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import {
  SimulationStep,
  type SimulationStepProps,
} from './SimulationStep'

export const simulationConversationVariants = cva('flex flex-col gap-5', {
  variants: {
    density: {
      compact: 'gap-3',
      comfortable: 'gap-5',
    },
  },
  defaultVariants: { density: 'comfortable' },
})

export type SimulationStepState = SimulationStepProps['state']

export interface SimulationConversationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof simulationConversationVariants> {
  customerInitials?: string
  customerMessage: string
  agentInitials?: string
  agentName?: string
  agentMessage: string
  steps: { label: string; state: SimulationStepState }[]
}

export const SimulationConversation = React.forwardRef<
  HTMLDivElement,
  SimulationConversationProps
>(function SimulationConversation(
  {
    className,
    density,
    customerInitials = 'C',
    customerMessage,
    agentInitials = 'N',
    agentName = 'Agent',
    agentMessage,
    steps,
    ...props
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(simulationConversationVariants({ density }), className)}
      {...props}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Avatar variant="neutral" shape="circle" size="xs" initials={customerInitials} />
          <Text size="sm" weight="semibold">
            Customer
          </Text>
        </div>
        <Text size="sm" tone="muted" className="leading-5">
          {customerMessage}
        </Text>
      </div>

      <Card variant="subtle" padding="md" radius="lg" className="gap-3">
        {steps.map((step, idx) => (
          <SimulationStep
            key={step.label}
            label={step.label}
            state={step.state}
            showConnector={idx < steps.length - 1}
          />
        ))}
      </Card>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Avatar variant="accent" shape="circle" size="xs" initials={agentInitials} />
          <Text size="sm" weight="semibold">
            {agentName}
          </Text>
        </div>
        <Text size="sm" tone="muted" className="leading-5">
          {agentMessage}
        </Text>
      </div>
    </div>
  )
})
