import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Card, CardTitle, Badge, Button, StatCard, Tabs, Input, Select, Spinner, Modal, Alert } from '../components/UI'
import toast from 'react-hot-toast'

// ════════════════════════════════════════════
// Admin Panel
// ════════════════════════════════════════════
export function AdminPanel() {
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [members, setMembers] = useState([])
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState({ members: 0, bookings: 0, revenue: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) return
    const today = new Date().toISOString().slice(0, 10)
    Promise.all([
      supabase.from('bookings').select('*, profiles(full_name,member_id), tables(name)').order('booking_date', { ascending: false }).limit(50),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(50),
    ]).then(([{ data: b }, { data: m }, { data: p }]) => {
      if (b) setBookings(b)
      if (m) setMembers(m)
      if (p) setPayments(p)
      setStats({
        members: m?.length || 0,
        bookings: b?.filter(bk => bk.booking_date === today).length || 0,
        revenue: p?.filter(pm => pm.status === 'verified').reduce((s, pm) => s + Number(pm.amount), 0) || 0,
        pending: p?.filter(pm => pm.status === 'pending').length || 0,
      })
      setLoading(false)
    })
  }, [isAdmin])

  const verifyPayment = async (id) => {
    const { error } = await supabase.from('payments').update({ status: 'verified', verified_at: new Date().toISOString() }).eq('id', id)
    if (!error) {
      setPayments(ps => ps.map(p => p.id === id ? { ...p, status: 'verified' } : p))
      setStats(s => ({ ...s, pending: s.pending - 1 }))
      toast.success('Payment verified!')
    }
  }

  const updateBookingStatus = async (id, status) => {
    await supabase.from('bookings').update({ status }).eq('id', id)
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b))
    toast.success(`Booking ${status}`)
  }

  const updateMemberStatus = async (id, membership_status) => {
    await supabase.from('profiles').update({ membership_status }).eq('id', id)
    setMembers(ms => ms.map(m => m.id === id ? { ...m, membership_status } : m))
    toast.success('Member updated')
  }

  if (!isAdmin) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: '3rem' }}>🔒</div>
      <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", marginTop: '1rem' }}>Admin Access Only</h2>
      <p style={{ color: '#6b6b6b', marginTop: '0.5rem' }}>You don't have permission to view this page.</p>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>Admin Panel</h1>
        <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>Manage bookings, members and payments</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Total Members" value={stats.members} change="Registered" accent />
        <StatCard label="Bookings Today" value={stats.bookings} change="Active" />
        <StatCard label="Revenue (MVR)" value={stats.revenue} change="Verified" changeUp />
        <StatCard label="Pending Payments" value={stats.pending} change={stats.pending > 0 ? 'Needs attention' : 'All clear'} changeUp={stats.pending === 0} />
      </div>

      <Tabs
        tabs={[{value:'bookings',label:'Bookings'},{value:'members',label:'Members'},{value:'payments',label:'Payments'}]}
        active={tab} onChange={setTab}
      />

      {/* Bookings tab */}
      {tab === 'bookings' && (
        <Card>
          {loading ? <Spinner /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ background: '#f4f4f4' }}>
                  {['Booking Ref','Member','Table','Date','Time','Amount','Status','Actions'].map(h=>(
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b6b6b', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1a6b1a' }}>{b.booking_ref || b.id?.slice(0,8)}</td>
                      <td style={{ padding: '12px 14px' }}>{b.profiles?.full_name}</td>
                      <td style={{ padding: '12px 14px' }}>{b.tables?.name}</td>
                      <td style={{ padding: '12px 14px' }}>{b.booking_date}</td>
                      <td style={{ padding: '12px 14px' }}>{b.start_time?.slice(0,5)}</td>
                      <td style={{ padding: '12px 14px' }}>MVR {b.amount}</td>
                      <td style={{ padding: '12px 14px' }}><Badge variant={b.status==='confirmed'?'green':b.status==='cancelled'?'red':'yellow'}>{b.status}</Badge></td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {b.status === 'confirmed' && <Button size="sm" variant="ghost" onClick={() => updateBookingStatus(b.id,'completed')}>Complete</Button>}
                          {b.status === 'confirmed' && <Button size="sm" variant="ghost" style={{ color: '#c62828' }} onClick={() => updateBookingStatus(b.id,'cancelled')}>Cancel</Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Members tab */}
      {tab === 'members' && (
        <Card>
          {loading ? <Spinner /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ background: '#f4f4f4' }}>
                  {['Member ID','Name','Type','Role','Expiry','Status','Actions'].map(h=>(
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b6b6b' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: '#1a6b1a' }}>{m.member_id || '—'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{m.full_name}</td>
                      <td style={{ padding: '12px 14px', textTransform: 'capitalize' }}>{m.membership_type}</td>
                      <td style={{ padding: '12px 14px', textTransform: 'capitalize' }}>{m.role}</td>
                      <td style={{ padding: '12px 14px' }}>{m.membership_expiry || '—'}</td>
                      <td style={{ padding: '12px 14px' }}><Badge variant={m.membership_status==='active'?'green':m.membership_status==='suspended'?'red':'yellow'}>{m.membership_status||'active'}</Badge></td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {m.membership_status !== 'active' && <Button size="sm" variant="ghost" onClick={() => updateMemberStatus(m.id,'active')}>Activate</Button>}
                          {m.membership_status === 'active' && <Button size="sm" variant="ghost" style={{ color: '#c62828' }} onClick={() => updateMemberStatus(m.id,'suspended')}>Suspend</Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Payments tab */}
      {tab === 'payments' && (
        <Card>
          {loading ? <Spinner /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ background: '#f4f4f4' }}>
                  {['Date','Member','Amount','Method','Ref','Slip','Status','Actions'].map(h=>(
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b6b6b' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: p.status==='pending'?'#fffde7':'#fff' }}>
                      <td style={{ padding: '12px 14px' }}>{p.created_at?.slice(0,10)}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{p.profiles?.full_name}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>MVR {p.amount}</td>
                      <td style={{ padding: '12px 14px' }}>{p.payment_method}</td>
                      <td style={{ padding: '12px 14px', color: '#6b6b6b', fontSize: 12 }}>{p.transaction_ref || '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        {p.slip_url ? <a href={p.slip_url} target="_blank" rel="noreferrer" style={{ color: '#1a6b1a', fontSize: 13 }}>View Slip</a> : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}><Badge variant={p.status==='verified'?'green':p.status==='rejected'?'red':'yellow'}>{p.status}</Badge></td>
                      <td style={{ padding: '12px 14px' }}>
                        {p.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <Button size="sm" variant="primary" onClick={() => verifyPayment(p.id)}>✓ Verify</Button>
                            <Button size="sm" variant="ghost" style={{ color: '#c62828' }} onClick={async () => {
                              await supabase.from('payments').update({ status: 'rejected' }).eq('id', p.id)
                              setPayments(ps => ps.map(pm => pm.id === p.id ? { ...pm, status: 'rejected' } : pm))
                              toast.success('Payment rejected')
                            }}>Reject</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

// ════════════════════════════════════════════
// Profile
// ════════════════════════════════════════════
export function Profile() {
  const { profile, updateProfile } = useAuth()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({...f,[k]:e.target.value}))

  useEffect(() => { if (profile) setForm({ ...profile }) }, [profile])
  if (!form) return <Spinner />

  const handleSave = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await updateProfile({ full_name: form.full_name, phone: form.phone, membership_type: form.membership_type })
      toast.success('Profile updated!')
    } catch (err) { toast.error(err.message) } finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>My Profile</h1>
        <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>Manage your account and membership</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.25rem' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#1a6b1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700, border: '3px solid #e8f5e8', flexShrink: 0 }}>
              {form.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '?'}
            </div>
            <div>
              <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.1rem', fontWeight: 700 }}>{form.full_name}</h3>
              <p style={{ color: '#6b6b6b', fontSize: 13 }}>{form.member_id} · {form.membership_type}</p>
              <Badge variant={form.membership_status === 'active' ? 'green' : 'red'} style={{ marginTop: 6 }}>{form.membership_status || 'active'}</Badge>
            </div>
          </div>
          <form onSubmit={handleSave}>
            <Input label="Full Name" value={form.full_name || ''} onChange={set('full_name')} required />
            <Input label="Phone" value={form.phone || ''} onChange={set('phone')} />
            <Input label="Email" value={form.email || ''} readOnly style={{ background: '#f9f9f9' }} hint="Email cannot be changed" />
            <Input label="National ID" value={form.national_id || ''} readOnly style={{ background: '#f9f9f9' }} />
            <Select label="Membership Type" value={form.membership_type || 'senior'} onChange={set('membership_type')}>
              <option value="junior">Junior</option>
              <option value="senior">Senior</option>
              <option value="elite">Elite</option>
            </Select>
            <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</Button>
          </form>
        </Card>

        <div>
          <Card style={{ marginBottom: '1.25rem' }}>
            <CardTitle>Membership Details</CardTitle>
            <div style={{ marginTop: '0.75rem' }}>
              {[['Member ID', form.member_id || '—'], ['Category', form.membership_type || '—'], ['Expiry', form.membership_expiry || '—'], ['National Rank', form.national_ranking ? `#${form.national_ranking}` : '—'], ['Rating', form.rating_points || '0']].map(([k,v])=>(
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: 14 }}>
                  <span style={{ color: '#6b6b6b' }}>{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
            <Button fullWidth variant="outline" style={{ marginTop: '1rem' }}>Renew Membership</Button>
          </Card>

          <Card>
            <CardTitle>Change Password</CardTitle>
            <div style={{ marginTop: '0.75rem' }}>
              <Input label="Current Password" type="password" placeholder="••••••••" />
              <Input label="New Password" type="password" placeholder="Min 8 characters" />
              <Input label="Confirm Password" type="password" placeholder="Repeat new password" />
              <Button variant="ghost" onClick={() => toast('Password update coming soon')}>Update Password</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// Settings
// ════════════════════════════════════════════
export function Settings() {
  const [saved, setSaved] = useState(false)
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>Settings</h1>
        <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>Application preferences and configuration</p>
      </div>
      <div style={{ maxWidth: 600 }}>
        {saved && <Alert variant="success" style={{ marginBottom: '1rem' }}>✓ Settings saved successfully</Alert>}
        <Card style={{ marginBottom: '1.25rem' }}>
          <CardTitle>General</CardTitle>
          <div style={{ marginTop: '0.75rem' }}>
            <Select label="Language"><option>English</option><option>Dhivehi</option></Select>
            <Select label="Timezone"><option>Maldives Time (UTC+5)</option></Select>
            <Select label="Currency"><option>MVR (Maldivian Rufiyaa)</option><option>USD</option></Select>
          </div>
        </Card>
        <Card style={{ marginBottom: '1.25rem' }}>
          <CardTitle>Notifications</CardTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14, marginTop: '0.75rem' }}>
            {[
              ['Email booking confirmations', true],
              ['Email invoice notifications', true],
              ['Push notifications (browser/app)', true],
              ['Tournament announcements', true],
              ['Payment reminders', false],
              ['Membership renewal reminders', true],
            ].map(([label, def]) => (
              <label key={label} style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                {label} <input type="checkbox" defaultChecked={def} style={{ width: 16, height: 16, accentColor: '#1a6b1a' }} />
              </label>
            ))}
          </div>
        </Card>
        <Card style={{ marginBottom: '1.25rem' }}>
          <CardTitle>Booking Preferences</CardTitle>
          <div style={{ marginTop: '0.75rem' }}>
            <Select label="Default Duration"><option>1 hour</option><option>2 hours</option></Select>
            <Select label="Default Booking Type"><option>Member</option><option>Guest</option><option>Training</option></Select>
          </div>
        </Card>
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  )
}
