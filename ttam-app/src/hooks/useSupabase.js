import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Generic Supabase query hook
 * Usage:
 *   const { data, loading, error, refetch } = useQuery(
 *     () => supabase.from('tournaments').select('*').order('start_date')
 *   )
 */
export function useQuery(queryFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: result, error: err } = await queryFn()
      if (err) throw err
      setData(result)
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { execute() }, [execute])

  return { data, loading, error, refetch: execute }
}

/**
 * Real-time subscription hook
 * Usage:
 *   const { data } = useRealtimeQuery('notifications', '*', { user_id: userId })
 */
export function useRealtimeQuery(table, select = '*', filter = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial fetch
    let query = supabase.from(table).select(select)
    Object.entries(filter).forEach(([key, val]) => { query = query.eq(key, val) })
    query.then(({ data: rows }) => { if (rows) setData(rows); setLoading(false) })

    // Subscribe to changes
    const channel = supabase
      .channel(`${table}-realtime`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (payload.eventType === 'INSERT') setData(d => [payload.new, ...d])
        if (payload.eventType === 'UPDATE') setData(d => d.map(r => r.id === payload.new.id ? payload.new : r))
        if (payload.eventType === 'DELETE') setData(d => d.filter(r => r.id !== payload.old.id))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])

  return { data, loading }
}

/**
 * Mutation hook for create/update/delete
 */
export function useMutation(mutationFn) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const mutate = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await mutationFn(...args)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [mutationFn])

  return { mutate, loading, error }
}

/**
 * Debounced search hook
 */
export function useSearch(delay = 300) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), delay)
    return () => clearTimeout(timer)
  }, [query, delay])

  return { query, setQuery, debouncedQuery }
}

/**
 * Local storage hook
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setItem = (newValue) => {
    try {
      setValue(newValue)
      window.localStorage.setItem(key, JSON.stringify(newValue))
    } catch (error) {
      console.error('localStorage error:', error)
    }
  }

  return [value, setItem]
}
