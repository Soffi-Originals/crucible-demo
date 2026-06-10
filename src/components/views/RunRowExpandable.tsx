import * as React from 'react'
import { ChevronRight, CheckCircle2, XCircle, Circle, Cpu } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'
import { RunRow, type RunRowProps } from './RunRow'
import type { RunDetail } from '@/data/demo'

export interface RunRowExpandableProps extends RunRowProps {
  detail?: RunDetail
}

export function RunRowExpandable({ detail, ...rowProps }: RunRowExpandableProps) {
  const [open, setOpen] = React.useState(false)
  const hasDetail = !!detail

  return (
    <div>
      <div
        className="relative"
        onClick={() => hasDetail && setOpen((o) => !o)}
      >
        <RunRow
          {...rowProps}
          interactive={hasDetail ? true : false}
          className={cn(
            hasDetail && 'cursor-pointer',
            open && 'bg-(--color-surface-subtle)',
          )}
        />
        {hasDetail && (
          <span
            className={cn(
              'pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-(--color-fg-muted) transition-transform duration-200',
              open && 'rotate-90',
            )}
          >
            <ChevronRight className="h-3 w-3" />
          </span>
        )}
      </div>

      {open && detail && (
        <div className="border-t border-(--color-border-subtle) bg-(--color-canvas) px-4 py-4">
          <div className="ml-8 flex flex-col gap-5">
            {/* Summary */}
            <Text size="sm" tone="muted" className="leading-5 max-w-prose">
              {detail.summary}
            </Text>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_auto]">
              {/* Tool calls */}
              {detail.toolCalls.length > 0 && (
                <div className="flex flex-col gap-2">
                  <Text size="xs" weight="medium" tone="subtle" className="uppercase tracking-wide">
                    Tool calls
                  </Text>
                  <div className="flex flex-col gap-1.5">
                    {detail.toolCalls.map((call, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-surface) px-3 py-2"
                      >
                        <span className={cn('mt-0.5 shrink-0', call.ok ? 'text-(--color-success)' : 'text-(--color-danger)')}>
                          {call.ok
                            ? <CheckCircle2 className="h-3.5 w-3.5" />
                            : <XCircle className="h-3.5 w-3.5" />
                          }
                        </span>
                        <div className="min-w-0 flex flex-col gap-0.5">
                          <div className="flex flex-wrap items-baseline gap-1.5">
                            <Text size="xs" weight="medium" family="mono">
                              {call.tool}
                            </Text>
                            <Text size="xs" tone="subtle" family="mono" truncate>
                              {call.args}
                            </Text>
                          </div>
                          <Text size="xs" tone="muted">
                            {call.result}
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Right column: evals + model */}
              <div className="flex flex-col gap-4 sm:min-w-[200px]">
                {/* Evals */}
                {detail.evals.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <Text size="xs" weight="medium" tone="subtle" className="uppercase tracking-wide">
                      Evals
                    </Text>
                    <div className="flex flex-col gap-1.5">
                      {detail.evals.map((ev) => (
                        <div key={ev.name} className="flex items-center gap-2">
                          <span className={cn('shrink-0', ev.passed ? 'text-(--color-success)' : 'text-(--color-danger)')}>
                            {ev.passed
                              ? <CheckCircle2 className="h-3.5 w-3.5" />
                              : <XCircle className="h-3.5 w-3.5" />
                            }
                          </span>
                          <Text size="xs" tone="muted" truncate>
                            {ev.name}
                          </Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Model + tokens */}
                <div className="flex flex-col gap-2">
                  <Text size="xs" weight="medium" tone="subtle" className="uppercase tracking-wide">
                    Model
                  </Text>
                  <div className="flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-(--color-fg-muted)" />
                    <Text size="xs" tone="muted" family="mono">
                      {detail.model}
                    </Text>
                    <span className="text-(--color-border)">·</span>
                    <Text size="xs" tone="subtle">
                      {detail.tokens.toLocaleString()} tok
                    </Text>
                  </div>
                </div>

                {/* No evals yet */}
                {detail.evals.length === 0 && rowProps.status === 'running' && (
                  <div className="flex items-center gap-1.5">
                    <Circle className="h-3 w-3 text-(--color-fg-subtle) animate-pulse" />
                    <Text size="xs" tone="subtle">Evals pending</Text>
                  </div>
                )}
              </div>
            </div>

            {/* Footer badges */}
            <div className="flex items-center gap-2 border-t border-(--color-border-subtle) pt-3">
              <Badge variant="neutral" size="sm">
                {rowProps.runId}
              </Badge>
              {detail.evals.length > 0 && (
                <Badge
                  variant={detail.evals.every((e) => e.passed) ? 'success' : 'danger'}
                  size="sm"
                >
                  {detail.evals.filter((e) => e.passed).length}/{detail.evals.length} evals passed
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
