// supabase/functions/send-email/index.ts
// Deploy with: supabase functions deploy send-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = 'TTAM <noreply@ttam.mv>'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const { type, data } = await req.json()
    let subject = '', html = ''

    if (type === 'booking_confirmation') {
      const { booking, user } = data
      subject = `Booking Confirmed – ${booking.booking_ref}`
      html = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
          <div style="background:#0f4a0f;padding:24px 28px;border-radius:12px 12px 0 0;">
            <h2 style="color:#fff;margin:0;font-size:20px;">TTAM – Booking Confirmed ✓</h2>
            <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Table Tennis Association of Maldives</p>
          </div>
          <div style="background:#fff;padding:28px;border:1px solid #e0e0e0;border-radius:0 0 12px 12px;">
            <p style="font-size:15px;">Hi <strong>${user.full_name}</strong>,</p>
            <p style="color:#5a5a5a;line-height:1.6;">Your table booking has been confirmed. Details below:</p>
            <table style="width:100%;margin:20px 0;border-collapse:collapse;">
              ${[
                ['Booking Ref', booking.booking_ref],
                ['Table', booking.table_name],
                ['Date', booking.booking_date],
                ['Time', `${booking.start_time} – ${booking.end_time}`],
                ['Duration', `${booking.duration_hours} hour(s)`],
                ['Amount', `MVR ${booking.amount}`],
              ].map(([k,v]) => `<tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:10px 0;color:#6b6b6b;font-size:13px;">${k}</td><td style="padding:10px 0;font-weight:600;font-size:13px;text-align:right;">${v}</td></tr>`).join('')}
            </table>
            <div style="background:#e8f5e8;border-radius:8px;padding:14px;margin:16px 0;">
              <p style="color:#2e7d32;font-size:13px;margin:0;">⏰ Please complete payment within 7 days to keep your booking. Upload your transfer slip at <a href="https://ttam.mv/payments" style="color:#1a6b1a;">ttam.mv/payments</a></p>
            </div>
            <p style="font-size:13px;color:#6b6b6b;">Questions? Reply to this email or contact us at info@ttam.mv</p>
            <p style="font-size:13px;color:#6b6b6b;margin-top:16px;">– The TTAM Team</p>
          </div>
        </div>
      `
    }

    if (type === 'invoice') {
      const { invoice, user } = data
      subject = `Invoice ${invoice.invoice_number} – MVR ${invoice.amount}`
      html = `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;">
          <div style="background:#0f4a0f;padding:24px;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;">
            <div><h2 style="color:#fff;margin:0;">TTAM Invoice</h2></div>
            <div style="text-align:right;"><p style="color:#fff;margin:0;font-size:18px;font-weight:700;">${invoice.invoice_number}</p></div>
          </div>
          <div style="background:#fff;padding:28px;border:1px solid #e0e0e0;border-radius:0 0 12px 12px;">
            <p>Dear <strong>${user.full_name}</strong>,</p>
            <p style="color:#5a5a5a;">Please find your invoice details below. Payment is due within 7 days.</p>
            <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:20px 0;">
              <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#6b6b6b;">Invoice #</span><strong>${invoice.invoice_number}</strong></div>
              <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#6b6b6b;">Due Date</span><span>${invoice.due_date}</span></div>
              <div style="border-top:1px solid #e0e0e0;padding-top:10px;display:flex;justify-content:space-between;"><span style="font-weight:700;">Total Due</span><strong style="color:#1a6b1a;font-size:18px;">MVR ${invoice.amount}</strong></div>
            </div>
            <p style="font-size:13px;color:#6b6b6b;">Pay via BML, MIB, MCB, mFaisa or MePay and upload your slip at <a href="https://ttam.mv/payments">ttam.mv/payments</a></p>
          </div>
        </div>
      `
    }

    if (!subject) return new Response(JSON.stringify({ error: 'Unknown email type' }), { status: 400 })

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: data.user?.email, subject, html }),
    })

    const result = await res.json()
    return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
