import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  Check, ChevronRight, ChevronLeft, Sparkles, Camera, Clock,
  Calendar, Link as LinkIcon, Star, Video, DollarSign, User,
  CalendarDays, Zap, ArrowRight
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { toast } from "sonner"
import { api, getStoredUser } from "@/app/lib/api"
import { useTenant } from "@/app/providers/TenantThemeProvider"

const STEPS = [
  { id: 1, label: "Welcome", icon: Sparkles },
  { id: 2, label: "Profile Photo", icon: Camera },
  { id: 3, label: "First Service", icon: Star },
  { id: 4, label: "Availability", icon: Calendar },
  { id: 5, label: "Go Live!", icon: Zap },
]

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const TIME_SLOTS = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"]

type AvailSlot = { day: string; time: string }

export function OnboardingPage() {
  const navigate = useNavigate()
  const tenant = useTenant()
  const [step, setStep] = useState(1)
  const [serviceName, setServiceName] = useState("Strategy Session")
  const [serviceType, setServiceType] = useState("1on1")
  const [duration, setDuration] = useState("60")
  const [price, setPrice] = useState("200")
  const [availability, setAvailability] = useState<AvailSlot[]>([
    { day: "Mon", time: "10:00 AM" },
    { day: "Tue", time: "10:00 AM" },
    { day: "Wed", time: "2:00 PM" },
    { day: "Thu", time: "10:00 AM" },
    { day: "Fri", time: "2:00 PM" },
  ])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const cached = getStoredUser()
    if (cached) {
      setUser(cached)
    }
    api.get("/me")
      .then((res: any) => {
        if (res.user) {
          setUser(res.user)
          localStorage.setItem("user", JSON.stringify(res.user))
        }
      })
      .catch((err: any) => {
        console.error("Failed to refresh user profile during onboarding:", err)
      })
  }, [])

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  function toggleSlot(day: string, time: string) {
    const key = `${day}-${time}`
    setAvailability(prev =>
      prev.some(s => `${s.day}-${s.time}` === key)
        ? prev.filter(s => `${s.day}-${s.time}` !== key)
        : [...prev, { day, time }]
    )
  }

  function isSelected(day: string, time: string) {
    return availability.some(s => s.day === day && s.time === time)
  }

  const handleNext = async () => {
    if (step === 4) {
      setLoading(true)
      try {
        // 1. Create first service
        await api.post("/services", {
          service: {
            title: serviceName,
            price_cents: parseFloat(price || "0") * 100,
            duration_minutes: parseInt(duration || "60"),
            slot_interval_minutes: parseInt(duration || "60"),
            description: "1on1 consulting and strategy session"
          }
        })

        // 2. Save working time slots
        const DAY_MAP: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
        
        const convertTimeFormat = (t: string): string => {
          const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i)
          if (!match) return "09:00:00"
          let hour = parseInt(match[1])
          const min = match[2]
          const ampm = match[3].toUpperCase()
          if (ampm === "PM" && hour < 12) hour += 12
          if (ampm === "AM" && hour === 12) hour = 0
          return `${hour.toString().padStart(2, '0')}:${min}:00`
        }

        const getTillTime = (t: string): string => {
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
          return convertTimeFormat(`${hour}:${min} ${ampm}`)
        }

        const slotsPayload = availability.map(item => ({
          week_day: DAY_MAP[item.day] || 1,
          from_time: convertTimeFormat(item.time),
          till_time: getTillTime(item.time)
        }))

        await api.post("/working_time_slots", { slots: slotsPayload })

        // 3. Refetch user profile details
        const meRes = await api.get("/me")
        if (meRes.user) {
          setUser(meRes.user)
          localStorage.setItem("user", JSON.stringify(meRes.user))
        }

        toast.success("Profile setup complete!")
        setStep(5)
      } catch (err: any) {
        toast.error("Failed to complete onboarding: " + err.message)
      } finally {
        setLoading(false)
      }
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "0.9375rem" }}>{tenant.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{step}/{STEPS.length}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map(s => {
              const done = step > s.id
              const active = step === s.id
              return (
                <div key={s.id} className={`h-2 rounded-full transition-all duration-300 ${done ? "w-6 bg-primary" : active ? "w-8 bg-primary" : "w-2 bg-border"}`} />
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 1 && <WelcomeStep name={user?.given_name || " Jordan"} />}
              {step === 2 && <PhotoStep initials={((user?.given_name?.[0] || "") + (user?.family_name?.[0] || "")).toUpperCase() || "EX"} />}
              {step === 3 && <ServiceStep serviceName={serviceName} setServiceName={setServiceName} serviceType={serviceType} setServiceType={setServiceType} duration={duration} setDuration={setDuration} price={price} setPrice={setPrice} />}
              {step === 4 && <AvailabilityStep days={DAYS} timeSlots={TIME_SLOTS} isSelected={isSelected} toggleSlot={toggleSlot} availability={availability} />}
              {step === 5 && <GoLiveStep user={user} navigate={navigate} serviceName={serviceName} price={price} availabilityCount={availability.length} />}
            </motion.div>
          </AnimatePresence>

          {step < 5 && (
            <div className="flex items-center justify-between mt-8">
              <Button variant="ghost" onClick={() => step > 1 && setStep(s => s - 1)} disabled={step === 1 || loading} className="text-muted-foreground">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleNext} disabled={loading} className="gap-2 min-w-32">
                {loading ? "Saving..." : step === 4 ? "Finish Setup" : "Continue"} <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Steps ──────────────────────────────────────────────────────────────────

function WelcomeStep({ name }: { name: string }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-xl"
      >
        <Sparkles className="h-12 w-12 text-white" />
      </motion.div>
      <h1 className="text-foreground mb-3" style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700 }}>
        Welcome, {name}! 🎉
      </h1>
      <p className="text-muted-foreground leading-relaxed mb-8">
        Your application has been approved. Let's set up your expert profile so you can start accepting bookings.
      </p>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: User, label: "Profile photo" },
          { icon: Star, label: "First service" },
          { icon: Calendar, label: "Availability" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="bg-muted/50 rounded-2xl p-4 flex flex-col items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground text-center">{label}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Takes about 3 minutes to complete.</p>
    </div>
  )
}

function PhotoStep({ initials }: { initials: string }) {
  return (
    <div className="text-center">
      <h2 className="text-foreground mb-2" style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700 }}>Add a profile photo</h2>
      <p className="text-muted-foreground mb-8">Experts with photos get 3× more bookings.</p>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white text-4xl font-bold">
            {initials}
          </div>
          <button className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
            <Camera className="h-4 w-4" />
          </button>
        </div>
        <div className="border-2 border-dashed border-border rounded-2xl p-8 w-full hover:border-primary/50 transition-colors cursor-pointer mt-4">
          <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Upload your photo</p>
          <p className="text-xs text-muted-foreground mt-1">JPG or PNG, at least 400×400px</p>
        </div>
        <Button variant="outline" className="w-full">Use initials instead</Button>
      </div>
    </div>
  )
}

