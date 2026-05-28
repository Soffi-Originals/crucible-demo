export type PassRatePoint = {
  label: string
  value: number
}

// 14 days of eval pass rate, ending at today's 94.2%
export const passRateHistory: PassRatePoint[] = [
  { label: 'Jun 16', value: 91.4 },
  { label: 'Jun 17', value: 90.8 },
  { label: 'Jun 18', value: 92.1 },
  { label: 'Jun 19', value: 91.7 },
  { label: 'Jun 20', value: 92.9 },
  { label: 'Jun 21', value: 91.3 },
  { label: 'Jun 22', value: 93.0 },
  { label: 'Jun 23', value: 93.5 },
  { label: 'Jun 24', value: 92.8 },
  { label: 'Jun 25', value: 93.1 },
  { label: 'Jun 26', value: 93.6 },
  { label: 'Jun 27', value: 92.7 },
  { label: 'Jun 28', value: 93.8 },
  { label: 'Jun 29', value: 94.2 },
]
