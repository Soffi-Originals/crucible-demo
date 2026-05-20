import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Toggle } from './Toggle'

const meta: Meta<typeof Toggle> = {
  title: 'Primitives/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    tone: { control: 'select', options: ['accent', 'success'] },
  },
}

export default meta
type Story = StoryObj<typeof Toggle>

export const Controlled: Story = {
  render: function Render(args) {
    const [on, setOn] = useState(true)
    return <Toggle {...args} checked={on} onCheckedChange={setOn} />
  },
}

export const Sizes: Story = {
  render: function Render() {
    const [a, setA] = useState(true)
    const [b, setB] = useState(true)
    const [c, setC] = useState(true)
    return (
      <div className="flex items-center gap-3">
        <Toggle size="sm" checked={a} onCheckedChange={setA} />
        <Toggle size="md" checked={b} onCheckedChange={setB} />
        <Toggle size="lg" checked={c} onCheckedChange={setC} />
      </div>
    )
  },
}
