import { Heading } from '@/components/ui/Heading'
import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { EvalScoreCard } from '@/components/views/EvalScoreCard'
import { evals } from '@/data/demo'

export function EvalsPage() {
  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <Heading as="h1" size="2xl" weight="semibold">
            Eval packs
          </Heading>
          <Text size="sm" tone="muted">
            Rubrics & graders that gate every production deploy.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            Import pack
          </Button>
          <Button variant="primary" size="sm">
            New eval
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {evals.map((evalEntry) => (
          <EvalScoreCard key={evalEntry.id} {...evalEntry} />
        ))}
      </div>
    </div>
  )
}
