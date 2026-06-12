import * as React from 'react'
import { X, Clock, Hash, Zap, Layers } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Text'
import { Heading } from '@/components/ui/Heading'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatusDot } from '@/components/ui/StatusDot'
import { IconButton } from '@/components/ui/IconButton'
import { Divider } from '@/components/ui/Divider'
import type { RunRecord } from '@/data/runHistory'
import type { RunStatus } from '@/components/views/RunRow'

const statusMap: Record<
  RunStatus,
  {
    dot: 'idle' | 'running' | 'success' | 'warning' | 'error'
    label: string
    badge: 'neutral' | 'success' | 'warning' | 'danger' | 'accent'
  }
> = {
  queued: { dot: 'idle', label: 'Queued', badge: 'neutral' },
  running: { dot: 'running', label: 'Running', badge: 'accent' },
  passed: { dot: 'success', label: 'Passed', badge: 'success' },
  failed: { dot: 'error', label: 'Failed', badge: 'danger' },
  cancelled: { dot: 'warning', label: 'Cancelled', badge: 'warning' },
}

const evalLabels: Record<string, string> = {
  refundPolicy: 'Refund policy',
  piiHandling: 'PII handling',
  toneDeescalation: 'Tone & de-escalation',
  escalationTriggers: 'Escalation triggers',
}

const evalTone = (score: number): 'success' | 'warning' | 'danger' | 'accent' => {
  if (score >= 90) return 'success'
  if (score >= 70) return 'warning'
  return 'danger'
}

const evalBadge = (score: number): 'success' | 'warning' | 'danger' => {
  if (score >= 90) return 'success'
  if (score >= 70) return 'warning'
  return 'danger'
}

// Deterministic fake step trace from scenario name
function generateSteps(run: RunRecord): string[] {
  const base: string[] = []
  const s = run.scenario.toLowerCase()

  if (s.includes('refund')) {
    base.push(
      'Booking record fetched',
      'Cancellation window validated',
      'Refund eligibility confirmed',
      `Refund of $${(run.durationMs * 0.07).toFixed(0)} issued`,
      'Confirmation email queued',
    )
  } else if (s.includes('qualify') || s.includes('inbound')) {
    base.push(
      'Lead profile enriched',
      'Intent signals scored',
      'ICP fit assessed — tier: mid-market',
      'Meeting link generated',
      'Follow-up sequence enrolled',
    )
  } else if (s.includes('onboarding')) {
    base.push(
      'Workspace provisioned',
      'Team members invited',
      'First integration connected',
      'Onboarding checklist completed',
    )
  } else if (s.includes('escalat')) {
    base.push(
      'Customer sentiment analysed — hostile',
      'Policy limits checked',
      'Supervisor queue pinged',
      'Case ID #7824 created',
    )
  } else if (s.includes('renewal')) {
    base.push(
      'Account health score pulled',
      'Renewal proposal drafted',
      'Calendar invite sent',
      'CRM activity log written',
    )
  } else {
    base.push('Context retrieved', 'Action executed', 'Response composed', 'Audit log written')
  }

  // Trim to actual step count
  return base.slice(0, Math.max(1, run.steps - 1))
}

export interface RunDetailPanelProps {
  run: RunRecord
  onClose?: () => void
  className?: string
}

export function RunDetailPanel({ run, onClose, className }: RunDetailPanelProps) {
  const meta = statusMap[run.status]
  const steps = generateSteps(run)
  const hasScores = Object.values(run.evalScores).some((v) => v !== null)

  return (
    <Card
      variant="default"
      padding="none"
      radius="lg"
      className={className}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <StatusDot status={meta.dot} size="md" />
            <Badge variant={meta.badge} size="sm" shape="pill">
              {meta.label}
            </Badge>
          </div>
          <Heading as="h3" size="sm" weight="semibold" className="mt-1">
            {run.scenario}
          </Heading>
          <Text size="xs" tone="subtle" family="mono">
            {run.runId}
          </Text>
        </div>
        {onClose && (
          <IconButton variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        )}
      </div>

      <Divider tone="subtle" />

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-px bg-(--color-border-subtle) border-b border-(--color-border-subtle)">
        {[
          { icon: <Hash className="h-3.5 w-3.5" />, label: 'Agent', value: run.agent },
          {
            icon: <Clock className="h-3.5 w-3.5" />,
            label: 'Duration',
            value: run.durationMs > 0 ? `${(run.durationMs / 1000).toFixed(1)}s` : '—',
          },
          {
            icon: <Layers className="h-3.5 w-3.5" />,
            label: 'Steps',
            value: run.steps > 0 ? String(run.steps) : '—',
          },
          {
            icon: <Zap className="h-3.5 w-3.5" />,
            label: 'Tokens',
            value: run.tokenCount > 0 ? run.tokenCount.toLocaleString() : '—',
          },
        ].map(({ icon, label, value }) => (
          <div key={label} className="flex items-center gap-2 bg-(--color-surface) px-4 py-3">
            <span className="text-(--color-fg-subtle)">{icon}</span>
            <div className="flex flex-col gap-0.5">
              <Text size="xs" tone="subtle">
                {label}
              </Text>
              <Text size="sm" weight="medium" family={label === 'Duration' || label === 'Tokens' ? 'mono' : 'sans'}>
                {value}
              </Text>
            </div>
          </div>
        ))}
      </div>

      {/* Eval scores */}
      {hasScores && (
        <div className="flex flex-col gap-3 p-4">
          <Text size="xs" tone="muted" weight="medium" className="uppercase tracking-wide">
            Eval scores
          </Text>
          <div className="flex flex-col gap-2.5">
            {(Object.entries(run.evalScores) as [string, number | null][]).map(
              ([key, score]) => {
                if (score === null) return null
                return (
                  <div key={key} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Text size="xs" tone="muted">
                        {evalLabels[key] ?? key}
                      </Text>
                      <Badge variant={evalBadge(score)} size="sm">
                        {score}%
                      </Badge>
                    </div>
                    <ProgressBar value={score} tone={evalTone(score)} size="sm" />
                  </div>
                )
              },
            )}
          </div>
        </div>
      )}

      {/* Step trace */}
      {steps.length > 0 && (
        <>
          <Divider tone="subtle" />
          <div className="flex flex-col gap-3 p-4">
            <Text size="xs" tone="muted" weight="medium" className="uppercase tracking-wide">
              Execution trace
            </Text>
            <ol className="flex flex-col gap-2">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-(--color-surface-subtle) text-(--color-fg-subtle)">
                    <Text size="xs" tone="subtle" family="mono">
                      {i + 1}
                    </Text>
                  </span>
                  <Text size="sm" tone="muted" as="p">
                    {step}
                  </Text>
                </li>
              ))}
              <li className="flex items-start gap-2.5">
                <StatusDot
                  status={run.status === 'passed' ? 'success' : run.status === 'failed' ? 'error' : 'idle'}
                  size="sm"
                  className="mt-1 ml-0.5"
                />
                <Text
                  size="sm"
                  tone={run.status === 'passed' ? 'success' : run.status === 'failed' ? 'danger' : 'subtle'}
                  weight="medium"
                  as="p"
                >
                  {run.status === 'passed'
                    ? 'Completed successfully'
                    : run.status === 'failed'
                      ? 'Run failed — review eval scores'
                      : 'Run did not complete'}
                </Text>
              </li>
            </ol>
          </div>
        </>
      )}

      <div className="px-4 pb-4">
        <Text size="xs" tone="subtle">
          Started {run.startedAt}
        </Text>
      </div>
    </Card>
  )
}
