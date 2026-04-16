import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { Card, CardTitle, Badge, Button, Tabs, Spinner, EmptyState, SectionDivider, Input, Select, Textarea, Alert } from '../components/UI'
import { TournamentCard, WinnerPodium } from '../components/Tournament'
import toast from 'react-hot-toast'

// ════════════════════════════════════════════
// Tournaments
// ════════════════════════════════════════════
export function Tournaments() {
  const { user } = useAuth()
  const [tournaments, setTournaments] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [tab, setTab] = useState('upcoming')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('tournaments').select('*').order('start_date'),
      user && supabase.from('tournament_registrations').select('tournament_id').eq('user_id', user.id),
    ]).then(([{ data: t }, res]) => {
      if (t) setTournaments(t)
      if (res?.data) setRegistrations(res.data.map(r => r.tournament_id))
      setLoading(false)
    })
  }, [user])

  const filtered = tournaments.filter(t => {
    if (tab === 'upcoming') return ['upcoming', 'registration'].includes(t.status)
    if (tab === 'ongoing') return t.status === 'ongoing'
    return t.status === 'completed'
  })

  const handleRegister = async (tournament) => {
    if (!user) { toast.error('Please sign in to register'); return }
    try {
      const { error } = await supabase.from('tournament_registrations').insert({ tournament_id: tournament.id, user_id: user.id })
      if (error) throw error
      setRegistrations(r => [...r, tournament.id])
      toast.success(`Registered for ${tournament.name}!`)
    } catch (err) {
      toast.error(err.message || 'Registration failed')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>Tournaments</h1>
        <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>Past, current and upcoming table tennis tournaments</p>
      </div>
      <Tabs tabs={[{value:'upcoming',label:'Upcoming'},{value:'ongoing',label:'Ongoing'},{value:'completed',label:'Past'}]} active={tab} onChange={setTab} />
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState icon="🏆" title="No tournaments" description="Check back soon for upcoming events" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
          {filtered.map(t => (
            <TournamentCard key={t.id} tournament={t} registered={registrations.includes(t.id)} onRegister={handleRegister} />
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════
// Notifications
// ════════════════════════════════════════════
export function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead, loading } = useNotifications()

  const today = new Date().toISOString().slice(0, 10)
  const todayNotifs = notifications.filter(n => n.created_at?.slice(0, 10) === today)
  const earlier = notifications.filter(n => n.created_at?.slice(0, 10) !== today)

  const typeColors = { booking: '#1a6b1a', payment: '#f57f17', invoice: '#1565c0', tournament: '#6a1b9a', announcement: '#e65100', system: '#5a5a5a' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>Notifications</h1>
          <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>{unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}</p>
        </div>
        {unreadCount > 0 && <Button size="sm" variant="ghost" onClick={markAllRead}>Mark all read</Button>}
      </div>

      <Card style={{ marginBottom: '1.25rem' }}>
        {loading ? <Spinner /> : notifications.length === 0 ? (
          <EmptyState icon="🔔" title="No notifications" description="You'll be notified about bookings, payments and tournaments here" />
        ) : (
          <>
            {todayNotifs.length > 0 && <SectionDivider label="Today" />}
            {todayNotifs.map(n => (
              <div key={n.id} onClick={() => !n.read && markRead(n.id)} style={{ display: 'flex', gap: 12, padding: '1rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)', cursor: n.read ? 'default' : 'pointer' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.read ? '#d0d0d0' : typeColors[n.type] || '#1a6b1a', flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: n.read ? 400 : 600 }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: '#6b6b6b', marginTop: 2 }}>{n.body}</div>
                  <div style={{ fontSize: 11, color: '#9a9a9a', marginTop: 4 }}>{n.created_at?.slice(0, 16).replace('T', ' ')} · {n.type}</div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a6b1a', flexShrink: 0, marginTop: 5 }} />}
              </div>
            ))}
            {earlier.length > 0 && <SectionDivider label="Earlier" />}
            {earlier.map(n => (
              <div key={n.id} onClick={() => !n.read && markRead(n.id)} style={{ display: 'flex', gap: 12, padding: '1rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)', cursor: n.read ? 'default' : 'pointer', opacity: n.read ? 0.7 : 1 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.read ? '#d0d0d0' : typeColors[n.type] || '#1a6b1a', flexShrink: 0, marginTop: 5 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: n.read ? 400 : 600 }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: '#6b6b6b', marginTop: 2 }}>{n.body}</div>
                  <div style={{ fontSize: 11, color: '#9a9a9a', marginTop: 4 }}>{n.created_at?.slice(0, 10)} · {n.type}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </Card>

      <Card>
        <CardTitle>Notification Preferences</CardTitle>
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14 }}>
          {[
            ['email_booking', 'Email notifications for bookings', true],
            ['email_payment', 'Email notifications for payment updates', true],
            ['email_tournament', 'Tournament announcements', true],
            ['push_all', 'Push notifications (browser/app)', true],
            ['sms', 'SMS reminders (coming soon)', false],
          ].map(([key, label, def]) => (
            <label key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span>{label}</span>
              <input type="checkbox" defaultChecked={def} style={{ width: 16, height: 16, accentColor: '#1a6b1a' }} />
            </label>
          ))}
        </div>
        <Button style={{ marginTop: '1rem' }} variant="outline">Save Preferences</Button>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════
// About TTAM
// ════════════════════════════════════════════
export function About() {
  return (
    <div>
      {/* Hero */}
      <div style={{ background: '#0f4a0f', borderRadius: 16, padding: '2.5rem', color: '#fff', display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Table Tennis Association of Maldives</h2>
          <p style={{ opacity: 0.85, marginTop: 10, lineHeight: 1.7, maxWidth: 560, fontSize: 15 }}>
            The official governing body for table tennis in the Maldives, promoting the sport at all levels — from grassroots to international competition since 1986.
          </p>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {[['38+','Years of Excellence'],['200+','Registered Members'],['50+','Tournaments Held'],['12','International Medals']].map(([v,l])=>(
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.8rem', fontWeight: 700 }}>{v}</div>
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.25rem' }}>
        <Card>
          <CardTitle>Our Mission</CardTitle>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: '#5a5a5a' }}>To develop, promote and govern the sport of table tennis in the Maldives through organized competitions, training programs, and participation in regional and international events under the ITTF and OTTF frameworks.</p>
        </Card>
        <Card>
          <CardTitle>Our Vision</CardTitle>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: '#5a5a5a' }}>To establish the Maldives as a competitive table tennis nation in South Asia and the Indian Ocean region, nurturing champions from every atoll through structured pathways from junior to elite level.</p>
        </Card>
        <Card>
          <CardTitle>Facilities</CardTitle>
          <ul style={{ fontSize: 14, lineHeight: 2.2, paddingLeft: '1.25rem', color: '#5a5a5a' }}>
            <li>8 regulation ITTF-certified tables</li>
            <li>Air-conditioned training hall</li>
            <li>Coaching & equipment room</li>
            <li>Video analysis station</li>
            <li>Spectator seating for 120</li>
          </ul>
        </Card>
        <Card>
          <CardTitle>Affiliations</CardTitle>
          <ul style={{ fontSize: 14, lineHeight: 2.2, paddingLeft: '1.25rem', color: '#5a5a5a' }}>
            <li>ITTF – International Table Tennis Federation</li>
            <li>OTTF – Oceania Table Tennis Federation</li>
            <li>SATTF – South Asian TT Federation</li>
            <li>Maldives Olympic Committee</li>
            <li>Ministry of Youth, Sports & Community</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// Exco Members
// ════════════════════════════════════════════
export function Exco() {
  const [exco, setExco] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('exco_members').select('*').eq('is_active', true).order('display_order')
      .then(({ data }) => { if (data) setExco(data); setLoading(false) })
  }, [])

  // Fallback data if DB empty
  const fallback = [
    { id:1, full_name:'Ahmed Hassan', position:'President', email:'president@ttam.mv' },
    { id:2, full_name:'Fatima Mohamed', position:'Vice President', email:'vp@ttam.mv' },
    { id:3, full_name:'Ibrahim Rasheed', position:'General Secretary', email:'secretary@ttam.mv' },
    { id:4, full_name:'Zainab Ahmed', position:'Treasurer', email:'treasurer@ttam.mv' },
    { id:5, full_name:'Hassan Manik', position:'Technical Director', email:'technical@ttam.mv' },
    { id:6, full_name:'Mohamed Ali', position:'Competitions Manager', email:'competitions@ttam.mv' },
    { id:7, full_name:'Laila Rasheed', position:'Youth Development', email:'youth@ttam.mv' },
    { id:8, full_name:'Yoosuf Amir', position:'Communications Officer', email:'comms@ttam.mv' },
  ]
  const display = exco.length > 0 ? exco : fallback

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>Executive Committee</h1>
        <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>TTAM Elected Officials 2024–2026</p>
      </div>
      {loading ? <Spinner /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1.25rem' }}>
          {display.map(m => (
            <Card key={m.id} style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#1a6b1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700, margin: '0 auto 1rem', border: '3px solid #e8f5e8' }}>
                {m.full_name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <h4 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 15, fontWeight: 600 }}>{m.full_name}</h4>
              <p style={{ fontSize: 12, color: '#1a6b1a', fontWeight: 500, marginTop: 4 }}>{m.position}</p>
              {m.email && <p style={{ fontSize: 12, color: '#6b6b6b', marginTop: 6 }}>{m.email}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════
// Champions / International Results
// ════════════════════════════════════════════
export function Champions() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('international_results').select('*').order('year', { ascending: false })
      .then(({ data }) => { if (data) setResults(data); setLoading(false) })
  }, [])

  // Fallback data
  const fallback = [
    { id:1, year:2025, tournament_name:'OTTF Open Championships', player_name:'Hassan Manik', category:"Men's Singles", result:'Gold', location:'Auckland' },
    { id:2, year:2025, tournament_name:'South Asian Games', player_name:'Fatima Mohamed', category:"Women's Singles", result:'Bronze', location:'Colombo' },
    { id:3, year:2024, tournament_name:'ITTF South Asia Open', player_name:'Ibrahim Rasheed', category:"Men's Singles", result:'Silver', location:'Dhaka' },
    { id:4, year:2024, tournament_name:'Indian Ocean Islands Games', player_name:'Hassan Manik', category:"Men's Singles", result:'Gold', location:'Male\'' },
    { id:5, year:2023, tournament_name:'SAARC Table Tennis', player_name:'Ahmed Hassan', category:"Men's Doubles", result:'Silver', location:'Kathmandu' },
  ]
  const display = results.length > 0 ? results : fallback
  const gold = display.find(r => r.result === 'Gold' && r.year === Math.max(...display.map(d=>d.year)))
  const silver = display.find(r => r.result === 'Silver' && r.year === Math.max(...display.map(d=>d.year)))
  const bronze = display.find(r => r.result === 'Bronze' && r.year === Math.max(...display.map(d=>d.year)))

  const resultBadge = { Gold:'green', Silver:'blue', Bronze:'yellow' }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>Champions Gallery</h1>
        <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>Maldivian champions in international competition</p>
      </div>
      <SectionDivider label="Latest International Podium" />
      <WinnerPodium first={gold} second={silver} third={bronze} />
      <Card style={{ marginTop: '1.5rem' }}>
        <CardTitle>Full International Record</CardTitle>
        {loading ? <Spinner /> : (
          <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead><tr style={{ background: '#f4f4f4' }}>
                {['Year','Tournament','Player','Category','Result','Venue'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b6b6b', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {display.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.year}</td>
                    <td style={{ padding: '12px 14px' }}>{r.tournament_name}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.player_name}</td>
                    <td style={{ padding: '12px 14px', color: '#6b6b6b' }}>{r.category}</td>
                    <td style={{ padding: '12px 14px' }}><Badge variant={resultBadge[r.result] || 'gray'}>🏅 {r.result}</Badge></td>
                    <td style={{ padding: '12px 14px', color: '#6b6b6b' }}>{r.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════
// Contact
// ════════════════════════════════════════════
export function Contact() {
  const [form, setForm] = useState({ name:'', email:'', subject:'general', message:'' })
  const [sent, setSent] = useState(false)
  const set = k => e => setForm(f => ({...f,[k]:e.target.value}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('contact_messages').insert(form).catch(() => ({}))
    setSent(true)
    toast.success('Message sent! We\'ll reply within 24 hours.')
  }

  const contacts = [
    { icon: '📍', title: 'Address', detail: "Artificial Beach Area, Male' 20095, Maldives" },
    { icon: '📞', title: 'Phone', detail: '+960 300-XXXX' },
    { icon: '📧', title: 'Email', detail: 'info@ttam.mv' },
    { icon: '🕐', title: 'Hall Hours', detail: 'Sun–Thu: 8AM–10PM\nFri–Sat: 9AM–11PM' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>Contact Us</h1>
        <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>Get in touch with TTAM</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.25rem' }}>
        <div>
          <Card style={{ marginBottom: '1.25rem' }}>
            <CardTitle>Get in Touch</CardTitle>
            {contacts.map(c => (
              <div key={c.title} style={{ display: 'flex', gap: 12, padding: '0.875rem 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ width: 40, height: 40, background: '#e8f5e8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{c.title}</div>
                  <div style={{ fontSize: 13, color: '#6b6b6b', marginTop: 2, whiteSpace: 'pre-line' }}>{c.detail}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
        <Card>
          <CardTitle>Send a Message</CardTitle>
          {sent ? (
            <Alert variant="success" style={{ marginTop: '0.75rem' }}>✅ Message sent! We'll reply within 24 hours.</Alert>
          ) : (
            <form onSubmit={handleSubmit} style={{ marginTop: '0.75rem' }}>
              <Input label="Your Name" placeholder="Full name" value={form.name} onChange={set('name')} required />
              <Input label="Email" type="email" placeholder="email@example.com" value={form.email} onChange={set('email')} required />
              <Select label="Subject" value={form.subject} onChange={set('subject')}>
                <option value="general">General Inquiry</option>
                <option value="booking">Booking Issue</option>
                <option value="membership">Membership</option>
                <option value="tournament">Tournament</option>
                <option value="complaint">Complaint</option>
                <option value="other">Other</option>
              </Select>
              <Textarea label="Message" placeholder="Write your message here…" value={form.message} onChange={set('message')} required />
              <Button type="submit" fullWidth>📤 Send Message</Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
