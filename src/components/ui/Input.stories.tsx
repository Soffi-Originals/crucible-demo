import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  args: { placeholder: 'Filter agents…' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'ghost', 'plain'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    state: { control: 'select', options: ['default', 'error', 'success'] },
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = { args: { variant: 'default' } }
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Plain: Story = { args: { variant: 'plain' } }
export const Error: Story = {
  args: { variant: 'default', state: 'error', defaultValue: 'invalid@' },
}
export const Sizes: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-2">
      <Input size="sm" placeholder="Small" />
      <Input size="md" placeholder="Medium" />
      <Input size="lg" placeholder="Large" />
    </div>
  ),
}
