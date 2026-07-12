import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  TrendingUp, Star, Calendar, Clock, DollarSign,
  Users, Video, MessageSquare, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, Edit, Settings, BookOpen,
  Plus, Trash2, CalendarDays, PlusCircle, Check, Award, ArrowUpRight,
  Gift, Copy, Link2
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/motion"
import { api } from "@/app/lib/api"
import { loginPathForReturnTo } from "@/app/lib/auth-routes"
import { toast } from "sonner"

const statusConfig = {
  confirmed: { label: "Confirmed", icon: CheckCircle2, class: "text-success", bg: "bg-success/10 text-success border-success/20" },
  confirmed_free: { label: "Confirmed", icon: CheckCircle2, class: "text-success", bg: "bg-success/10 text-success border-success/20" },
  paid: { label: "Paid", icon: CheckCircle2, class: "text-success", bg: "bg-success/10 text-success border-success/20" },
  pending: { label: "Pending", icon: AlertCircle, class: "text-warning", bg: "bg-warning/10 text-warning border-amber-200" },
  completed: { label: "Completed", icon: CheckCircle2, class: "text-muted-foreground", bg: "bg-muted text-muted-foreground border-border" },
  canceled: { label: "Canceled", icon: XCircle, class: "text-error", bg: "bg-error/10 text-error border-error/20" },
  rejected: { label: "Rejected", icon: XCircle, class: "text-error", bg: "bg-error/10 text-error border-error/20" },
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-raised text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>${payload[0].value}</p>
      </div>
    )
  }
  return null
}

const DAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 }
]

const TIME_SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
]

