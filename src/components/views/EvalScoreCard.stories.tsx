import type { Meta, StoryObj } from '@storybook/react-vite'
import { EvalScoreCard } from './EvalScoreCard'

const meta: Meta<typeof EvalScoreCard> = {
  title: 'Views/EvalScoreCard',
  component: EvalScoreCard,
  tags: ['autodocs'],
  args: {
    name: 'Refund policy adherence',
    description: 'Never refunds outside the published cancellation window.',
    score: 248,
    total: 250,
    severity: 'pass',
    lastRun: '12 min ago',
  },
  argTypes: {
    severity: { control: 'select', options: ['pass', 'warn', 'fail'] },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof EvalScoreCard>

export const Passing: Story = {}
export const Warning: Story = {
  args: {
    name: 'PII handling',
    score: 144,
    total: 150,
    severity: 'warn',
  },
}
export const Failing: Story = {
  args: {
    name: 'Escalation triggers',
    score: 42,
    total: 75,
    severity: 'fail',
  },
}
