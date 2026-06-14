import { useState, useEffect } from "react"
import { Link } from "react-router"
import { motion } from "motion/react"
import {
  Bell, X, Settings,
  ArrowRight, MoreHorizontal, Trash2, Check
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu"
import { staggerContainer, staggerItem } from "@/app/lib/motion"
import { api } from "@/app/lib/api"

type Notification = {
  id: string
  icon?: React.ElementType
  iconColor: string
  iconBg: string
  title: string
  body: string
  time: string
  date: string
  read: boolean
  type: "booking" | "payment" | "review" | "message" | "system"
  actionLabel?: string
  actionHref?: string
}

const typeLabels: Record<string, string> = {
  booking: "Bookings",
  payment: "Payments",
  review: "Reviews",
  message: "Messages",
  system: "System",
}

function formatApiNotification(n: any): Notification {
  return {
    id: String(n.id),
    iconColor: "text-brand-600",
    iconBg: "bg-brand-50",
    title: n.title || n.subject || "Notification",
    body: n.body || n.message || "",
    time: n.created_at ? new Date(n.created_at).toLocaleDateString() : "",
    date: n.created_at ? new Date(n.created_at).toLocaleDateString([], { month: "short", day: "numeric" }) : "",
    read: !!n.read_at,
    type: (n.notification_type || n.kind || "system") as Notification["type"],
    actionLabel: n.action_label,
    actionHref: n.action_url,
  }
}

export function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const data = await api.get("/notifications")
        const arr = Array.isArray(data) ? data : (data?.notifications ?? [])
        setItems(arr.map(formatApiNotification))
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  const unread = items.filter(n => !n.read).length

  function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function deleteItem(id: string) {
    setItems(prev => prev.filter(n => n.id !== id))
  }

  function clearAll() {
    setItems([])
  }

  const filtered = activeTab === "all" ? items : items.filter(n => n.type === activeTab)

  // Group by date
  const groups: { date: string; items: Notification[] }[] = []
  filtered.forEach(item => {
    const group = groups.find(g => g.date === item.date)
    if (group) group.items.push(item)
    else groups.push({ date: item.date, items: [item] })
  })

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground text-sm">Loading notifications...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700 }}>
            Notifications
          </h1>
          {unread > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">{unread} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
              <Check className="h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={clearAll} className="text-error gap-2">
                <Trash2 className="h-4 w-4" /> Clear all notifications
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="gap-2">
                  <Settings className="h-4 w-4" /> Notification settings
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-muted/50 gap-1">
          <TabsTrigger value="all">
            All {unread > 0 && <Badge className="ml-1.5 bg-primary text-white text-xs h-4 px-1.5">{unread}</Badge>}
          </TabsTrigger>
          {["booking", "payment", "review", "message"].map(type => (
            <TabsTrigger key={type} value={type}>
              {typeLabels[type]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Notifications */}
      {groups.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground mb-1">No notifications</p>
          <p className="text-sm text-muted-foreground">You're all caught up!</p>
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
          {groups.map(group => (
            <div key={group.date}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{group.date}</p>
              <div className="space-y-2">
                {group.items.map(item => (
                  <motion.div
                    key={item.id}
                    variants={staggerItem}
                    layout
                    className={`relative flex gap-4 p-4 rounded-2xl border transition-all group
                      ${item.read ? "bg-card border-border" : "bg-brand-50/30 border-brand-200/60"}`}
                  >
                    {/* Unread dot */}
                    {!item.read && (
                      <div className="absolute left-4 top-4 h-2 w-2 rounded-full bg-primary" />
                    )}

                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg} ${item.read ? "" : "mt-1"}`}>
                      {item.icon
                        ? <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                        : <Bell className={`h-5 w-5 ${item.iconColor}`} />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className={`text-sm font-medium ${item.read ? "text-foreground" : "text-foreground"}`}>
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-1">
                            {!item.read && (
                              <button onClick={() => markRead(item.id)} className="h-6 w-6 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="Mark read">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button onClick={() => deleteItem(item.id)} className="h-6 w-6 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-error transition-colors" title="Delete">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">{item.body}</p>
                      {item.actionLabel && item.actionHref && (
                        <Link
                          to={item.actionHref}
                          onClick={() => markRead(item.id)}
                          className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:text-primary/80 transition-colors"
                        >
                          {item.actionLabel} <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
