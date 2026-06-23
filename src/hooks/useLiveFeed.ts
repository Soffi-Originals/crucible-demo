import * as React from 'react'
import { runHistory, type RunRecord } from '@/data/runHistory'

export type SpeedSetting = '1x' | '2x' | 'ludicrous'

const SPEED_MS: Record<SpeedSetting, number> = {
  '1x': 1800,
  '2x': 900,
  ludicrous: 300,
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Stamp a run so it looks like it just happened within the last 120 seconds.
 * Runs are placed in the recent 120s window proportionally so the time series
 * fills up naturally as the feed progresses.
 */
function stampRun(run: RunRecord, seqId: number, totalSoFar: number): RunRecord {
  const nowMs = Date.now()
  // Spread arrivals across the last 120 seconds so the chart fills consistently
  // Earlier runs in the session get older timestamps; newer runs cluster near now.
  const maxJitterMs = 120 * 1000
  const jitterMs = Math.max(0, maxJitterMs - (totalSoFar % 120) * 1000 - Math.random() * 2000)
  const startedAtMs = nowMs - jitterMs

  const relSec = Math.round(jitterMs / 1000)
  const startedAt = relSec < 5 ? 'just now' : `${relSec}s ago`

  return {
    ...run,
    runId: `run_live_${seqId.toString().padStart(4, '0')}`,
    startedAtMs,
    startedAt,
  }
}

export interface LiveFeedState {
  arrived: RunRecord[]
  isPlaying: boolean
  speed: SpeedSetting
  isLudicrous: boolean
  togglePlay: () => void
  setSpeed: (s: SpeedSetting) => void
}

export function useLiveFeed(): LiveFeedState {
  const [arrived, setArrived] = React.useState<RunRecord[]>([])
  const [isPlaying, setIsPlaying] = React.useState(true)
  const [speed, setSpeed] = React.useState<SpeedSetting>('1x')

  const poolRef = React.useRef<RunRecord[]>([])
  const poolIdxRef = React.useRef(0)
  const seqRef = React.useRef(0)

  React.useEffect(() => {
    poolRef.current = shuffle(runHistory)
    poolIdxRef.current = 0
  }, [])

  React.useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      const pool = poolRef.current
      if (pool.length === 0) return

      const idx = poolIdxRef.current % pool.length
      const base = pool[idx]
      poolIdxRef.current++
      seqRef.current++

      const run = stampRun(base, seqRef.current, seqRef.current)
      setArrived((prev) => [run, ...prev].slice(0, 300))
    }, SPEED_MS[speed])

    return () => clearInterval(interval)
  }, [isPlaying, speed])

  return {
    arrived,
    isPlaying,
    speed,
    isLudicrous: speed === 'ludicrous',
    togglePlay: () => setIsPlaying((p) => !p),
    setSpeed,
  }
}