function ServiceStep({ serviceName, setServiceName, serviceType, setServiceType, duration, setDuration, price, setPrice }: {
  serviceName: string; setServiceName: (v: string) => void
  serviceType: string; setServiceType: (v: string) => void
  duration: string; setDuration: (v: string) => void
  price: string; setPrice: (v: string) => void
}) {
  return (
    <div>
      <h2 className="text-foreground mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700 }}>Create your first service</h2>
      <p className="text-sm text-muted-foreground mb-6">You can always add more services later from your dashboard.</p>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Service Name</label>
          <input
            value={serviceName}
            onChange={e => setServiceName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "1on1", icon: Video, label: "1:1 Video Call" },
              { id: "async", icon: LinkIcon, label: "Async Q&A" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setServiceType(id)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm
                  ${serviceType === id ? "border-primary bg-brand-50/50 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Duration</label>
            <select
              value={duration}
              onChange={e => setDuration(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {["30", "45", "60", "90", "120"].map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Price (USD)</label>
            <div className="flex">
              <span className="px-3 py-2.5 rounded-l-xl border border-r-0 border-border bg-muted text-muted-foreground text-sm flex items-center">$</span>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-r-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            You'll earn after platform fee (15%)
          </div>
          <span className="font-semibold text-success">${(parseFloat(price || "0") * 0.85).toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}

function AvailabilityStep({ days, timeSlots, isSelected, toggleSlot, availability }: {
  days: string[]
  timeSlots: string[]
  isSelected: (day: string, time: string) => boolean
  toggleSlot: (day: string, time: string) => void
  availability: AvailSlot[]
}) {
  return (
    <div>
      <h2 className="text-foreground mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700 }}>Set your availability</h2>
      <p className="text-sm text-muted-foreground mb-5">Select times when you're available for bookings. You can change this anytime.</p>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="p-2 text-left text-muted-foreground font-medium w-20 bg-muted/30">Time</th>
                {days.map(d => (
                  <th key={d} className="p-2 text-center text-muted-foreground font-medium min-w-[52px]">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time, ti) => (
                <tr key={time} className={ti % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <td className="p-2 text-muted-foreground font-medium whitespace-nowrap">{time}</td>
                  {days.map(day => (
                    <td key={day} className="p-1 text-center">
                      <button
                        onClick={() => toggleSlot(day, time)}
                        className={`h-8 w-10 rounded-lg transition-all mx-auto block
                          ${isSelected(day, time)
                            ? "bg-primary shadow-sm"
                            : "bg-muted/50 hover:bg-muted"
                          }`}
                      >
                        {isSelected(day, time) && <Check className="h-3.5 w-3.5 text-white mx-auto" />}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-muted-foreground">
          {availability.length} slot{availability.length !== 1 ? "s" : ""} selected
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-primary inline-block" /> Available</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-muted inline-block" /> Unavailable</span>
        </div>
      </div>
    </div>
  )
}

function GoLiveStep({ user, navigate, serviceName, price, availabilityCount }: {
  user: any
  navigate: ReturnType<typeof useNavigate>
  serviceName: string
  price: string
  availabilityCount: number
}) {
  const profileSlug = user ? `${user.given_name || ""}-${user.family_name || ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "-") : " Jordan-rivera"
  const expertIdentifier = user?.username || user?.expert_profile?.id || user?.id || " jordan-rivera"
  const profileUrl = `/expert/${expertIdentifier}`
  const displayUrl = `${window.location.host}/expert/${user?.username || profileSlug}`

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        className="h-24 w-24 rounded-3xl bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xl"
      >
        <Check className="h-12 w-12 text-white" />
      </motion.div>
      <h1 className="text-foreground mb-3" style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700 }}>
        You're all set! 🚀
      </h1>
      <p className="text-muted-foreground leading-relaxed mb-8">
        Your expert profile is ready. Share your link to start getting bookings!
      </p>

      <div className="bg-muted/50 rounded-2xl p-4 mb-6 flex items-center gap-3">
        <div className="flex-1 text-left">
          <p className="text-xs text-muted-foreground mb-0.5">Your public profile link</p>
          <p className="text-sm font-medium text-primary">{displayUrl}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => {
          navigator.clipboard?.writeText(displayUrl)
          toast.success("Link copied!")
        }}>
          Copy
        </Button>
      </div>

      <div className="space-y-3 mb-8">
        {[
          { icon: Star, label: "First service created", desc: `${serviceName} — $${price}/hr` },
          { icon: CalendarDays, label: "Availability set", desc: `${availabilityCount} slot${availabilityCount !== 1 ? "s" : ""} per week` },
          { icon: Clock, label: "Profile live", desc: "Visible to all clients" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-success" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Check className="h-4 w-4 text-success shrink-0" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Go to Dashboard
        </Button>
        <Button onClick={() => navigate(profileUrl)} className="gap-2">
          View Profile <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
