import { useState, useEffect, useCallback, useRef } from "react"
import { AUTH_CLEARED_EVENT, syncAuthSession } from "./api"
import { api } from "./api"
import { getCableConsumer } from "./cable"

export type ApiNotification = {
  id: string
  notification_type: string
  data: Record<string, any>
  created_at: string
  read: boolean
}

export function useNotifications(enabled = true) {
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    if (!enabled) {
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
      return
    }

    syncAuthSession()
    const token = localStorage.getItem("token")
    if (!token) return

    let cancelled = false

    Promise.all([
      api.get("/notifications"),
      api.get("/notifications/unread_count"),
    ])
      .then(([notifs, countData]: any) => {
        if (cancelled) return
        if (Array.isArray(notifs)) {
          setNotifications(notifs.map((n: any) => ({ ...n, read: !!n.read_at })))
        }
        if (countData && typeof countData.count === "number") {
          setUnreadCount(countData.count)
        }
      })
      .catch(() => {
        // Session may have expired on a public page — api layer clears storage
      })

    try {
      const consumer = getCableConsumer()
      subscriptionRef.current = consumer.subscriptions.create(
        { channel: "NotificationChannel" },
        {
          received(data: ApiNotification) {
            if (cancelled) return
            setNotifications((prev) => [data, ...prev])
            setUnreadCount((c) => c + 1)
          },
        }
      )
    } catch {
      // No valid cable session (missing/expired token)
    }

    const stop = () => {
      cancelled = true
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
    }

    window.addEventListener(AUTH_CLEARED_EVENT, stop)

    return () => {
      stop()
      window.removeEventListener(AUTH_CLEARED_EVENT, stop)
    }
  }, [enabled])

  const markRead = useCallback(async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // ignore
    }
  }, [])

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read)
    await Promise.allSettled(unread.map((n) => api.post(`/notifications/${n.id}/read`)))
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [notifications])

  return { notifications, unreadCount, markRead, markAllRead }
}
