import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Check, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Text } from '@/components/ui/Text'

export const simulationStepVariants = cva('flex items-start gap-3 relative', {
  variants: {
    state: {
      pending: '',
      running: '',
      done: '',
      failed: '',
      final: '',
    },
  },
  defaultVariants: {
    state: 'pending',
  },
})

const iconWrap = cva(
  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border z-10 bg-(--color-surface)',
  {
    variants: {
      state: {
        pending:
          'border-(--color-border) text-(--color-fg-subtle)',
        running:
          'border-(--color-info) text-(--color-info) animate-pulse',
        done: 'border-(--color-border-strong) text-(--color-fg-muted)',
        failed: 'border-(--color-danger) text-(--color-danger)',
        final:
          'border-(--color-accent) bg-(--color-accent) text-(--color-accent-fg)',
      },
    },
    defaultVariants: { state: 'pending' },
  },
)

export interface SimulationStepProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof simulationStepVariants> {
  label: string
  showConnector?: boolean
}

export const SimulationStep = React.forwardRef<
  HTMLDivElement,
  SimulationStepProps
>(function SimulationStep(
  { className, state = 'pending', label, showConnector = true, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(simulationStepVariants({ state }), className)}
      {...props}
    >
      {showConnector ? (
        <span
          aria-hidden="true"
          className="absolute left-2.5 top-5 bottom-[-20px] w-px bg-(--color-border-subtle)"
        />
      ) : null}
      <span className={iconWrap({ state })}>
        {state === 'running' ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : state === 'failed' ? (
          <X className="h-3 w-3" strokeWidth={2.5} />
        ) : (
          <Check className="h-3 w-3" strokeWidth={2.5} />
        )}
      </span>
      <Text
        size="sm"
        weight={state === 'final' ? 'medium' : 'regular'}
        tone={
          state === 'final'
            ? 'accent'
            : state === 'pending'
              ? 'subtle'
              : state === 'failed'
                ? 'danger'
                : 'default'
        }
        className="leading-5"
      >
        {label}
      </Text>
    </div>
  )
})
