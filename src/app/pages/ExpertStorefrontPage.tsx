import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router"
import { motion } from "motion/react"
import {
  Star, CheckCircle2, Clock, Video, MessageSquare, Calendar,
  Globe, Award, Heart, Share2, Flag,
  ChevronDown, ChevronUp, ArrowLeft, ThumbsUp, CreditCard, Zap
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/app/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import { fadeInUp, ease } from "@/app/lib/motion"
import { api } from "@/app/lib/api"
import { toast } from "sonner"

// ─── Helpers ───────────────────────────────────────────────────────────────────

const generateNext7Days = () => {
  const dates = []
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`
    
    dates.push({
      dateStr,
      dayName: daysOfWeek[d.getDay()],
      monthDay: `${months[d.getMonth()]} ${d.getDate()}`,
      dayNum: d.getDate(),
    })
  }
  return dates
}

const formatSlotTime = (timeStr: string) => {
  try {
    const date = new Date(timeStr)
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  } catch (e) {
    return timeStr
  }
}

const EXPERT_COLORS = [
  "from-violet-400 to-indigo-600",
  "from-emerald-400 to-teal-600",
  "from-rose-400 to-pink-600",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-600",
  "from-purple-400 to-fuchsia-600",
  "from-green-400 to-emerald-600",
  "from-red-400 to-rose-600",
]

// ─── Booking Panel ─────────────────────────────────────────────────────────────

interface BookingPanelProps {
  expertUser: any
  services: any[]
  selectedService: any
  setSelectedService: (s: any) => void
  selectedDate: any
  setSelectedDate: (d: any) => void
  selectedTime: string | null
  setSelectedTime: (t: string | null) => void
  slots: any[]
  loadingSlots: boolean
  navigate: any
}

function BookingPanel({
  expertUser,
  services,
  selectedService,
  setSelectedService,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  slots,
  loadingSlots,
  navigate
}: BookingPanelProps) {
  const [dateOffset, setDateOffset] = useState(0)
  const next7Days = generateNext7Days()
  const visibleDates = next7Days.slice(dateOffset, dateOffset + 5)
  const canGoBack = dateOffset > 0
  const canGoForward = dateOffset + 5 < next7Days.length

  const handleBooking = () => {
    if (!selectedService || !selectedDate || !selectedTime) return
    navigate("/checkout", {
      state: {
        serviceId: selectedService.id,
        date: selectedDate.dateStr,
        slot: selectedTime
      }
    })
  }

  return (
    <div className="glass-light rounded-2xl p-5 shadow-raised sticky top-24 border border-border/60">
      <h3 className="font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-heading)", fontSize: "1rem" }}>
        Book a Consultation
      </h3>

      {/* Service selector */}
      <div className="space-y-2 mb-4">
        {services.map(service => (
          <button
            key={service.id}
            onClick={() => {
              setSelectedService(service)
              setSelectedTime(null)
            }}
            className={`w-full flex items-start justify-between p-3 rounded-xl border text-left transition-all ${
              selectedService?.id === service.id
                ? "border-primary bg-brand-50"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <div className="flex-1">
              <div className="font-medium text-foreground" style={{ fontSize: "0.875rem" }}>{service.title}</div>
              <div className="text-muted-foreground mt-0.5" style={{ fontSize: "0.75rem" }}>
                {service.duration_minutes} min · {service.description ? service.description.slice(0, 50) + "..." : ""}
              </div>
            </div>
            <div className="font-bold text-primary shrink-0 ml-3" style={{ fontFamily: "var(--font-heading)", fontSize: "0.9375rem" }}>
              ${service.price_cents ? (service.price_cents / 100).toFixed(0) : "0"}
            </div>
          </button>
        ))}
        {services.length === 0 && (
          <p className="text-muted-foreground text-sm">No services listed yet.</p>
        )}
      </div>

      <Separator className="mb-4" />

      {/* Date selector */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-foreground" style={{ fontSize: "0.875rem" }}>Select Date</span>
          <div className="flex gap-1">
            <button
              disabled={!canGoBack}
              onClick={() => setDateOffset(d => d - 1)}
              className="p-1 rounded-md hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronDown className="h-4 w-4 rotate-90" />
            </button>
            <button
              disabled={!canGoForward}
              onClick={() => setDateOffset(d => d + 1)}
              className="p-1 rounded-md hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronDown className="h-4 w-4 -rotate-90" />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          {visibleDates.map(date => (
            <button
              key={date.dateStr}
              onClick={() => { setSelectedDate(date); setSelectedTime(null) }}
              className={`flex-1 py-2 rounded-xl text-center transition-all ${
                selectedDate?.dateStr === date.dateStr
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-brand-50 hover:text-primary"
              }`}
            >
              <div style={{ fontSize: "0.625rem", fontWeight: 600 }}>{date.monthDay.slice(4)}</div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600 }}>{date.dayName}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <motion.div {...fadeInUp} className="mt-4">
          <div className="font-medium text-foreground mb-3" style={{ fontSize: "0.875rem" }}>Available Times</div>
          {loadingSlots ? (
            <div className="text-center py-4 text-muted-foreground text-sm">Loading slots...</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {slots.filter(s => s.available).map(slot => {
                const formattedTime = formatSlotTime(slot.start_time)
                return (
                  <button
                    key={slot.start_time}
                    onClick={() => setSelectedTime(formattedTime)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                      selectedTime === formattedTime
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-brand-50"
                    }`}
                  >
                    {formattedTime}
                  </button>
                )
              })}
              {slots.filter(s => s.available).length === 0 && (
                <div className="col-span-2 text-center py-4 text-muted-foreground text-xs">
                  No slots available on this day.
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      <Separator className="my-4" />

      {/* Price & CTA */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>Total</div>
        <div className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem" }}>
          ${selectedService ? (selectedService.price_cents / 100).toFixed(0) : "0"}
        </div>
      </div>

      <Button
        className="w-full rounded-xl py-3 glow-brand"
        disabled={!selectedDate || !selectedTime}
        onClick={handleBooking}
      >
        <Calendar className="h-4 w-4 mr-2" />
        {selectedDate && selectedTime ? `Book for ${selectedDate.monthDay} at ${selectedTime}` : "Select a time"}
      </Button>

      <p className="text-center text-muted-foreground mt-3" style={{ fontSize: "0.75rem" }}>
        Free cancellation up to 24h before session
      </p>

      {/* Chat option */}
      <Button variant="outline" className="w-full mt-2 rounded-xl gap-2">
        <MessageSquare className="h-4 w-4" /> Message First
      </Button>
    </div>
  )
}

// ─── Page Component ───────────────────────────────────────────────────────────

const getEmbedUrl = (url: string) => {
  if (!url) return null
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
  
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/[^\/]+\/|groups\/[^\/]+\/videos\/|album\/[^\/]+\/video\/|showcase\/[^\/]+\/video\/|event\/[^\/]+\/videos\/|video\/)?([0-9]+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  
  return url.startsWith("http") ? url : null
}

export function ExpertStorefrontPage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()

  const [expertUser, setExpertUser] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([])
  const [subscribingId, setSubscribingId] = useState<number | null>(null)
  const [subscribedIds, setSubscribedIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<any>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const [bioExpanded, setBioExpanded] = useState(false)
  const [liked, setLiked] = useState(false)
  const [mobileBookingOpen, setMobileBookingOpen] = useState(false)

  // Fetch expert, services, and reviews
  useEffect(() => {
    if (!username) return
    async function loadData() {
      setLoading(true)
      try {
        const expertData = await api.get(`/experts/${username}`)
        setExpertUser(expertData)
        const expertProfileId = expertData?.expert_profile?.id

        // Services
        const svcData = await api.get(`/services?expert_profile_id=${expertProfileId || username}`)
        setServices(svcData)
        if (svcData.length > 0) {
          setSelectedService(svcData[0])
        }

        // Reviews
        const revData = await api.get(`/reviews?expert_profile_id=${expertProfileId || username}`)
        setReviews(revData)

        // Subscription plans (client-facing plans)
        try {
          const plansData = await api.get(`/subscription_plans?expert_profile_id=${expertProfileId || ""}`)
          const clientPlans = Array.isArray(plansData)
            ? plansData.filter((p: any) => p.target_role === "client" && p.is_active !== false)
            : []
          setSubscriptionPlans(clientPlans)
        } catch {
          // subscription plans are optional
        }
      } catch (err: any) {
        toast.error("Failed to load expert storefront: " + err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [username])

  // Fetch slot availability when selected service or selected date changes
  useEffect(() => {
    if (!selectedService || !selectedDate) {
      setSlots([])
      return
    }

    async function loadSlots() {
      setLoadingSlots(true)
      try {
        const res = await api.get(`/services/${selectedService.id}/slots?date=${selectedDate.dateStr}`)
        setSlots(res.slots || [])
      } catch (err: any) {
        toast.error("Failed to load availability: " + err.message)
      } finally {
        setLoadingSlots(false)
      }
    }
    loadSlots()
  }, [selectedService, selectedDate])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
          />
          <p className="text-muted-foreground text-sm font-medium">Loading storefront...</p>
        </div>
      </div>
    )
  }

  if (!expertUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-foreground font-bold mb-2" style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem" }}>Expert not found</h2>
          <p className="text-muted-foreground mb-4">The expert profile you are looking for does not exist or has been disabled.</p>
          <Link to="/">
            <Button className="rounded-xl">Go Back Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const profile = expertUser.expert_profile
  const initials = `${expertUser.given_name?.[0] || ""}${expertUser.family_name?.[0] || ""}`.toUpperCase() || "EX"
  const name = expertUser.display_name || `${expertUser.given_name || ""} ${expertUser.family_name || ""}`.trim() || "Expert Advisor"
  
  // Pick cover gradient
  const colorIndex = (expertUser.id || 0) % EXPERT_COLORS.length
  const gradient = EXPERT_COLORS[colorIndex]

  // Average Rating
  const avgRating = profile?.average_rating ? parseFloat(profile.average_rating) : 5.0
  const totalReviews = profile?.reviews_count || reviews.length || 0

  const handleSubscribe = async (planId: number) => {
    setSubscribingId(planId)
    try {
      await api.post("/subscriptions", { subscription_plan_id: planId })
      setSubscribedIds(prev => [...prev, planId])
      toast.success("Subscribed successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to subscribe")
    } finally {
      setSubscribingId(null)
    }
  }

  const handleMobileBooking = () => {
    if (selectedService && selectedDate && selectedTime) {
      navigate("/checkout", {
        state: {
          serviceId: selectedService.id,
          date: selectedDate.dateStr,
          slot: selectedTime
        }
      })
    } else {
      toast.info("Please select a date and time slot from the booking panel.")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <Link to="/explore" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to experts
        </Link>
      </div>

      {/* Cover + Identity */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
        <div className="relative rounded-2xl overflow-hidden">
          {/* Cover */}
          <div className={`h-52 sm:h-64 bg-gradient-to-br ${gradient} relative`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setLiked(l => !l)}
                className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white transition-transform hover:scale-110"
              >
                <Heart className={`h-5 w-5 ${liked ? "fill-rose-400 text-rose-400" : ""}`} />
              </button>
              <button className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white">
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Identity card */}
          <div className="bg-card border border-border rounded-b-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Avatar */}
              <div className={`-mt-16 sm:-mt-20 h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-br ${gradient} border-4 border-card flex items-center justify-center shadow-raised shrink-0`}>
                <span className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                  {initials}
                </span>
              </div>

              <div className="flex-1 sm:mt-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700 }}>
                        {name}
                      </h1>
                      {profile?.approval_status === "approved" && (
                        <Badge className="bg-brand-50 text-brand-600 border-brand-200 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </Badge>
                      )}
                      {profile?.is_on_duty && (
                        <Badge className="bg-success/10 text-success border-success/20 gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-online" /> Online
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1">{profile?.title || "Expert Advisor"}</p>
                  </div>

                  {/* Quick stats */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-foreground">{avgRating.toFixed(1)}</span>
                      <span className="text-muted-foreground text-sm">({totalReviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <Clock className="h-4 w-4" />
                      <span>Responds ~1h</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                      <Video className="h-4 w-4" />
                      <span>{profile?.bookings_count || 0} sessions</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><Globe className="h-4 w-4" />GMT (UTC{profile?.timezone_offset >= 0 ? `+${profile?.timezone_offset}` : profile?.timezone_offset})</div>
              <div className="flex items-center gap-1.5"><Award className="h-4 w-4" />Member since {new Date(expertUser.created_at).getFullYear()}</div>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                English
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left column */}
          <div>
            <Tabs defaultValue="about">
              <TabsList className="w-full justify-start gap-1 bg-transparent border-b border-border rounded-none pb-0 h-auto mb-6">
                {["about", "services", "reviews"].map(tab => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary capitalize pb-3 px-4"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* About */}
              <TabsContent value="about" className="mt-0">
                <motion.div {...fadeInUp} className="space-y-6">
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <h2 className="font-semibold text-foreground mb-3" style={{ fontFamily: "var(--font-heading)", fontSize: "1.0625rem" }}>About</h2>
                    <div className="text-muted-foreground leading-relaxed" style={{ fontSize: "0.9375rem" }}>
                      {profile?.bio ? (
                        bioExpanded
                          ? profile.bio.split("\n").map((p: string, i: number) => <p key={i} className={i > 0 ? "mt-3" : ""}>{p}</p>)
                          : <p>{profile.bio.slice(0, 280)}{profile.bio.length > 280 ? "..." : ""}</p>
                      ) : (
                        <p>No bio available.</p>
                      )}
                    </div>
                    {profile?.bio && profile.bio.length > 280 && (
                      <button
                        onClick={() => setBioExpanded(b => !b)}
                        className="flex items-center gap-1 mt-2 text-primary font-medium text-sm"
                      >
                        {bioExpanded ? <><ChevronUp className="h-4 w-4" /> Show less</> : <><ChevronDown className="h-4 w-4" /> Read more</>}
                      </button>
                    )}
                  </div>

                  {/* Specializations */}
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <h2 className="font-semibold text-foreground mb-3" style={{ fontFamily: "var(--font-heading)", fontSize: "1.0625rem" }}>Specializations</h2>
                    <div className="flex flex-wrap gap-2">
                      {profile?.specialization?.split(",")?.map((tag: string) => (
                        <span key={tag} className="px-3 py-1.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100 text-sm font-medium">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Intro Video */}
                  {profile?.intro_video_url && getEmbedUrl(profile.intro_video_url) && (
                    <div className="bg-card rounded-2xl border border-border p-5 overflow-hidden">
                      <h2 className="font-semibold text-foreground mb-3" style={{ fontFamily: "var(--font-heading)", fontSize: "1.0625rem" }}>Introduction Video</h2>
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black/5 border border-border">
                        <iframe
                          src={getEmbedUrl(profile.intro_video_url)!}
                          className="absolute inset-0 w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="Introduction Video"
                        />
                      </div>
                    </div>
                  )}

                  {/* Credentials / Vetting */}
                  {Array.isArray(profile?.credentials) && profile.credentials.length > 0 && (
                    <div className="bg-card rounded-2xl border border-border p-5">
                      <h2 className="font-semibold text-foreground mb-4" style={{ fontFamily: "var(--font-heading)", fontSize: "1.0625rem" }}>Academic & Professional Credentials</h2>
                      <div className="space-y-3.5">
                        {profile.credentials.map((cred: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 mt-0.5">
                              <Award className="h-4.5 w-4.5 text-brand-600" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">{cred.name}</p>
                              <p className="text-muted-foreground text-xs mt-0.5">{cred.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Press / Publications */}
                  {Array.isArray(profile?.press_links) && profile.press_links.length > 0 && (
                    <div className="bg-card rounded-2xl border border-border p-5">
                      <h2 className="font-semibold text-foreground mb-3" style={{ fontFamily: "var(--font-heading)", fontSize: "1.0625rem" }}>Featured In & Publications</h2>
                      <div className="flex flex-wrap gap-3">
                        {profile.press_links.map((link: any, idx: number) => (
                          <a
                            key={idx}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted border border-border text-xs font-semibold text-foreground hover:border-primary/40 hover:text-primary transition-all"
                          >
                            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                            {link.name}
                            <Share2 className="h-3 w-3 text-muted-foreground" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              {/* Services */}
              <TabsContent value="services" className="mt-0">
                <motion.div {...fadeInUp} className="space-y-4">
                  {services.map(service => (
                    <div key={service.id} className="bg-card rounded-2xl border border-border p-5 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "1rem" }}>{service.title}</h3>
                        <p className="text-muted-foreground mt-1 text-sm">{service.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="flex items-center gap-1.5 text-muted-foreground text-sm"><Clock className="h-4 w-4" />{service.duration_minutes} min</span>
                          <span className="flex items-center gap-1.5 text-muted-foreground text-sm"><Video className="h-4 w-4" />Video call</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <span className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem" }}>
                          ${service.price_cents ? (service.price_cents / 100).toFixed(0) : "0"}
                        </span>
                        <Button
                          size="sm"
                          className="rounded-full px-4"
                          onClick={() => {
                            setSelectedService(service)
                            const firstDate = generateNext7Days()[0]
                            setSelectedDate(firstDate)
                            setSelectedTime(null)
                          }}
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                  {services.length === 0 && (
                    <p className="text-muted-foreground text-sm p-4 text-center">No services found for this expert.</p>
                  )}
                </motion.div>
              </TabsContent>

              {/* Reviews */}
              <TabsContent value="reviews" className="mt-0">
                <motion.div {...fadeInUp} className="space-y-4">
                  {/* Aggregate info card */}
                  <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-6">
                    <div className="text-center">
                      <div className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "3rem" }}>{avgRating.toFixed(1)}</div>
                      <div className="flex gap-0.5 justify-center my-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className={`h-4 w-4 ${i <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                        ))}
                      </div>
                      <div className="text-muted-foreground text-sm">{totalReviews} reviews</div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map(stars => {
                        const count = reviews.filter(r => r.rating === stars).length
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                        return (
                          <div key={stars} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-2">{stars}</span>
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground w-4">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {reviews.map(review => {
                    const reviewerInitials = `${review.reviewer?.given_name?.[0] || ""}${review.reviewer?.family_name?.[0] || ""}`.toUpperCase() || "C"
                    const reviewerName = review.reviewer?.display_name || `${review.reviewer?.given_name || ""} ${review.reviewer?.family_name || ""}`.trim() || "Client"
                    return (
                      <div key={review.id} className="bg-card rounded-2xl border border-border p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-semibold">
                              {reviewerInitials}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground text-sm">{reviewerName}</div>
                              <div className="text-muted-foreground text-xs">{new Date(review.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} className={`h-3.5 w-3.5 ${i <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm mt-3 leading-relaxed">{review.content}</p>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                          <button className="flex items-center gap-1.5 text-muted-foreground text-xs hover:text-primary transition-colors">
                            <ThumbsUp className="h-3.5 w-3.5" /> Helpful
                          </button>
                          <button className="flex items-center gap-1.5 text-muted-foreground text-xs hover:text-primary transition-colors">
                            <Flag className="h-3.5 w-3.5" /> Report
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {reviews.length === 0 && (
                    <p className="text-muted-foreground text-sm p-4 text-center">No reviews yet for this expert.</p>
                  )}
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right column — Booking panel (desktop only; mobile uses Sheet) */}
          <div className="hidden lg:block space-y-4">
            <BookingPanel
              expertUser={expertUser}
              services={services}
              selectedService={selectedService}
              setSelectedService={setSelectedService}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              slots={slots}
              loadingSlots={loadingSlots}
              navigate={navigate}
            />

            {/* Subscription Plans */}
            {subscriptionPlans.length > 0 && (
              <div className="glass-light rounded-2xl p-5 border border-border/60 shadow-raised">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "1rem" }}>
                    Subscribe & Save
                  </h3>
                </div>
                <div className="space-y-3">
                  {subscriptionPlans.map(plan => {
                    const isSubscribed = subscribedIds.includes(plan.id)
                    const features: string[] = Array.isArray(plan.features) ? plan.features : []
                    return (
                      <div key={plan.id} className={`p-4 rounded-xl border transition-all ${isSubscribed ? "border-success bg-success/5" : "border-border bg-card hover:border-primary/40"}`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-semibold text-foreground text-sm">{plan.name}</p>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="font-bold text-primary">${(plan.price_cents / 100).toFixed(0)}</span>
                              <span className="text-muted-foreground text-xs">/{plan.billing_interval}</span>
                            </div>
                          </div>
                          <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
                        </div>
                        {features.length > 0 && (
                          <ul className="space-y-1 mb-3">
                            {features.slice(0, 3).map((f, i) => (
                              <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 text-success shrink-0" /> {f}
                              </li>
                            ))}
                          </ul>
                        )}
                        <Button
                          size="sm"
                          className="w-full rounded-xl"
                          variant={isSubscribed ? "outline" : "default"}
                          disabled={isSubscribed || subscribingId === plan.id}
                          onClick={() => handleSubscribe(plan.id)}
                        >
                          {isSubscribed ? "Subscribed ✓" : subscribingId === plan.id ? "Subscribing..." : "Subscribe"}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile sticky CTA — triggers full booking panel Sheet */}
      <Sheet open={mobileBookingOpen} onOpenChange={setMobileBookingOpen}>
        <div className="fixed bottom-0 left-0 right-0 lg:hidden p-4 bg-card/90 backdrop-blur-md border-t border-border z-10">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            <div>
              <div className="text-sm text-muted-foreground">Starting from</div>
              <div className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem" }}>
                ${selectedService ? (selectedService.price_cents / 100).toFixed(0) : "0"}
              </div>
            </div>
            <SheetTrigger asChild>
              <Button className="rounded-xl px-6 gap-2 glow-brand">
                <Calendar className="h-4 w-4" /> Book Now
              </Button>
            </SheetTrigger>
          </div>
        </div>
        <SheetContent side="bottom" className="h-[92dvh] overflow-y-auto rounded-t-2xl px-4 pb-8">
          <SheetHeader className="mb-4">
            <SheetTitle style={{ fontFamily: "var(--font-heading)" }}>Book a Session</SheetTitle>
          </SheetHeader>
          <BookingPanel
            expertUser={expertUser}
            services={services}
            selectedService={selectedService}
            setSelectedService={setSelectedService}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            slots={slots}
            loadingSlots={loadingSlots}
            navigate={navigate}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
