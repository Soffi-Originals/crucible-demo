import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/Card'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export const connectorCardVariants = cva('flex flex-col gap-4', {
  variants: {
    layout: {
      stacked: '',
      compact: '',
    },
  },
  defaultVariants: { layout: 'stacked' },
})

export type ConnectorState = 'available' | 'installed' | 'updating' | 'error'

export interface ConnectorCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof connectorCardVariants> {
  name: string
  vendor: string
  description: string
  category?: string
  capabilities?: string[]
  state?: ConnectorState
  icon?: React.ReactNode
  onInstall?: () => void
}

const stateLabel: Record<ConnectorState, string> = {
  available: 'Install',
  installed: 'Manage',
  updating: 'Updating…',
  error: 'Reconnect',
}

const stateBadge: Record<
  ConnectorState,
  { variant: 'neutral' | 'success' | 'warning' | 'danger'; label: string }
> = {
  available: { variant: 'neutral', label: 'Available' },
  installed: { variant: 'success', label: 'Connected' },
  updating: { variant: 'warning', label: 'Updating' },
  error: { variant: 'danger', label: 'Error' },
}

export const ConnectorCard = React.forwardRef<
  HTMLDivElement,
  ConnectorCardProps
>(function ConnectorCard(
  {
    className,
    layout,
    name,
    vendor,
    description,
    category,
    capabilities = [],
    state = 'available',
    icon,
    onInstall,
    ...props
  },
  ref,
) {
  const badge = stateBadge[state]
  return (
    <Card
      ref={ref}
      variant="default"
      padding="lg"
      radius="xl"
      className={cn(connectorCardVariants({ layout }), className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-(--radius-md) bg-(--color-surface-subtle) text-(--color-fg-muted)">
            {icon}
          </div>
          <div className="flex flex-col">
            <Heading as="h3" size="sm" weight="semibold">
              {name}
            </Heading>
            <Text size="xs" tone="muted">
              by {vendor}
            </Text>
          </div>
        </div>
        <Badge variant={badge.variant} size="sm" shape="pill">
          {badge.label}
        </Badge>
      </div>

      <Text size="sm" tone="muted" className="leading-5">
        {description}
      </Text>

      {capabilities.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {capabilities.map((cap) => (
            <Badge key={cap} variant="outline" size="sm">
              {cap}
            </Badge>
          ))}
        </div>
      ) : null}

      {category ? (
        <div className="flex items-center justify-between">
          <Text size="xs" tone="subtle">
            {category}
          </Text>
        </div>
      ) : null}

      <Button
        variant="primary"
        size="md"
        fullWidth
        onClick={onInstall}
        disabled={state === 'updating'}
      >
        {stateLabel[state]}
      </Button>
    </Card>
  )
})
