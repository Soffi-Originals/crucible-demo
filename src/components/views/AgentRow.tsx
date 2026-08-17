import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Avatar } from '@/components/ui/Avatar'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'

// eslint-disable-next-line react-refresh/only-export-components
export const agentRowVariants = cva(
  'flex items-start gap-3 w-full text-left transition-colors',
  {
    variants: {
      state: {
        default:
          'bg-transparent hover:bg-(--color-surface-subtle)',
        selected:
          'bg-(--color-surface-subtle) ring-1 ring-(--color-border)',
        muted: 'opacity-60',
      },
      size: {
        sm: 'p-2 rounded-(--radius-sm)',
        md: 'p-3 rounded-(--radius-md)',
        lg: 'p-4 rounded-(--radius-lg)',
      },
    },
    defaultVariants: {
      state: 'default',
      size: 'md',
    },
  },
)

export type AgentTone =
  | 'neutral'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'solid'

export interface AgentRowProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'name'>,
    VariantProps<typeof agentRowVariants> {
  name: string
  description?: string
  initials?: string
  tone?: AgentTone
  trailing?: React.ReactNode
  badge?: string
}

export const AgentRow = React.forwardRef<HTMLButtonElement, AgentRowProps>(
  function AgentRow(
    {
      className,
      state,
      size,
      name,
      description,
      initials,
      tone = 'accent',
      trailing,
      badge,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(agentRowVariants({ state, size }), className)}
        {...props}
      >
        <Avatar
          variant={tone}
          shape="circle"
          size="sm"
          initials={initials ?? name.charAt(0).toUpperCase()}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Text size="base" weight="medium" truncate className="flex-1">
              {name}
            </Text>
            {badge ? (
              <Badge variant="neutral" size="sm" shape="pill" className="shrink-0">
                {badge}
              </Badge>
            ) : null}
            {trailing ? <div className="shrink-0">{trailing}</div> : null}
          </div>
          {description ? (
            <Text size="base" tone="muted" truncate>
              {description}
            </Text>
          ) : null}
        </div>
      </button>
    )
  },
)
