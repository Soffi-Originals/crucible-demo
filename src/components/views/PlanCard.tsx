import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/Card'
import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

export const planCardVariants = cva('flex flex-col gap-4', {
  variants: {
    tier: {
      free: '',
      pro: '',
      enterprise: '',
    },
    featured: {
      true: 'ring-2 ring-(--color-accent)',
      false: '',
    },
  },
  defaultVariants: { tier: 'free', featured: false },
})

export interface PlanCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof planCardVariants> {
  name: string
  price: string
  pricePeriod?: string
  description: string
  features: string[]
  ctaLabel: string
  badge?: string
  badgeTone?: 'accent' | 'success' | 'neutral'
  banner?: React.ReactNode
  onCta?: () => void
}

export const PlanCard = React.forwardRef<HTMLDivElement, PlanCardProps>(
  function PlanCard(
    {
      className,
      tier,
      featured,
      name,
      price,
      pricePeriod,
      description,
      features,
      ctaLabel,
      badge,
      badgeTone = 'neutral',
      banner,
      onCta,
      ...props
    },
    ref,
  ) {
    return (
      <Card
        ref={ref}
        variant="default"
        padding="none"
        radius="xl"
        className={cn(
          planCardVariants({ tier, featured }),
          'overflow-hidden',
          className,
        )}
        {...props}
      >
        {banner ? (
          <div className="h-32 w-full">{banner}</div>
        ) : null}

        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Heading as="h3" size="md" weight="semibold">
                {name}
              </Heading>
              <Text size="sm" tone="muted">
                {description}
              </Text>
            </div>
            {badge ? (
              <Badge variant={badgeTone} size="sm" shape="pill">
                {badge}
              </Badge>
            ) : null}
          </div>

          <div className="flex items-baseline gap-1">
            <Heading as="div" size="2xl" weight="semibold">
              {price}
            </Heading>
            {pricePeriod ? (
              <Text size="sm" tone="muted">
                {pricePeriod}
              </Text>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Text size="xs" tone="subtle" weight="medium" className="uppercase tracking-wide">
              What you get
            </Text>
            <ul className="flex flex-col gap-2">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-(--color-fg-muted) mt-0.5" />
                  <Text size="sm">{feature}</Text>
                </li>
              ))}
            </ul>
          </div>

          <Button
            variant={featured ? 'primary' : 'secondary'}
            size="lg"
            fullWidth
            onClick={onCta}
          >
            {ctaLabel}
          </Button>
        </div>
      </Card>
    )
  },
)
