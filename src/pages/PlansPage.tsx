import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { PlanCard } from '@/components/views/PlanCard'
import { plans } from '@/data/demo'

export function PlansPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-1">
        <Heading as="h1" size="xl" weight="semibold" className="sm:text-2xl">
          Plans & billing
        </Heading>
        <Text size="sm" tone="muted">
          You're currently on the Sandbox plan. Upgrade to ship agents to
          production.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            name={plan.name}
            price={plan.price}
            pricePeriod={plan.pricePeriod}
            description={plan.description}
            features={plan.features}
            ctaLabel={plan.ctaLabel}
            badge={plan.badge}
            badgeTone={plan.featured ? 'accent' : 'neutral'}
            featured={plan.featured}
            tier={
              plan.id === 'free'
                ? 'free'
                : plan.id === 'team'
                  ? 'pro'
                  : 'enterprise'
            }
            banner={
              <div
                className="h-full w-full"
                style={{
                  background: `linear-gradient(135deg, ${plan.bannerFrom}, ${plan.bannerTo})`,
                }}
              />
            }
          />
        ))}
      </div>
    </div>
  )
}
