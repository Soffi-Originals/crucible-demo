import type { Meta, StoryObj } from '@storybook/react-vite'
import { Activity, Bot, Gauge, Plug } from 'lucide-react'
import { SidebarNavItem } from './SidebarNavItem'

const meta: Meta<typeof SidebarNavItem> = {
  title: 'Views/SidebarNavItem',
  component: SidebarNavItem,
  tags: ['autodocs'],
  args: { label: 'Agents', icon: <Bot className="h-4 w-4" /> },
  argTypes: {
    state: { control: 'select', options: ['default', 'active', 'muted'] },
    size: { control: 'select', options: ['sm', 'md'] },
  },
}

export default meta
type Story = StoryObj<typeof SidebarNavItem>

export const Default: Story = {}
export const Active: Story = { args: { state: 'active' } }
export const WithCount: Story = {
  args: { label: 'Simulations', icon: <Activity className="h-4 w-4" />, count: 12 },
}

export const Group: Story = {
  render: () => (
    <div className="flex w-56 flex-col gap-0.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-2">
      <SidebarNavItem
        label="Overview"
        icon={<Gauge className="h-4 w-4" />}
        shortcut="⌘1"
        state="default"
      />
      <SidebarNavItem
        label="Agents"
        icon={<Bot className="h-4 w-4" />}
        count={4}
        shortcut="⌘2"
        state="active"
      />
      <SidebarNavItem
        label="Simulations"
        icon={<Activity className="h-4 w-4" />}
        count={12}
        shortcut="⌘3"
      />
      <SidebarNavItem
        label="Connectors"
        icon={<Plug className="h-4 w-4" />}
        shortcut="⌘4"
        state="muted"
      />
    </div>
  ),
}
