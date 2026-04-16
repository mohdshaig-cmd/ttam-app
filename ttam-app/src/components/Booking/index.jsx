import { useState } from 'react'
import { Check } from 'lucide-react'

/* ── TableGrid ──────────────────────────────────────────── */
export function TableGrid({ tables, selectedId, bookedTableIds = [], onSelect }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
      gap: 12, marginTop: '1rem',
    }}>
      {tables.map(table => {
        const isBooked = bookedTableIds.includes(table.id)
        const isSelected = selectedId === table.id
        return (
          <div
            key={table.id}
            onClick={() => !isBooked && onSelect(table)}
            style={{
              border: `2px solid ${isSelected ? '#1a6b1a' : isBooked ? '#ef9a9a' : '#c8e6c9'}`,
              borderRadius: 12, padding: '1rem',
              textAlign: 'center', cursor: isBooked ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              background: isSelected ? '#1a6b1a' : isBooked ? '#fff5f5' : '#f1f8f1',
              transform: isSelected ? 'translateY(-2px)' : 'none',
              boxShadow: isSelected ? '0 4px 16px rgba(26,107,26,0.25)' : 'none',
            }}
          >
            <div style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontSize: '1.5rem', fontWeight: 700,
              color: isSelected ? '#fff' : isBooked ? '#e57373' : '#1a6b1a',
            }}>
              T{table.number}
            </div>
            <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: isSelected ? 'rgba(255,255,255,0.85)' : isBooked ? '#e57373' : '#5a5a5a' }}>
              {isSelected ? '✓ Selected' : isBooked ? 'Occupied' : 'Available'}
            </div>
            {!isBooked && !isSelected && (
              <div style={{ fontSize: 10, marginTop: 2, color: '#6b6b6b' }}>
                MVR {table.hourly_rate_member}/hr
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── TimeSlots ──────────────────────────────────────────── */
const ALL_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00',
]

function fmt(t) {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`
}

export function TimeSlots({ selectedSlot, bookedSlots = [], onSelect }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
      gap: 8, marginTop: '0.75rem',
    }}>
      {ALL_SLOTS.map(slot => {
        const isBooked = bookedSlots.includes(slot)
        const isSelected = selectedSlot === slot
        return (
          <button
            key={slot}
            disabled={isBooked}
            onClick={() => onSelect(slot)}
            style={{
              padding: '9px 4px', border: `1px solid ${isSelected ? '#1a6b1a' : isBooked ? '#e0e0e0' : '#c8e6c9'}`,
              borderRadius: 8, fontSize: 13, fontWeight: 500,
              textAlign: 'center', cursor: isBooked ? 'not-allowed' : 'pointer',
              background: isSelected ? '#1a6b1a' : isBooked ? '#f9f9f9' : '#fff',
              color: isSelected ? '#fff' : isBooked ? '#bdbdbd' : '#2a2a2a',
              transition: 'all 0.15s', fontFamily: "'DM Sans',sans-serif",
              textDecoration: isBooked ? 'line-through' : 'none',
            }}
          >
            {fmt(slot)}
          </button>
        )
      })}
    </div>
  )
}

/* ── MiniCalendar ───────────────────────────────────────── */
export function MiniCalendar({ selected, onSelect, bookedDates = [] }) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date())
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const dayStr = (d) => {
    if (!d) return ''
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <button onClick={() => setViewDate(new Date(year, month - 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 8px', borderRadius: 6, color: '#5a5a5a' }}>‹</button>
        <strong style={{ fontSize: 14 }}>{monthName}</strong>
        <button onClick={() => setViewDate(new Date(year, month + 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: '4px 8px', borderRadius: 6, color: '#5a5a5a' }}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#9a9a9a', padding: '4px 0' }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          const str = dayStr(d)
          const isToday = str === today.toISOString().slice(0, 10)
          const isSelected = str === selected
          const hasBooking = bookedDates.includes(str)
          const isPast = d && new Date(str) < new Date(today.toISOString().slice(0, 10))
          return (
            <div
              key={i}
              onClick={() => d && !isPast && onSelect(str)}
              style={{
                textAlign: 'center', padding: '6px 2px', fontSize: 12,
                borderRadius: 6, cursor: d && !isPast ? 'pointer' : 'default',
                background: isSelected ? '#1a6b1a' : isToday ? '#e8f5e8' : hasBooking ? '#fff8e1' : 'transparent',
                color: isSelected ? '#fff' : isToday ? '#1a6b1a' : isPast ? '#d0d0d0' : d ? '#1a1a1a' : 'transparent',
                fontWeight: isToday || isSelected ? 600 : 400,
                transition: 'background 0.15s',
              }}
            >
              {d || ''}
            </div>
          )
        })}
      </div>
    </div>
  )
}


/* ── StepIndicator ──────────────────────────────────────── */
export function StepIndicator({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
      {steps.map((step, i) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'initial' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
              background: i < current ? '#e8f5e8' : i === current ? '#1a6b1a' : 'transparent',
              border: `2px solid ${i < current ? '#1a6b1a' : i === current ? '#1a6b1a' : '#d0d0d0'}`,
              color: i < current ? '#1a6b1a' : i === current ? '#fff' : '#9a9a9a',
            }}>
              {i < current ? <Check size={13} /> : i + 1}
            </div>
            <span style={{ fontSize: 13, fontWeight: i === current ? 600 : 400, color: i === current ? '#1a1a1a' : '#6b6b6b', whiteSpace: 'nowrap' }}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? '#1a6b1a' : '#e0e0e0', margin: '0 12px', transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ── BookingTypePicker ──────────────────────────────────── */
export function BookingTypePicker({ value, onChange, memberRate, guestRate }) {
  const types = [
    { value: 'member', label: 'Member Rate', desc: `MVR ${memberRate}/hr`, color: '#1a6b1a' },
    { value: 'guest', label: 'Guest Rate', desc: `MVR ${guestRate}/hr`, color: '#1565c0' },
    { value: 'training', label: 'Training Session', desc: 'Coaching included', color: '#6a1b9a' },
    { value: 'tournament', label: 'Tournament Practice', desc: 'Match prep', color: '#e65100' },
  ]
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '0.75rem' }}>
      {types.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          style={{
            padding: '10px 16px', border: `2px solid ${value === t.value ? t.color : '#e0e0e0'}`,
            borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            background: value === t.value ? `${t.color}12` : '#fff',
            color: value === t.value ? t.color : '#5a5a5a',
            fontFamily: "'DM Sans',sans-serif", transition: 'all 0.15s',
          }}
        >
          <div>{t.label}</div>
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{t.desc}</div>
        </button>
      ))}
    </div>
  )
}
