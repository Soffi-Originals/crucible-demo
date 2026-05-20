import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { Heading } from '@/components/ui/Heading'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Badge } from '@/components/ui/Badge'

export const evalScoreCardVariants = cva('flex flex-col gap-3', {
  variants: {
    severity: {
      pass: '',
      warn: '',
      fail: '',
    },
  },
  defaultVariants: { severity: 'pass' },
})

export type EvalSeverity = 'pass' | 'warn' | 'fail'

const severityBadge: Record<EvalSeverity, 'success' | 'warning' | 'danger'> = {
  pass: 'success',
  warn: 'warning',
  fail: 'danger',
}

const severityTone: Record<EvalSeverity, 'success' | 'warning' | 'danger' | 'accent'> = {
  pass: 'success',
  warn: 'warning',
  fail: 'danger',
}

const severityLabel: Record<EvalSeverity, string> = {
  pass: 'Passing',
  warn: 'Needs review',
  fail: 'Regressing',
}

export interface EvalScoreCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof evalScoreCardVariants> {
  name: string
  score: number
  total: number
  description?: string
  lastRun?: string
}

export const EvalScoreCard = React.forwardRef<
  HTMLDivElement,
  EvalScoreCardProps
>(function EvalScoreCard(
  { className, severity = 'pass', name, score, total, description, lastRun, ...props },
  ref,
) {
  const pct = total === 0 ? 0 : Math.round((score / total) * 100)
  return (
    <Card
      ref={ref}
      variant="default"
      padding="md"
      radius="lg"
      className={cn(evalScoreCardVariants({ severity }), className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <Heading as="h3" size="sm" weight="semibold">
            {name}
          </Heading>
          {description ? (
            <Text size="xs" tone="muted">
              {description}
            </Text>
          ) : null}
        </div>
        <Badge variant={severityBadge[severity ?? 'pass']} size="sm" shape="pill">
          {severityLabel[severity ?? 'pass']}
        </Badge>
      </div>

      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1">
          <Heading as="div" size="xl" weight="semibold">
            {score}
          </Heading>
          <Text size="sm" tone="muted">
            / {total} passing
          </Text>
        </div>
        <Text size="sm" tone="muted" family="mono">
          {pct}%
        </Text>
      </div>

      <ProgressBar value={pct} tone={severityTone[severity ?? 'pass']} size="sm" />

      {lastRun ? (
        <Text size="xs" tone="subtle">
          Last run {lastRun}
        </Text>
      ) : null}
    </Card>
  )
})
