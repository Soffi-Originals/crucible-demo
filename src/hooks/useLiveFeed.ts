import * as React from 'react'
import { runHistory, type RunRecord } from '@/data/runHistory'

export type SpeedSetting = '1x' | '2x' | 'ludicrous'

const SPEED_MS: Record<SpeedSetting, number> = {
  '1x': 1800,
  '2x': 900,
  ludicrous: 300,
}

// Pool to draw from — shuffle once
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Stamp a run with a fresh "just arrived" time so heatmap cell is today
function stampRun(run: RunRecord, seqId: number): RunRecord {
  const nowMs = Date.now()
  const jitter = Math.floor(Math.random() * 60 * 60 * 1000) // up to 1h ago
  return {
    ...run,
    runId: `run_live_${seqId.toString().padStart(4, '0')}`,
    startedAtMs: nowMs - jitter,
    startedAt: jitter < 60_000 ? 'just now' : `${Math.floor(jitter / 60_000)} min ago`,
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

  // Stable pool ref — cycle through shuffled history indefinitely
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
      setArrived((prev) => [run, ...prev].slice(0, 200)) // cap at 200
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
