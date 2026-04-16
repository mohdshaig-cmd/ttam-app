import { X } from 'lucide-react'

/* ── Badge ──────────────────────────────────────────────── */
const badgeStyles = {
  green:  { background: '#e8f5e9', color: '#2e7d32' },
  red:    { background: '#ffebee', color: '#c62828' },
  yellow: { background: '#fff8e1', color: '#f57f17' },
  blue:   { background: '#e3f2fd', color: '#1565c0' },
  purple: { background: '#f3e5f5', color: '#6a1b9a' },
  gray:   { background: '#f4f4f4', color: '#5a5a5a' },
  teal:   { background: '#e0f2f1', color: '#00695c' },
}

export function Badge({ variant = 'gray', children, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.3px',
      ...badgeStyles[variant],
      ...style,
    }}>
      {children}
    </span>
  )
}

/* ── Card ────────────────────────────────────────────────── */
export function Card({ children, style, className }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      border: '1px solid rgba(0,0,0,0.08)',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      ...style,
    }} className={className}>
      {children}
    </div>
  )
}

export function CardTitle({ children }) {
  return (
    <div style={{
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: 12, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.5px',
      color: '#6b6b6b', marginBottom: '0.75rem',
    }}>
      {children}
    </div>
  )
}

/* ── Button ─────────────────────────────────────────────── */
const btnBase = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '9px 18px', borderRadius: 8,
  fontSize: 14, fontWeight: 500, cursor: 'pointer',
  border: 'none', transition: 'all 0.15s',
  fontFamily: "'DM Sans', sans-serif",
  textDecoration: 'none',
}

const btnVariants = {
  primary:  { background: '#1a6b1a', color: '#fff' },
  outline:  { background: 'transparent', color: '#1a6b1a', border: '1px solid #1a6b1a' },
  ghost:    { background: 'transparent', color: '#6b6b6b', border: '1px solid rgba(0,0,0,0.12)' },
  danger:   { background: '#c62828', color: '#fff' },
  secondary:{ background: '#f4f4f4', color: '#2a2a2a', border: '1px solid rgba(0,0,0,0.08)' },
}

const btnSizes = {
  sm: { padding: '6px 12px', fontSize: 13 },
  md: {},
  lg: { padding: '12px 24px', fontSize: 15 },
  icon: { padding: 8, borderRadius: 8 },
}

export function Button({ variant = 'primary', size = 'md', children, style, fullWidth, ...props }) {
  return (
    <button style={{
      ...btnBase,
      ...btnVariants[variant],
      ...btnSizes[size],
      ...(fullWidth ? { width: '100%', justifyContent: 'center' } : {}),
      ...style,
    }} {...props}>
      {children}
    </button>
  )
}

/* ── Modal ──────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, maxWidth = 520 }) {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 300, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, padding: '2rem',
          maxWidth, width: '100%', maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          animation: 'modalIn 0.2s ease',
        }}
      >
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', fontWeight: 700 }}>{title}</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6b6b6b', display: 'flex' }}>
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px) } to { opacity:1; transform:scale(1) translateY(0) } }`}</style>
    </div>
  )
}

/* ── Alert ──────────────────────────────────────────────── */
const alertStyles = {
  success: { background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' },
  warning: { background: '#fff8e1', color: '#f57f17', border: '1px solid #ffe082' },
  info:    { background: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9' },
  error:   { background: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a' },
}

export function Alert({ variant = 'info', children, style }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 8,
      fontSize: 14, ...alertStyles[variant], ...style,
    }}>
      {children}
    </div>
  )
}

/* ── Form elements ──────────────────────────────────────── */
const inputStyle = {
  width: '100%', padding: '10px 14px',
  border: '1px solid #d0d0d0', borderRadius: 8,
  fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  color: '#1a1a1a', background: '#fff',
  outline: 'none', transition: 'border 0.15s',
}

export function Input({ label, hint, error, style, ...props }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6b6b6b', marginBottom: 6 }}>{label}</label>}
      <input
        style={{ ...inputStyle, ...(error ? { borderColor: '#c62828' } : {}), ...style }}
        onFocus={e => e.target.style.borderColor = '#1a6b1a'}
        onBlur={e => e.target.style.borderColor = error ? '#c62828' : '#d0d0d0'}
        {...props}
      />
      {hint && <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 4 }}>{hint}</div>}
      {error && <div style={{ fontSize: 12, color: '#c62828', marginTop: 4 }}>{error}</div>}
    </div>
  )
}

export function Select({ label, hint, error, children, style, ...props }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6b6b6b', marginBottom: 6 }}>{label}</label>}
      <select style={{ ...inputStyle, ...style }} {...props}>{children}</select>
      {hint && <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

export function Textarea({ label, hint, style, ...props }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6b6b6b', marginBottom: 6 }}>{label}</label>}
      <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 90, ...style }} {...props} />
      {hint && <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

/* ── Progress ───────────────────────────────────────────── */
export function ProgressBar({ value, max = 100, style }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3, overflow: 'hidden', ...style }}>
      <div style={{ height: '100%', width: `${pct}%`, background: '#1a6b1a', borderRadius: 3, transition: 'width 0.4s' }} />
    </div>
  )
}

/* ── Stat card ──────────────────────────────────────────── */
export function StatCard({ label, value, change, changeUp, accent }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '1.25rem',
      border: '1px solid rgba(0,0,0,0.08)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      ...(accent ? { borderLeft: '3px solid #1a6b1a' } : {}),
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b6b6b', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{value}</div>
      {change && (
        <div style={{ fontSize: 12, marginTop: 6, color: changeUp ? '#2e7d32' : '#c62828' }}>{change}</div>
      )}
    </div>
  )
}

/* ── Avatar ─────────────────────────────────────────────── */
export function Avatar({ initials, size = 40, color = '#1a6b1a', style }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#fff',
      fontSize: size * 0.35, fontWeight: 600,
      flexShrink: 0, ...style,
    }}>
      {initials}
    </div>
  )
}

/* ── Tabs ────────────────────────────────────────────────── */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 4, background: '#f4f4f4',
      padding: 4, borderRadius: 8, width: 'fit-content',
      marginBottom: '1.5rem',
    }}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          style={{
            padding: '8px 16px', borderRadius: 6,
            border: 'none', fontSize: 14, fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.15s',
            fontFamily: "'DM Sans', sans-serif",
            background: active === tab.value ? '#fff' : 'transparent',
            color: active === tab.value ? '#1a1a1a' : '#6b6b6b',
            boxShadow: active === tab.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────────── */
export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: '#6b6b6b', fontSize: 14, marginBottom: '1.5rem' }}>{description}</p>
      {action}
    </div>
  )
}

/* ── Loading spinner ─────────────────────────────────────── */
export function Spinner({ size = 24 }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
      <div style={{
        width: size, height: size,
        border: `2px solid #e8e8e8`,
        borderTopColor: '#1a6b1a',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

/* ── Section divider ─────────────────────────────────────── */
export function SectionDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: '#6b6b6b', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.08)' }} />
    </div>
  )
}
