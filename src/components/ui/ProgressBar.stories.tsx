import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProgressBar } from './ProgressBar'

const meta: Meta<typeof ProgressBar> = {
  title: 'Primitives/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  args: { value: 68 },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    tone: {
      control: 'select',
      options: ['accent', 'success', 'warning', 'danger'],
    },
    value: { control: { type: 'range', min: 0, max: 100 } },
  },
}

export default meta
type Story = StoryObj<typeof ProgressBar>

export const Tones: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-3">
      <ProgressBar value={92} tone="success" />
      <ProgressBar value={68} tone="accent" />
      <ProgressBar value={44} tone="warning" />
      <ProgressBar value={18} tone="danger" />
    </div>
  ),
}
