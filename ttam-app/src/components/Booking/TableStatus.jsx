import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Real-time table availability viewer
 * Subscribes to bookings changes and shows live status
 */
export function TableStatusGrid({ date, onSelectTable, selectedId }) {
  const [tables, setTables] = useState([])
  const [occupiedIds, setOccupiedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const targetDate = date || new Date().toISOString().slice(0, 10)
  const currentTime = new Date().toTimeString().slice(0, 5)

  useEffect(() => {
    // Fetch all tables
    supabase.from('tables').select('*').eq('status', 'available').order('number').then(({ data }) => {
      if (data) setTables(data)
    })
  }, [])

  useEffect(() => {
    if (tables.length === 0) return

    const fetchOccupied = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('table_id')
        .eq('booking_date', targetDate)
        .neq('status', 'cancelled')
        .lte('start_time', currentTime)
        .gte('end_time', currentTime)

      setOccupiedIds(new Set((data || []).map(b => b.table_id)))
      setLoading(false)
    }

    fetchOccupied()

    // Real-time subscription
    const channel = supabase
      .channel(`table-status-${targetDate}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `booking_date=eq.${targetDate}`,
      }, () => {
        fetchOccupied()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [tables, targetDate, currentTime])

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ height: 80, background: '#f4f4f4', borderRadius: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: 12, color: '#6b6b6b', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: '#c8e6c9', display: 'inline-block' }} /> Available
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: '#ef9a9a', display: 'inline-block' }} /> Occupied now
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: '#1a6b1a', display: 'inline-block' }} /> Selected
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11 }}>
          🔴 Live · Updates in real-time
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
        {tables.map(table => {
          const isOccupied = occupiedIds.has(table.id)
          const isSelected = selectedId === table.id

          return (
            <div
              key={table.id}
              onClick={() => !isOccupied && onSelectTable?.(table)}
              style={{
                border: `2px solid ${isSelected ? '#1a6b1a' : isOccupied ? '#ef9a9a' : '#c8e6c9'}`,
                borderRadius: 12,
                padding: '1rem 0.75rem',
                textAlign: 'center',
                cursor: isOccupied ? 'not-allowed' : 'pointer',
                background: isSelected ? '#1a6b1a' : isOccupied ? '#fff5f5' : '#f1f8f1',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                boxShadow: isSelected ? '0 6px 20px rgba(26,107,26,0.25)' : 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {/* Live indicator dot */}
              <span style={{
                position: 'absolute',
                top: 8, right: 8,
                width: 8, height: 8,
                borderRadius: '50%',
                background: isOccupied ? '#e53935' : '#4caf50',
                animation: 'blink 2s ease-in-out infinite',
              }} />

              <div style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: '1.6rem',
                fontWeight: 700,
                color: isSelected ? '#fff' : isOccupied ? '#e57373' : '#1a6b1a',
                lineHeight: 1,
              }}>
                T{table.number}
              </div>

              <div style={{
                fontSize: 11, marginTop: 6, fontWeight: 600,
                color: isSelected ? 'rgba(255,255,255,0.9)' : isOccupied ? '#e57373' : '#2e7d32',
              }}>
                {isSelected ? '✓ Selected' : isOccupied ? 'In Use' : 'Free'}
              </div>

              {!isOccupied && !isSelected && (
                <div style={{ fontSize: 10, marginTop: 4, color: '#6b6b6b' }}>
                  MVR {table.hourly_rate_member}/hr
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}

/**
 * Compact table status strip for dashboard
 */
export function TableStatusStrip({ onBookClick }) {
  const [tables, setTables] = useState([])
  const [occupiedIds, setOccupiedIds] = useState(new Set())
  const today = new Date().toISOString().slice(0, 10)
  const now = new Date().toTimeString().slice(0, 5)

  useEffect(() => {
    supabase.from('tables').select('*').eq('status', 'available').order('number').then(({ data }) => {
      if (data) setTables(data)
    })

    const refresh = async () => {
      const { data } = await supabase
        .from('bookings')
        .select('table_id')
        .eq('booking_date', today)
        .neq('status', 'cancelled')
        .lte('start_time', now)
        .gte('end_time', now)
      setOccupiedIds(new Set((data || []).map(b => b.table_id)))
    }

    refresh()
    const interval = setInterval(refresh, 60000) // refresh every minute
    return () => clearInterval(interval)
  }, [today, now])

  const availableCount = tables.filter(t => !occupiedIds.has(t.id)).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: 13, color: '#6b6b6b' }}>
          <span style={{ fontWeight: 600, color: '#2e7d32' }}>{availableCount}</span> of {tables.length} tables available right now
        </div>
        <span style={{ fontSize: 11, color: '#9a9a9a', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4caf50', display: 'inline-block', animation: 'blink 2s infinite' }} />
          Live
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {tables.slice(0, 8).map(t => {
          const isOccupied = occupiedIds.has(t.id)
          return (
            <div
              key={t.id}
              onClick={() => !isOccupied && onBookClick?.()}
              style={{
                border: `2px solid ${isOccupied ? '#ef9a9a' : '#c8e6c9'}`,
                borderRadius: 10,
                padding: '0.65rem 0.5rem',
                textAlign: 'center',
                cursor: isOccupied ? 'default' : 'pointer',
                background: isOccupied ? '#fff5f5' : '#f1f8f1',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.2rem', color: isOccupied ? '#e57373' : '#1a6b1a' }}>
                T{t.number}
              </div>
              <div style={{ fontSize: 9, marginTop: 2, fontWeight: 600, color: isOccupied ? '#ef9a9a' : '#4caf50', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                {isOccupied ? 'Busy' : 'Free'}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  )
}
