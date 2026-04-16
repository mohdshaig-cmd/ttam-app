import { supabase } from './supabase'

// ── In-app notifications (Supabase) ─────────────────────

export async function createNotification({ userId, type, title, body, actionUrl }) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    action_url: actionUrl,
  })
  if (error) console.error('Notification error:', error)
}

export async function markAllRead(userId) {
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
}

export async function markRead(notifId) {
  await supabase.from('notifications').update({ read: true }).eq('id', notifId)
}

// ── OneSignal Web Push ────────────────────────────────────

export function initOneSignal() {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID
  if (!appId || typeof window === 'undefined') return

  window.OneSignalDeferred = window.OneSignalDeferred || []
  const script = document.createElement('script')
  script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
  script.defer = true
  document.head.appendChild(script)

  window.OneSignalDeferred.push(async (OneSignal) => {
    await OneSignal.init({
      appId,
      notifyButton: { enable: false },
      allowLocalhostAsSecureOrigin: true,
    })
  })
}

export async function subscribePush() {
  if (!window.OneSignal) return false
  try {
    await window.OneSignal.Notifications.requestPermission()
    return true
  } catch {
    return false
  }
}

// ── Email via Resend (called from Supabase Edge Functions) ──
// In production, call your Supabase Edge Function instead of
// calling Resend directly from the browser (to keep key secret).

export async function sendBookingEmail(bookingData) {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'booking_confirmation',
        data: bookingData,
      },
    })
    if (error) throw error
  } catch (err) {
    console.error('Email send failed:', err)
  }
}

export async function sendInvoiceEmail(invoiceData) {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'invoice',
        data: invoiceData,
      },
    })
    if (error) throw error
  } catch (err) {
    console.error('Invoice email failed:', err)
  }
}
