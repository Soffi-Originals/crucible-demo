import type { Meta, StoryObj } from '@storybook/react-vite'
import { SimulationConversation } from './SimulationConversation'
import { simulationSteps } from '@/data/demo'

const meta: Meta<typeof SimulationConversation> = {
  title: 'Views/SimulationConversation',
  component: SimulationConversation,
  tags: ['autodocs'],
  args: {
    customerMessage: 'My stay was cancelled last minute. I need a full refund.',
    agentName: 'Navigator',
    agentMessage:
      'Refund of $487 issued to card •••• 4242. Arrives in 3–5 business days. Confirmation sent.',
    steps: simulationSteps,
  },
  argTypes: {
    density: { control: 'select', options: ['comfortable', 'compact'] },
  },
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof SimulationConversation>

export const RefundFlow: Story = {
  render: (args) => (
    <div className="w-[480px]">
      <SimulationConversation {...args} />
    </div>
  ),
}
