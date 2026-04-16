import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Warn but don't crash — lets the app render a setup screen instead of a blank page
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️  TTAM: Missing Supabase environment variables.\n' +
    '   Copy .env.example to .env and add your keys from https://supabase.com\n' +
    '   VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.'
  )
}

// Use placeholder values so createClient doesn't throw — all DB calls will
// just fail with a network error (handled gracefully in each hook)
export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)

/** Fetch all booked time slots for a table on a given date */
export async function getBookedSlots(tableId, date) {
  const { data, error } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('table_id', tableId)
    .eq('booking_date', date)
    .neq('status', 'cancelled')
  if (error) throw error
  return data || []
}

/** Create a booking — server unique index prevents duplicates */
export async function createBooking(payload) {
  const { data, error } = await supabase
    .from('bookings')
    .insert(payload)
    .select()
    .single()
  if (error) {
    if (error.code === '23505') throw new Error('This slot is already booked. Please choose another time.')
    throw error
  }
  return data
}

/** Upload a payment slip to Supabase Storage */
export async function uploadSlip(file, userId) {
  const ext = file.name.split('.').pop()
  const path = `slips/${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('payment-slips')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('payment-slips').getPublicUrl(path)
  return publicUrl
}
