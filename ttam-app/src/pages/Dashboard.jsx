import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useBookings } from '../hooks/useBookings'
import { useNotifications } from '../hooks/useNotifications'
import { StatCard, Card, CardTitle, Badge, Button, Alert, Spinner } from '../components/UI'
import { TableStatusStrip } from '../components/Booking/TableStatus'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

export default function Dashboard() {
  const { profile } = useAuth()
  const { bookings, loading: bookingsLoading } = useBookings()
  const { notifications, unreadCount } = useNotifications()
  const [tournaments, setTournaments] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const navigate = useNavigate()

  const greeting =
    new Date().getHours() < 12 ? 'Good morning'
    : new Date().getHours() < 17 ? 'Good afternoon'
    : 'Good evening'

  useEffect(() => {
    supabase.from('tournaments').select('*')
      .in('status', ['upcoming', 'registration']).order('start_date').limit(3)
      .then(({ data }) => { if (data) setTournaments(data) })

    supabase.from('announcements').select('*')
      .eq('published', true)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setAnnouncements(data) })
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const upcomingBookings = bookings
    .filter(b => b.status !== 'cancelled' && b.booking_date >= today)
    .slice(0, 3)
  const thisMonthBookings = bookings.filter(b =>
    b.booking_date?.startsWith(new Date().toISOString().slice(0, 7))
  ).length
  const totalHours = bookings.reduce((s, b) => s + (Number(b.duration_hours) || 0), 0)
  const recentNotifs = notifications.filter(n => !n.read).slice(0, 4)
  const openTournament = tournaments.find(t => t.status === 'registration')

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
          {greeting}, {profile?.full_name?.split(' ')[0] ?? 'Member'} 👋
        </h1>
        <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>
          {format(new Date(), 'EEEE, d MMMM yyyy')}
          {profile?.membership_type && ` · ${profile.membership_type} member`}
        </p>
      </div>

      {openTournament && (
        <Alert variant="info" style={{ marginBottom: '1.5rem' }}>
          🎯 <strong>Registration open:</strong> {openTournament.name} —{' '}
          <span onClick={() => navigate('/tournaments')} style={{ fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Register now →</span>
        </Alert>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="My Bookings" value={bookings.length} change={`${thisMonthBookings} this month`} changeUp accent />
        <StatCard label="Hours Played" value={`${totalHours}h`} change="All time" />
        <StatCard label="My Rank" value={profile?.national_ranking ? `#${profile.national_ranking}` : '—'} />
        <StatCard label="Notifications" value={unreadCount} change={unreadCount > 0 ? 'Unread' : 'All read ✓'} changeUp={unreadCount === 0} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <CardTitle style={{ margin: 0 }}>Hall Status</CardTitle>
            <span style={{ fontSize: 11, color: '#9a9a9a', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4caf50', display: 'inline-block', animation: 'blink 2s infinite' }} />
              Real-time
            </span>
          </div>
          <TableStatusStrip onBookClick={() => navigate('/booking')} />
          <Button fullWidth style={{ marginTop: '1rem' }} onClick={() => navigate('/booking')}>📅 Book a Table</Button>
          <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <CardTitle style={{ margin: 0 }}>Upcoming Bookings</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => navigate('/my-bookings')}>View all</Button>
          </div>
          {bookingsLoading ? <Spinner /> : upcomingBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#6b6b6b', fontSize: 14 }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
              No upcoming bookings
              <div style={{ marginTop: '0.75rem' }}><Button size="sm" onClick={() => navigate('/booking')}>Book now</Button></div>
            </div>
          ) : upcomingBookings.map(b => (
            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{b.tables?.name}</div>
                <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>{b.booking_date} · {b.start_time?.slice(0,5)} – {b.end_time?.slice(0,5)}</div>
              </div>
              <Badge variant={b.status === 'confirmed' ? 'green' : 'yellow'}>{b.status}</Badge>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <CardTitle style={{ margin: 0 }}>Latest News</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => navigate('/announcements')}>View all</Button>
          </div>
          {announcements.length === 0 ? (
            <div style={{ color: '#6b6b6b', fontSize: 14, textAlign: 'center', padding: '1rem' }}>No announcements yet</div>
          ) : announcements.map(a => (
            <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 14 }}>{a.type === 'urgent' ? '🚨' : a.type === 'tournament' ? '🏆' : '📢'}</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{a.title}</span>
              </div>
              <div style={{ fontSize: 13, color: '#5a5a5a', paddingLeft: 22 }}>{a.body.slice(0, 75)}{a.body.length > 75 ? '…' : ''}</div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <CardTitle style={{ margin: 0 }}>
              Notifications
              {unreadCount > 0 && <Badge variant="green" style={{ marginLeft: 8, verticalAlign: 'middle' }}>{unreadCount} new</Badge>}
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => navigate('/notifications')}>View all</Button>
          </div>
          {recentNotifs.length === 0 ? (
            <div style={{ color: '#6b6b6b', fontSize: 14, textAlign: 'center', padding: '1rem' }}>You're all caught up ✓</div>
          ) : recentNotifs.map(n => (
            <div key={n.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a6b1a', flexShrink: 0, marginTop: 5 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>{n.body?.slice(0, 60)}{n.body?.length > 60 ? '…' : ''}</div>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <CardTitle style={{ margin: 0 }}>Upcoming Tournaments</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => navigate('/tournaments')}>View all</Button>
          </div>
          {tournaments.length === 0 ? (
            <div style={{ color: '#6b6b6b', fontSize: 14, textAlign: 'center', padding: '1rem' }}>No upcoming tournaments</div>
          ) : tournaments.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>{t.start_date} – {t.end_date}</div>
              </div>
              <Badge variant={t.status === 'registration' ? 'green' : 'blue'}>{t.status === 'registration' ? 'Open' : 'Soon'}</Badge>
            </div>
          ))}
        </Card>

      </div>
    </div>
  )
}
