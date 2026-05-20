import type { Meta, StoryObj } from '@storybook/react-vite'
import { SimulationStep } from './SimulationStep'

const meta: Meta<typeof SimulationStep> = {
  title: 'Views/SimulationStep',
  component: SimulationStep,
  tags: ['autodocs'],
  args: { label: 'Cancellation policy reviewed' },
  argTypes: {
    state: {
      control: 'select',
      options: ['pending', 'running', 'done', 'failed', 'final'],
    },
  },
}

export default meta
type Story = StoryObj<typeof SimulationStep>

export const States: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface-subtle) p-4">
      <SimulationStep label="Booking #4892 located" state="done" />
      <SimulationStep label="Cancellation policy reviewed" state="done" />
      <SimulationStep label="Refund eligibility confirmed" state="done" />
      <SimulationStep label="$487 refunded to card •••• 4242" state="done" />
      <SimulationStep label="Confirmation email sent" state="running" />
      <SimulationStep label="Done" state="final" showConnector={false} />
    </div>
  ),
}

export const FailureCase: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface-subtle) p-4">
      <SimulationStep label="Booking located" state="done" />
      <SimulationStep label="Refund eligibility — exceeds authority" state="failed" />
      <SimulationStep label="Handoff queued" state="pending" showConnector={false} />
    </div>
  ),
}
