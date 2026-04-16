import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Card, Badge, Button, Input, Select, Textarea, Spinner, EmptyState, Alert } from '../components/UI'
import toast from 'react-hot-toast'

const typeColors = {
  general:     'blue',
  urgent:      'red',
  tournament:  'green',
  maintenance: 'yellow',
}

const typeIcons = {
  general:     '📢',
  urgent:      '🚨',
  tournament:  '🏆',
  maintenance: '🔧',
}

export default function Announcements() {
  const { isAdmin } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', type: 'general', audience: 'all', pinned: false })
  const [submitting, setSubmitting] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    supabase
      .from('announcements')
      .select('*, profiles(full_name)')
      .eq('published', true)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setAnnouncements(data)
        setLoading(false)
      })

    // Real-time new announcements
    const channel = supabase
      .channel('announcements-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, payload => {
        if (payload.new.published) setAnnouncements(a => [payload.new, ...a])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const handlePublish = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('announcements')
        .insert({ ...form, published: true })
      if (error) throw error
      toast.success('Announcement published!')
      setShowForm(false)
      setForm({ title: '', body: '', type: 'general', audience: 'all', pinned: false })
      const { data } = await supabase
        .from('announcements')
        .select('*, profiles(full_name)')
        .eq('published', true)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
      if (data) setAnnouncements(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements(a => a.filter(x => x.id !== id))
    toast.success('Announcement deleted')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>Announcements</h1>
          <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>Official news and updates from TTAM</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(s => !s)}>
            {showForm ? '✕ Cancel' : '+ New Announcement'}
          </Button>
        )}
      </div>

      {/* Admin post form */}
      {showForm && isAdmin && (
        <Card style={{ marginBottom: '1.5rem', borderLeft: '3px solid #1a6b1a' }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 14, fontWeight: 600, marginBottom: '1rem', color: '#1a6b1a' }}>
            Publish New Announcement
          </div>
          <form onSubmit={handlePublish}>
            <Input label="Title" placeholder="Announcement title…" value={form.title} onChange={set('title')} required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Select label="Type" value={form.type} onChange={set('type')}>
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="tournament">Tournament</option>
                <option value="maintenance">Maintenance</option>
              </Select>
              <Select label="Audience" value={form.audience} onChange={set('audience')}>
                <option value="all">Everyone</option>
                <option value="members">Members only</option>
                <option value="admins">Admins only</option>
              </Select>
            </div>
            <Textarea label="Message" placeholder="Write your announcement…" value={form.body} onChange={set('body')} required />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', marginBottom: '1rem' }}>
              <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} style={{ accentColor: '#1a6b1a', width: 16, height: 16 }} />
              Pin to top (important announcements)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" disabled={submitting}>{submitting ? 'Publishing…' : '📢 Publish'}</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Announcements feed */}
      {loading ? <Spinner /> : announcements.length === 0 ? (
        <EmptyState icon="📢" title="No announcements yet" description="Check back soon for TTAM updates" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {announcements.map(a => (
            <Card
              key={a.id}
              style={{
                borderLeft: `3px solid ${a.type === 'urgent' ? '#c62828' : a.type === 'tournament' ? '#1a6b1a' : a.type === 'maintenance' ? '#f57f17' : '#1565c0'}`,
                ...(a.pinned ? { boxShadow: '0 2px 12px rgba(26,107,26,0.12)' } : {}),
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 18 }}>{typeIcons[a.type]}</span>
                  <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1rem', fontWeight: 600 }}>{a.title}</h3>
                  {a.pinned && <span style={{ fontSize: 10, fontWeight: 700, background: '#fff8e1', color: '#f57f17', padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📌 Pinned</span>}
                  <Badge variant={typeColors[a.type] || 'gray'}>{a.type}</Badge>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(a.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a9a9a', fontSize: 13, padding: '4px 8px', borderRadius: 6 }}
                  >
                    ✕ Delete
                  </button>
                )}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#3a3a3a', marginTop: '0.75rem' }}>{a.body}</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: 12, color: '#9a9a9a' }}>
                <span>{a.created_at?.slice(0, 10)}</span>
                {a.profiles?.full_name && <span>by {a.profiles.full_name}</span>}
                {a.audience !== 'all' && <span>• {a.audience} only</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
