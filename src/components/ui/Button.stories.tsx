import type { Meta, StoryObj } from '@storybook/react-vite'
import { ArrowRight, Plus, Sparkles } from 'lucide-react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  args: { children: 'Run simulation' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'accent', 'danger'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    fullWidth: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = { args: { variant: 'primary' } }
export const Secondary: Story = { args: { variant: 'secondary' } }
export const Outline: Story = { args: { variant: 'outline' } }
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Accent: Story = { args: { variant: 'accent' } }
export const Danger: Story = { args: { variant: 'danger', children: 'Delete agent' } }

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button leadingIcon={<Plus className="h-3.5 w-3.5" />}>New agent</Button>
      <Button
        variant="secondary"
        trailingIcon={<ArrowRight className="h-3.5 w-3.5" />}
      >
        Open
      </Button>
      <Button
        variant="accent"
        leadingIcon={<Sparkles className="h-3.5 w-3.5" />}
      >
        Suggest fix
      </Button>
    </div>
  ),
}

export const Disabled: Story = {
  args: { disabled: true, children: 'Running…' },
}

export const FullWidth: Story = {
  args: { fullWidth: true, children: 'Continue', variant: 'primary' },
  parameters: { layout: 'padded' },
}
