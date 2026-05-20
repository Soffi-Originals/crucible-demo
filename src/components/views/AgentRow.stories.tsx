import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChevronRight } from 'lucide-react'
import { AgentRow } from './AgentRow'
import { Badge } from '@/components/ui/Badge'

const meta: Meta<typeof AgentRow> = {
  title: 'Views/AgentRow',
  component: AgentRow,
  tags: ['autodocs'],
  args: {
    name: 'Navigator',
    description: 'Customer support · refunds, escalations, cancellations',
    initials: 'N',
  },
  argTypes: {
    state: { control: 'select', options: ['default', 'selected', 'muted'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    tone: {
      control: 'select',
      options: ['neutral', 'accent', 'success', 'warning', 'danger', 'solid'],
    },
  },
}

export default meta
type Story = StoryObj<typeof AgentRow>

export const Default: Story = { args: { tone: 'accent' } }
export const Selected: Story = { args: { tone: 'accent', state: 'selected' } }

export const WithBadge: Story = {
  args: {
    tone: 'accent',
    badge: 'New',
  },
}

export const List: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-2">
      <AgentRow
        name="Explorer"
        description="Inbound discovery"
        initials="E"
        tone="danger"
        trailing={<Badge variant="success" size="sm" shape="pill">Prod</Badge>}
      />
      <AgentRow
        name="Navigator"
        description="Customer support"
        initials="N"
        tone="accent"
        state="selected"
        trailing={<ChevronRight className="h-4 w-4 text-(--color-fg-subtle)" />}
      />
      <AgentRow
        name="Pioneer"
        description="Onboarding"
        initials="P"
        tone="solid"
        trailing={<Badge variant="warning" size="sm" shape="pill">Staging</Badge>}
      />
      <AgentRow
        name="Voyager"
        description="Renewal outreach"
        initials="V"
        tone="warning"
        state="muted"
        trailing={<Badge variant="neutral" size="sm" shape="pill">Paused</Badge>}
      />
    </div>
  ),
}
