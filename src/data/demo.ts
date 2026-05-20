import type { AgentTone } from '@/components/views/AgentRow'
import type { ConnectorState } from '@/components/views/ConnectorCard'
import type { RunStatus } from '@/components/views/RunRow'
import type { EvalSeverity } from '@/components/views/EvalScoreCard'
import type { SimulationStepState } from '@/components/views/SimulationConversation'

export type Agent = {
  id: string
  name: string
  description: string
  initials: string
  tone: AgentTone
  status: 'production' | 'staging' | 'paused'
  runs: number
}

export const agents: Agent[] = [
  {
    id: 'navigator',
    name: 'Navigator',
    description: 'Customer support · refunds, escalations, cancellations',
    initials: 'N',
    tone: 'accent',
    status: 'production',
    runs: 14_281,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Inbound discovery · qualifies leads from website traffic',
    initials: 'E',
    tone: 'danger',
    status: 'production',
    runs: 6_104,
  },
  {
    id: 'pioneer',
    name: 'Pioneer',
    description: 'Onboarding · walks new tenants through workspace setup',
    initials: 'P',
    tone: 'solid',
    status: 'staging',
    runs: 412,
  },
  {
    id: 'voyager',
    name: 'Voyager',
    description: 'Renewal outreach · drafts proposals & schedules calls',
    initials: 'V',
    tone: 'warning',
    status: 'paused',
    runs: 1_973,
  },
]

export type Connector = {
  id: string
  name: string
  vendor: string
  description: string
  category: string
  capabilities: string[]
  state: ConnectorState
  initials: string
}

export const connectors: Connector[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    vendor: 'Stripe Inc.',
    description:
      'Issue refunds, look up invoices, and pause subscriptions from inside a simulation.',
    category: 'Payments',
    capabilities: ['Refunds', 'Subscriptions', 'Invoices', 'Write'],
    state: 'installed',
    initials: 'S',
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    vendor: 'Zendesk',
    description:
      'Read ticket history and create follow-ups when an agent resolves an issue.',
    category: 'Support',
    capabilities: ['Tickets', 'Macros', 'Read', 'Write'],
    state: 'installed',
    initials: 'Z',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    vendor: 'Salesforce',
    description:
      'Fetch account context and write activity logs to the timeline.',
    category: 'CRM',
    capabilities: ['Accounts', 'Opportunities', 'Read'],
    state: 'available',
    initials: 'CRM',
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    vendor: 'Snowflake',
    description:
      'Run pre-approved queries against your warehouse for analytics evals.',
    category: 'Data',
    capabilities: ['Read', 'SQL', 'Warehouse'],
    state: 'updating',
    initials: 'SF',
  },
  {
    id: 'slack',
    name: 'Slack',
    vendor: 'Salesforce',
    description:
      'Notify on-call rooms when a failing eval ships to production.',
    category: 'Communication',
    capabilities: ['Notifications', 'Channels'],
    state: 'error',
    initials: 'SL',
  },
  {
    id: 'okta',
    name: 'Okta',
    vendor: 'Okta',
    description:
      'Reset MFA, deactivate sessions, and verify user identity inside simulations.',
    category: 'Identity',
    capabilities: ['SSO', 'MFA', 'Write'],
    state: 'available',
    initials: 'O',
  },
]

export type Run = {
  runId: string
  agent: string
  scenario: string
  status: RunStatus
  duration: string
  startedAt: string
}

