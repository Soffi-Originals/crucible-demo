import { Database, KeyRound, MessageSquare, Plug, Receipt, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Input } from '@/components/ui/Input'
import { ConnectorCard } from '@/components/views/ConnectorCard'
import { connectors } from '@/data/demo'

const iconFor: Record<string, ReactNode> = {
  stripe: <Receipt className="h-5 w-5" />,
  zendesk: <MessageSquare className="h-5 w-5" />,
  salesforce: <Users className="h-5 w-5" />,
  snowflake: <Database className="h-5 w-5" />,
  slack: <MessageSquare className="h-5 w-5" />,
  okta: <KeyRound className="h-5 w-5" />,
}

export function ConnectorsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <Heading as="h1" size="xl" weight="semibold" className="sm:text-2xl">
            Connectors
          </Heading>
          <Text size="sm" tone="muted">
            Tools agents can read from or take action against during a simulation.
          </Text>
        </div>
        <Input
          variant="default"
          size="md"
          placeholder="Search connectors…"
          className="w-full sm:w-72"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {connectors.map((c) => (
          <ConnectorCard
            key={c.id}
            name={c.name}
            vendor={c.vendor}
            description={c.description}
            category={c.category}
            capabilities={c.capabilities}
            state={c.state}
            icon={iconFor[c.id] ?? <Plug className="h-5 w-5" />}
          />
        ))}
      </div>
    </div>
  )
}
