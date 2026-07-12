import { useState, useEffect, useRef } from "react"
import { Link, useSearchParams, useNavigate as useNavigate_ } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  Search, Star, MapPin, Clock, ChevronDown, SlidersHorizontal,
  Briefcase, Heart, BookOpen, Video, Zap, TrendingUp, Globe, Code, FlaskConical,
  ArrowRight, CheckCircle2, Sparkles, Loader2
} from "lucide-react"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { Skeleton } from "@/app/components/ui/skeleton"
import { FeatureGate } from "@/app/components/ui/FeatureGate"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu"
import { api } from "@/app/lib/api"
import { toast } from "sonner"
import { fadeInUp, staggerContainer, staggerItem, ease } from "@/app/lib/motion"

const EXPERT_COLORS: [string, string][] = [
  ["from-violet-500 to-indigo-600", "violet"],
  ["from-brand-500 to-brand-700", "brand"],
  ["from-emerald-500 to-teal-600", "emerald"],
  ["from-amber-400 to-orange-500", "amber"],
  ["from-rose-400 to-pink-600", "rose"],
  ["from-sky-400 to-blue-600", "sky"],
  ["from-purple-400 to-violet-600", "purple"],
  ["from-teal-400 to-cyan-600", "teal"],
]

function getExpertRouteIdentifier(expertProfile?: any, user?: any) {
  return user?.username || expertProfile?.user?.username || expertProfile?.id || user?.id
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const getCategoryIcon = (name: string) => {
  switch (name.toLowerCase()) {
    case "technology": return Code
    case "business":
    case "business strategy": return TrendingUp
    case "health": return Heart
    case "education": return BookOpen
    case "science": return FlaskConical
    case "languages": return Globe
    case "marketing": return Zap
    default: return Briefcase
  }
}

function ExpertCard({ service, index }: { service: any; index: number }) {
  const expertProfile = service.expert_profile
  const user = expertProfile?.user
  
  const colorIdx = (expertProfile?.id || 0) % EXPERT_COLORS.length
  const [gradient] = EXPERT_COLORS[colorIdx]
  const [liked, setLiked] = useState(false)
  
  const initials = `${user?.given_name?.[0] || ""}${user?.family_name?.[0] || ""}`.toUpperCase() || "EX"
  const name = user?.display_name || `${user?.given_name || ""} ${user?.family_name || ""}`.trim() || "Expert Advisor"
  const specialty = service.title
  const subspecialty = expertProfile?.specialization || ""
  const rating = expertProfile?.average_rating || 5.0
  const reviews = expertProfile?.reviews_count || 0
  const rate = service.price_cents ? (service.price_cents / 100).toFixed(0) : "0"
  const avatarUrl = user?.avatar_url || null
  const isApproved = expertProfile?.approval_status === "approved"
  const expertIdentifier = getExpertRouteIdentifier(expertProfile, user)

  return (
    <motion.div
      variants={staggerItem}
      className="card-hover group relative bg-card rounded-2xl border border-border overflow-hidden shadow-card"
    >
      {/* Cover gradient */}
      <div className={`h-28 bg-gradient-to-br ${gradient} relative`}>
        <button
          onClick={() => setLiked(l => !l)}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 backdrop-blur-sm text-white transition-transform active:scale-90"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-rose-400 text-rose-400" : ""}`} />
        </button>
        {expertProfile?.is_on_duty && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-medium text-white bg-black/25 backdrop-blur-sm rounded-full px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse-online" />
            Online
          </span>
        )}
      </div>

      {/* Avatar overlapping cover */}
      <div className="relative px-4 pb-4 pt-0">
        <div className={`-mt-7 h-14 w-14 rounded-2xl border-4 border-card shadow-md overflow-hidden shrink-0 ${!avatarUrl ? `bg-gradient-to-br ${gradient} flex items-center justify-center` : ""}`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
              {initials}
            </span>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-foreground truncate max-w-[160px]" style={{ fontFamily: "var(--font-heading)", fontSize: "0.9375rem" }}>
                  {name}
                </h3>
                {isApproved && (
                  <span title="Verified expert">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-foreground font-medium mt-1 truncate" style={{ fontSize: "0.875rem" }}>
                {specialty}
              </p>
              <p className="text-muted-foreground truncate" style={{ fontSize: "0.75rem" }}>
                {subspecialty}
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground" style={{ fontSize: "0.8125rem" }}>{rating}</span>
              <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>({reviews})</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span style={{ fontSize: "0.8125rem" }}>{service.duration_minutes} min</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {subspecialty.split(",").slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100" style={{ fontSize: "0.75rem", fontWeight: 500 }}>
                {tag.trim()}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <div>
              <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>from</span>
              <span className="font-bold text-foreground ml-1" style={{ fontSize: "1.0625rem", fontFamily: "var(--font-heading)" }}>
                ${rate}
              </span>
              <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>/session</span>
            </div>
            <Link to={`/expert/${expertIdentifier}`}>
              <Button size="sm" className="rounded-full px-4">
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ExpertCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-card">
      <Skeleton className="h-28 w-full rounded-none" />
      <div className="px-4 pb-4 pt-0">
        <Skeleton className="-mt-7 h-14 w-14 rounded-2xl" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
          <div className="flex gap-2 mt-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex gap-1.5 mt-3">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CourseCard({ course, onEnrolled }: { course: any; onEnrolled?: (courseId: number) => void }) {
  const colorIdx = (course.id || 0) % EXPERT_COLORS.length
  const [gradient] = EXPERT_COLORS[colorIdx]
  const navigate = useNavigate_()
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(course.enrollment != null)

  const instructor = course.expert_profile?.user
    ? course.expert_profile.user.display_name || `${course.expert_profile.user.given_name} ${course.expert_profile.user.family_name}`.trim()
    : "Expert Instructor"
    
  const price = course.price_cents ? (course.price_cents / 100).toFixed(0) : "0"
  const isFree = course.price_cents === 0

  const handleEnroll = async () => {
    if (enrolled) {
      // Navigate to first lesson
      navigate(`/courses/${course.id}/lessons/default`)
      return
    }
    setEnrolling(true)
    try {
      await api.post(`/courses/${course.id}/enroll`)
      setEnrolled(true)
      toast.success("Enrolled! Starting first lesson...")
      onEnrolled?.(course.id)
      setTimeout(() => navigate(`/courses/${course.id}/lessons/default`), 800)
    } catch (err: any) {
      toast.error(err.message || "Failed to enroll")
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <motion.div variants={staggerItem} className="card-hover bg-card rounded-2xl border border-border overflow-hidden shadow-card">
      <div className={`h-36 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
        <BookOpen className="h-12 w-12 text-white/60" />
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/25 text-white text-xs font-medium backdrop-blur-sm">
          {isFree ? "Free" : "All Levels"}
        </span>
        {enrolled && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/80 text-white text-xs font-medium">
            <CheckCircle2 className="h-3 w-3" /> Enrolled
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground leading-snug" style={{ fontFamily: "var(--font-heading)", fontSize: "0.9375rem" }}>
          {course.title}
        </h3>
        <p className="text-muted-foreground mt-1" style={{ fontSize: "0.8125rem" }}>by {instructor}</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium" style={{ fontSize: "0.8125rem" }}>5.0</span>
          </div>
          <span className="text-muted-foreground" style={{ fontSize: "0.8125rem" }}>
            {course.enrollments_count != null ? `${course.enrollments_count} students` : "Verified"}
          </span>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem" }}>
            {isFree ? "Free" : `$${price}`}
          </span>
          <Button
            size="sm"
            variant={enrolled ? "default" : "outline"}
            className="rounded-full px-4"
            onClick={handleEnroll}
            disabled={enrolling}
          >
            {enrolling ? "Enrolling..." : enrolled ? "Continue" : "Enroll"}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function SessionCard({ session }: { session: any }) {
  const colorIdx = (session.id || 0) % EXPERT_COLORS.length
  const [gradient] = EXPERT_COLORS[colorIdx]
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)

  const expertUser = session.expert_profile?.user
  const initials = `${expertUser?.given_name?.[0] || ""}${expertUser?.family_name?.[0] || ""}`.toUpperCase() || "EX"
  const host = expertUser?.display_name || `${expertUser?.given_name || ""} ${expertUser?.family_name || ""}`.trim() || "Expert"
  
  const durationMin = Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000)
  const formattedDate = new Date(session.start_time).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  
  const totalSpots = session.max_participants || 10
  const takenSpots = session.registered_count ?? 0
  const remainingSpots = totalSpots - takenSpots
  const isFull = session["full?"] || remainingSpots <= 0
  const fillPct = (takenSpots / totalSpots) * 100
  
  const price = session.price_cents ? (session.price_cents / 100).toFixed(0) : "0"

  const handleRegister = async () => {
    if (registered || isFull) return
    setRegistering(true)
    try {
      await api.post(`/group_sessions/${session.id}/register`)
      setRegistered(true)
      toast.success("Registered for session!")
    } catch (err: any) {
      toast.error(err.message || "Failed to register")
    } finally {
      setRegistering(false)
    }
  }

  return (
    <motion.div variants={staggerItem} className="card-hover bg-card rounded-2xl border border-border overflow-hidden shadow-card">
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
            <span className="text-white text-sm font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground leading-snug" style={{ fontFamily: "var(--font-heading)", fontSize: "0.9375rem" }}>
              {session.title}
            </h3>
            <p className="text-muted-foreground mt-0.5" style={{ fontSize: "0.8125rem" }}>by {host}</p>
          </div>
          {isFull && (
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-error/10 text-error text-xs font-semibold border border-error/20">Full</span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span style={{ fontSize: "0.8125rem" }}>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Video className="h-3.5 w-3.5 shrink-0" />
            <span style={{ fontSize: "0.8125rem" }}>{durationMin} min</span>
          </div>
        </div>
        {/* Seats remaining */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground" style={{ fontSize: "0.75rem" }}>{takenSpots} seats taken</span>
            <span className={`text-xs font-medium ${remainingSpots <= 5 ? "text-error" : "text-success"}`}>
              {isFull ? "Sold out" : `${remainingSpots} left`}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${gradient}`} style={{ width: `${fillPct}%` }} />
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem" }}>
            {session.price_cents === 0 ? "Free" : `$${price}`}
          </span>
          <Button
            size="sm"
            className="rounded-full px-4"
            disabled={registering || isFull || registered}
            onClick={handleRegister}
          >
            {registering ? "Registering..." : registered ? "Registered ✓" : isFull ? "Full" : "Register"}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Tab = "experts" | "courses" | "sessions"

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get("tab") as Tab | null
  const qParam = searchParams.get("q") || ""
  const [activeTab, setActiveTab] = useState<Tab>("experts")
  const [searchQuery, setSearchQuery] = useState(qParam)
  const [aiQuery, setAiQuery] = useState("")
  const [aiMatching, setAiMatching] = useState(false)
  const [aiResults, setAiResults] = useState<any[] | null>(null)
  const aiResultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tabParam && ["experts", "courses", "sessions"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Sync searchQuery when URL parameter "q" changes externally (e.g. from landing page search)
  useEffect(() => {
    const currentQ = searchParams.get("q") || ""
    if (currentQ !== searchQuery) {
      setSearchQuery(currentQ)
    }
  }, [searchParams])

  const [dbCategories, setDbCategories] = useState<{ id: number; name: string }[]>([])
  const [dbServices, setDbServices] = useState<any[]>([])
  const [dbCourses, setDbCourses] = useState<any[]>([])
  const [dbSessions, setDbSessions] = useState<any[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await api.get("/categories")
        setDbCategories(cats)
      } catch (err: any) {
        console.error("Failed to load categories:", err)
      }
    }
    fetchCategories()
  }, [])

  // Sync category selected by URL parameter "category" (e.g. from chatbot link redirect)
  useEffect(() => {
    const catSlug = searchParams.get("category")
    if (catSlug && dbCategories.length > 0) {
      const matched = dbCategories.find(c => (c as any).slug === catSlug)
      if (matched) {
        setSelectedCategoryId(matched.id)
      }
    }
  }, [searchParams, dbCategories])

  // Listen for triage-completed event from the floating AI assistant
  useEffect(() => {
    const handleTriageCompleted = (e: Event) => {
      const customEvent = e as CustomEvent
      const { category_slugs, query } = customEvent.detail || {}
      if (category_slugs && category_slugs.length > 0) {
        const recommendedSlug = category_slugs[0]
        const matched = dbCategories.find(c => (c as any).slug === recommendedSlug)
        if (matched) {
          setSelectedCategoryId(matched.id)
        }
        if (query && query !== "triage recommendations") {
          setAiQuery(query)
          // Automatically run AI matching
          setAiMatching(true)
          setAiResults(null)
          api.post("/ai/match", { query: query.trim() })
            .then(res => {
              setAiResults(res.experts || res || [])
              toast.success("✨ AI assistant matched you with these experts!")
              setTimeout(() => aiResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300)
            })
            .catch(() => setAiResults([]))
            .finally(() => setAiMatching(false))
        }
      }
    }

    window.addEventListener("experthub:triage-completed", handleTriageCompleted)
    return () => {
      window.removeEventListener("experthub:triage-completed", handleTriageCompleted)
    }
  }, [dbCategories])

  useEffect(() => {
    async function fetchServices() {
      setLoading(true)
      setCurrentPage(1)
      try {
        let path = "/services"
        const params: string[] = ["page=1"]
        if (selectedCategoryId) {
          params.push(`category_id=${selectedCategoryId}`)
        }
        if (searchQuery) {
          params.push(`q=${encodeURIComponent(searchQuery)}`)
        }
        path += `?${params.join("&")}`
        const svcs = await api.get(path)
        const list = Array.isArray(svcs) ? svcs : (svcs?.data || svcs?.services || [])
        setDbServices(list)
        setHasMore(list.length >= 12)
      } catch (err: any) {
        toast.error("Failed to load services: " + err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [selectedCategoryId, searchQuery])

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = currentPage + 1
    try {
      const params: string[] = [`page=${nextPage}`]
      if (selectedCategoryId) params.push(`category_id=${selectedCategoryId}`)
      if (searchQuery) params.push(`q=${encodeURIComponent(searchQuery)}`)
      const path = `/services?${params.join("&")}`
      const svcs = await api.get(path)
      const list = Array.isArray(svcs) ? svcs : (svcs?.data || svcs?.services || [])
      setDbServices(prev => [...prev, ...list])
      setCurrentPage(nextPage)
      setHasMore(list.length >= 12)
    } catch (err: any) {
      toast.error("Failed to load more: " + err.message)
    } finally {
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    async function fetchCoursesAndSessions() {
      try {
        const crs = await api.get("/courses")
        setDbCourses(crs)
        const ses = await api.get("/group_sessions")
        setDbSessions(ses)
      } catch (err: any) {
        console.error("Failed to load courses/sessions:", err)
      }
    }
    fetchCoursesAndSessions()
  }, [])

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    const newParams = new URLSearchParams(searchParams)
    if (val) {
      newParams.set("q", val)
    } else {
      newParams.delete("q")
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleTabChange = (tabKey: Tab) => {
    setActiveTab(tabKey)
    const newParams = new URLSearchParams(searchParams)
    newParams.set("tab", tabKey)
    setSearchParams(newParams, { replace: true })
  }

  const handleAiMatch = async () => {
    if (!aiQuery.trim() || aiMatching) return
    setAiMatching(true)
    setAiResults(null)
    try {
      const res = await api.post("/ai/match", { query: aiQuery.trim() })
      setAiResults(res.experts || res || [])
      setTimeout(() => aiResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
    } catch {
      setAiResults([])
    } finally {
      setAiMatching(false)
    }
  }

  // Filter courses & sessions locally on client
  const filteredCourses = dbCourses.filter(c => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const title = (c.title || "").toLowerCase()
    const desc = (c.description || "").toLowerCase()
    return title.includes(q) || desc.includes(q)
  })

  const filteredSessions = dbSessions.filter(s => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const title = (s.title || "").toLowerCase()
    const desc = (s.description || "").toLowerCase()
    return title.includes(q) || desc.includes(q)
  })

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "experts", label: "Consultations", count: dbServices.length },
    { key: "courses", label: "Courses", count: filteredCourses.length },
    { key: "sessions", label: "Live Sessions", count: filteredSessions.length },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-violet-600/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 pb-24 text-center">
          <motion.div {...fadeInUp}>
            <Badge className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/15 backdrop-blur-sm px-4 py-1.5">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Browse verified experts across all categories
            </Badge>
          </motion.div>

          <motion.h1
            {...fadeInUp}
            transition={{ ...ease, delay: 0.05 }}
            className="text-white mx-auto max-w-3xl"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.25rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.15 }}
          >
            Connect with <span className="text-brand-300">world-class experts</span> on your schedule
          </motion.h1>

          <motion.p
            {...fadeInUp}
            transition={{ ...ease, delay: 0.1 }}
            className="mt-5 max-w-xl mx-auto text-slate-300"
            style={{ fontSize: "1.0625rem" }}
          >
            Book 1:1 consultations, join live sessions, or learn at your own pace — all in one platform built for serious learners.
          </motion.p>

          {/* Search bar form */}
          <motion.div
            {...fadeInUp}
            transition={{ ...ease, delay: 0.15 }}
            className="mt-8 max-w-2xl mx-auto"
          >
            <form
              onSubmit={e => e.preventDefault()}
              className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-modal"
            >
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name, skill, or topic..."
                  className="flex-1 bg-transparent outline-none text-white placeholder:text-slate-500"
                  style={{ fontSize: "0.9375rem" }}
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white transition-colors shrink-0" style={{ fontSize: "0.875rem" }}>
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {dbCategories.find(c => c.id === selectedCategoryId)?.name || "All Categories"}
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-slate-900 border-slate-800 text-white">
                  <DropdownMenuItem onClick={() => setSelectedCategoryId(null)} className="hover:bg-slate-800 cursor-pointer">All Categories</DropdownMenuItem>
                  {dbCategories.map(c => (
                    <DropdownMenuItem key={c.id} onClick={() => setSelectedCategoryId(c.id)} className="hover:bg-slate-800 cursor-pointer">
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button type="submit" className="rounded-xl px-6 shrink-0 glow-brand bg-primary hover:bg-primary/95 text-white">
                <Search className="h-4 w-4 mr-1.5" /> Search
              </Button>
            </form>
          </motion.div>

          {/* AI Expert Matching */}
          <motion.div {...fadeInUp} transition={{ ...ease, delay: 0.2 }} className="mt-5 max-w-2xl mx-auto">
            <FeatureGate feature="ai_matching">
              <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-700/60 rounded-2xl p-2 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-brand-400 shrink-0 ml-2" />
                <input
                  type="text"
                  placeholder="Or describe your problem and let AI find the best expert..."
                  className="flex-1 bg-transparent outline-none text-slate-200 placeholder:text-slate-500 text-sm"
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAiMatch() }}
                />
                <button
                  onClick={handleAiMatch}
                  disabled={!aiQuery.trim() || aiMatching}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors shrink-0"
                >
                  {aiMatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  AI Match
                </button>
              </div>
            </FeatureGate>
          </motion.div>

        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-background" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
      </section>

      {/* AI Match Results */}
      {aiResults !== null && (
        <section ref={aiResultsRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                AI-matched experts for: <span className="text-primary">"{aiQuery}"</span>
              </h2>
              <button onClick={() => setAiResults(null)} className="ml-auto text-muted-foreground hover:text-foreground text-sm">Clear</button>
            </div>
            {aiResults.length === 0 ? (
              <p className="text-muted-foreground text-sm">No experts found for this query. Try rephrasing or browse categories below.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {aiResults.map((expert: any, i: number) => {
                  const colorIdx = i % EXPERT_COLORS.length
                  const [gradient] = EXPERT_COLORS[colorIdx]
                  const name = expert.display_name || `${expert.given_name || ""} ${expert.family_name || ""}`.trim() || "Expert"
                  const initials = `${expert.given_name?.[0] || ""}${expert.family_name?.[0] || ""}`.toUpperCase() || "EX"
                  const profile = expert.expert_profile
                  const expertIdentifier = getExpertRouteIdentifier(profile, expert) || expert.expert_profile_id
                  return (
                    <div key={expert.id} className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3">
                      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm`}>{initials}</div>
                      <div>
                        <p className="font-semibold text-foreground text-sm" style={{ fontFamily: "var(--font-heading)" }}>{name}</p>
                        {profile?.specialization && <p className="text-muted-foreground text-xs mt-0.5">{profile.specialization}</p>}
                        {profile?.average_rating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-medium">{profile.average_rating}</span>
                          </div>
                        )}
                      </div>
                      <Link to={`/expert/${expertIdentifier}`} className="mt-auto">
                        <Button size="sm" className="w-full rounded-xl">View Profile</Button>
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`flex items-center gap-2 shrink-0 px-4 py-2 rounded-full border transition-all text-sm font-medium ${
              !selectedCategoryId
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
            }`}
          >
            All
          </button>
          {dbCategories.map(cat => {
            const Icon = getCategoryIcon(cat.name)
            const active = selectedCategoryId === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(active ? null : cat.id)}
                className={`flex items-center gap-2 shrink-0 px-4 py-2 rounded-full border transition-all text-sm font-medium ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {cat.name}
              </button>
            )
          })}
        </div>
      </section>

      {/* Tab Switcher */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-card text-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key ? "bg-brand-100 text-brand-600" : "bg-muted text-muted-foreground"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filter controls */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full gap-2">
                  Sort by: Rating <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Rating (high to low)</DropdownMenuItem>
                <DropdownMenuItem>Price (low to high)</DropdownMenuItem>
                <DropdownMenuItem>Most reviews</DropdownMenuItem>
                <DropdownMenuItem>Availability</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 pb-20">
        <AnimatePresence mode="wait">
          {activeTab === "experts" && (
            <motion.div key="experts" {...fadeInUp}>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {Array.from({ length: 8 }).map((_, i) => <ExpertCardSkeleton key={i} />)}
                </div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                >
                  {dbServices.map((service, i) => (
                    <ExpertCard key={service.id} service={service} index={i} />
                  ))}
                  {dbServices.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                      <Search className="h-12 w-12 text-muted-foreground/40 mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">No experts found</h3>
                      <p className="text-muted-foreground text-sm mb-4">Try adjusting your search or filters</p>
                      <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCategoryId(null) }}>
                        Clear filters
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === "courses" && (
            <motion.div key="courses" {...fadeInUp}>
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              >
                {filteredCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
                {filteredCourses.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                    <Search className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No courses found</h3>
                    <p className="text-muted-foreground text-sm mb-4">Try adjusting your search query</p>
                    <Button variant="outline" onClick={() => handleSearchChange("")}>
                      Clear search
                    </Button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {activeTab === "sessions" && (
            <motion.div key="sessions" {...fadeInUp}>
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {filteredSessions.map(session => (
                  <SessionCard key={session.id} session={session} />
                ))}
                {filteredSessions.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                    <Search className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No sessions found</h3>
                    <p className="text-muted-foreground text-sm mb-4">Try adjusting your search query</p>
                    <Button variant="outline" onClick={() => handleSearchChange("")}>
                      Clear search
                    </Button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load more */}
        {activeTab === "experts" && hasMore && !loading && (
          <div className="flex justify-center mt-10">
            <Button
              variant="outline"
              className="rounded-full px-8 gap-2"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Loading...</>
              ) : (
                <>Load more experts <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
