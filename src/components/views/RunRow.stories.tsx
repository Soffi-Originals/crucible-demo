import type { Meta, StoryObj } from '@storybook/react-vite'
import { RunRow } from './RunRow'
import { runs } from '@/data/demo'

const meta: Meta<typeof RunRow> = {
  title: 'Views/RunRow',
  component: RunRow,
  tags: ['autodocs'],
  args: runs[0],
  argTypes: {
    status: {
      control: 'select',
      options: ['queued', 'running', 'passed', 'failed', 'cancelled'],
    },
    density: { control: 'select', options: ['compact', 'comfortable', 'loose'] },
    interactive: { control: 'boolean' },
  },
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof RunRow>

export const Single: Story = {
  render: (args) => (
    <div className="w-[720px] rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface)">
      <RunRow {...args} />
    </div>
  ),
}

export const Table: Story = {
  render: () => (
    <div className="w-[720px] divide-y divide-(--color-border-subtle) rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface)">
      {runs.map((r) => (
        <RunRow key={r.runId} {...r} />
      ))}
    </div>
  ),
}
