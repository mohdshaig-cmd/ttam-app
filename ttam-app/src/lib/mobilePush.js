/**
 * TTAM Mobile Push Notifications
 * Handles Capacitor native push notifications for iOS and Android
 * Only activates when running as a native app (not in browser)
 */

let PushNotifications = null

async function loadCapacitor() {
  try {
    // Only import Capacitor when running as native app
    const cap = await import('@capacitor/push-notifications')
    PushNotifications = cap.PushNotifications
    return true
  } catch {
    return false
  }
}

export async function initMobilePush(supabaseUserId) {
  const isNative = !!window.Capacitor?.isNativePlatform?.()
  if (!isNative) return

  const loaded = await loadCapacitor()
  if (!loaded || !PushNotifications) return

  // Request permission
  const permResult = await PushNotifications.requestPermissions()
  if (permResult.receive !== 'granted') return

  // Register with APNs / FCM
  await PushNotifications.register()

  // Get the device token
  PushNotifications.addListener('registration', async (token) => {
    console.log('Push token:', token.value)
    // Save token to Supabase for server-side push sending
    if (supabaseUserId) {
      const { supabase } = await import('./supabase')
      await supabase.from('push_tokens').upsert({
        user_id: supabaseUserId,
        token: token.value,
        platform: window.Capacitor?.getPlatform?.() || 'unknown',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    }
  })

  // Handle registration errors
  PushNotifications.addListener('registrationError', (err) => {
    console.error('Push registration error:', err)
  })

  // Handle incoming push while app is open
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification)
    // Show a toast or update notification badge
    // The notification will still appear in the OS tray
  })

  // Handle tap on push notification
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const data = action.notification.data
    if (data?.url) {
      // Navigate to the relevant page
      window.location.href = data.url
    }
  })
}

export async function clearMobilePushListeners() {
  if (!PushNotifications) return
  await PushNotifications.removeAllListeners()
}
