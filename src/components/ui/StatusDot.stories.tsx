import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatusDot } from './StatusDot'
import { Text } from './Text'

const meta: Meta<typeof StatusDot> = {
  title: 'Primitives/StatusDot',
  component: StatusDot,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['idle', 'running', 'success', 'warning', 'error'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    ring: { control: 'select', options: ['none', 'soft'] },
  },
}

export default meta
type Story = StoryObj<typeof StatusDot>

export const Statuses: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {(['idle', 'running', 'success', 'warning', 'error'] as const).map(
        (s) => (
          <div key={s} className="flex items-center gap-2">
            <StatusDot status={s} />
            <Text size="sm" tone="muted">
              {s}
            </Text>
          </div>
        ),
      )}
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <StatusDot status="running" size="sm" />
      <StatusDot status="running" size="md" />
      <StatusDot status="running" size="lg" />
    </div>
  ),
}
