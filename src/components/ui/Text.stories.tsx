import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text } from './Text'

const meta: Meta<typeof Text> = {
  title: 'Primitives/Text',
  component: Text,
  tags: ['autodocs'],
  args: { children: 'Replay against 4 evals · 3 connectors invoked' },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'base', 'md', 'lg', 'xl'],
    },
    weight: {
      control: 'select',
      options: ['regular', 'medium', 'semibold', 'bold'],
    },
    tone: {
      control: 'select',
      options: [
        'default',
        'muted',
        'subtle',
        'inverse',
        'accent',
        'success',
        'warning',
        'danger',
      ],
    },
    family: { control: 'select', options: ['sans', 'mono'] },
  },
}

export default meta
type Story = StoryObj<typeof Text>

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <Text tone="default">Default tone — body copy</Text>
      <Text tone="muted">Muted tone — secondary info</Text>
      <Text tone="subtle">Subtle tone — least emphasis</Text>
      <Text tone="accent">Accent tone — interactive</Text>
      <Text tone="success">Success tone</Text>
      <Text tone="warning">Warning tone</Text>
      <Text tone="danger">Danger tone</Text>
    </div>
  ),
}

export const Mono: Story = {
  args: { family: 'mono', children: 'run_01HZ8PT4Q3 · 6.4s' },
}
