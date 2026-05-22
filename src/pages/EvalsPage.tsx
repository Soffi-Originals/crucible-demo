import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { EvalScoreCard } from '@/components/views/EvalScoreCard'
import { evals } from '@/data/demo'

export function EvalsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <Heading as="h1" size="xl" weight="semibold" className="text-left sm:text-2xl">
            Test title
          </Heading>
          <Text size="sm" tone="muted">
            Rubrics & graders that gate every production deploy.
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            Import pack
          </Button>
          <Button variant="primary" size="sm">
            New eval
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {evals.map((evalEntry) => (
          <EvalScoreCard key={evalEntry.id} {...evalEntry} />
        ))}
      </div>
    </div>
  )
}
