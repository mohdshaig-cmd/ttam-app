// All imports ONCE at the top — fixes "Identifier already declared" error
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useBookings } from '../hooks/useBookings'
import {
  Card, CardTitle, Badge, Button, Tabs,
  EmptyState, Spinner, Modal, Avatar, Input, Select,
} from '../components/UI'
import toast from 'react-hot-toast'

// ═══════════════════════════════════════════════════════════
// MyBookings
// ═══════════════════════════════════════════════════════════
export function MyBookings() {
  const { bookings, loading, cancel } = useBookings()
  const navigate = useNavigate()
  const [tab, setTab] = useState('upcoming')
  const [cancelId, setCancelId] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  const filtered = bookings.filter(b => {
    if (tab === 'upcoming') return b.status !== 'cancelled' && b.booking_date >= today
    if (tab === 'past')     return b.status === 'completed' || (b.status !== 'cancelled' && b.booking_date < today)
    return b.status === 'cancelled'
  })

  const handleCancel = async () => {
    try { await cancel(cancelId, cancelReason); setCancelId(null) } catch (_) {}
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>My Bookings</h1>
          <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>Manage all your table bookings</p>
        </div>
        <Button onClick={() => navigate('/booking')}>+ New Booking</Button>
      </div>

      <Tabs
        tabs={[
          { value: 'upcoming',  label: 'Upcoming' },
          { value: 'past',      label: 'Past' },
          { value: 'cancelled', label: 'Cancelled' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <Card>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState
            icon="📭"
            title="No bookings found"
            description="Book a table to get started"
            action={<Button onClick={() => navigate('/booking')}>Book Now</Button>}
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f4f4f4' }}>
                  {['Booking ID', 'Table', 'Date', 'Time', 'Duration', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b6b6b', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: '12px 14px' }}><strong>{b.booking_ref || b.id?.slice(0, 8)}</strong></td>
                    <td style={{ padding: '12px 14px' }}>{b.tables?.name}</td>
                    <td style={{ padding: '12px 14px' }}>{b.booking_date}</td>
                    <td style={{ padding: '12px 14px' }}>{b.start_time?.slice(0, 5)}</td>
                    <td style={{ padding: '12px 14px' }}>{b.duration_hours}h</td>
                    <td style={{ padding: '12px 14px' }}>MVR {b.amount}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <Badge variant={b.status === 'confirmed' ? 'green' : b.status === 'cancelled' ? 'red' : 'yellow'}>
                        {b.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {b.status === 'confirmed' && (
                        <Button size="sm" variant="ghost" onClick={() => setCancelId(b.id)}>Cancel</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!cancelId} onClose={() => setCancelId(null)} title="Cancel Booking">
        <p style={{ fontSize: 14, color: '#6b6b6b', marginBottom: '1rem' }}>
          Please provide a reason for cancellation:
        </p>
        <textarea
          value={cancelReason}
          onChange={e => setCancelReason(e.target.value)}
          placeholder="Reason…"
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #d0d0d0', borderRadius: 8, fontSize: 14, minHeight: 80, marginBottom: '1rem', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost"  style={{ flex: 1 }} onClick={() => setCancelId(null)}>Keep Booking</Button>
          <Button variant="danger" style={{ flex: 1 }} onClick={handleCancel}>Cancel Booking</Button>
        </div>
      </Modal>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Members
// ═══════════════════════════════════════════════════════════
export function Members() {
  const [members, setMembers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search,  setSearch]    = useState('')
  const [filter,  setFilter]    = useState('all')

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .neq('role', 'admin')
      .order('full_name')
      .then(({ data }) => {
        if (data) setMembers(data)
        setLoading(false)
      })
  }, [])

  const filtered = members.filter(m => {
    const matchSearch = m.full_name?.toLowerCase().includes(search.toLowerCase()) || m.member_id?.includes(search)
    const matchFilter = filter === 'all' || m.membership_type === filter
    return matchSearch && matchFilter
  })

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>Members Directory</h1>
        <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>Active registered members of TTAM</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9a9a9a', fontSize: 14 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members…"
            style={{ width: '100%', padding: '10px 14px 10px 36px', border: '1px solid #d0d0d0', borderRadius: 8, fontSize: 14, outline: 'none' }}
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid #d0d0d0', borderRadius: 8, fontSize: 14 }}
        >
          <option value="all">All Types</option>
          <option value="junior">Junior</option>
          <option value="senior">Senior</option>
          <option value="elite">Elite</option>
        </select>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="👥" title="No members found" description="Try a different search" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.map(m => (
            <div
              key={m.id}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem', background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
            >
              <Avatar
                initials={(m.full_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                size={44}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.full_name}
                </div>
                <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2, textTransform: 'capitalize' }}>
                  {m.membership_type} · {m.member_id || '—'}
                </div>
              </div>
              <Badge variant={m.membership_status === 'active' ? 'green' : m.membership_status === 'expired' ? 'red' : 'yellow'}>
                {m.membership_status || 'active'}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Guests
// ═══════════════════════════════════════════════════════════
export function Guests() {
  const [guests,  setGuests]  = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '',
    nationality: '', guest_type: 'day', invited_by: '',
  })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setGuests(data) })
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const validUntil = form.guest_type === 'week'
        ? new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
        : today

      const { error } = await supabase.from('guests').insert({
        ...form,
        valid_from: today,
        valid_until: validUntil,
      })
      if (error) throw error

      toast.success('Guest registered!')
      setForm({ full_name: '', phone: '', email: '', nationality: '', guest_type: 'day', invited_by: '' })

      const { data } = await supabase.from('guests').select('*').order('created_at', { ascending: false }).limit(20)
      if (data) setGuests(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>Guest Management</h1>
        <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>Register and manage guest players</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        <Card>
          <CardTitle>Register New Guest</CardTitle>
          <form onSubmit={handleSubmit}>
            <Input label="Full Name"    placeholder="Guest's full name"  value={form.full_name}   onChange={set('full_name')}   required />
            <Input label="Phone"        placeholder="+960 xxx xxxx"      value={form.phone}       onChange={set('phone')} />
            <Input label="Email"        type="email" placeholder="email@example.com" value={form.email} onChange={set('email')} />
            <Input label="Nationality"  placeholder="e.g. Maldivian"    value={form.nationality} onChange={set('nationality')} />

            <Select label="Guest Type" value={form.guest_type} onChange={set('guest_type')}>
              <option value="day">Day Pass (1 day)</option>
              <option value="week">Week Pass (7 days)</option>
              <option value="accompanying">Accompanying Member</option>
            </Select>

            <Input label="Invited by (Member ID)" placeholder="#TTAM-001" value={form.invited_by} onChange={set('invited_by')} />

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Registering…' : 'Register Guest'}
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Recent Guests</CardTitle>
          <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f4f4f4' }}>
                  {['Name', 'Date', 'Type', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b6b6b' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guests.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: '10px 12px' }}>{g.full_name}</td>
                    <td style={{ padding: '10px 12px' }}>{g.valid_from}</td>
                    <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{g.guest_type}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <Badge variant={g.status === 'active' ? 'green' : 'gray'}>{g.status}</Badge>
                    </td>
                  </tr>
                ))}
                {guests.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#9a9a9a' }}>No guests yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Rankings
// ═══════════════════════════════════════════════════════════
export function Rankings() {
  const [rankings, setRankings] = useState([])
  const [tab,      setTab]      = useState('senior')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('profiles')
      .select('id, full_name, membership_type, national_ranking, rating_points')
      .eq('membership_type', tab)
      .order('national_ranking', { ascending: true })
      .limit(20)
      .then(({ data }) => {
        if (data) setRankings(data)
        setLoading(false)
      })
  }, [tab])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>National Rankings</h1>
        <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>TTAM official player rankings</p>
      </div>

      <Tabs
        tabs={[
          { value: 'senior', label: 'Senior Men' },
          { value: 'junior', label: 'Juniors' },
          { value: 'elite',  label: 'Elite' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <Card>
        {loading ? <Spinner /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f4f4f4' }}>
                  {['Rank', 'Player', 'Category', 'Points', 'Change'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b6b6b' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rankings.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: i < 3 ? '#fafdf6' : '#fff' }}>
                    <td style={{ padding: '12px 14px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: i < 3 ? '1.1rem' : 14 }}>
                      {i < 3 ? medals[i] : i + 1}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.full_name}</td>
                    <td style={{ padding: '12px 14px', textTransform: 'capitalize', color: '#6b6b6b' }}>{r.membership_type}</td>
                    <td style={{ padding: '12px 14px', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600 }}>{r.rating_points || 0}</td>
                    <td style={{ padding: '12px 14px', color: '#2e7d32' }}>↑ —</td>
                  </tr>
                ))}
                {rankings.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b6b6b' }}>
                      No rankings data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
