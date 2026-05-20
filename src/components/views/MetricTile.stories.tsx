import type { Meta, StoryObj } from '@storybook/react-vite'
import { MetricTile } from './MetricTile'

const meta: Meta<typeof MetricTile> = {
  title: 'Views/MetricTile',
  component: MetricTile,
  tags: ['autodocs'],
  args: {
    label: 'Eval pass rate',
    value: '94.2',
    unit: '%',
    delta: '+1.4 vs. last week',
    trend: 'up',
    sentiment: 'positive',
  },
  argTypes: {
    trend: { control: 'select', options: ['up', 'down', 'flat'] },
    sentiment: {
      control: 'select',
      options: ['positive', 'negative', 'neutral'],
    },
    emphasis: { control: 'select', options: ['default', 'raised'] },
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof MetricTile>

export const Positive: Story = {}
export const Negative: Story = {
  args: {
    label: 'Simulations / 24h',
    value: '12,481',
    unit: '',
    delta: '−2.1 vs. last week',
    trend: 'down',
    sentiment: 'negative',
  },
}

export const Grid: Story = {
  render: () => (
    <div className="grid w-[640px] grid-cols-2 gap-3">
      <MetricTile label="Pass rate" value="94.2" unit="%" delta="+1.4" trend="up" sentiment="positive" />
      <MetricTile label="Sims / 24h" value="12,481" delta="−2.1" trend="down" sentiment="negative" />
      <MetricTile label="P95 latency" value="1.8" unit="s" delta="flat" trend="flat" />
      <MetricTile label="Escalation rate" value="3.1" unit="%" delta="−0.6" trend="down" sentiment="positive" />
    </div>
  ),
}
