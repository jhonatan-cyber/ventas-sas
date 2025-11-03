"use client"

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  readAt?: string | null
  createdAt: string
  expiresAt?: string | null
}

interface UseNotificationsOptions {
  system: 'admin' | 'sas'
  slug?: string
  enabled?: boolean
}

export function useNotifications({ system, slug, enabled = true }: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  // Obtener notificaciones iniciales
  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams({ system })
      if (slug) params.append('slug', slug)

      const response = await fetch(`/api/notifications?${params.toString()}` , {
        credentials: 'include',
      })
      if (!response.ok) return

      const data = await response.json()
      setNotifications(data.notifications || [])
      
      // Contar no leídas
      const unread = data.notifications?.filter((n: Notification) => !n.isRead).length || 0
      setUnreadCount(unread)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [system, slug])

  // Marcar como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const params = new URLSearchParams({ system })
      if (slug) params.append('slug', slug)

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markAll: false }),
      })

      if (!response.ok) return

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [system, slug])

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      const params = new URLSearchParams({ system })
      if (slug) params.append('slug', slug)

      const response = await fetch(`/api/notifications/all?${params.toString()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (!response.ok) return

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }, [system, slug])

  // Conectar al stream SSE
  useEffect(() => {
    if (!enabled) return

    const params = new URLSearchParams({ system })
    if (slug) params.append('slug', slug)

    const eventSource = new EventSource(`/api/notifications/stream?${params.toString()}`)

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'connected') {
          setIsConnected(true)
        } else if (data.type === 'new_notification') {
          const newNotifications = data.data as Notification[]
          setNotifications(prev => {
            // Evitar duplicados
            const existingIds = new Set(prev.map(n => n.id))
            const unique = newNotifications.filter(n => !existingIds.has(n.id))
            return [...unique, ...prev].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          })
          setUnreadCount(prev => prev + newNotifications.length)

          // Mostrar toast para nuevas notificaciones
          newNotifications.forEach(notification => {
            toast.info(notification.title, {
              description: notification.message,
              duration: 5000,
            })
          })
        } else if (data.type === 'notifications') {
          // Notificaciones iniciales
          setNotifications(data.data)
          const unread = data.data.filter((n: Notification) => !n.isRead).length
          setUnreadCount(unread)
        } else if (data.type === 'heartbeat') {
          // Mantener conexión viva
          setIsConnected(true)
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      // Reintentar conexión después de 5 segundos
      setTimeout(() => {
        if (enabled) {
          fetchNotifications()
        }
      }, 5000)
    }

    // Cargar notificaciones iniciales
    fetchNotifications()

    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [system, slug, enabled, fetchNotifications])

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  }
}

