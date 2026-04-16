import jsPDF from 'jspdf'
import { format } from 'date-fns'

/**
 * Generate a professional PDF invoice for TTAM
 * @param {Object} invoice
 * @param {Object} user
 * @param {Object} booking
 */
export function generateInvoicePDF(invoice, user, booking) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 20

  // ── Header band ─────────────────────────────────────────
  doc.setFillColor(15, 74, 15)   // green-dark
  doc.rect(0, 0, W, 42, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('TTAM', margin, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Table Tennis Association of Maldives', margin, 25)
  doc.text('Artificial Beach Area, Male\' 20095, Maldives', margin, 30)
  doc.text('info@ttam.mv  |  ttam.mv', margin, 35)

  // Invoice label right side
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.text('INVOICE', W - margin, 20, { align: 'right' })
  doc.setFontSize(11)
  doc.text(invoice.invoice_number || 'INV-2026-001', W - margin, 28, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Issued: ${format(new Date(invoice.created_at || new Date()), 'dd MMM yyyy')}`, W - margin, 34, { align: 'right' })
  doc.text(`Due: ${invoice.due_date ? format(new Date(invoice.due_date), 'dd MMM yyyy') : 'Upon receipt'}`, W - margin, 39, { align: 'right' })

  // ── Bill To ──────────────────────────────────────────────
  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('BILLED TO', margin, 55)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(user?.full_name || 'Member', margin, 62)
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(user?.email || '', margin, 68)
  doc.text(user?.phone || '', margin, 73)
  doc.text(`Member ID: ${user?.member_id || '—'}`, margin, 78)

  // Status badge
  const statusColor = invoice.status === 'paid' ? [46, 125, 50] : [198, 40, 40]
  doc.setFillColor(...statusColor)
  doc.roundedRect(W - margin - 28, 52, 28, 10, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text((invoice.status || 'UNPAID').toUpperCase(), W - margin - 14, 58.5, { align: 'center' })

  // ── Table header ─────────────────────────────────────────
  doc.setFillColor(232, 245, 232)
  doc.rect(margin, 88, W - margin * 2, 9, 'F')
  doc.setTextColor(15, 74, 15)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('DESCRIPTION', margin + 2, 94)
  doc.text('DATE', 120, 94)
  doc.text('QTY', 150, 94)
  doc.text('AMOUNT', W - margin - 2, 94, { align: 'right' })

  // ── Line items ───────────────────────────────────────────
  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  let y = 106

  const items = booking ? [
    {
      desc: `Table Booking – ${booking.table_name || 'Table'}`,
      sub: `${booking.start_time || ''} – ${booking.end_time || ''} · ${booking.booking_type || 'Member'} rate`,
      date: booking.booking_date ? format(new Date(booking.booking_date), 'dd MMM yyyy') : '',
      qty: `${booking.duration_hours || 1} hr`,
      amount: `MVR ${Number(booking.amount || 0).toFixed(2)}`,
    },
  ] : [
    { desc: 'Table Booking', sub: '', date: format(new Date(), 'dd MMM yyyy'), qty: '1 hr', amount: `MVR ${Number(invoice.amount || 0).toFixed(2)}` },
  ]

  items.forEach(item => {
    doc.setFont('helvetica', 'bold')
    doc.text(item.desc, margin + 2, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    doc.setFontSize(8)
    doc.text(item.sub, margin + 2, y + 5)
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text(item.date, 120, y)
    doc.text(item.qty, 150, y)
    doc.text(item.amount, W - margin - 2, y, { align: 'right' })
    y += 14

    // Divider
    doc.setDrawColor(220, 220, 220)
    doc.line(margin, y - 2, W - margin, y - 2)
  })

  // ── Totals ───────────────────────────────────────────────
  y += 4
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(9)
  doc.text('Subtotal', W - margin - 44, y)
  doc.setTextColor(30, 30, 30)
  doc.text(`MVR ${Number(invoice.amount || 0).toFixed(2)}`, W - margin - 2, y, { align: 'right' })
  y += 7

  doc.setTextColor(100, 100, 100)
  doc.text('Tax (0%)', W - margin - 44, y)
  doc.setTextColor(30, 30, 30)
  doc.text('MVR 0.00', W - margin - 2, y, { align: 'right' })
  y += 3

  doc.setDrawColor(15, 74, 15)
  doc.line(W - margin - 60, y + 2, W - margin, y + 2)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 74, 15)
  doc.text('TOTAL DUE', W - margin - 44, y)
  doc.text(`MVR ${Number(invoice.amount || 0).toFixed(2)}`, W - margin - 2, y, { align: 'right' })

  // ── Payment instructions ─────────────────────────────────
  y += 20
  doc.setFillColor(232, 245, 232)
  doc.roundedRect(margin, y, W - margin * 2, 36, 3, 3, 'F')

  doc.setTextColor(15, 74, 15)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('PAYMENT INSTRUCTIONS', margin + 4, y + 8)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(60, 60, 60)
  doc.setFontSize(8.5)
  doc.text('Bank: Bank of Maldives (BML)  |  Account: 7710000XXXXXX  |  Account Name: Table Tennis Association of Maldives', margin + 4, y + 16)
  doc.text('Also accepted: MIB, MCB, mFaisa, MePay', margin + 4, y + 22)
  doc.text('After payment, upload your transfer slip at: ttam.mv/payments', margin + 4, y + 28)

  // ── Footer ───────────────────────────────────────────────
  doc.setFillColor(15, 74, 15)
  doc.rect(0, 280, W, 17, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Thank you for being a valued TTAM member!', W / 2, 286, { align: 'center' })
  doc.text('ttam.mv  |  info@ttam.mv  |  +960 300-xxxx', W / 2, 291, { align: 'center' })

  doc.save(`${invoice.invoice_number || 'TTAM-Invoice'}.pdf`)
}
