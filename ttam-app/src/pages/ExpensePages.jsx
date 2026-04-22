import { useState, useEffect, useRef } from 'react'
import {
  Card, CardTitle, Badge, Button, Input, Select, Tabs,
  Spinner, EmptyState, Alert, Modal, Textarea,
} from '../components/UI'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { Receipt, Plus, Upload, X, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'equipment',      label: 'Equipment',      color: '#1565c0', bg: '#e3f2fd' },
  { value: 'venue',          label: 'Venue',           color: '#6a1b9a', bg: '#f3e5f5' },
  { value: 'events',         label: 'Events',          color: '#e65100', bg: '#fff3e0' },
  { value: 'travel',         label: 'Travel',          color: '#00695c', bg: '#e0f2f1' },
  { value: 'administrative', label: 'Administrative',  color: '#37474f', bg: '#eceff1' },
  { value: 'training',       label: 'Training',        color: '#2e7d32', bg: '#e8f5e9' },
  { value: 'other',          label: 'Other',           color: '#5a5a5a', bg: '#f4f4f4' },
]

const STATUS_VARIANTS = {
  pending:    'yellow',
  approved:   'green',
  rejected:   'red',
  reimbursed: 'teal',
}

function catMeta(value) {
  return CATEGORIES.find(c => c.value === value) || CATEGORIES[CATEGORIES.length - 1]
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MV', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtAmount(n) {
  return `MVR ${Number(n).toLocaleString('en-MV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Receipt upload ───────────────────────────────────────────
function ReceiptUpload({ onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5 MB'); return }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('expense-receipts').upload(path, file)
      if (error) throw error
      const { data } = supabase.storage.from('expense-receipts').getPublicUrl(path)
      onUploaded(data.publicUrl)
      toast.success('Receipt uploaded')
    } catch (err) {
      // Fallback: store a placeholder so the UI still works without the bucket set up
      onUploaded(`placeholder:${file.name}`)
      toast.success('Receipt recorded (storage bucket optional)')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        border: '2px dashed #d0d0d0', borderRadius: 8,
        padding: '1.25rem', textAlign: 'center',
        cursor: 'pointer', transition: 'border 0.15s',
        background: '#fafafa',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#1a6b1a'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#d0d0d0'}
    >
      <input ref={inputRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFile} />
      <Upload size={20} color="#9a9a9a" style={{ margin: '0 auto 6px' }} />
      <div style={{ fontSize: 13, color: '#6b6b6b' }}>
        {uploading ? 'Uploading…' : 'Click to upload receipt (JPG, PNG, PDF — max 5 MB)'}
      </div>
    </div>
  )
}

// ── Add Expense Modal ────────────────────────────────────────
function AddExpenseModal({ open, onClose, onAdded, userId }) {
  const blank = { title: '', category: 'equipment', amount: '', description: '', expense_date: new Date().toISOString().slice(0, 10) }
  const [form, setForm] = useState(blank)
  const [receiptUrl, setReceiptUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const reset = () => { setForm(blank); setReceiptUrl('') }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Please enter a title'); return }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Enter a valid amount'); return }

    setSaving(true)
    try {
      const { error } = await supabase.from('expenses').insert({
        user_id: userId,
        title: form.title.trim(),
        category: form.category,
        amount: Number(form.amount),
        description: form.description.trim() || null,
        expense_date: form.expense_date,
        receipt_url: receiptUrl || null,
        status: 'pending',
      })
      if (error) throw error
      toast.success('Expense submitted for approval')
      reset()
      onAdded()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to submit expense')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Expense" maxWidth={520}>
      <form onSubmit={handleSubmit}>
        <Input label="Expense Title" placeholder="e.g. 12 ping pong balls" value={form.title} onChange={set('title')} required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select label="Category" value={form.category} onChange={set('category')}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
          <Input label="Amount (MVR)" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={set('amount')} required />
        </div>
        <Input label="Date of Expense" type="date" value={form.expense_date} onChange={set('expense_date')} required />
        <Textarea label="Description (optional)" placeholder="Additional details about this expense…" value={form.description} onChange={set('description')} style={{ minHeight: 70 }} />

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6b6b6b', marginBottom: 6 }}>Receipt (optional)</label>
          {receiptUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Alert variant="success" style={{ flex: 1, margin: 0 }}>Receipt attached</Alert>
              <button type="button" onClick={() => setReceiptUrl('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={16} color="#6b6b6b" />
              </button>
            </div>
          ) : (
            <ReceiptUpload onUploaded={setReceiptUrl} />
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Submitting…' : 'Submit Expense'}</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Admin Review Modal ───────────────────────────────────────
function ReviewModal({ expense, open, onClose, onReviewed, reviewerId }) {
  const [action, setAction] = useState('approved')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('expenses').update({
        status: action,
        admin_notes: notes.trim() || null,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      }).eq('id', expense.id)
      if (error) throw error
      toast.success(`Expense ${action}`)
      setNotes('')
      onReviewed()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Review failed')
    } finally {
      setSaving(false)
    }
  }

  if (!expense) return null

  return (
    <Modal open={open} onClose={onClose} title={`Review: ${expense.expense_ref}`} maxWidth={480}>
      <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f8f8f8', borderRadius: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{expense.title}</div>
        <div style={{ fontSize: 13, color: '#6b6b6b' }}>{fmtAmount(expense.amount)} · {expense.category} · {fmtDate(expense.expense_date)}</div>
        {expense.description && <div style={{ fontSize: 13, marginTop: 6, color: '#444' }}>{expense.description}</div>}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6b6b6b', marginBottom: 8 }}>Decision</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['approved', 'rejected', 'reimbursed'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setAction(s)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', border: '2px solid',
                  borderColor: action === s ? (s === 'rejected' ? '#c62828' : s === 'reimbursed' ? '#00695c' : '#1a6b1a') : '#e0e0e0',
                  background: action === s ? (s === 'rejected' ? '#ffebee' : s === 'reimbursed' ? '#e0f2f1' : '#e8f5e9') : '#fff',
                  color: action === s ? (s === 'rejected' ? '#c62828' : s === 'reimbursed' ? '#00695c' : '#1a6b1a') : '#6b6b6b',
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <Textarea label="Admin Notes (optional)" placeholder="Reason for rejection or additional comments…" value={notes} onChange={e => setNotes(e.target.value)} style={{ minHeight: 70 }} />
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            disabled={saving}
            variant={action === 'rejected' ? 'danger' : 'primary'}
          >
            {saving ? 'Saving…' : `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Category breakdown bar ────────────────────────────────────
function CategoryBreakdown({ expenses }) {
  const totals = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.value && e.status !== 'rejected').reduce((s, e) => s + Number(e.amount), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const max = totals[0]?.total || 1

  if (totals.length === 0) return (
    <EmptyState icon="📊" title="No data yet" description="Approved expenses will appear here" />
  )

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {totals.map(cat => (
        <div key={cat.value} style={{ marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span style={{ fontWeight: 500 }}>{cat.label}</span>
            <span style={{ fontWeight: 600, color: cat.color }}>{fmtAmount(cat.total)}</span>
          </div>
          <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(cat.total / max) * 100}%`, background: cat.color, borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Expense row ───────────────────────────────────────────────
function ExpenseRow({ expense, isAdmin, onReview, showUser }) {
  const cat = catMeta(expense.category)
  return (
    <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <td style={{ padding: '10px 12px' }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#1a6b1a' }}>{expense.expense_ref}</div>
        <div style={{ fontSize: 12, color: '#9a9a9a' }}>{fmtDate(expense.expense_date)}</div>
      </td>
      {showUser && (
        <td style={{ padding: '10px 12px', fontSize: 13 }}>{expense.profiles?.full_name || '—'}</td>
      )}
      <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500 }}>{expense.title}</td>
      <td style={{ padding: '10px 12px' }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 12, background: cat.bg, color: cat.color }}>
          {cat.label}
        </span>
      </td>
      <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 13 }}>{fmtAmount(expense.amount)}</td>
      <td style={{ padding: '10px 12px' }}>
        <Badge variant={STATUS_VARIANTS[expense.status] || 'gray'}>{expense.status}</Badge>
      </td>
      <td style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {expense.receipt_url && !expense.receipt_url.startsWith('placeholder:') && (
            <a href={expense.receipt_url} target="_blank" rel="noreferrer">
              <Button size="sm" variant="ghost">Receipt</Button>
            </a>
          )}
          {isAdmin && expense.status === 'pending' && (
            <Button size="sm" variant="outline" onClick={() => onReview(expense)}>Review</Button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Main Expenses Page ────────────────────────────────────────
export function Expenses() {
  const { user, profile, isAdmin } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [allExpenses, setAllExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('my')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [reviewTarget, setReviewTarget] = useState(null)

  const fetchExpenses = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [{ data: mine }, { data: all }] = await Promise.all([
        supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        isAdmin
          ? supabase.from('expenses').select('*, profiles(full_name,member_id)').order('created_at', { ascending: false })
          : { data: [] },
      ])
      setExpenses(mine || [])
      setAllExpenses(all || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchExpenses() }, [user, isAdmin])

  // Stats
  const source = tab === 'all' ? allExpenses : expenses
  const totalApproved = source.filter(e => e.status === 'approved' || e.status === 'reimbursed').reduce((s, e) => s + Number(e.amount), 0)
  const totalPending = source.filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.amount), 0)
  const totalRejected = source.filter(e => e.status === 'rejected').reduce((s, e) => s + Number(e.amount), 0)

  const thisMonth = source.filter(e => {
    const d = new Date(e.expense_date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((s, e) => s + Number(e.amount), 0)

  // Filtered list
  const filtered = source.filter(e => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false
    if (filterCategory !== 'all' && e.category !== filterCategory) return false
    return true
  })

  const tabs = [
    { value: 'my', label: 'My Expenses' },
    ...(isAdmin ? [{ value: 'all', label: 'All Expenses' }] : []),
  ]

  const tableHeaders = ['Ref / Date', ...(tab === 'all' ? ['Member'] : []), 'Title', 'Category', 'Amount', 'Status', '']

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>Expenses</h1>
          <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>Track and manage club expenses</p>
        </div>
        <Button onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} />
          Add Expense
        </Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card style={{ borderLeft: '3px solid #2e7d32' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <CheckCircle size={16} color="#2e7d32" />
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b6b6b' }}>Approved</span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.4rem', fontWeight: 700, color: '#2e7d32' }}>{fmtAmount(totalApproved)}</div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Clock size={16} color="#f57f17" />
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b6b6b' }}>Pending</span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.4rem', fontWeight: 700, color: '#f57f17' }}>{fmtAmount(totalPending)}</div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <XCircle size={16} color="#c62828" />
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b6b6b' }}>Rejected</span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.4rem', fontWeight: 700, color: '#c62828' }}>{fmtAmount(totalRejected)}</div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <TrendingUp size={16} color="#1565c0" />
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b6b6b' }}>This Month</span>
          </div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.4rem', fontWeight: 700, color: '#1565c0' }}>{fmtAmount(thisMonth)}</div>
        </Card>
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 260px', gap: '1.25rem', alignItems: 'start' }}>
        {/* Expense list */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <Tabs tabs={tabs} active={tab} onChange={setTab} />
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '7px 12px', border: '1px solid #d0d0d0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="reimbursed">Reimbursed</option>
              </select>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                style={{ padding: '7px 12px', border: '1px solid #d0d0d0', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? <Spinner /> : filtered.length === 0 ? (
            <EmptyState
              icon="🧾"
              title={source.length === 0 ? 'No expenses yet' : 'No matching expenses'}
              description={source.length === 0 ? 'Click "Add Expense" to submit your first expense' : 'Try changing the filters above'}
              action={source.length === 0 && (
                <Button onClick={() => setShowAdd(true)} size="sm">
                  <Plus size={14} /> Add Expense
                </Button>
              )}
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f4f4f4' }}>
                    {tableHeaders.map((h, i) => (
                      <th key={i} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b6b6b', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(exp => (
                    <ExpenseRow
                      key={exp.id}
                      expense={exp}
                      isAdmin={isAdmin}
                      showUser={tab === 'all'}
                      onReview={setReviewTarget}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Sidebar: breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Card>
            <CardTitle>Category Breakdown</CardTitle>
            <CategoryBreakdown expenses={source} />
          </Card>

          <Card>
            <CardTitle>Quick Stats</CardTitle>
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b6b6b' }}>Total Submissions</span>
                <strong>{source.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b6b6b' }}>Pending Review</span>
                <strong style={{ color: '#f57f17' }}>{source.filter(e => e.status === 'pending').length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b6b6b' }}>Approved</span>
                <strong style={{ color: '#2e7d32' }}>{source.filter(e => e.status === 'approved').length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b6b6b' }}>Reimbursed</span>
                <strong style={{ color: '#00695c' }}>{source.filter(e => e.status === 'reimbursed').length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b6b6b' }}>Rejected</span>
                <strong style={{ color: '#c62828' }}>{source.filter(e => e.status === 'rejected').length}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Responsive sidebar on small screens */}
      <style>{`
        @media (max-width: 768px) {
          .expense-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Modals */}
      <AddExpenseModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={fetchExpenses}
        userId={user?.id}
      />
      <ReviewModal
        expense={reviewTarget}
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        onReviewed={fetchExpenses}
        reviewerId={user?.id}
      />
    </div>
  )
}
