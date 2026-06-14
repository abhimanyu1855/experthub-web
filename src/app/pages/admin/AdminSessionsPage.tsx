import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Video, Plus, Users, Clock, DollarSign, Loader2,
  Check, X, Calendar, XCircle
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { toast } from "sonner"
import { api } from "@/app/lib/api"

export function AdminSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [experts, setExperts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [capacity, setCapacity] = useState("20")
  const [price, setPrice] = useState("0")

  const fetchData = async () => {
    try {
      const [allSessions, allExperts] = await Promise.all([
        api.get("/group_sessions"),
        api.get("/experts")
      ])
      const list = Array.isArray(allSessions) ? allSessions : []
      const expertList = Array.isArray(allExperts) ? allExperts : (allExperts?.experts || [])
      setSessions(list)
      setExperts(expertList)
    } catch (err: any) {
      toast.error("Failed to load sessions: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await api.post("/group_sessions", {
        group_session: {
          title,
          description,
          start_time: startTime,
          end_time: endTime,
          max_participants: parseInt(capacity),
          price_cents: Math.round(parseFloat(price || "0") * 100)
        }
      })
      toast.success("Group session created!")
      setSessions(prev => [res, ...prev])
      setShowCreate(false)
      setTitle(""); setDescription(""); setStartTime(""); setEndTime("")
      setCapacity("20"); setPrice("0")
    } catch (err: any) {
      toast.error(err.message || "Failed to create session")
    } finally {
      setCreating(false)
    }
  }

  const totalRevenue = sessions.reduce((sum: number, s: any) => {
    const registeredCount = s.registered_count || 0
    return sum + registeredCount * (s.price_cents || 0)
  }, 0)

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-foreground">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Group Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage live group sessions, registrations, and revenue.</p>
        </div>
        <Button className="gap-2 rounded-xl" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Create Group Session
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Sessions", value: sessions.length, icon: Video, color: "text-primary", bg: "bg-brand-50" },
          { label: "Total Registrations", value: sessions.reduce((s: number, x: any) => s + (x.registered_count || 0), 0), icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
          { label: "Total Revenue", value: `$${(totalRevenue / 100).toFixed(0)}`, icon: DollarSign, color: "text-success", bg: "bg-success/10" }
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-5 shadow-card flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="font-bold text-foreground text-xl">{stat.value}</p>
                <p className="text-muted-foreground text-xs">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Session Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-modal space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-lg">Create Group Session</h3>
                <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Growth Marketing Masterclass" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    placeholder="What will attendees gain from this session?"
                    className="w-full bg-background border border-input rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Start Date & Time</Label>
                    <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} required className="rounded-xl text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>End Date & Time</Label>
                    <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} required className="rounded-xl text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Capacity (max participants)</Label>
                    <Input type="number" min="1" value={capacity} onChange={e => setCapacity(e.target.value)} required className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Price (USD, 0 = free)</Label>
                    <Input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} required className="rounded-xl" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating} className="gap-2">
                    {creating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...</> : <><Check className="h-3.5 w-3.5" /> Create Session</>}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
          <Video className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">No group sessions yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create a session for experts to host live group events.</p>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Group Session
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <p className="font-semibold text-foreground text-sm">All Sessions ({sessions.length})</p>
          </div>
          <div className="divide-y divide-border">
            {sessions.map(session => {
              const startDate = new Date(session.start_time)
              const endDate = new Date(session.end_time)
              const durationMin = Math.round((endDate.getTime() - startDate.getTime()) / 60000)
              const registeredCount = session.registered_count || 0
              const capacity = session.max_participants || 0
              const isFull = session["full?"] || registeredCount >= capacity
              const isPast = startDate < new Date()
              const revenue = (registeredCount * (session.price_cents || 0)) / 100

              return (
                <div key={session.id} className="px-5 py-4 flex items-start gap-4 hover:bg-muted/10 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                    <Video className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-sm">{session.title}</p>
                      {isFull && <Badge className="bg-error/10 text-error border-0 text-xs">Full</Badge>}
                      {isPast && <Badge className="bg-muted text-muted-foreground border-0 text-xs">Past</Badge>}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {startDate.toLocaleDateString([], { month: "short", day: "numeric" })} at {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {durationMin} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {registeredCount}/{capacity} registered
                      </span>
                      <span className="flex items-center gap-1 text-success font-medium">
                        <DollarSign className="h-3 w-3" />
                        ${revenue.toFixed(0)} revenue
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-foreground text-sm">
                      {session.price_cents === 0 ? "Free" : `$${(session.price_cents / 100).toFixed(0)}`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