export const runs: Run[] = [
  {
    runId: 'run_01HZ8PT4Q3',
    agent: 'Navigator',
    scenario: 'Refund · last-minute cancellation',
    status: 'passed',
    duration: '6.4s',
    startedAt: '2 min ago',
  },
  {
    runId: 'run_01HZ8PT4Q2',
    agent: 'Navigator',
    scenario: 'Refund · partial — damaged room',
    status: 'running',
    duration: '—',
    startedAt: '3 min ago',
  },
  {
    runId: 'run_01HZ8PT4Q1',
    agent: 'Explorer',
    scenario: 'Qualify · enterprise inbound from pricing page',
    status: 'failed',
    duration: '11.2s',
    startedAt: '14 min ago',
  },
  {
    runId: 'run_01HZ8PT4Q0',
    agent: 'Pioneer',
    scenario: 'Onboarding · invite three teammates',
    status: 'passed',
    duration: '4.1s',
    startedAt: '22 min ago',
  },
  {
    runId: 'run_01HZ8PT4PZ',
    agent: 'Voyager',
    scenario: 'Renewal · 90-day pre-expiry outreach',
    status: 'cancelled',
    duration: '2.0s',
    startedAt: '1 hr ago',
  },
  {
    runId: 'run_01HZ8PT4PY',
    agent: 'Navigator',
    scenario: 'Escalation · billing dispute > $1k',
    status: 'queued',
    duration: '—',
    startedAt: '1 hr ago',
  },
  {
    runId: 'run_01HZ8PT4PX',
    agent: 'Navigator',
    scenario: 'Refund · loyalty member edge case',
    status: 'passed',
    duration: '5.8s',
    startedAt: '2 hr ago',
  },
]

export type Eval = {
  id: string
  name: string
  description: string
  score: number
  total: number
  severity: EvalSeverity
  lastRun: string
}

export const evals: Eval[] = [
  {
    id: 'refund-policy',
    name: 'Refund policy adherence',
    description: 'Never refunds outside the published cancellation window.',
    score: 248,
    total: 250,
    severity: 'pass',
    lastRun: '12 min ago',
  },
  {
    id: 'pii',
    name: 'PII handling',
    description: 'Does not echo card numbers or addresses back to the user.',
    score: 144,
    total: 150,
    severity: 'warn',
    lastRun: '18 min ago',
  },
  {
    id: 'tone',
    name: 'Tone & de-escalation',
    description: 'Responds calmly to hostile or distressed customers.',
    score: 88,
    total: 100,
    severity: 'warn',
    lastRun: '34 min ago',
  },
  {
    id: 'escalate',
    name: 'Escalation triggers',
    description: 'Hands off when policy or refund exceeds agent authority.',
    score: 42,
    total: 75,
    severity: 'fail',
    lastRun: '1 hr ago',
  },
]

export type SimulationStepEntry = {
  label: string
  state: SimulationStepState
}

export const simulationSteps: SimulationStepEntry[] = [
  { label: 'Booking #4892 located', state: 'done' },
  { label: 'Cancellation policy reviewed', state: 'done' },
  { label: 'Refund eligibility confirmed', state: 'done' },
  { label: '$487 refunded to card •••• 4242', state: 'done' },
  { label: 'Confirmation email sent', state: 'done' },
  { label: 'Done', state: 'final' },
]

export type Plan = {
  id: string
  name: string
  price: string
  pricePeriod: string
  description: string
  features: string[]
  ctaLabel: string
  badge?: string
  featured?: boolean
  bannerFrom: string
  bannerTo: string
}

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Sandbox',
    price: '$0',
    pricePeriod: ' / month',
    description: 'For evaluating one agent in a private workspace.',
    features: [
      '1 agent · 500 simulations / mo',
      'Basic evals & failure traces',
      'Community connectors',
    ],
    ctaLabel: 'Current plan',
    badge: 'Free',
    bannerFrom: '#dbeafe',
    bannerTo: '#c7d2fe',
  },
  {
    id: 'team',
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
    badge: 'Most popular',
    featured: true,
    bannerFrom: '#f5d0fe',
    bannerTo: '#fce7f3',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    pricePeriod: '',
    description: 'For regulated industries running mission-critical agents.',
    features: [
      'Unlimited agents & simulations',
      'On-prem deployment & VPC peering',
      'Dedicated solutions engineer',
      'Custom DPA & legal review',
    ],
    ctaLabel: 'Talk to sales',
    bannerFrom: '#e0e7ff',
    bannerTo: '#fae8ff',
  },
]
