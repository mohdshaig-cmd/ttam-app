import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

export function useTournaments() {
  const { user } = useAuth()
  const [tournaments, setTournaments] = useState([])
  const [myRegistrations, setMyRegistrations] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: t }, regRes] = await Promise.all([
        supabase
          .from('tournaments')
          .select(`
            *,
            tournament_registrations(count)
          `)
          .order('start_date'),
        user
          ? supabase
              .from('tournament_registrations')
              .select('tournament_id, status')
              .eq('user_id', user.id)
          : Promise.resolve({ data: [] }),
      ])
      if (t) {
        setTournaments(
          t.map(tour => ({
            ...tour,
            registration_count: tour.tournament_registrations?.[0]?.count ?? 0,
          }))
        )
      }
      if (regRes.data) setMyRegistrations(regRes.data.map(r => r.tournament_id))
    } catch (err) {
      console.error('Tournament fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  const register = async (tournamentId, category = '') => {
    if (!user) { toast.error('Please sign in to register'); return }
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .insert({ tournament_id: tournamentId, user_id: user.id, category })
      if (error) {
        if (error.code === '23505') throw new Error('Already registered for this tournament')
        throw error
      }
      setMyRegistrations(r => [...r, tournamentId])
      toast.success('Registration successful!')
    } catch (err) {
      toast.error(err.message)
      throw err
    }
  }

  const withdraw = async (tournamentId) => {
    try {
      await supabase
        .from('tournament_registrations')
        .update({ status: 'withdrawn' })
        .eq('tournament_id', tournamentId)
        .eq('user_id', user.id)
      setMyRegistrations(r => r.filter(id => id !== tournamentId))
      toast.success('Withdrawn from tournament')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const isRegistered = (id) => myRegistrations.includes(id)

  return {
    tournaments, loading, myRegistrations,
    register, withdraw, isRegistered, refetch: fetch,
  }
}
