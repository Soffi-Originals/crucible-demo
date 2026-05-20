import type { Meta, StoryObj } from '@storybook/react-vite'
import { Skeleton } from './Skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'Primitives/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    shape: { control: 'select', options: ['line', 'block', 'circle', 'pill'] },
  },
}

export default meta
type Story = StoryObj<typeof Skeleton>

export const Shapes: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-2">
      <Skeleton shape="line" />
      <Skeleton shape="line" className="w-2/3" />
      <Skeleton shape="block" />
      <div className="flex items-center gap-2">
        <Skeleton shape="circle" className="h-8 w-8" />
        <Skeleton shape="pill" />
      </div>
    </div>
  ),
}
