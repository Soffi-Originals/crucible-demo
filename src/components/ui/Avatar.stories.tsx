import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Primitives/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: { initials: 'BL' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'accent', 'success', 'warning', 'danger', 'solid'],
    },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    shape: { control: 'select', options: ['square', 'circle'] },
  },
}

export default meta
type Story = StoryObj<typeof Avatar>

export const Tones: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Avatar variant="neutral" initials="N" shape="circle" />
      <Avatar variant="accent" initials="A" shape="circle" />
      <Avatar variant="success" initials="S" shape="circle" />
      <Avatar variant="warning" initials="W" shape="circle" />
      <Avatar variant="danger" initials="D" shape="circle" />
      <Avatar variant="solid" initials="X" shape="circle" />
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-2">
      <Avatar size="xs" initials="X" />
      <Avatar size="sm" initials="S" />
      <Avatar size="md" initials="M" />
      <Avatar size="lg" initials="L" />
      <Avatar size="xl" initials="XL" />
    </div>
  ),
}

export const Shapes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Avatar shape="square" initials="SQ" />
      <Avatar shape="circle" initials="CI" />
    </div>
  ),
}
