import type { Meta, StoryObj } from '@storybook/react-vite'
import { MoreHorizontal, Search, Settings, Trash2 } from 'lucide-react'
import { IconButton } from './IconButton'

const meta: Meta<typeof IconButton> = {
  title: 'Primitives/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: {
    'aria-label': 'Settings',
    children: <Settings className="h-4 w-4" />,
  },
  argTypes: {
    variant: { control: 'select', options: ['ghost', 'outline', 'solid', 'soft'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
}

export default meta
type Story = StoryObj<typeof IconButton>

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <IconButton variant="ghost" aria-label="Search">
        <Search className="h-4 w-4" />
      </IconButton>
      <IconButton variant="outline" aria-label="Settings">
        <Settings className="h-4 w-4" />
      </IconButton>
      <IconButton variant="soft" aria-label="More">
        <MoreHorizontal className="h-4 w-4" />
      </IconButton>
      <IconButton variant="solid" aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </IconButton>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <IconButton size="sm" variant="outline" aria-label="Search">
        <Search className="h-3.5 w-3.5" />
      </IconButton>
      <IconButton size="md" variant="outline" aria-label="Search">
        <Search className="h-4 w-4" />
      </IconButton>
      <IconButton size="lg" variant="outline" aria-label="Search">
        <Search className="h-5 w-5" />
      </IconButton>
    </div>
  ),
}