export function DashboardPage() {
  const navigate = useNavigate()
  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [membership, setMembership] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [generatingPostId, setGeneratingPostId] = useState<number | null>(null)
  const [generatedPost, setGeneratedPost] = useState<string | null>(null)
  const [showPostModal, setShowPostModal] = useState(false)

  // Data states
  const [expertStats, setExpertStats] = useState<any>(null)
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([])
  const [pastBookings, setPastBookings] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [myServices, setMyServices] = useState<any[]>([])
  const [mySessions, setMySessions] = useState<any[]>([])
  const [myCourses, setMyCourses] = useState<any[]>([])
  const [availability, setAvailability] = useState<any[]>([])

  // Modal / Form states
  const [showListingModal, setShowListingModal] = useState(false)
  const [listingType, setListingType] = useState<"1on1" | "group">("1on1")
  const [newListingTitle, setNewListingTitle] = useState("")
  const [newListingDesc, setNewListingDesc] = useState("")
  const [newListingPrice, setNewListingPrice] = useState("")
  const [newListingDuration, setNewListingDuration] = useState("60")
  const [newListingCategory, setNewListingCategory] = useState("")
  // Group session specific
  const [groupStartTime, setGroupStartTime] = useState("")
  const [groupEndTime, setGroupEndTime] = useState("")
  const [groupMaxPart, setGroupMaxPart] = useState("10")

  // Availability add-slot form state
  const [showAddSlotForm, setShowAddSlotForm] = useState(false)
  const [newSlotDay, setNewSlotDay] = useState("1")
  const [newSlotFrom, setNewSlotFrom] = useState("09:00")
  const [newSlotTill, setNewSlotTill] = useState("10:00")
  const [savingSlot, setSavingSlot] = useState(false)

  // Course Modal state
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [newCourseTitle, setNewCourseTitle] = useState("")
  const [newCourseDesc, setNewCourseDesc] = useState("")
  const [newCoursePrice, setNewCoursePrice] = useState("")

  // Clients view courses
  const [clientCourses, setClientCourses] = useState<any[]>([])
  const [mySubscriptions, setMySubscriptions] = useState<any[]>([])
  const [cancelingSubId, setCancelingSubId] = useState<number | null>(null)

  // Referral
  const [referralSummary, setReferralSummary] = useState<any>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  // Load all dashboard context
  const loadDashboardData = () => {
    api.get("/me")
      .then(data => {
        setCurrentUser(data.user)
        setMembership(data.membership)
        
        const promises = []
        
        if (data.membership?.role === "expert") {
          promises.push(
            api.get("/analytics/expert").then(stats => setExpertStats(stats)),
            api.get("/bookings?upcoming=true").then(b => setUpcomingBookings(b)),
            api.get("/bookings?past=true").then(b => setPastBookings(b)),
            api.get("/reviews").then(r => setReviews(r)),
            api.get("/categories").then(c => setCategories(c)),
            api.get("/services?my_services=true").then(s => setMyServices(s)),
            api.get("/group_sessions?my_sessions=true").then(gs => setMySessions(gs)),
            api.get("/courses?my_courses=true").then(mc => setMyCourses(mc)),
            api.get("/working_time_slots").then(wts => setAvailability(wts)),
            api.get("/referrals/summary").then(r => setReferralSummary(r)).catch(() => {})
          )
        } else if (data.membership?.role === "client") {
          promises.push(
            api.get("/bookings?upcoming=true").then(b => setUpcomingBookings(b)),
            api.get("/bookings?past=true").then(b => setPastBookings(b)),
            api.get("/courses").then(c => setClientCourses(c)),
            api.get("/subscriptions").then(s => setMySubscriptions(Array.isArray(s) ? s : [])).catch(() => {}),
            api.get("/referrals/summary").then(r => setReferralSummary(r)).catch(() => {})
          )
        } else if (data.membership?.role === "operator") {
          navigate("/admin/getting-started")
          return
        }

        Promise.all(promises).then(() => setLoading(false))
      })
      .catch(err => {
        console.error("Failed to load dashboard context:", err)
        toast.error("Please login to access your dashboard")
        navigate(`${loginPathForReturnTo("/dashboard")}?returnTo=${encodeURIComponent("/dashboard")}`)
      })
  }

  useEffect(() => {
    loadDashboardData()
  }, [navigate])

  const convertTo24h = (t: string) => {
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!match) return "09:00:00"
    let hour = parseInt(match[1])
    const min = match[2]
    const ampm = match[3].toUpperCase()
    if (ampm === "PM" && hour < 12) hour += 12
    if (ampm === "AM" && hour === 12) hour = 0
    return `${hour.toString().padStart(2, '0')}:${min}:00`
  }

  const getTillTime = (t: string) => {
    const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!match) return "10:00:00"
    let hour = parseInt(match[1])
    const min = match[2]
    let ampm = match[3].toUpperCase()
    hour += 1
    if (hour === 12) {
      ampm = ampm === "AM" ? "PM" : "AM"
    } else if (hour > 12) {
      hour -= 12
    }
    return convertTo24h(`${hour}:${min} ${ampm}`)
  }

  const matchSlot = (dayVal: number, timeStr: string) => {
    const targetFrom = convertTo24h(timeStr)
    return availability.some((s: any) => {
      if (s.week_day !== dayVal) return false
      const fromMatch = s.from_time?.match(/(\d{2}):(\d{2})/)
      const targetMatch = targetFrom.match(/(\d{2}):(\d{2})/)
      return fromMatch && targetMatch && fromMatch[1] === targetMatch[1]
    })
  }

  const toggleSlot = (dayVal: number, timeStr: string) => {
    const fromTime = convertTo24h(timeStr)
    const tillTime = getTillTime(timeStr)
    
    const exists = matchSlot(dayVal, timeStr)
    let nextAvailability = []

    if (exists) {
      nextAvailability = availability.filter((s: any) => {
        if (s.week_day !== dayVal) return true
        const fromMatch = s.from_time?.match(/(\d{2}):(\d{2})/)
        const targetMatch = fromTime.match(/(\d{2}):(\d{2})/)
        return !(fromMatch && targetMatch && fromMatch[1] === targetMatch[1])
      })
    } else {
      nextAvailability = [...availability, { week_day: dayVal, from_time: fromTime, till_time: tillTime }]
    }

    setAvailability(nextAvailability)
  }

  const handleSaveAvailability = async () => {
    try {
      const slotsPayload = availability.map((s: any) => {
        const fromMatch = s.from_time?.match(/(\d{2}):(\d{2})/)
        const tillMatch = s.till_time?.match(/(\d{2}):(\d{2})/)
        return {
          week_day: s.week_day,
          from_time: fromMatch ? `${fromMatch[1]}:${fromMatch[2]}:00` : "09:00:00",
          till_time: tillMatch ? `${tillMatch[1]}:${tillMatch[2]}:00` : "10:00:00"
        }
      })
      await api.post("/working_time_slots", { slots: slotsPayload })
      toast.success("Availability updated successfully!")
      loadDashboardData()
    } catch (err: any) {
      toast.error(err.message || "Failed to update availability")
    }
  }

  const handleGenerateLinkedInPost = async (bookingId: number) => {
    setGeneratingPostId(bookingId)
    setGeneratedPost(null)
    setShowPostModal(true)
    try {
      const res = await api.post(`/bookings/${bookingId}/marketing_post`)
      if (res?.post) {
        setGeneratedPost(res.post)
      } else {
        toast.error("Could not generate post. Make sure you have submitted a session notes transcript first.")
        setShowPostModal(false)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate marketing post. Make sure a session transcript exists.")
      setShowPostModal(false)
    } finally {
      setGeneratingPostId(null)
    }
  }

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSlot(true)
    try {
      await api.post("/working_time_slots", {
        week_day: parseInt(newSlotDay),
        from_time: `${newSlotFrom}:00`,
        till_time: `${newSlotTill}:00`,
      })
      toast.success("Time slot added!")
      setShowAddSlotForm(false)
      setNewSlotDay("1")
      setNewSlotFrom("09:00")
      setNewSlotTill("10:00")
      const updated = await api.get("/working_time_slots")
      setAvailability(updated)
    } catch (err: any) {
      toast.error(err.message || "Failed to add slot")
    } finally {
      setSavingSlot(false)
    }
  }

  const handleDeleteSlot = async (slotId: number) => {
    try {
      await api.delete(`/working_time_slots/${slotId}`)
      setAvailability((prev: any[]) => prev.filter((s: any) => s.id !== slotId))
      toast.success("Slot removed")
    } catch (err: any) {
      toast.error(err.message || "Failed to remove slot")
    }
  }

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (listingType === "1on1") {
        await api.post("/services", {
          service: {
            title: newListingTitle,
            description: newListingDesc,
            price_cents: parseFloat(newListingPrice) * 100,
            duration_minutes: parseInt(newListingDuration),
            slot_interval_minutes: parseInt(newListingDuration),
            category_id: newListingCategory ? parseInt(newListingCategory) : null
          }
        })
        toast.success("1:1 service created successfully!")
      } else {
        await api.post("/group_sessions", {
          group_session: {
            title: newListingTitle,
            description: newListingDesc,
            price_cents: parseFloat(newListingPrice) * 100,
            start_time: groupStartTime,
            end_time: groupEndTime,
            max_participants: parseInt(groupMaxPart)
          }
        })
        toast.success("Group session created successfully!")
      }
      setShowListingModal(false)
      // Reset forms
      setNewListingTitle("")
      setNewListingDesc("")
      setNewListingPrice("")
      setNewListingDuration("60")
      setNewListingCategory("")
      setGroupStartTime("")
      setGroupEndTime("")
      setGroupMaxPart("10")
      loadDashboardData()
    } catch (err: any) {
      toast.error(err.message || "Failed to create listing")
    }
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post("/courses", {
        course: {
          title: newCourseTitle,
          description: newCourseDesc,
          price_cents: parseFloat(newCoursePrice) * 100,
          is_active: true
        }
      })
      toast.success("Course created successfully!")
      setShowCourseModal(false)
      setNewCourseTitle("")
      setNewCourseDesc("")
      setNewCoursePrice("")
      loadDashboardData()
    } catch (err: any) {
      toast.error(err.message || "Failed to create course")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  const isExpert = membership?.role === "expert"

  const referralLink = referralSummary?.referral_code
    ? `${window.location.origin}/signup/customer?ref=${referralSummary.referral_code}`
    : ""

  const handleCopyReferral = () => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink)
    setCopySuccess(true)
    toast.success("Referral link copied to clipboard!")
    setTimeout(() => setCopySuccess(false), 2000)
  }

  // Chart data from real earnings_by_month API data
  const chartData = isExpert && Array.isArray(expertStats?.earnings_by_month) && expertStats.earnings_by_month.length > 0
    ? expertStats.earnings_by_month.map((m: any) => ({
        day: m.month,
        earnings: Math.round((m.earnings_cents || 0) / 100),
      }))
    : [
        { day: "Month 1", earnings: 0 },
        { day: "Month 2", earnings: 0 },
        { day: "Month 3", earnings: 0 },
        { day: "Month 4", earnings: 0 },
        { day: "Month 5", earnings: 0 },
        { day: "Month 6", earnings: 0 },
      ]

  // Render Expert View
  if (isExpert) {
    const expertMetrics = [
      {
        label: "Total Earned",
        value: `$${((expertStats?.expert_payout_cents || 0) / 100).toLocaleString()}`,
        change: "+100%",
        up: true,
        sub: "lifetime earnings",
        icon: DollarSign,
        color: "text-success",
        bg: "bg-success/10",
      },
      {
        label: "Sessions Booked",
        value: (expertStats?.expert_bookings_count || 0).toString(),
        change: "+100%",
        up: true,
        sub: `${upcomingBookings.length} upcoming`,
        icon: Video,
        color: "text-primary",
        bg: "bg-brand-50",
      },
      {
        label: "Avg Rating",
        value: (expertStats?.ratings_average || 0).toFixed(1),
        change: "—",
        up: true,
        sub: `${reviews.length} reviews`,
        icon: Star,
        color: "text-amber-500",
        bg: "bg-amber-50",
      },
      {
        label: "Direct Inquiries",
        value: "Active",
        change: "Online",
        up: true,
        sub: "inbox is open",
        icon: Users,
        color: "text-info",
        bg: "bg-info/10",
      },
    ]
    const expertProfile = currentUser?.expert_profile || {}
    const payoutStatus = expertProfile.payout_connected
      ? "Connected"
      : expertProfile.payout_onboarding_started
        ? "Pending onboarding"
        : "Not connected"

    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-foreground text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                Welcome back, {currentUser?.given_name || "Expert"} 👋
              </h1>
              <p className="text-muted-foreground mt-1">Here's what's happening with your practice today.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-xl gap-2" onClick={() => navigate("/settings")}>
                <Edit className="h-4 w-4" /> Edit Profile
              </Button>
            </div>
          </div>

          {/* Expert Tabs Bar */}
          <div className="border-b border-border mb-8 flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-6">
              {[
                { id: "overview", label: "Overview", icon: TrendingUp },
                { id: "schedules", label: "Schedules", icon: CalendarDays },
                { id: "listings", label: "Listings & Services", icon: PlusCircle },
                { id: "availability", label: "Availability Settings", icon: Clock },
                { id: "courses", label: "My Courses", icon: BookOpen },
                { id: "referrals", label: "Referrals", icon: Gift }
              ].map(tab => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 pb-4 text-sm font-semibold border-b-2 transition-all relative ${
                      active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Contents */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-8"
              >
                {/* Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {expertMetrics.map(metric => {
                    const Icon = metric.icon
                    return (
                      <div key={metric.label} className="bg-card rounded-2xl border border-border p-5 shadow-card">
                        <div className="flex items-start justify-between">
                          <div className={`h-10 w-10 rounded-xl ${metric.bg} flex items-center justify-center`}>
                            <Icon className={`h-5 w-5 ${metric.color}`} />
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="font-bold text-foreground text-2xl" style={{ fontFamily: "var(--font-heading)" }}>{metric.value}</div>
                          <div className="text-muted-foreground text-sm mt-0.5">{metric.label}</div>
                          <div className="text-muted-foreground text-xs mt-0.5">{metric.sub}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
                  {/* Earnings chart */}
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
                    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                      <div>
                        <h2 className="font-bold text-foreground text-base" style={{ fontFamily: "var(--font-heading)" }}>Earnings Summary</h2>
                        <p className="text-muted-foreground text-sm mt-0.5">Estimated payout breakdown</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="earnings" stroke="#6366f1" strokeWidth={2.5} fill="url(#earningsGrad)" dot={false} activeDot={{ r: 5, fill: "#6366f1" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Reviews & Actions */}
                  <div className="space-y-5">
                    {/* Quick navigation */}
                    <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
                      <h3 className="font-bold text-foreground mb-3 text-sm" style={{ fontFamily: "var(--font-heading)" }}>Quick Links</h3>
                      <div className="mb-3 rounded-xl border border-border bg-muted/30 p-3">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-success shrink-0" />
                            <span className="font-medium text-foreground text-sm">Payout account</span>
                          </div>
                          <Badge className={
                            payoutStatus === "Connected"
                              ? "bg-success/10 text-success border-success/20 text-xs"
                              : payoutStatus === "Pending onboarding"
                                ? "bg-warning/10 text-warning border-amber-200 text-xs"
                                : "bg-muted text-muted-foreground border-border text-xs"
                          }>
                            {payoutStatus}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-xs mb-3">
                          Earnings are paid out after session confirmation.
                        </p>
                        <Link to="/settings?tab=payouts" className="text-xs font-semibold text-primary hover:text-primary/80">
                          Manage payouts →
                        </Link>
                      </div>
                      <div className="space-y-2">
                        <Link to="/inbox" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/50 transition-colors group">
                          <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">Go to inbox</span>
                        </Link>
                        <Link to="/earnings" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/50 transition-colors group">
                          <DollarSign className="h-4 w-4 text-success shrink-0" />
                          <span className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">Payout History</span>
                        </Link>
                      </div>
                    </div>

                    {/* Recent reviews */}
                    <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
                      <h3 className="font-bold text-foreground mb-4 text-sm" style={{ fontFamily: "var(--font-heading)" }}>Recent Reviews</h3>
                      <div className="space-y-3">
                        {reviews.length === 0 ? (
                          <p className="text-muted-foreground text-xs">No reviews received yet.</p>
                        ) : (
                          reviews.map((r: any) => (
                            <div key={r.id} className="p-3 rounded-xl bg-background border border-border">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="font-medium text-foreground text-xs">{r.reviewer?.given_name || "Client"}</span>
                                <div className="flex gap-0.5 ml-auto">
                                  {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} className={`h-2.5 w-2.5 ${r.rating >= i ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-muted-foreground text-xs leading-relaxed">{r.content || r.comment}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "schedules" && (
              <motion.div
                key="schedules"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="font-bold text-foreground text-base" style={{ fontFamily: "var(--font-heading)" }}>Client Appointments</h2>
                </div>
                <Tabs defaultValue="upcoming">
                  <div className="px-5 pt-4">
                    <TabsList className="bg-muted">
                      <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                      <TabsTrigger value="past">Past</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="upcoming" className="mt-0">
                    <div className="divide-y divide-border">
                      {upcomingBookings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                          <div className="h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
                            <CalendarDays className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="font-semibold text-foreground text-sm mb-1">No upcoming appointments</h3>
                          <p className="text-muted-foreground text-xs max-w-xs">Clients will appear here once they book a session with you.</p>
                        </div>
                      ) : (
                        upcomingBookings.map(booking => {
                          const statusKey = booking.aasm_state as keyof typeof statusConfig
                          const status = statusConfig[statusKey] || statusConfig.pending
                          const StatusIcon = status.icon
                          const clientInitials = `${booking.client?.given_name?.[0] || ""}${booking.client?.family_name?.[0] || ""}`
                          return (
                            <div key={booking.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                {clientInitials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-foreground text-sm">{booking.client?.given_name} {booking.client?.family_name}</div>
                                <div className="text-muted-foreground text-xs truncate">{booking.service?.title}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-medium text-foreground text-sm">{new Date(booking.start_time).toLocaleDateString()}</div>
                                <div className="flex items-center gap-1 text-muted-foreground text-xs justify-end mt-0.5">
                                  <Clock className="h-3 w-3" />{new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {booking.duration_minutes}m
                                </div>
                              </div>
                              <Badge className={`${status.bg} shrink-0 gap-1`}>
                                <StatusIcon className="h-3 w-3" />{status.label}
                              </Badge>
                              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 hover:bg-accent" onClick={() => navigate(`/session/${booking.id}`)}>
                                <Video className="h-4 w-4 text-primary" />
                              </Button>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="past" className="mt-0">
                    <div className="divide-y divide-border">
                      {pastBookings.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">No past appointments.</div>
                      ) : (
                        pastBookings.map(booking => {
                          const statusKey = booking.aasm_state as keyof typeof statusConfig
                          const status = statusConfig[statusKey] || statusConfig.completed
                          const StatusIcon = status.icon
                          const clientInitials = `${booking.client?.given_name?.[0] || ""}${booking.client?.family_name?.[0] || ""}`
                          return (
                            <div key={booking.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                {clientInitials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-foreground text-sm">{booking.client?.given_name} {booking.client?.family_name}</div>
                                <div className="text-muted-foreground text-xs truncate">{booking.service?.title}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-medium text-foreground text-sm">${(booking.price_cents / 100).toFixed(2)}</div>
                                <div className="text-muted-foreground text-xs">{new Date(booking.start_time).toLocaleDateString()}</div>
                              </div>
                              <Badge className={`${status.bg} shrink-0 gap-1`}>
                                <StatusIcon className="h-3 w-3" />{status.label}
                              </Badge>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl shrink-0 gap-1.5 text-xs h-8 hover:bg-brand-50 hover:text-primary hover:border-primary/40"
                                onClick={() => handleGenerateLinkedInPost(booking.id)}
                              >
                                <TrendingUp className="h-3.5 w-3.5" /> Post
                              </Button>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}

            {activeTab === "listings" && (
              <motion.div
                key="listings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-8"
              >
                {/* Header Actions */}
                <div className="flex items-center justify-between flex-wrap gap-4 bg-card border border-border rounded-2xl p-5 shadow-card">
                  <div>
                    <h3 className="font-bold text-foreground text-base">Service Listings & Classes</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">Manage your 1:1 consultation offerings and 1-to-many group sessions.</p>
                  </div>
                  <Button className="rounded-xl gap-2 bg-primary hover:bg-primary/95 text-white" onClick={() => setShowListingModal(true)}>
                    <Plus className="h-4 w-4" /> Create Listing
                  </Button>
                </div>

                {/* Grid division */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 1:1 Listings */}
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-card space-y-4">
                    <h4 className="font-bold text-sm uppercase tracking-wide text-primary">1:1 Consultation Services</h4>
                    {myServices.length === 0 ? (
                      <p className="text-muted-foreground text-xs p-4 border border-dashed border-border rounded-xl">No 1:1 services created yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {myServices.map((service: any) => {
                          const serviceBookings = [...upcomingBookings, ...pastBookings].filter((b: any) => b.service?.id === service.id)
                          return (
                            <div key={service.id} className="p-4 rounded-xl bg-background border border-border space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h5 className="font-bold text-foreground text-sm">{service.title}</h5>
                                  <p className="text-muted-foreground text-xs mt-1">{service.description || "No description provided."}</p>
                                </div>
                                <span className="font-bold text-primary shrink-0">${(service.price_cents / 100).toFixed(0)}</span>
                              </div>
                              
                              <div className="flex items-center gap-3 text-muted-foreground text-xs">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {service.duration_minutes} min</span>
                                {service.category && <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-[10px]">{service.category.name}</span>}
                                <span className="ml-auto">
                                  {service.approval_status === "approved" ? (
                                    <Badge className="bg-success/15 text-success border-0">Approved</Badge>
                                  ) : (
                                    <Badge className="bg-warning/15 text-warning border-0">Pending review</Badge>
                                  )}
                                </span>
                              </div>

                              {/* Booked People */}
                              <div className="pt-2.5 border-t border-border">
                                <p className="text-muted-foreground font-semibold text-[10px] uppercase mb-1">Booked Clients ({serviceBookings.length})</p>
                                {serviceBookings.length === 0 ? (
                                  <p className="text-muted-foreground/60 text-[10px]">No bookings yet.</p>
                                ) : (
                                  <div className="space-y-1">
                                    {serviceBookings.map((b: any) => (
                                      <div key={b.id} className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{b.client?.given_name} {b.client?.family_name}</span>
                                        <span>{new Date(b.start_time).toLocaleDateString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* 1-to-many Sessions */}
                  <div className="bg-card rounded-2xl border border-border p-5 shadow-card space-y-4">
                    <h4 className="font-bold text-sm uppercase tracking-wide text-purple-500">1-to-Many Group Sessions</h4>
                    {mySessions.length === 0 ? (
                      <p className="text-muted-foreground text-xs p-4 border border-dashed border-border rounded-xl">No group sessions created yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {mySessions.map((session: any) => {
                          const enrolledPeople = session.attendances || []
                          return (
                            <div key={session.id} className="p-4 rounded-xl bg-background border border-border space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h5 className="font-bold text-foreground text-sm">{session.title}</h5>
                                  <p className="text-muted-foreground text-xs mt-1">{session.description || "No description provided."}</p>
                                </div>
                                <span className="font-bold text-purple-500 shrink-0">${(session.price_cents / 100).toFixed(0)}</span>
                              </div>

                              <div className="flex items-center gap-3 text-muted-foreground text-xs">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(session.start_time).toLocaleString()}</span>
                                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-[10px]">
                                  {enrolledPeople.length} / {session.max_participants} joined
                                </span>
                              </div>

                              {/* Enrolled People */}
                              <div className="pt-2.5 border-t border-border">
                                <p className="text-muted-foreground font-semibold text-[10px] uppercase mb-1">Enrolled Participants ({enrolledPeople.length})</p>
                                {enrolledPeople.length === 0 ? (
                                  <p className="text-muted-foreground/60 text-[10px]">No participants enrolled yet.</p>
                                ) : (
                                  <div className="space-y-1">
                                    {enrolledPeople.map((att: any) => (
                                      <div key={att.id} className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{att.user?.given_name} {att.user?.family_name}</span>
                                        <span className="text-[10px] text-muted-foreground/70">{att.user?.email}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "availability" && (
              <motion.div
                key="availability"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                {/* Header */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-card flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="font-bold text-foreground text-base">Weekly Availability</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">Define recurring time slots when clients can book sessions with you.</p>
                  </div>
                  <Button className="rounded-xl gap-2 bg-primary hover:bg-primary/95 text-white" onClick={() => setShowAddSlotForm(true)}>
                    <Plus className="h-4 w-4" /> Add Slot
                  </Button>
                </div>

                {/* Slots grouped by day */}
                <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
                  {DAYS.map((day, dayIdx) => {
                    const daySlots = availability.filter((s: any) => s.week_day === day.value)
                    return (
                      <div key={day.value} className={`${dayIdx > 0 ? "border-t border-border" : ""}`}>
                        <div className="flex items-center gap-4 px-5 py-3">
                          <div className="w-10 text-center">
                            <span className="text-xs font-bold text-muted-foreground uppercase">{day.label}</span>
                          </div>
                          {daySlots.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">No slots — day off</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {daySlots.map((slot: any) => {
                                const fmt = (t: string) => {
                                  const m = t?.match(/(\d{2}):(\d{2})/)
                                  if (!m) return t
                                  const h = parseInt(m[1]), min = m[2]
                                  const ampm = h >= 12 ? "PM" : "AM"
                                  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
                                  return `${displayH}:${min} ${ampm}`
                                }
                                return (
                                  <div key={slot.id} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary rounded-lg px-3 py-1 text-xs font-medium">
                                    <Clock className="h-3 w-3 shrink-0" />
                                    <span>{fmt(slot.from_time)} – {fmt(slot.till_time)}</span>
                                    <button
                                      onClick={() => handleDeleteSlot(slot.id)}
                                      className="ml-1 rounded-full hover:bg-error/20 hover:text-error transition-colors p-0.5"
                                      title="Remove slot"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {availability.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-t border-border">
                      <CalendarDays className="h-8 w-8 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground text-sm font-medium">No availability set</p>
                      <p className="text-muted-foreground text-xs mt-1">Click "Add Slot" to define your working hours.</p>
                    </div>
                  )}
                </div>

                {/* Add Slot modal */}
                {showAddSlotForm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-modal space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-foreground">Add Availability Slot</h3>
                        <button className="text-muted-foreground hover:text-foreground" onClick={() => setShowAddSlotForm(false)}>
                          <Plus className="h-5 w-5 transform rotate-45" />
                        </button>
                      </div>
                      <form onSubmit={handleAddSlot} className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="slot-day">Day of Week</Label>
                          <select
                            id="slot-day"
                            value={newSlotDay}
                            onChange={e => setNewSlotDay(e.target.value)}
                            className="w-full bg-background border border-input rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="slot-from">Start Time</Label>
                            <Input id="slot-from" type="time" value={newSlotFrom} onChange={e => setNewSlotFrom(e.target.value)} required className="rounded-xl" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="slot-till">End Time</Label>
                            <Input id="slot-till" type="time" value={newSlotTill} onChange={e => setNewSlotTill(e.target.value)} required className="rounded-xl" />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2 border-t border-border">
                          <Button type="button" variant="outline" onClick={() => setShowAddSlotForm(false)}>Cancel</Button>
                          <Button type="submit" disabled={savingSlot} className="bg-primary hover:bg-primary/95 text-white gap-2">
                            {savingSlot ? <><Clock className="h-3.5 w-3.5 animate-spin" /> Saving...</> : <><Check className="h-3.5 w-3.5" /> Add Slot</>}
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "courses" && (
              <motion.div
                key="courses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Header Actions */}
                <div className="flex items-center justify-between flex-wrap gap-4 bg-card border border-border rounded-2xl p-5 shadow-card">
                  <div>
                    <h3 className="font-bold text-foreground text-base">Course Management</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">Create and distribute material, and check enrolled student counts.</p>
                  </div>
                  <Button className="rounded-xl gap-2 bg-primary hover:bg-primary/95 text-white" onClick={() => setShowCourseModal(true)}>
                    <Plus className="h-4 w-4" /> Create Course
                  </Button>
                </div>

                {/* Courses Lists */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
                  {myCourses.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                      No courses created yet. Create one to start selling content.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myCourses.map((course: any) => {
                        const students = course.enrollments || []
                        return (
                          <div key={course.id} className="p-4 rounded-xl bg-background border border-border flex flex-col justify-between space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <Badge className="bg-primary/15 text-primary border-0">Self-Paced</Badge>
                                <span className="font-bold text-primary">${(course.price_cents / 100).toFixed(0)}</span>
                              </div>
                              <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2">{course.title}</h3>
                              <p className="text-muted-foreground text-xs mt-2 line-clamp-3">{course.description || "No description provided."}</p>
                            </div>

                            {/* Enrolled Students */}
                            <div className="pt-3 border-t border-border">
                              <p className="text-muted-foreground font-semibold text-[10px] uppercase mb-1">Enrolled Students ({students.length})</p>
                              {students.length === 0 ? (
                                <p className="text-muted-foreground/60 text-[10px]">No students enrolled yet.</p>
                              ) : (
                                <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
                                  {students.map((e: any) => (
                                    <div key={e.id} className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span>{e.user?.given_name} {e.user?.family_name}</span>
                                      <span className="text-[10px] text-muted-foreground/70">{e.user?.email}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            {activeTab === "referrals" && (
              <motion.div
                key="referrals"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Referral link card */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Gift className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Your Referral Link</h3>
                      <p className="text-muted-foreground text-sm">Share this link and earn credits for every new signup</p>
                    </div>
                  </div>
                  {referralSummary ? (
                    <div className="flex items-center gap-2 bg-muted rounded-xl p-3 border border-border">
                      <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-sm font-mono text-foreground truncate">{referralLink}</span>
                      <button
                        onClick={handleCopyReferral}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          copySuccess ? "bg-success text-white" : "bg-primary text-white hover:bg-primary/90"
                        }`}
                      >
                        {copySuccess ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copySuccess ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  ) : (
                    <div className="h-12 bg-muted rounded-xl animate-pulse" />
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    Your referral code: <span className="font-mono font-semibold text-foreground">{referralSummary?.referral_code || "—"}</span>
                  </p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                      {referralSummary?.referred_users_count ?? "—"}
                    </div>
                    <div className="text-muted-foreground text-sm mt-0.5">Total Referrals</div>
                    <div className="text-muted-foreground text-xs mt-0.5">Users who signed up using your link</div>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
                    <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center mb-3">
                      <DollarSign className="h-5 w-5 text-success" />
                    </div>
                    <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                      ${referralSummary?.active_credits_value?.toFixed(2) ?? "0.00"}
                    </div>
                    <div className="text-muted-foreground text-sm mt-0.5">Credits Available</div>
                    <div className="text-muted-foreground text-xs mt-0.5">Ready to use on your next booking</div>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
                      <Award className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                      ${(((referralSummary?.referred_users_count || 0) * 10)).toFixed(2)}
                    </div>
                    <div className="text-muted-foreground text-sm mt-0.5">Lifetime Earned</div>
                    <div className="text-muted-foreground text-xs mt-0.5">Estimated total credits from referrals</div>
                  </div>
                </div>

                {/* Credits explanation */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
                  <h4 className="font-bold text-foreground mb-3">How It Works</h4>
                  <div className="space-y-3">
                    {[
                      { step: "1", text: "Share your unique referral link with friends or colleagues." },
                      { step: "2", text: "When they sign up and make their first booking, you both earn credits." },
                      { step: "3", text: "Credits are automatically applied to your next booking as a discount." },
                    ].map(({ step, text }) => (
                      <div key={step} className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {step}
                        </div>
                        <p className="text-sm text-muted-foreground">{text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10 text-sm text-primary">
                    Credits are automatically applied to your next booking — no coupon code needed.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Create Listing Modal */}
        {showListingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-modal space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Create New Listing</h3>
                <button className="text-muted-foreground hover:text-foreground" onClick={() => setShowListingModal(false)}>
                  <Plus className="h-5 w-5 transform rotate-45" />
                </button>
              </div>

              <form onSubmit={handleCreateListing} className="space-y-4">
                <div className="space-y-2">
                  <Label>Listing Type</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setListingType("1on1")}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        listingType === "1on1" ? "bg-primary border-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      1:1 Consultation
                    </button>
                    <button
                      type="button"
                      onClick={() => setListingType("group")}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        listingType === "group" ? "bg-purple-600 border-purple-600 text-white" : "border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      Group Session
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="listing-title">Title</Label>
                  <Input id="listing-title" value={newListingTitle} onChange={e => setNewListingTitle(e.target.value)} required placeholder="e.g. 1-Hour Financial Advisory" className="rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="listing-desc">Description</Label>
                  <textarea id="listing-desc" value={newListingDesc} onChange={e => setNewListingDesc(e.target.value)} required rows={3} placeholder="Provide details about the session..." className="w-full bg-background border border-input rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="listing-price">Price (USD)</Label>
                    <Input id="listing-price" type="number" step="0.01" value={newListingPrice} onChange={e => setNewListingPrice(e.target.value)} required placeholder="100.00" className="rounded-xl" />
                  </div>

                  {listingType === "1on1" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="listing-duration">Duration (mins)</Label>
                      <Input id="listing-duration" type="number" value={newListingDuration} onChange={e => setNewListingDuration(e.target.value)} required className="rounded-xl" />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label htmlFor="group-max">Max Participants</Label>
                      <Input id="group-max" type="number" value={groupMaxPart} onChange={e => setGroupMaxPart(e.target.value)} required className="rounded-xl" />
                    </div>
                  )}
                </div>

                {listingType === "1on1" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="listing-category">Category</Label>
                    <select
                      id="listing-category"
                      value={newListingCategory}
                      onChange={e => setNewListingCategory(e.target.value)}
                      className="w-full bg-background border border-input rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}

                {listingType === "group" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="group-start">Start Time</Label>
                      <Input id="group-start" type="datetime-local" value={groupStartTime} onChange={e => setGroupStartTime(e.target.value)} required className="rounded-xl text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="group-end">End Time</Label>
                      <Input id="group-end" type="datetime-local" value={groupEndTime} onChange={e => setGroupEndTime(e.target.value)} required className="rounded-xl text-xs" />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setShowListingModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/95 text-white">
                    Submit Listing
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Create Course Modal */}
        {showCourseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-modal space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Create New Course</h3>
                <button className="text-muted-foreground hover:text-foreground" onClick={() => setShowCourseModal(false)}>
                  <Plus className="h-5 w-5 transform rotate-45" />
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="course-title">Course Title</Label>
                  <Input id="course-title" value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} required placeholder="e.g. Architectural Engineering Masterclass" className="rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="course-desc">Description</Label>
                  <textarea id="course-desc" value={newCourseDesc} onChange={e => setNewCourseDesc(e.target.value)} required rows={4} placeholder="What will students learn in this course?" className="w-full bg-background border border-input rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="course-price">Price (USD)</Label>
                  <Input id="course-price" type="number" step="0.01" value={newCoursePrice} onChange={e => setNewCoursePrice(e.target.value)} required placeholder="149.00" className="rounded-xl" />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setShowCourseModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/95 text-white">
                    Create Course
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    )
  }

  // Render Customer / Client view (Keep unchanged)
  const clientMetrics = [
    {
      label: "Total Consultations",
      value: (upcomingBookings.length + pastBookings.length).toString(),
      sub: `${upcomingBookings.length} scheduled`,
      icon: Video,
      color: "text-primary",
      bg: "bg-brand-50"
    },
    {
      label: "Active Courses",
      value: clientCourses.length.toString(),
      sub: "learn at your own pace",
      icon: BookOpen,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-foreground text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              Welcome, {currentUser?.given_name || "Guest"} 👋
            </h1>
            <p className="text-muted-foreground mt-1">Book consultations and manage your active learning sessions.</p>
          </div>
          <div className="flex gap-2">
            <Button className="rounded-xl bg-primary hover:bg-primary/90 text-white" onClick={() => navigate("/explore")}>
              Browse Experts
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {clientMetrics.map(metric => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="bg-card rounded-2xl border border-border p-5 shadow-card flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${metric.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{metric.value}</div>
                  <div className="text-muted-foreground text-sm font-medium">{metric.label}</div>
                  <div className="text-muted-foreground text-xs mt-0.5">{metric.sub}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          {/* Left Column - Bookings & Courses */}
          <div className="space-y-6">
            {/* Bookings */}
            <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-bold text-foreground text-base" style={{ fontFamily: "var(--font-heading)" }}>Consultation Sessions</h2>
              </div>
              <Tabs defaultValue="upcoming">
                <div className="px-5 pt-4">
                  <TabsList className="bg-muted">
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="past">Past</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="upcoming" className="mt-0">
                  <div className="divide-y divide-border">
                    {upcomingBookings.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                        <div className="h-14 w-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
                          <Calendar className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-heading)" }}>No bookings yet</h3>
                        <p className="text-muted-foreground text-sm mb-4 max-w-xs">You haven't booked any consultations. Browse our verified experts and schedule your first session.</p>
                        <Button size="sm" className="rounded-xl gap-2" onClick={() => navigate("/explore")}>
                          <ArrowUpRight className="h-4 w-4" /> Browse Experts
                        </Button>
                      </div>
                    ) : (
                      upcomingBookings.map(booking => {
                        const statusKey = booking.aasm_state as keyof typeof statusConfig
                        const status = statusConfig[statusKey] || statusConfig.pending
                        const StatusIcon = status.icon
                        const expertInitials = `${booking.expert?.given_name?.[0] || ""}${booking.expert?.family_name?.[0] || ""}`
                        return (
                          <div key={booking.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                              {expertInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-foreground text-sm">{booking.expert?.given_name} {booking.expert?.family_name}</div>
                              <div className="text-muted-foreground text-xs truncate">{booking.service?.title}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-medium text-foreground text-sm">{new Date(booking.start_time).toLocaleDateString()}</div>
                              <div className="flex items-center gap-1 text-muted-foreground text-xs justify-end mt-0.5">
                                <Clock className="h-3 w-3" />{new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {booking.duration_minutes}m
                              </div>
                            </div>
                            <Badge className={`${status.bg} shrink-0 gap-1`}>
                              <StatusIcon className="h-3 w-3" />{status.label}
                            </Badge>
                            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 hover:bg-accent animate-pulse" onClick={() => navigate(`/session/${booking.id}`)}>
                              <Video className="h-4 w-4 text-primary" />
                            </Button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="past" className="mt-0">
                  <div className="divide-y divide-border">
                    {pastBookings.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">No past sessions.</div>
                    ) : (
                      pastBookings.map(booking => {
                        const statusKey = booking.aasm_state as keyof typeof statusConfig
                        const status = statusConfig[statusKey] || statusConfig.completed
                        const StatusIcon = status.icon
                        const expertInitials = `${booking.expert?.given_name?.[0] || ""}${booking.expert?.family_name?.[0] || ""}`
                        return (
                          <div key={booking.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                              {expertInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-foreground text-sm">{booking.expert?.given_name} {booking.expert?.family_name}</div>
                              <div className="text-muted-foreground text-xs truncate">{booking.service?.title}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-medium text-foreground text-sm">${(booking.price_cents / 100).toFixed(2)}</div>
                              <div className="text-muted-foreground text-xs">{new Date(booking.start_time).toLocaleDateString()}</div>
                            </div>
                            <Badge className={`${status.bg} shrink-0 gap-1`}>
                              <StatusIcon className="h-3 w-3" />{status.label}
                            </Badge>
                          </div>
                        )
                      })
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* My Subscriptions */}
            {mySubscriptions.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
                <h2 className="font-bold text-foreground text-base mb-4" style={{ fontFamily: "var(--font-heading)" }}>My Subscriptions</h2>
                <div className="space-y-3">
                  {mySubscriptions.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-background border border-border">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{sub.subscription_plan?.name || "Subscription Plan"}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge className={
                            sub.status === "active" ? "bg-success/10 text-success border-0 text-xs" :
                            sub.status === "trialing" ? "bg-blue-50 text-blue-600 border-0 text-xs" :
                            "bg-muted text-muted-foreground border-0 text-xs"
                          }>
                            {sub.status}
                          </Badge>
                          {sub.current_period_end && (
                            <span className="text-xs text-muted-foreground">
                              Renews {new Date(sub.current_period_end).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {sub.status !== "canceled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl shrink-0 border-error/30 text-error hover:bg-error/5"
                          disabled={cancelingSubId === sub.id}
                          onClick={async () => {
                            setCancelingSubId(sub.id)
                            try {
                              await api.post(`/subscriptions/${sub.id}/cancel`)
                              setMySubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, status: "canceled" } : s))
                              toast.success("Subscription cancelled")
                            } catch (err: any) {
                              toast.error(err.message || "Failed to cancel subscription")
                            } finally {
                              setCancelingSubId(null)
                            }
                          }}
                        >
                          {cancelingSubId === sub.id ? "Cancelling..." : "Cancel"}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Courses */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
              <h2 className="font-bold text-foreground text-base mb-4" style={{ fontFamily: "var(--font-heading)" }}>Courses & Material</h2>
              {clientCourses.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                  No courses enrolled yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clientCourses.map(course => (
                    <div key={course.id} className="p-4 rounded-xl bg-background border border-border flex flex-col justify-between">
                      <div>
                        <Badge className="bg-primary/15 text-primary border-0 mb-2">Self-Paced</Badge>
                        <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2">{course.title}</h3>
                        <p className="text-muted-foreground text-xs mt-2 line-clamp-3">{course.description}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">
                          By {course.expert_profile?.user?.given_name || "Expert"} {course.expert_profile?.user?.family_name}
                        </span>
                        <Button size="sm" className="bg-primary text-white" onClick={() => navigate(`/courses/${course.id}/lessons/default`)}>
                          Open Player
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Quick links + Referrals */}
          <div className="space-y-5">
            <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
              <h3 className="font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-heading)", fontSize: "1rem" }}>Navigation</h3>
              <div className="space-y-2">
                {[
                  { label: "Book consultations", icon: Video, href: "/explore" },
                  { label: "Chat messages", icon: MessageSquare, href: "/inbox" },
                  { label: "My settings", icon: Settings, href: "/settings" },
                ].map(action => {
                  const Icon = action.icon
                  return (
                    <Link key={action.label} to={action.href} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-accent/50 transition-colors group">
                      <div className="h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">{action.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Referral Card */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Gift className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-sm" style={{ fontFamily: "var(--font-heading)" }}>Refer & Earn</h3>
              </div>
              {referralSummary ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">Your Credits</span>
                    <span className="font-bold text-success text-sm">${referralSummary.active_credits_value?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-muted-foreground">Referrals</span>
                    <span className="font-bold text-foreground text-sm">{referralSummary.referred_users_count || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-muted rounded-lg px-2 py-1.5 mb-3">
                    <span className="text-[11px] font-mono text-muted-foreground flex-1 truncate">{referralLink}</span>
                  </div>
                  <button
                    onClick={handleCopyReferral}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                      copySuccess ? "bg-success text-white" : "bg-primary text-white hover:bg-primary/90"
                    }`}
                  >
                    {copySuccess ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copySuccess ? "Copied!" : "Copy Referral Link"}
                  </button>
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">Credits applied automatically to your next booking</p>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-8 bg-muted rounded-xl animate-pulse mt-2" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LinkedIn Post Modal */}
      <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>AI-Generated LinkedIn Thought Leadership Post</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {generatingPostId !== null ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2.5">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground font-medium animate-pulse">Claude is drafting your thought-leadership post...</p>
              </div>
            ) : generatedPost ? (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground font-sans">This post was generated by AI based on key insights and educational takeaways from your session, keeping all client details confidential.</p>
                <div className="rounded-xl border border-border p-4 bg-muted/40 whitespace-pre-wrap text-sm text-foreground leading-relaxed font-sans max-h-96 overflow-y-auto">
                  {generatedPost}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPostModal(false)}
                  >
                    Close
                  </Button>
                  <Button
                    className="gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPost)
                      toast.success("Post copied to clipboard! Paste it directly into LinkedIn.")
                    }}
                  >
                    <Copy className="h-4 w-4" /> Copy Post
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Failed to generate post.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
