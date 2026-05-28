import * as React from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { Heading } from '@/components/ui/Heading'
import { passRateHistory } from '@/data/passRateHistory'

const CHART_W = 400
const CHART_H = 64
const PADDING_X = 4
const PADDING_Y = 6

function buildPath(points: { x: number; y: number }[]): string {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')
}

function buildAreaPath(points: { x: number; y: number }[]): string {
  const line = buildPath(points)
  const last = points[points.length - 1]
  const first = points[0]
  return `${line} L ${last.x.toFixed(2)} ${CHART_H} L ${first.x.toFixed(2)} ${CHART_H} Z`
}

export function PassRateChart() {
  const data = passRateHistory
  const latest = data[data.length - 1]
  const first = data[0]
  const delta = (latest.value - first.value).toFixed(1)
  const isPositive = latest.value >= first.value

  const minVal = Math.min(...data.map((d) => d.value)) - 1
  const maxVal = Math.max(...data.map((d) => d.value)) + 1

  const chartPoints = data.map((d, i) => {
    const x = PADDING_X + (i / (data.length - 1)) * (CHART_W - PADDING_X * 2)
    const y =
      PADDING_Y +
      (1 - (d.value - minVal) / (maxVal - minVal)) * (CHART_H - PADDING_Y * 2)
    return { x, y, ...d }
  })

  const linePath = buildPath(chartPoints)
  const areaPath = buildAreaPath(chartPoints)

  const lastPoint = chartPoints[chartPoints.length - 1]

  return (
    <Card variant="default" padding="md" radius="lg" className="flex flex-col gap-3">
      <Text size="xs" tone="muted" weight="medium" className="uppercase tracking-wide">
        Eval pass rate
      </Text>

      <div className="flex items-baseline gap-2">
        <Heading as="div" size="2xl" weight="semibold">
          {latest.value.toFixed(1)}
        </Heading>
        <Text size="sm" tone="muted">%</Text>
        <div
          className="ml-auto flex items-center gap-1"
          style={{ color: 'var(--color-success-fg)' }}
        >
          <ArrowUpRight className="h-3 w-3" />
          <Text size="xs" weight="medium" className="text-current">
            +{delta} vs. 2 weeks ago
          </Text>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        preserveAspectRatio="none"
        className="h-16 w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="pass-rate-fill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={isPositive ? 'var(--color-success)' : 'var(--color-danger)'}
              stopOpacity="0.18"
            />
            <stop
              offset="100%"
              stopColor={isPositive ? 'var(--color-success)' : 'var(--color-danger)'}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#pass-rate-fill)"
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={isPositive ? 'var(--color-success)' : 'var(--color-danger)'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* End-point dot */}
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="3"
          fill={isPositive ? 'var(--color-success)' : 'var(--color-danger)'}
        />
      </svg>

      <div className="flex items-center justify-between">
        <Text size="xs" tone="subtle">{data[0].label}</Text>
        <Text size="xs" tone="subtle">{data[data.length - 1].label}</Text>
      </div>
    </Card>
  )
}
