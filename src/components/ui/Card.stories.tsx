import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card, CardSection } from './Card'
import { Heading } from './Heading'
import { Text } from './Text'
import { Badge } from './Badge'

const meta: Meta<typeof Card> = {
  title: 'Primitives/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined', 'subtle', 'raised'],
    },
    padding: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
    radius: { control: 'select', options: ['sm', 'md', 'lg', 'xl', '2xl'] },
    interactive: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Card>

const Body = () => (
  <div className="flex w-72 flex-col gap-1">
    <Heading as="h3" size="sm" weight="semibold">
      Refund policy adherence
    </Heading>
    <Text size="sm" tone="muted">
      248 / 250 passing · last run 12 min ago
    </Text>
  </div>
)

export const Default: Story = {
  args: { variant: 'default' },
  render: (args) => (
    <Card {...args}>
      <Body />
    </Card>
  ),
}

export const Elevated: Story = {
  args: { variant: 'elevated' },
  render: (args) => (
    <Card {...args}>
      <Body />
    </Card>
  ),
}

export const Subtle: Story = {
  args: { variant: 'subtle' },
  render: (args) => (
    <Card {...args}>
      <Body />
    </Card>
  ),
}

export const Interactive: Story = {
  args: { variant: 'default', interactive: true },
  render: (args) => (
    <Card {...args}>
      <Body />
    </Card>
  ),
}

export const WithSections: Story = {
  render: () => (
    <Card variant="default" padding="none" radius="lg" className="w-80">
      <CardSection padding="md" border="bottom">
        <div className="flex items-center justify-between">
          <Heading as="h3" size="sm" weight="semibold">
            Connector status
          </Heading>
          <Badge variant="success" size="sm" shape="pill">
            Connected
          </Badge>
        </div>
      </CardSection>
      <CardSection padding="md">
        <Text size="sm" tone="muted">
          Read · Write · Refunds enabled.
        </Text>
      </CardSection>
    </Card>
  ),
}
