import type { Meta, StoryObj } from '@storybook/react-vite'
import { PlanCard } from './PlanCard'

const banner = (from: string, to: string) => (
  <div
    className="h-full w-full"
    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
  />
)

const meta: Meta<typeof PlanCard> = {
  title: 'Views/PlanCard',
  component: PlanCard,
  tags: ['autodocs'],
  args: {
    name: 'Team',
    price: '$1,200',
    pricePeriod: ' / month',
    description: 'For teams running production agents with quarterly reviews.',
    features: [
      'Up to 10 agents · 50k simulations / mo',
      'Custom eval packs & rubrics',
      'SOC2 + audit log export',
      'Priority support',
    ],
    ctaLabel: 'Upgrade to Team',
    banner: banner('#f5d0fe', '#fce7f3'),
  },
  argTypes: {
    tier: { control: 'select', options: ['free', 'pro', 'enterprise'] },
    featured: { control: 'boolean' },
  },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof PlanCard>

export const Default: Story = {}
export const Featured: Story = {
  args: { featured: true, badge: 'Most popular', badgeTone: 'accent' },
}

export const Free: Story = {
  args: {
    name: 'Sandbox',
    price: '$0',
    pricePeriod: ' / month',
    description: 'For evaluating one agent in a private workspace.',
    features: ['1 agent · 500 simulations / mo', 'Basic evals', 'Community connectors'],
    ctaLabel: 'Current plan',
    badge: 'Free',
    badgeTone: 'neutral',
    banner: banner('#dbeafe', '#c7d2fe'),
  },
}
