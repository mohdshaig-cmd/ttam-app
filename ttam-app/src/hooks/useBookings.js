import { useState, useEffect, useCallback } from 'react'
import { supabase, createBooking, getBookedSlots } from '../lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export function useBookings() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchBookings = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`*, tables(name, number)`)
        .eq('user_id', user.id)
        .order('booking_date', { ascending: false })
      if (error) throw error
      setBookings(data || [])
    } catch (err) {
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const book = async (payload) => {
    setLoading(true)
    try {
      const data = await createBooking({ ...payload, user_id: user.id })
      await fetchBookings()
      toast.success('Booking confirmed!')
      return data
    } catch (err) {
      toast.error(err.message || 'Booking failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const cancel = async (bookingId, reason) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancelled_reason: reason })
        .eq('id', bookingId)
        .eq('user_id', user.id)
      if (error) throw error
      await fetchBookings()
      toast.success('Booking cancelled')
    } catch (err) {
      toast.error('Failed to cancel booking')
      throw err
    }
  }

  return { bookings, loading, book, cancel, refetch: fetchBookings }
}

export function useTables() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('tables').select('*').eq('status', 'available').order('number')
      .then(({ data, error }) => {
        if (!error) setTables(data || [])
        setLoading(false)
      })
  }, [])

  return { tables, loading }
}

export function useTableAvailability(tableId, date) {
  const [bookedSlots, setBookedSlots] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!tableId || !date) return
    setLoading(true)
    getBookedSlots(tableId, date)
      .then(setBookedSlots)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tableId, date])

  const isSlotBooked = (startTime) => {
    return bookedSlots.some(s => s.start_time === startTime)
  }

  return { bookedSlots, loading, isSlotBooked }
}
