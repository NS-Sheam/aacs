'use client'

import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ─── Single Toast Item ────────────────────────────────────────────────────────

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Mount animation
    requestAnimationFrame(() => setVisible(true))
    // Auto-dismiss after 4 s
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(toast.id), 350)
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle size={18} />,
    error: <XCircle size={18} />,
    info: <Info size={18} />,
  }

  const colors: Record<ToastType, string> = {
    success: 'var(--toast-success)',
    error: 'var(--toast-error)',
    info: 'var(--toast-info)',
  }

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        borderRadius: '10px',
        background: '#1a1a2e',
        border: `1px solid ${colors[toast.type]}44`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${colors[toast.type]}22`,
        color: '#e2e8f0',
        fontSize: '14px',
        fontWeight: 500,
        minWidth: '280px',
        maxWidth: '400px',
        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(40px) scale(0.95)',
        pointerEvents: 'all',
      }}
    >
      <span style={{ color: colors[toast.type], flexShrink: 0 }}>{icons[toast.type]}</span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(() => onRemove(toast.id), 350)
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
          borderRadius: '4px',
          flexShrink: 0,
          transition: 'color 0.15s',
        }}
        onMouseOver={e => ((e.currentTarget as HTMLElement).style.color = '#e2e8f0')}
        onMouseOut={e => ((e.currentTarget as HTMLElement).style.color = '#64748b')}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <style>{`
        :root {
          --toast-success: #22c55e;
          --toast-error:   #ef4444;
          --toast-info:    #6366f1;
        }
      `}</style>
      {children}
      {/* Toast container */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 99999,
          pointerEvents: 'none',
          alignItems: 'flex-end',
        }}
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
