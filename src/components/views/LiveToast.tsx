import * as React from 'react'

export interface ToastItem {
  id: string
  message: string
  passed: boolean
  timestamp: number
}

interface LiveToastProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export function LiveToast({ toasts, onDismiss }: LiveToastProps) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column-reverse',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.slice(0, 4).map((toast) => (
        <ToastBubble key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastBubble({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = React.useState(false)
  const [leaving, setLeaving] = React.useState(false)

  React.useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 20)
    const t2 = setTimeout(() => {
      setLeaving(true)
      setTimeout(() => onDismiss(toast.id), 350)
    }, 3800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [toast.id, onDismiss])

  const borderColor = toast.passed ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'
  const glowColor = toast.passed ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)'

  return (
    <div
      style={{
        pointerEvents: 'auto',
        backgroundColor: '#1c1c1c',
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: '10px 14px',
        minWidth: 240,
        maxWidth: 320,
        boxShadow: `0 4px 20px rgba(0,0,0,0.5), inset 0 0 0 1px ${glowColor}`,
        opacity: visible && !leaving ? 1 : 0,
        transform: visible && !leaving ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.96)',
        transition: leaving
          ? 'opacity 350ms ease, transform 350ms ease'
          : 'opacity 280ms cubic-bezier(0.34,1.56,0.64,1), transform 280ms cubic-bezier(0.34,1.56,0.64,1)',
        cursor: 'pointer',
      }}
      onClick={() => { setLeaving(true); setTimeout(() => onDismiss(toast.id), 350) }}
    >
      <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
        {toast.message}
      </p>
    </div>
  )
}
