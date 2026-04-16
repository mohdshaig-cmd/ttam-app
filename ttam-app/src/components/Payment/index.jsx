import { useState, useRef } from 'react'
import { Upload, X, FileImage, FilePdf } from 'lucide-react'
import { Button, Alert } from '../UI'
import { uploadSlip } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

/* ── SlipUpload ─────────────────────────────────────────── */
export function SlipUpload({ onUploaded }) {
  const { user } = useAuth()
  const inputRef = useRef()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const handleFile = (f) => {
    if (!f) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(f.type)) { toast.error('Only JPG, PNG, WebP or PDF allowed'); return }
    if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return }
    setFile(f)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => setPreview(e.target.result)
      reader.readAsDataURL(f)
    } else {
      setPreview('pdf')
    }
  }

  const handleUpload = async () => {
    if (!file || !user) return
    setUploading(true)
    try {
      const url = await uploadSlip(file, user.id)
      toast.success('Slip uploaded successfully')
      onUploaded?.(url)
    } catch (err) {
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const clear = () => { setFile(null); setPreview(null) }

  return (
    <div>
      {!file ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#1a6b1a' : '#a5d6a7'}`,
            borderRadius: 12, padding: '2.5rem 1.5rem',
            textAlign: 'center', cursor: 'pointer',
            background: dragging ? '#e8f5e8' : '#f8fdf8',
            transition: 'all 0.2s',
          }}
        >
          <Upload size={32} style={{ color: '#1a6b1a', margin: '0 auto 0.75rem' }} />
          <p style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>Click to upload or drag & drop</p>
          <p style={{ fontSize: 12, color: '#6b6b6b', marginTop: 4 }}>JPG, PNG, PDF · Max 5MB</p>
        </div>
      ) : (
        <div style={{ border: '1px solid #c8e6c9', borderRadius: 12, padding: '1rem', background: '#f8fdf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {preview === 'pdf' ? <FilePdf size={24} style={{ color: '#c62828' }} /> : <FileImage size={24} style={{ color: '#1a6b1a' }} />}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{file.name}</div>
                <div style={{ fontSize: 11, color: '#6b6b6b' }}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            </div>
            <button onClick={clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b6b' }}><X size={18} /></button>
          </div>
          {preview && preview !== 'pdf' && (
            <img src={preview} alt="Slip preview" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8, border: '1px solid #e0e0e0', marginBottom: '0.75rem' }} />
          )}
          <Button onClick={handleUpload} disabled={uploading} fullWidth>
            {uploading ? 'Uploading…' : '📤 Submit Slip'}
          </Button>
        </div>
      )}
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
    </div>
  )
}

/* ── InvoiceView ────────────────────────────────────────── */
export function InvoiceView({ invoice, user, booking, onDownload, onEmail }) {
  if (!invoice) return null
  const statusColors = { paid: 'green', unpaid: 'red', overdue: 'yellow' }
  return (
    <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: '#0f4a0f', color: '#fff', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.4rem', fontWeight: 700 }}>TTAM</div>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>Table Tennis Association of Maldives</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>INVOICE</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.1rem', fontWeight: 700 }}>{invoice.invoice_number}</div>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: '1.5rem' }}>
        {/* Bill to + dates */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Billed to</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.full_name || 'Member'}</div>
            <div style={{ fontSize: 13, color: '#6b6b6b' }}>{user?.email}</div>
            <div style={{ fontSize: 13, color: '#6b6b6b' }}>Member ID: {user?.member_id}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6b6b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Details</div>
            <div style={{ fontSize: 13 }}>Issued: {invoice.created_at?.slice(0, 10)}</div>
            <div style={{ fontSize: 13, color: '#6b6b6b' }}>Due: {invoice.due_date || 'Upon receipt'}</div>
            <div style={{ marginTop: 6 }}>
              <span style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                background: invoice.status === 'paid' ? '#e8f5e9' : '#ffebee',
                color: invoice.status === 'paid' ? '#2e7d32' : '#c62828',
              }}>{invoice.status}</span>
            </div>
          </div>
        </div>
        {/* Line items */}
        <div style={{ background: '#f4f4f4', borderRadius: 8, overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.75rem', padding: '10px 14px', background: '#e8f5e8' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#1a6b1a', textTransform: 'uppercase' }}>Description</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#1a6b1a', textTransform: 'uppercase' }}>Qty</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#1a6b1a', textTransform: 'uppercase', textAlign: 'right' }}>Amount</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.75rem', padding: '14px', alignItems: 'start' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Table Booking – {booking?.table_name || 'Table'}</div>
              <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>{booking?.booking_date} · {booking?.start_time}–{booking?.end_time}</div>
            </div>
            <span style={{ fontSize: 14 }}>{booking?.duration_hours || 1} hr</span>
            <span style={{ fontSize: 14, fontWeight: 600, textAlign: 'right' }}>MVR {Number(invoice.amount).toFixed(2)}</span>
          </div>
        </div>
        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b6b6b', marginBottom: 6 }}><span>Subtotal</span><span>MVR {Number(invoice.amount).toFixed(2)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b6b6b', marginBottom: 10 }}><span>Tax (0%)</span><span>MVR 0.00</span></div>
            <div style={{ height: 1, background: '#1a6b1a', marginBottom: 10 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', color: '#1a6b1a' }}><span>Total</span><span>MVR {Number(invoice.amount).toFixed(2)}</span></div>
          </div>
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: '1.5rem' }}>
          <Button size="sm" onClick={onDownload}>📄 Download PDF</Button>
          <Button size="sm" variant="outline" onClick={onEmail}>📧 Email Invoice</Button>
        </div>
      </div>
    </div>
  )
}
