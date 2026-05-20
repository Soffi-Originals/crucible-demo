import type { Meta, StoryObj } from '@storybook/react-vite'
import { Receipt } from 'lucide-react'
import { ConnectorCard } from './ConnectorCard'

const meta: Meta<typeof ConnectorCard> = {
  title: 'Views/ConnectorCard',
  component: ConnectorCard,
  tags: ['autodocs'],
  args: {
    name: 'Stripe',
    vendor: 'Stripe Inc.',
    description:
      'Issue refunds, look up invoices, and pause subscriptions from inside a simulation.',
    category: 'Payments',
    capabilities: ['Refunds', 'Subscriptions', 'Invoices', 'Write'],
    state: 'available',
    icon: <Receipt className="h-5 w-5" />,
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['available', 'installed', 'updating', 'error'],
    },
  },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof ConnectorCard>

export const Available: Story = { args: { state: 'available' } }
export const Installed: Story = { args: { state: 'installed' } }
export const Updating: Story = { args: { state: 'updating' } }
export const Error: Story = { args: { state: 'error' } }
