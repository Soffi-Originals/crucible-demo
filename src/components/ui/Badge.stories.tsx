import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'
import { StatusDot } from './StatusDot'

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: { children: 'Connected' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'accent', 'success', 'warning', 'danger', 'outline', 'solid'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    shape: { control: 'select', options: ['rect', 'pill'] },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="accent">Accent</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="solid">Solid</Badge>
    </div>
  ),
}

export const Pills: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="success" shape="pill">
        <StatusDot status="success" size="sm" /> Passing
      </Badge>
      <Badge variant="warning" shape="pill">
        <StatusDot status="warning" size="sm" /> Needs review
      </Badge>
      <Badge variant="danger" shape="pill">
        <StatusDot status="error" size="sm" /> Regressing
      </Badge>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
}
