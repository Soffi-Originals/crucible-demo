import * as React from 'react'
import { X, Bell, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

export interface Notification {
  id: string
  type: 'pass' | 'fail' | 'warn' | 'info'
  title: string
  body: string
  timestamp: number
  read: boolean
}

interface NotificationDrawerProps {
  open: boolean
  notifications: Notification[]
  onClose: () => void
  onDismiss: (id: string) => void
  onMarkAllRead: () => void
}

const TYPE_COLOR: Record<Notification['type'], string> = {
  pass: '#34d399',
  fail: '#f87171',
  warn: '#fbbf24',
  info: '#60a5fa',
}
const TYPE_BG: Record<Notification['type'], string> = {
  pass: 'rgba(52,211,153,0.07)',
  fail: 'rgba(248,113,113,0.07)',
  warn: 'rgba(251,191,36,0.07)',
  info: 'rgba(96,165,250,0.07)',
}
const TYPE_BORDER: Record<Notification['type'], string> = {
  pass: 'rgba(52,211,153,0.2)',
  fail: 'rgba(248,113,113,0.2)',
  warn: 'rgba(251,191,36,0.2)',
  info: 'rgba(96,165,250,0.2)',
}
const TYPE_ICON: Record<Notification['type'], React.ReactNode> = {
  pass: <CheckCircle size={13} />,
  fail: <XCircle size={13} />,
  warn: <AlertTriangle size={13} />,
  info: <Info size={13} />,
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 10_000) return 'just now'
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  return `${Math.floor(diff / 3_600_000)}h ago`
}

function NotificationItem({ n, onDismiss }: { n: Notification; onDismiss: (id: string) => void }) {
  const [mounted, setMounted] = React.useState(false)
  const [leaving, setLeaving] = React.useState(false)

  React.useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const dismiss = () => {
    setLeaving(true)
    setTimeout(() => onDismiss(n.id), 280)
  }

  const color = TYPE_COLOR[n.type]

  return (
    <div style={{
      background: n.read ? 'rgba(255,255,255,0.02)' : TYPE_BG[n.type],
      border: `1px solid ${n.read ? 'rgba(255,255,255,0.05)' : TYPE_BORDER[n.type]}`,
      borderRadius: 10,
      padding: '10px 12px',
      display: 'flex', gap: 10, alignItems: 'flex-start',
      opacity: mounted && !leaving ? 1 : 0,
      transform: mounted && !leaving ? 'translateX(0) scale(1)' : 'translateX(12px) scale(0.97)',
      transition: 'opacity 0.25s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      position: 'relative',
      boxShadow: n.read ? 'none' : `0 0 16px ${color}15`,
    }}>
      {!n.read && (
        <div style={{
          position: 'absolute', top: -2, right: -2, width: 8, height: 8,
          borderRadius: '50%', backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
          border: '1.5px solid #111',
        }} />
      )}

      <div style={{ color, flexShrink: 0, marginTop: 1, opacity: n.read ? 0.5 : 1 }}>
        {TYPE_ICON[n.type]}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: n.read ? 'rgba(255,255,255,0.45)' : '#f0f0f0', letterSpacing: '-0.01em' }}>
            {n.title}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
            {timeAgo(n.timestamp)}
          </span>
        </div>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 }}>
          {n.body}
        </p>
      </div>

      <button type="button" onClick={dismiss} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 2,
        color: 'rgba(255,255,255,0.2)', flexShrink: 0, display: 'flex', alignItems: 'center',
        borderRadius: 4, transition: 'color 0.15s',
      }}>
        <X size={11} />
      </button>
    </div>
  )
}

export function NotificationDrawer({ open, notifications, onClose, onDismiss, onMarkAllRead }: NotificationDrawerProps) {
  const unread = notifications.filter((n) => !n.read).length

  return (
    <>
      {open && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, zIndex: 800,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }} />
      )}

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 360, zIndex: 900,
        background: 'linear-gradient(180deg, rgba(14,14,20,0.98) 0%, rgba(10,10,15,0.99) 100%)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: open ? '-32px 0 80px rgba(0,0,0,0.7)' : 'none',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={14} color={unread > 0 ? '#f87171' : 'rgba(255,255,255,0.4)'} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fafafa', letterSpacing: '-0.02em' }}>Notifications</span>
            {unread > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 999,
                background: 'rgba(248,113,113,0.15)', color: '#f87171',
                border: '1px solid rgba(248,113,113,0.3)',
                boxShadow: '0 0 8px rgba(248,113,113,0.2)',
              }}>
                {unread}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {unread > 0 && (
              <button type="button" onClick={onMarkAllRead} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: 'rgba(255,255,255,0.3)', padding: '2px 4px',
                fontFamily: 'inherit', fontWeight: 500, transition: 'color 0.15s',
              }}>
                Mark all read
              </button>
            )}
            <button type="button" onClick={onClose} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 7, cursor: 'pointer', padding: '5px 7px',
              color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center',
              transition: 'all 0.15s',
            }}>
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {notifications.length === 0 ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bell size={22} color="rgba(255,255,255,0.15)" />
              </div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 1.6 }}>
                No notifications yet.<br />Runs will appear here as they land.
              </span>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem key={n.id} n={n} onDismiss={onDismiss} />
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div style={{
            padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', justifyContent: 'center', flexShrink: 0,
          }}>
            <button type="button" onClick={() => notifications.forEach((n) => onDismiss(n.id))} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,0.3)',
              padding: '6px 18px', fontFamily: 'inherit', fontWeight: 500, transition: 'all 0.15s',
            }}>
              Clear all
            </button>
          </div>
        )}
      </div>
    </>
  )
}
