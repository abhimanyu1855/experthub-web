import { useState, useEffect } from "react"
import {
  Search, Calendar, Filter, Download, MoreHorizontal, Video,
  ChevronDown, Clock, CheckCircle2, XCircle, AlertCircle,
  DollarSign, MessageSquare, Eye, RefreshCw
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import { api } from "@/app/lib/api"
import { toast } from "sonner"

type BookingStatus = "confirmed" | "pending" | "completed" | "cancelled" | "no-show"

type Booking = {
  id: string
  rawId: number
  client: string
  clientInitials: string
  clientGradient: string
  expert: string
  expertInitials: string
  service: string
  date: string
  time: string
  duration: string
  amount: number
  status: BookingStatus
  createdAt: string
}

const statusConfig = {
  confirmed: { color: "text-primary", bg: "bg-brand-50", label: "Confirmed", icon: CheckCircle2 },
  pending: { color: "text-amber-600", bg: "bg-amber-50", label: "Pending", icon: Clock },
  completed: { color: "text-success", bg: "bg-success/10", label: "Completed", icon: CheckCircle2 },
  cancelled: { color: "text-muted-foreground", bg: "bg-muted", label: "Cancelled", icon: XCircle },
  "no-show": { color: "text-error", bg: "bg-error/10", label: "No Show", icon: AlertCircle },
}

export function AdminBookingsPage() {
  const [bookingsList, setBookingsList] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all")

  const fetchBookings = () => {
    setLoading(true)
    api.get("/bookings")
      .then((data: any) => {
        if (Array.isArray(data)) {
          const list = data.map((b: any) => {
            const clientName = b.client ? `${b.client.given_name} ${b.client.family_name}` : "Client"
            const expertName = b.expert ? `${b.expert.given_name} ${b.expert.family_name}` : "Expert"
            const clientInitials = b.client ? `${b.client.given_name?.[0] || ""}${b.client.family_name?.[0] || ""}`.toUpperCase() : "CL"
            const expertInitials = b.expert ? `${b.expert.given_name?.[0] || ""}${b.expert.family_name?.[0] || ""}`.toUpperCase() : "EX"
            
            let status: BookingStatus = "pending"
            if (["confirmed", "confirmed_free"].includes(b.aasm_state)) status = "confirmed"
            else if (b.aasm_state === "paid") status = "confirmed"
            else if (b.aasm_state === "completed") status = "completed"
            else if (b.aasm_state === "canceled") status = "cancelled"
            else if (b.aasm_state === "rejected" || b.aasm_state === "errored" || b.aasm_state === "payment_failed") status = "no-show"

            return {
              id: `BK-${b.id}`,
              rawId: b.id,
              client: clientName,
              clientInitials,
              clientGradient: "from-blue-500 to-indigo-600",
              expert: expertName,
              expertInitials,
              service: b.service?.title || "Consultation",
              date: new Date(b.start_time).toLocaleDateString(),
              time: new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              duration: `${b.duration_minutes || 60} min`,
              amount: b.price_cents / 100,
              status,
              createdAt: new Date(b.created_at).toLocaleDateString([], { month: "short", day: "numeric" })
            }
          })
          setBookingsList(list)
        }
        setLoading(false)
      })
      .catch((err: any) => {
        console.error("Failed to fetch admin bookings:", err)
        toast.error("Failed to load platform bookings")
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleCancelBooking = async (id: number) => {
    try {
      await api.post(`/bookings/${id}/cancel`)
      toast.success("Booking cancelled successfully!")
      fetchBookings()
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel booking")
    }
  }

  const handleConfirmBooking = async (id: number) => {
    try {
      await api.post(`/bookings/${id}/confirm`)
      toast.success("Booking confirmed successfully!")
      fetchBookings()
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm booking")
    }
  }

  const filtered = bookingsList.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = b.client.toLowerCase().includes(q) || b.expert.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.service.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || b.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalRevenue = bookingsList.filter(b => b.status === "completed").reduce((s, b) => s + b.amount, 0)
  const completedCount = bookingsList.filter(b => b.status === "completed").length
  const pendingCount = bookingsList.filter(b => b.status === "pending" || b.status === "confirmed").length
  const cancelledCount = bookingsList.filter(b => b.status === "cancelled" || b.status === "no-show").length

  // Generate volume data dynamically for the last 7 days
  const volumeData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toLocaleDateString()
    const dayName = d.toLocaleDateString([], { month: "short", day: "numeric" })
    
    // Match bookings count and total revenue on this day
    const dayBookings = bookingsList.filter(b => b.date === dateStr)
    const bookingsCount = dayBookings.length
    const revenueSum = dayBookings.reduce((sum, b) => sum + b.amount, 0)
    
    return {
      day: dayName,
      bookings: bookingsCount,
      revenue: revenueSum
    }
  })

  // Start date (6 days ago) and End date (today) for the chart label
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 6)
  const endDate = new Date()
  const dateBadgeText = `${startDate.toLocaleDateString([], { month: "short", day: "numeric" })} – ${endDate.toLocaleDateString([], { month: "short", day: "numeric" })}`

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground text-sm">Loading bookings catalog...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto text-foreground">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700 }}>
            All Bookings
          </h1>
          <p className="text-sm text-muted-foreground">Monitor and manage all platform sessions.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, color: "text-success", bg: "bg-success/10", icon: DollarSign },
          { label: "Completed", value: completedCount, color: "text-success", bg: "bg-success/10", icon: CheckCircle2 },
          { label: "Upcoming/Active", value: pendingCount, color: "text-primary", bg: "bg-brand-50", icon: Calendar },
          { label: "Cancelled / No-show", value: cancelledCount, color: "text-error", bg: "bg-error/10", icon: XCircle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${bg}`}>
              <Icon className={`h-4.5 w-4.5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-foreground">Booking Volume (Last 7 days)</p>
          <Badge variant="secondary" className="text-xs">{dateBadgeText}</Badge>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={volumeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
            <Area type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={2} fill="url(#bookingGrad)" dot={false} activeDot={{ r: 4, fill: "#6366f1" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by client, expert, or booking ID..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              Status: {statusFilter === "all" ? "All" : statusConfig[statusFilter].label}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>All statuses</DropdownMenuItem>
            {(Object.keys(statusConfig) as BookingStatus[]).map(s => (
              <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>{statusConfig[s].label}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Booking ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Client → Expert</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date & Time</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(b => {
                const s = statusConfig[b.status]
                const SIcon = s.icon
                return (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{b.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${b.clientGradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {b.clientInitials}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{b.client}</p>
                          <p className="text-xs text-muted-foreground">→ {b.expert}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground">{b.service}</p>
                      <p className="text-xs text-muted-foreground">{b.duration}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      <p>{b.date}</p>
                      <p>{b.time}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">${b.amount}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={`${s.bg} ${s.color} border-0 text-xs gap-1`}>
                        <SIcon className="h-3 w-3" />{s.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> View Details</DropdownMenuItem>
                          {b.status === "pending" && (
                            <DropdownMenuItem className="gap-2 text-success" onClick={() => handleConfirmBooking(b.rawId)}>
                              <CheckCircle2 className="h-4 w-4" /> Confirm Booking
                            </DropdownMenuItem>
                          )}
                          {(b.status === "pending" || b.status === "confirmed") && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 text-error" onClick={() => handleCancelBooking(b.rawId)}>
                                <XCircle className="h-4 w-4" /> Cancel Booking
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No bookings found</p>
          </div>
        )}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Showing {filtered.length} of {bookingsList.length} bookings</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
