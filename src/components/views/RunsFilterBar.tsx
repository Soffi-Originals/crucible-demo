import * as React from 'react'
import { Search, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Input } from '@/components/ui/Input'
import { Text } from '@/components/ui/Text'
import type { RunStatus } from '@/components/views/RunRow'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RunsFilters = {
  search: string
  agents: string[]
  statuses: RunStatus[]
}

export const AGENT_OPTIONS = ['Navigator', 'Explorer', 'Pioneer', 'Voyager'] as const
export const STATUS_OPTIONS: RunStatus[] = ['passed', 'running', 'failed', 'cancelled', 'queued']

const STATUS_LABELS: Record<RunStatus, string> = {
  passed: 'Passed',
  running: 'Running',
  failed: 'Failed',
  cancelled: 'Cancelled',
  queued: 'Queued',
}

// ─── Multi-select dropdown ─────────────────────────────────────────────────────

interface MultiSelectProps {
  label: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
}

function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  // Close on outside click
  React.useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    )
  }

  const activeCount = selected.length

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-9 items-center gap-1.5 rounded-(--radius-md) border px-3 text-sm transition-colors',
          'bg-(--color-surface) text-(--color-fg) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-border-focus)',
          activeCount > 0
            ? 'border-(--color-accent) text-(--color-accent)'
            : 'border-(--color-border) hover:border-(--color-border-strong)',
        )}
      >
        <span>{label}</span>
        {activeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-(--color-accent) px-1 text-xs font-medium text-(--color-fg-on-accent)">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[160px] rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) shadow-(--shadow-md) overflow-hidden">
          {options.map((opt) => {
            const checked = selected.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left',
                  'hover:bg-(--color-surface-subtle)',
                  checked ? 'text-(--color-fg)' : 'text-(--color-fg-muted)',
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                    checked
                      ? 'border-(--color-accent) bg-(--color-accent)'
                      : 'border-(--color-border)',
                  )}
                >
                  {checked && (
                    <svg viewBox="0 0 10 8" className="h-2.5 w-2.5" fill="none">
                      <path
                        d="M1 4l2.5 2.5L9 1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-(--color-fg-on-accent)"
                      />
                    </svg>
                  )}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Filter chip ───────────────────────────────────────────────────────────────

interface ChipProps {
  label: string
  onRemove: () => void
}

function FilterChip({ label, onRemove }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-(--radius-full) border border-(--color-border) bg-(--color-surface-subtle) py-0.5 pl-2.5 pr-1.5 text-xs text-(--color-fg-muted)">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors hover:bg-(--color-surface-muted) focus-visible:outline-none"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  )
}

// ─── RunsFilterBar ─────────────────────────────────────────────────────────────

export interface RunsFilterBarProps {
  filters: RunsFilters
  totalCount: number
  filteredCount: number
  onSearchChange: (value: string) => void
  onAgentsChange: (agents: string[]) => void
  onStatusesChange: (statuses: RunStatus[]) => void
  onClearAll: () => void
}

export function RunsFilterBar({
  filters,
  totalCount,
  filteredCount,
  onSearchChange,
  onAgentsChange,
  onStatusesChange,
  onClearAll,
}: RunsFilterBarProps) {
  const hasActiveFilters =
    filters.search.length > 0 ||
    filters.agents.length > 0 ||
    filters.statuses.length > 0

  const chips: { key: string; label: string; onRemove: () => void }[] = [
    ...filters.agents.map((a) => ({
      key: `agent:${a}`,
      label: a,
      onRemove: () => onAgentsChange(filters.agents.filter((x) => x !== a)),
    })),
    ...filters.statuses.map((s) => ({
      key: `status:${s}`,
      label: STATUS_LABELS[s],
      onRemove: () => onStatusesChange(filters.statuses.filter((x) => x !== s)),
    })),
  ]

  return (
    <div className="flex flex-col gap-2">
      {/* Search + dropdowns row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--color-fg-subtle)" />
          <Input
            variant="default"
            size="md"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search scenarios…"
            className="pl-8"
          />
        </div>

        {/* Dropdowns */}
        <MultiSelect
          label="Agent"
          options={AGENT_OPTIONS}
          selected={filters.agents}
          onChange={onAgentsChange}
        />
        <MultiSelect
          label="Status"
          options={STATUS_OPTIONS.map((s) => STATUS_LABELS[s])}
          selected={filters.statuses.map((s) => STATUS_LABELS[s])}
          onChange={(labels) =>
            onStatusesChange(
              labels.map(
                (l) =>
                  (Object.entries(STATUS_LABELS).find(
                    ([, v]) => v === l,
                  )?.[0] as RunStatus) ?? 'passed',
              ),
            )
          }
        />

        {/* Result count */}
        <Text size="xs" tone="subtle" className="ml-auto shrink-0 tabular-nums">
          {hasActiveFilters
            ? `Showing ${filteredCount} of ${totalCount}`
            : `${totalCount} runs`}
        </Text>
      </div>

      {/* Chips row */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
          ))}
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-(--color-fg-subtle) underline-offset-2 hover:underline focus-visible:outline-none"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
