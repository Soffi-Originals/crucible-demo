import type { Meta, StoryObj } from '@storybook/react-vite'
import { SparklineChart } from './SparklineChart'

const SERIES = [
  {
    label: 'This year',
    color: 'var(--color-accent)',
    values: [310, 340, 328, 360, 380, 375, 395, 420, 440, 455, 470, 490],
    strokeWidth: 2,
  },
  {
    label: 'Last year',
    color: 'var(--color-info)',
    values: [260, 275, 265, 280, 295, 290, 305, 320, 330, 340, 350, 360],
    strokeWidth: 1.5,
  },
  {
    label: '2 yrs ago',
    color: 'var(--color-fg-subtle)',
    values: [210, 215, 205, 220, 230, 225, 235, 245, 255, 260, 268, 275],
    strokeWidth: 1.5,
  },
]

const X_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const meta: Meta<typeof SparklineChart> = {
  title: 'Views/SparklineChart',
  component: SparklineChart,
  tags: ['autodocs'],
  args: {
    title: 'Simulation runs',
    series: SERIES,
    xLabels: X_LABELS,
    showMenu: true,
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'outlined', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  decorators: [
    (Story) => (
      <div className="w-[600px] bg-(--color-canvas) p-6">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SparklineChart>

export const Default: Story = {
  args: { variant: 'default' },
}

export const Outlined: Story = {
  args: { variant: 'outlined' },
}

export const Ghost: Story = {
  args: { variant: 'ghost' },
}
