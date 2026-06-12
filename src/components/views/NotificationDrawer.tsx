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

const TYPE_ICON: Record<Notification['type'], React.ReactNode> = {
  pass: <CheckCircle size={14} color="#34d399" />,
  fail: <XCircle size={14} color="#f87171" />,
  warn: <AlertTriangle size={14} color="#fbbf24" />,
  info: <Info size={14} color="#60a5fa" />,
}

const TYPE_BG: Record<Notification['type'], string> = {
  pass: 'rgba(52,211,153,0.08)',
  fail: 'rgba(248,113,113,0.08)',
  warn: 'rgba(251,191,36,0.08)',
  info: 'rgba(96,165,250,0.08)',
}

const TYPE_BORDER: Record<Notification['type'], string> = {
  pass: 'rgba(52,211,153,0.18)',
  fail: 'rgba(248,113,113,0.18)',
  warn: 'rgba(251,191,36,0.18)',
  info: 'rgba(96,165,250,0.18)',
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
    setTimeout(() => onDismiss(n.id), 300)
  }

  return (
    <div style={{
      background: n.read ? 'transparent' : TYPE_BG[n.type],
      border: `1px solid ${n.read ? 'rgba(255,255,255,0.06)' : TYPE_BORDER[n.type]}`,
      borderRadius: 8,
      padding: '10px 12px',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      opacity: mounted && !leaving ? 1 : 0,
      transform: mounted && !leaving ? 'translateX(0)' : 'translateX(16px)',
      transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      position: 'relative',
    }}>
      {/* Unread dot */}
      {!n.read && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          width: 5,
          height: 5,
          borderRadius: '50%',
          backgroundColor: n.type === 'pass' ? '#34d399' : n.type === 'fail' ? '#f87171' : n.type === 'warn' ? '#fbbf24' : '#60a5fa',
        }} />
      )}

      <div style={{ marginTop: 1, flexShrink: 0, marginLeft: n.read ? 0 : 2 }}>
        {TYPE_ICON[n.type]}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: n.read ? 'rgba(255,255,255,0.55)' : '#fafafa' }}>
            {n.title}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
            {timeAgo(n.timestamp)}
          </span>
        </div>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.45 }}>
          {n.body}
        </p>
      </div>

      <button
        type="button"
        onClick={dismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 2,
          color: 'rgba(255,255,255,0.2)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={11} />
      </button>
    </div>
  )
}

export function NotificationDrawer({ open, notifications, onClose, onDismiss, onMarkAllRead }: NotificationDrawerProps) {
  const unread = notifications.filter((n) => !n.read).length

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 800,
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Drawer panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 340,
        zIndex: 900,
        backgroundColor: '#111111',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: open ? '-20px 0 60px rgba(0,0,0,0.6)' : 'none',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 16px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={14} color="rgba(255,255,255,0.5)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fafafa' }}>Notifications</span>
            {unread > 0 && (
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 999,
                backgroundColor: 'rgba(248,113,113,0.2)',
                color: '#f87171',
                border: '1px solid rgba(248,113,113,0.3)',
              }}>
                {unread}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {unread > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.3)',
                  padding: '2px 4px',
                }}
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                cursor: 'pointer',
                padding: '4px 6px',
                color: 'rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {notifications.length === 0 ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              paddingTop: 60,
            }}>
              <Bell size={28} color="rgba(255,255,255,0.1)" />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
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
            padding: '10px 16px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'center',
          }}>
            <button
              type="button"
              onClick={() => notifications.forEach((n) => onDismiss(n.id))}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 11,
                color: 'rgba(255,255,255,0.3)',
                padding: '5px 14px',
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </>
  )
}
