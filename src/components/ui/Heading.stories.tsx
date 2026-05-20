import type { Meta, StoryObj } from '@storybook/react-vite'
import { Heading } from './Heading'

const meta: Meta<typeof Heading> = {
  title: 'Primitives/Heading',
  component: Heading,
  tags: ['autodocs'],
  args: { children: 'Production overview' },
  argTypes: {
    as: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'],
    },
    weight: {
      control: 'select',
      options: ['regular', 'medium', 'semibold', 'bold'],
    },
    tone: { control: 'select', options: ['default', 'muted', 'inverse'] },
  },
}

export default meta
type Story = StoryObj<typeof Heading>

export const Scale: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Heading size="3xl">Display 3xl</Heading>
      <Heading size="2xl">Display 2xl</Heading>
      <Heading size="xl">Title xl</Heading>
      <Heading size="lg">Title lg</Heading>
      <Heading size="md">Section md</Heading>
      <Heading size="sm">Subsection sm</Heading>
      <Heading size="xs">Label xs</Heading>
    </div>
  ),
}

export const Weights: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <Heading weight="regular">Regular weight</Heading>
      <Heading weight="medium">Medium weight</Heading>
      <Heading weight="semibold">Semibold weight</Heading>
      <Heading weight="bold">Bold weight</Heading>
    </div>
  ),
}
