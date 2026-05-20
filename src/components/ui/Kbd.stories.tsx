import type { Meta, StoryObj } from '@storybook/react-vite'
import { Kbd } from './Kbd'

const meta: Meta<typeof Kbd> = {
  title: 'Primitives/Kbd',
  component: Kbd,
  tags: ['autodocs'],
  args: { children: '⌘K' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    tone: { control: 'select', options: ['default', 'accent'] },
  },
}

export default meta
type Story = StoryObj<typeof Kbd>

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Kbd size="sm">⌘K</Kbd>
      <Kbd size="md">⇧ Enter</Kbd>
      <Kbd tone="accent">⌘R</Kbd>
    </div>
  ),
}
