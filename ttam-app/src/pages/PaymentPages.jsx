import { useState, useEffect } from 'react'
import { Card, CardTitle, Badge, Button, Input, Select, Tabs, Spinner, EmptyState, Alert } from '../components/UI'
import { SlipUpload, InvoiceView } from '../components/Payment'
import { generateInvoicePDF } from '../lib/pdf'
import { sendInvoiceEmail } from '../lib/notifications'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

// ════════════════════════════════════════════
// Payments Page
// ════════════════════════════════════════════
export function Payments() {
  const { user, profile } = useAuth()
  const [payments, setPayments] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [slipUrl, setSlipUrl] = useState('')
  const [form, setForm] = useState({
    booking_id: '', amount: '', payment_method: 'BML', transaction_ref: '', notes: '',
  })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('bookings').select('id,booking_ref,booking_date,tables(name)').eq('user_id', user.id).neq('status', 'cancelled'),
    ]).then(([{ data: p }, { data: b }]) => {
      if (p) setPayments(p)
      if (b) setBookings(b)
      setLoading(false)
    })
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!slipUrl) { toast.error('Please upload your transfer slip'); return }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('payments').insert({
        user_id: user.id,
        booking_id: form.booking_id || null,
        amount: Number(form.amount),
        payment_method: form.payment_method,
        transaction_ref: form.transaction_ref,
        slip_url: slipUrl,
        notes: form.notes,
        status: 'pending',
      })
      if (error) throw error
      toast.success('Payment submitted! Admin will verify within 24 hours.')
      setForm({ booking_id: '', amount: '', payment_method: 'BML', transaction_ref: '', notes: '' })
      setSlipUrl('')
      const { data } = await supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      if (data) setPayments(data)
    } catch (err) {
      toast.error(err.message || 'Payment submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const totalPaid = payments.filter(p => p.status === 'verified').reduce((s, p) => s + Number(p.amount), 0)
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>Payments</h1>
        <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>Submit and track your payments</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card style={{ borderLeft: '3px solid #1a6b1a' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b6b6b', marginBottom: 6 }}>Verified Paid</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700, color: '#2e7d32' }}>MVR {totalPaid}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b6b6b', marginBottom: 6 }}>Pending Verification</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700, color: '#f57f17' }}>MVR {totalPending}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b6b6b', marginBottom: 6 }}>Total Payments</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>{payments.length}</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '1.25rem' }}>
        {/* Upload form */}
        <Card>
          <CardTitle>Submit Payment</CardTitle>
          <form onSubmit={handleSubmit} style={{ marginTop: '0.75rem' }}>
            <Select label="Payment For" value={form.booking_id} onChange={set('booking_id')}>
              <option value="">— Select booking —</option>
              {bookings.map(b => (
                <option key={b.id} value={b.id}>{b.booking_ref} · {b.tables?.name} · {b.booking_date}</option>
              ))}
              <option value="membership">Annual Membership Renewal</option>
              <option value="tournament">Tournament Registration</option>
            </Select>
            <Input label="Amount Paid (MVR)" type="number" min="1" placeholder="0.00" value={form.amount} onChange={set('amount')} required />
            <Select label="Bank / Transfer Method" value={form.payment_method} onChange={set('payment_method')}>
              <option value="BML">Bank of Maldives (BML)</option>
              <option value="MIB">Maldives Islamic Bank (MIB)</option>
              <option value="MCB">MCB Maldives</option>
              <option value="mFaisa">mFaisa (Mobile Transfer)</option>
              <option value="MePay">MePay</option>
              <option value="cash">Cash (at counter)</option>
            </Select>
            <Input label="Transaction Reference" placeholder="TXN-20260415-XXXX" value={form.transaction_ref} onChange={set('transaction_ref')} />
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6b6b6b', marginBottom: 6 }}>Transfer Slip / Screenshot</label>
              {slipUrl ? (
                <Alert variant="success">✓ Slip uploaded successfully</Alert>
              ) : (
                <SlipUpload onUploaded={setSlipUrl} />
              )}
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#6b6b6b', marginBottom: 6 }}>Notes (optional)</label>
              <textarea value={form.notes} onChange={set('notes')} placeholder="Any additional notes…" style={{ width: '100%', padding: '10px 14px', border: '1px solid #d0d0d0', borderRadius: 8, fontSize: 14, minHeight: 70, resize: 'vertical' }} />
            </div>
            <Button type="submit" fullWidth disabled={submitting}>{submitting ? 'Submitting…' : '📤 Submit Payment'}</Button>
          </form>
        </Card>

        {/* Payment history */}
        <Card>
          <CardTitle>Payment History</CardTitle>
          {loading ? <Spinner /> : payments.length === 0 ? (
            <EmptyState icon="💳" title="No payments yet" description="Submit your first payment above" />
          ) : (
            <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ background: '#f4f4f4' }}>
                  {['Date','For','Amount','Method','Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b6b6b' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                      <td style={{ padding: '10px 12px' }}>{p.created_at?.slice(0, 10)}</td>
                      <td style={{ padding: '10px 12px' }}>{p.booking_id ? 'Booking' : 'Other'}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>MVR {p.amount}</td>
                      <td style={{ padding: '10px 12px' }}>{p.payment_method}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge variant={p.status === 'verified' ? 'green' : p.status === 'rejected' ? 'red' : 'yellow'}>{p.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════
// Invoices Page
// ════════════════════════════════════════════
export function Invoices() {
  const { user, profile } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [selected, setSelected] = useState(null)
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) { setInvoices(data); if (data[0]) setSelected(data[0]) } setLoading(false) })
  }, [user])

  const handleSelect = async (inv) => {
    setSelected(inv)
    if (inv.booking_id) {
      const { data } = await supabase.from('bookings').select('*, tables(name)').eq('id', inv.booking_id).single()
      setBooking(data ? { ...data, table_name: data.tables?.name } : null)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700 }}>Invoices</h1>
        <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>View and download your invoices</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '1.25rem' }}>
        {/* Invoice list */}
        <Card>
          <CardTitle>All Invoices</CardTitle>
          {loading ? <Spinner /> : invoices.length === 0 ? (
            <EmptyState icon="🧾" title="No invoices yet" description="Invoices are auto-generated on booking" />
          ) : (
            <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ background: '#f4f4f4' }}>
                  {['Invoice #','Date','Amount','Status',''].map((h,i) => (
                    <th key={i} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b6b6b' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: selected?.id === inv.id ? '#f8fdf8' : '#fff' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1a6b1a' }}>{inv.invoice_number}</td>
                      <td style={{ padding: '10px 12px' }}>{inv.created_at?.slice(0, 10)}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>MVR {inv.amount}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge variant={inv.status === 'paid' ? 'green' : inv.status === 'overdue' ? 'red' : 'yellow'}>{inv.status}</Badge>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Button size="sm" variant="ghost" onClick={() => handleSelect(inv)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Invoice preview */}
        {selected && (
          <InvoiceView
            invoice={selected}
            user={profile}
            booking={booking}
            onDownload={() => generateInvoicePDF(selected, profile, booking)}
            onEmail={() => { sendInvoiceEmail({ invoice: selected, user: profile }); toast.success('Invoice emailed!') }}
          />
        )}
      </div>
    </div>
  )
}
