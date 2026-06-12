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
 * Stamp a run with a "just arrived" time within the past 60 minutes
 * so the time-series chart always shows recent activity.
 * We spread arrivals realistically — newer runs cluster near "now",
 * older ones fill the past hour.
 */
function stampRun(run: RunRecord, seqId: number): RunRecord {
  const nowMs = Date.now()
  // Jitter 0–55 min back so the 60-min time-series always has content
  const jitterMs = Math.floor(Math.random() * 55 * 60 * 1000)
  const startedAtMs = nowMs - jitterMs

  const relMin = Math.floor(jitterMs / 60_000)
  const startedAt = relMin < 1 ? 'just now' : `${relMin}m ago`

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

      const run = stampRun(base, seqRef.current)
      setArrived((prev) => [run, ...prev].slice(0, 200))
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
