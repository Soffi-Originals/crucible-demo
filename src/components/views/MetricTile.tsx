import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { Heading } from '@/components/ui/Heading'

export const metricTileVariants = cva('flex flex-col gap-2', {
  variants: {
    emphasis: {
      default: '',
      raised: '',
    },
  },
  defaultVariants: { emphasis: 'default' },
})

export type TrendDirection = 'up' | 'down' | 'flat'
export type TrendSentiment = 'positive' | 'negative' | 'neutral'

export interface MetricTileProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof metricTileVariants> {
  label: string
  value: string
  unit?: string
  hint?: string
  delta?: string
  trend?: TrendDirection
  sentiment?: TrendSentiment
}

const trendIcon: Record<TrendDirection, React.ReactNode> = {
  up: <ArrowUpRight className="h-3 w-3" />,
  down: <ArrowDownRight className="h-3 w-3" />,
  flat: <Minus className="h-3 w-3" />,
}

const sentimentColor: Record<TrendSentiment, string> = {
  positive: 'text-(--color-success-fg)',
  negative: 'text-(--color-danger-fg)',
  neutral: 'text-(--color-fg-muted)',
}

const sentimentGradient: Record<TrendSentiment, string> = {
  positive: 'bg-gradient-to-br from-emerald-500 via-teal-400 to-cyan-300',
  negative: 'bg-gradient-to-br from-rose-500 via-pink-400 to-orange-300',
  neutral: 'bg-gradient-to-br from-slate-600 via-blue-500 to-indigo-400',
}

export const MetricTile = React.forwardRef<HTMLDivElement, MetricTileProps>(
  function MetricTile(
    {
      className,
      emphasis,
      label,
      value,
      unit,
      hint,
      delta,
      trend = 'flat',
      sentiment = 'neutral',
      ...props
    },
    ref,
  ) {
    return (
      <Card
        ref={ref}
        variant={emphasis === 'raised' ? 'raised' : 'default'}
        padding="md"
        radius="lg"
        className={cn(
          metricTileVariants({ emphasis }),
          sentimentGradient[sentiment],
          'border-0 shadow-lg',
          className,
        )}
        {...props}
      >
        <Text size="xs" weight="medium" className="uppercase tracking-wide text-white/80">
          {label}
        </Text>
        <div className="flex items-baseline gap-1">
          <Heading as="div" size="2xl" weight="semibold" className="text-white">
            {value}
          </Heading>
          {unit ? (
            <Text size="sm" className="text-white/70">
              {unit}
            </Text>
          ) : null}
        </div>
        {(delta || hint) && (
          <div className="flex items-center justify-between">
            {delta ? (
              <div className="flex items-center gap-1 text-white/90">
                {trendIcon[trend]}
                <Text size="xs" weight="medium" className="text-current">
                  {delta}
                </Text>
              </div>
            ) : (
              <span />
            )}
            {hint ? (
              <Text size="xs" className="text-white/70">
                {hint}
              </Text>
            ) : null}
          </div>
        )}
      </Card>
    )
  },
)
