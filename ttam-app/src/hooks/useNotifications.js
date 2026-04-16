import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { markRead, markAllRead } from '../lib/notifications'
import { useAuth } from './useAuth'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data || [])
    setUnreadCount((data || []).filter(n => !n.read).length)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetch()
    if (!user) return
    // Real-time subscription
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
        setUnreadCount(c => c + 1)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, fetch])

  const handleMarkRead = async (id) => {
    await markRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    await markAllRead(user.id)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  return { notifications, unreadCount, loading, markRead: handleMarkRead, markAllRead: handleMarkAllRead, refetch: fetch }
}
