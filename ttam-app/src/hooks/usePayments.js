import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export function usePayments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [{ data: p }, { data: i }] = await Promise.all([
        supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('invoices')
          .select('*, bookings(booking_ref, booking_date, start_time, end_time, duration_hours, tables(name))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ])
      if (p) setPayments(p)
      if (i) setInvoices(i)
    } catch (err) {
      console.error('Payment fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  const submitPayment = async (payload) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      await fetchAll()
      toast.success('Payment submitted! Admin will verify within 24 hours.')
      return data
    } catch (err) {
      toast.error(err.message || 'Payment submission failed')
      throw err
    }
  }

  const totalVerified = payments
    .filter(p => p.status === 'verified')
    .reduce((s, p) => s + Number(p.amount || 0), 0)

  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((s, p) => s + Number(p.amount || 0), 0)

  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue')

  return {
    payments, invoices, loading,
    submitPayment, refetch: fetchAll,
    totalVerified, totalPending, unpaidInvoices,
  }
}
