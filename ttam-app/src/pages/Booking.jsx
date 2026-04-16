import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardTitle, Button, Alert, Modal, Select, Textarea } from '../components/UI'
import { TableGrid, TimeSlots, MiniCalendar, StepIndicator, BookingTypePicker } from '../components/Booking'
import { useBookings, useTables, useTableAvailability } from '../hooks/useBookings'
import { useAuth } from '../hooks/useAuth'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STEPS = ['Choose Table', 'Date & Time', 'Confirm & Pay']

const DURATION_OPTIONS = [
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 3, label: '3 hours' },
]

function addHours(timeStr, hours) {
  const [h, m] = timeStr.split(':').map(Number)
  return `${String(h + hours).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function fmt12(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const s = h >= 12 ? 'PM' : 'AM'
  return `${h > 12 ? h - 12 : h || 12}:${m.toString().padStart(2,'0')} ${s}`
}

export default function Booking() {
  const { profile } = useAuth()
  const { tables } = useTables()
  const { book } = useBookings()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [selectedTable, setSelectedTable] = useState(null)
  const [bookingType, setBookingType] = useState('member')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [duration, setDuration] = useState(1)
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [confirmedData, setConfirmedData] = useState(null)
  const [loading, setLoading] = useState(false)

  const { bookedSlots, isSlotBooked } = useTableAvailability(selectedTable?.id, selectedDate)
  const bookedSlotTimes = bookedSlots.map(s => s.start_time?.slice(0, 5))

  const rate = bookingType === 'guest'
    ? (selectedTable?.hourly_rate_guest || 150)
    : (selectedTable?.hourly_rate_member || 50)
  const totalAmount = rate * duration

  const handleConfirm = async () => {
    if (!selectedTable || !selectedDate || !selectedSlot) {
      toast.error('Please complete all booking details'); return
    }
    setLoading(true)
    try {
      const endTime = addHours(selectedSlot, duration)
      const booking = await book({
        table_id: selectedTable.id,
        booking_type: bookingType,
        booking_date: selectedDate,
        start_time: selectedSlot,
        end_time: endTime,
        duration_hours: duration,
        amount: totalAmount,
        notes,
      })
      setConfirmedData(booking)
      setConfirmed(true)
    } catch (err) {
      // Error already toasted in hook
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(0); setSelectedTable(null); setSelectedSlot(null)
    setNotes(''); setConfirmed(false); setConfirmedData(null)
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 6 }}>Dashboard › Book a Table</div>
        <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Book a Table</h1>
        <p style={{ color: '#6b6b6b', fontSize: 14, marginTop: 4 }}>Select your table, date and time slot</p>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      {/* ── Step 0: Choose table ── */}
      {step === 0 && (
        <>
          <Card style={{ marginBottom: '1.25rem' }}>
            <CardTitle>Select a Table</CardTitle>
            <p style={{ fontSize: 13, color: '#6b6b6b', marginBottom: '0.5rem' }}>🟢 Available &nbsp;&nbsp; 🔴 Occupied &nbsp;&nbsp; 🔵 Selected</p>
            <TableGrid
              tables={tables}
              selectedId={selectedTable?.id}
              bookedTableIds={[]}
              onSelect={setSelectedTable}
            />
          </Card>
          <Card>
            <CardTitle>Booking Type</CardTitle>
            <BookingTypePicker
              value={bookingType}
              onChange={setBookingType}
              memberRate={selectedTable?.hourly_rate_member || 50}
              guestRate={selectedTable?.hourly_rate_guest || 150}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <Button onClick={() => { if (!selectedTable) { toast.error('Please select a table'); return } setStep(1) }}>
                Next: Choose Date & Time →
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* ── Step 1: Date & Time ── */}
      {step === 1 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <Card>
              <CardTitle>Select Date</CardTitle>
              <MiniCalendar selected={selectedDate} onSelect={setSelectedDate} />
            </Card>
            <Card>
              <CardTitle>Available Slots — {format(new Date(selectedDate), 'd MMM yyyy')}</CardTitle>
              <TimeSlots
                selectedSlot={selectedSlot}
                bookedSlots={bookedSlotTimes}
                onSelect={setSelectedSlot}
              />
              <div style={{ marginTop: '1rem' }}>
                <Select
                  label="Duration"
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                >
                  {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </Select>
              </div>
            </Card>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="ghost" onClick={() => setStep(0)}>← Back</Button>
            <Button onClick={() => { if (!selectedSlot) { toast.error('Please select a time slot'); return } setStep(2) }}>
              Next: Confirm Booking →
            </Button>
          </div>
        </>
      )}

      {/* ── Step 2: Confirm ── */}
      {step === 2 && (
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <Card>
            <CardTitle>Booking Summary</CardTitle>
            <div style={{ marginTop: '1rem' }}>
              {[
                ['Table', selectedTable?.name],
                ['Date', format(new Date(selectedDate), 'EEEE, d MMMM yyyy')],
                ['Time', `${fmt12(selectedSlot)} – ${fmt12(addHours(selectedSlot, duration))}`],
                ['Duration', `${duration} hour${duration > 1 ? 's' : ''}`],
                ['Type', bookingType.charAt(0).toUpperCase() + bookingType.slice(1)],
                ['Rate', `MVR ${rate}/hr`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.06)', fontSize: 14 }}>
                  <span style={{ color: '#6b6b6b' }}>{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', fontWeight: 700, fontSize: '1.1rem' }}>
                <span>Total</span>
                <span style={{ color: '#1a6b1a' }}>MVR {totalAmount}</span>
              </div>
            </div>
            <Textarea
              label="Notes (optional)"
              placeholder="e.g. training with coach, doubles match…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ marginTop: '1.25rem' }}
            />
            <Alert variant="warning" style={{ marginBottom: '1rem' }}>
              ⚠️ This slot will be locked upon confirmation. No duplicate bookings allowed.
            </Alert>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="ghost" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</Button>
              <Button style={{ flex: 2 }} onClick={handleConfirm} disabled={loading}>
                {loading ? 'Confirming…' : '✓ Confirm & Pay'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation modal */}
      <Modal open={confirmed} onClose={reset}>
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#1a6b1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 1rem', color: '#fff' }}>✓</div>
          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.3rem', marginBottom: '0.5rem' }}>Booking Confirmed!</h3>
          <p style={{ color: '#6b6b6b', fontSize: 14 }}>
            {selectedTable?.name} · {format(new Date(selectedDate), 'd MMM yyyy')} · {fmt12(selectedSlot)}
          </p>
          <Alert variant="success" style={{ marginTop: '1.25rem', textAlign: 'left' }}>
            📧 Confirmation email sent to {profile?.email}
          </Alert>
          <p style={{ fontSize: 13, color: '#6b6b6b', marginTop: '0.75rem' }}>
            Booking ID: <strong>{confirmedData?.booking_ref || 'BK-' + Date.now()}</strong>
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
            <Button variant="outline" style={{ flex: 1 }} onClick={() => { reset(); navigate('/invoices') }}>View Invoice</Button>
            <Button style={{ flex: 1 }} onClick={() => { reset(); navigate('/my-bookings') }}>My Bookings</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
