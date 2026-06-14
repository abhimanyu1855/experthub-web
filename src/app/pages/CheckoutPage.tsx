import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  ArrowLeft, Video, Phone, MessageSquare, Check, CreditCard,
  Lock, Tag, ChevronRight, Clock, Calendar, User, AlertCircle, CheckCircle2
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Separator } from "@/app/components/ui/separator"
import { fadeInUp } from "@/app/lib/motion"
import { api } from "@/app/lib/api"
import { loadRazorpayCheckout } from "@/app/lib/razorpay"
import { toast } from "sonner"
import { loadStripe, type Stripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { useTenant } from "@/app/providers/TenantThemeProvider"

type StripePayment = {
  gateway: "stripe"
  client_secret: string
  payment_intent_id: string
  amount: number
  currency: string
  publishable_key: string
}

type RazorpayPayment = {
  gateway: "razorpay"
  order_id: string
  key_id: string
  amount: number
  currency: string
}

type BookingCreateResponse = {
  booking?: unknown
  payment?: StripePayment | RazorpayPayment
  mock_paid?: boolean
}

function isStripePayment(payment: BookingCreateResponse["payment"]): payment is StripePayment {
  return payment?.gateway === "stripe" && Boolean(payment.client_secret && payment.publishable_key)
}

function isRazorpayPayment(payment: BookingCreateResponse["payment"]): payment is RazorpayPayment {
  return payment?.gateway === "razorpay" && Boolean(payment.order_id && payment.key_id)
}

function formatPaymentAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

// Stripe PaymentElement form rendered inside <Elements> provider
function StripePaymentForm({ total, onBack, onSuccess }: { total: number; onBack: () => void; onSuccess: (booking?: any) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    setError(null)
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/dashboard` },
      redirect: "if_required"
    })
    if (stripeError) {
      setError(stripeError.message ?? "Payment failed")
      setPaying(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement className="mb-5" />
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-5">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        Payments are encrypted and processed securely by Stripe.
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onBack}>Back</Button>
        <Button type="submit" className="flex-1 rounded-xl gap-2" disabled={!stripe || paying}>
          {paying ? (
            <span className="flex items-center gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
              </motion.div>
              Processing...
            </span>
          ) : (
            <><Lock className="h-4 w-4" /> Pay ${total.toFixed(2)}</>
          )}
        </Button>
      </div>
    </form>
  )
}

function RazorpayPaymentPanel({
  payment,
  currentUser,
  customerName,
  phone,
  serviceTitle,
  expertName,
  marketplaceName,
  onBack,
  onSubmitted
}: {
  payment: RazorpayPayment
  currentUser: { email?: string } | null
  customerName: string
  phone: string
  serviceTitle: string
  expertName: string
  marketplaceName: string
  onBack: () => void
  onSubmitted: () => void
}) {
  const openedRef = useRef(false)
  const submittedRef = useRef(false)
  const failedRef = useRef(false)
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const displayTotal = formatPaymentAmount(payment.amount / 100, payment.currency)

  const openCheckout = useCallback(async () => {
    setOpening(true)
    setError(null)
    failedRef.current = false

    try {
      await loadRazorpayCheckout()

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout is unavailable.")
      }

      const checkout = new window.Razorpay({
        key: payment.key_id,
        order_id: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        name: marketplaceName,
        description: `${serviceTitle} with ${expertName}`,
        prefill: {
          name: customerName || undefined,
          email: currentUser?.email,
          contact: phone || undefined
        },
        handler: () => {
          submittedRef.current = true
          onSubmitted()
        },
        modal: {
          ondismiss: () => {
            if (submittedRef.current) return
            if (failedRef.current) {
              failedRef.current = false
              return
            }

            setOpening(false)
            setError("Payment was cancelled. You can reopen Razorpay to try again.")
            toast.error("Payment cancelled. You can try again when you're ready.")
          }
        },
        theme: {
          color: "#4f46e5"
        }
      })

      checkout.on("payment.failed", response => {
        failedRef.current = true
        const message = response.error?.description || "Razorpay payment failed. Please try again."
        setOpening(false)
        setError(message)
        toast.error(message)
      })

      checkout.open()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to open Razorpay checkout."
      setOpening(false)
      setError(message)
      toast.error(message)
    }
  }, [currentUser?.email, customerName, expertName, marketplaceName, onSubmitted, payment, phone, serviceTitle])

  useEffect(() => {
    if (openedRef.current) return

    openedRef.current = true
    void openCheckout()
  }, [openCheckout])

  return (
    <div>
      <div className="rounded-xl border border-border bg-muted/40 p-4 mb-5">
        <div className="flex items-center gap-2 text-foreground font-semibold text-sm mb-1">
          <CreditCard className="h-4 w-4" />
          Razorpay Checkout
        </div>
        <p className="text-muted-foreground text-sm">
          Complete your {displayTotal} payment in the secure Razorpay window. The booking will be confirmed after the payment webhook is received.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-5">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        Payments are encrypted and processed securely by Razorpay.
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onBack}>Back</Button>
        <Button type="button" className="flex-1 rounded-xl gap-2" disabled={opening} onClick={openCheckout}>
          {opening ? (
            <span className="flex items-center gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
              </motion.div>
              Razorpay is open...
            </span>
          ) : (
            <><Lock className="h-4 w-4" /> Pay with Razorpay</>
          )}
        </Button>
      </div>
    </div>
  )
}

const STEPS = ["Details", "Communication", "Payment"]
const PENDING_CHECKOUT_KEY = "experthub.pendingCheckout"
const LEGACY_PENDING_CHECKOUT_KEY = "pendingCheckout"

function readPendingCheckout() {
  try {
    const pending = sessionStorage.getItem(PENDING_CHECKOUT_KEY) || sessionStorage.getItem(LEGACY_PENDING_CHECKOUT_KEY)
    return pending ? JSON.parse(pending) : null
  } catch {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
    sessionStorage.removeItem(LEGACY_PENDING_CHECKOUT_KEY)
    return null
  }
}

function getPromoDiscountCents(res: any, baseCents: number): number | null {
  const cents =
    res?.discount_cents ??
    res?.amount_off_cents ??
    res?.discount_amount_cents ??
    res?.promo_code?.discount_cents ??
    res?.promo_code?.amount_off_cents

  if (typeof cents === "number" && cents > 0) {
    return Math.min(baseCents, Math.round(cents))
  }

  const amount =
    res?.discount_amount ??
    res?.amount_off ??
    res?.promo_code?.discount_amount ??
    res?.promo_code?.amount_off

  if (typeof amount === "number" && amount > 0) {
    return Math.min(baseCents, Math.round(amount * 100))
  }

  const percent = res?.percent_off ?? res?.percent ?? res?.promo_code?.percent_off
  if (typeof percent === "number" && percent > 0) {
    return Math.min(baseCents, Math.round(baseCents * (percent / 100)))
  }

  return null
}

const commTools = [
  { id: "video", icon: Video, label: "Video Call", description: "Daily.co secure video room", recommended: true },
  { id: "phone", icon: Phone, label: "Phone Call", description: "Expert calls your number" },
  { id: "chat", icon: MessageSquare, label: "Chat Session", description: "Real-time text consultation" },
]

export function CheckoutPage() {
  const tenant = useTenant()
  const location = useLocation()
  const navigate = useNavigate()
  const checkoutState = location.state || readPendingCheckout() || {}
  const { serviceId, date, slot } = checkoutState

  const [step, setStep] = useState(0)
  const [commTool, setCommTool] = useState("video")
  const [coupon, setCoupon] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [discountCents, setDiscountCents] = useState<number | null>(null)
  const [couponError, setCouponError] = useState("")
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(false)

  const [service, setService] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(true)

  // Inputs
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [notes, setNotes] = useState("")
  const [phone, setPhone] = useState("")

  const [booking, setBooking] = useState<any>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [razorpayPayment, setRazorpayPayment] = useState<RazorpayPayment | null>(null)

  useEffect(() => {
    if (location.state) {
      sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(location.state))
    }

    if (!serviceId) {
      toast.error("No service selected for checkout.")
      navigate("/explore")
      return
    }

    async function loadData() {
      setLoadingDetails(true)
      try {
        // Load service
        const sData = await api.get(`/services/${serviceId}`)
        setService(sData)

        // Load user
        const uData = await api.get("/me")
        if (uData && uData.user) {
          setCurrentUser(uData.user)
          setFirstName(uData.user.given_name || "")
          setLastName(uData.user.family_name || "")
          setEmail(uData.user.email || "")
        }
      } catch (err: any) {
        console.error("Failed to load checkout details:", err)
        // User might not be authenticated, we can redirect to login
        toast.error("Please login to proceed with checkout.")
        const returnTo = `${location.pathname}${location.search}${location.hash}`
        navigate(`/login/customer?returnTo=${encodeURIComponent(returnTo)}`, { state: { from: location } })
      } finally {
        setLoadingDetails(false)
      }
    }
    loadData()
  }, [serviceId])

  const subtotal = service ? service.price_cents / 100 : 0
  const platformFee = subtotal * 0.1
  const discount = discountCents != null ? discountCents / 100 : 0
  const total = Math.max(0, subtotal + platformFee - discount)

  async function handleApplyCoupon() {
    if (!coupon.trim()) return
    try {
      const res = await api.post("/promo_codes/validate", { code: coupon.trim() })
      if (res?.valid) {
        const baseCents = Math.round((subtotal + platformFee) * 100)
        const cents = getPromoDiscountCents(res, baseCents)
        const validatedCode = res?.code || res?.promo_code?.code || coupon.trim()
        setAppliedCoupon(validatedCode)
        setDiscountCents(cents)
        setCouponError("")
        toast.success(cents != null ? "Coupon code applied successfully!" : "Coupon code validated.")
      } else {
        setCouponError(res?.message || "Invalid or expired coupon code")
      }
    } catch {
      setCouponError("Invalid or expired coupon code")
    }
  }

  function parseSlotTime(slot: string, date: string) {
    let hour = 0
    let minute = 0
    const timeMatch = slot.match(/^(\d+):(\d+)\s*(AM|PM)?$/i)
    if (timeMatch) {
      hour = parseInt(timeMatch[1])
      minute = parseInt(timeMatch[2])
      const ampm = timeMatch[3]
      if (ampm && ampm.toUpperCase() === "PM" && hour < 12) hour += 12
      else if (ampm && ampm.toUpperCase() === "AM" && hour === 12) hour = 0
    }
    const start = new Date(date)
    start.setHours(hour, minute, 0, 0)
    const end = new Date(start.getTime() + service.duration_minutes * 60000)
    return { start, end }
  }

  async function handlePay() {
    setLoading(true)
    try {
      const { start, end } = parseSlotTime(slot, date)
      const payload = {
        booking: {
          service_id: service.id,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          ...(appliedCoupon ? { promo_code: appliedCoupon } : {})
        }
      }

      const res = await api.post("/bookings", payload) as BookingCreateResponse

      if (isRazorpayPayment(res.payment)) {
        setBooking(res.booking)
        setClientSecret(null)
        setStripePromise(null)
        setRazorpayPayment(res.payment)
        setStep(2)
      } else if (isStripePayment(res.payment)) {
        // Paid service — initialise Stripe with the tenant's own publishable key
        setStripePromise(loadStripe(res.payment.publishable_key))
        setBooking(res.booking)
        setRazorpayPayment(null)
        setClientSecret(res.payment.client_secret)
        setStep(2)
      } else if (res.booking) {
        // Free service — booking directly confirmed (no Stripe needed)
        setBooking(res.booking)
        sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
        sessionStorage.removeItem(LEGACY_PENDING_CHECKOUT_KEY)
        setComplete(true)
        toast.success("Booking confirmed!")
      }
    } catch (err: any) {
      toast.error("Failed to create booking: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  function handlePaymentSuccess(confirmedBooking?: any) {
    setBooking(confirmedBooking || booking)
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
    sessionStorage.removeItem(LEGACY_PENDING_CHECKOUT_KEY)
    setComplete(true)
    toast.success("Payment successful! Booking confirmed.")
  }

  function handleRazorpaySubmitted() {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
    sessionStorage.removeItem(LEGACY_PENDING_CHECKOUT_KEY)
    toast.success("Payment submitted. We'll confirm your booking once Razorpay notifies us.")
    navigate("/dashboard")
  }

  if (loadingDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
          />
          <p className="text-muted-foreground text-sm font-medium">Preparing checkout...</p>
        </div>
      </div>
    )
  }

  if (!service) return null

  const expertUser = service.expert_profile?.user
  const expertName = expertUser?.display_name || `${expertUser?.given_name || ""} ${expertUser?.family_name || ""}`.trim() || "Expert"
  const expertInitials = `${expertUser?.given_name?.[0] || ""}${expertUser?.family_name?.[0] || ""}`.toUpperCase() || "EX"

  if (complete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div {...fadeInUp} className="max-w-md w-full text-center">
          <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-foreground mb-2" style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700 }}>
            Booking Confirmed!
          </h1>
          <p className="text-muted-foreground mb-6">
            Your session with {expertName} is confirmed for {new Date(date).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })} at {slot}. You'll receive a calendar invite and video room link via email.
          </p>
          <div className="bg-card border border-border rounded-2xl p-5 text-left mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {expertInitials}
              </div>
              <div>
                <div className="font-semibold text-foreground text-sm">{expertName}</div>
                <div className="text-muted-foreground text-xs">{service.title}</div>
              </div>
            </div>
            <Separator className="mb-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{new Date(date).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{slot}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{service.duration_minutes} minutes</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Format</span><span className="font-medium">{commTools.find(t => t.id === commTool)?.label}</span></div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold"><span>Total Paid</span><span className="text-primary">${total.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/explore" className="flex-1">
              <Button variant="outline" className="w-full rounded-xl">Browse more experts</Button>
            </Link>
            <Link to="/dashboard" className="flex-1">
              <Button className="w-full rounded-xl">View Dashboard</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-sm font-medium mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to expert profile
        </button>

        {/* Progress steps */}
        <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center shrink-0">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  i === step
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : i < step
                    ? "bg-success/10 text-success"
                    : "text-muted-foreground"
                }`}
              >
                {i < step
                  ? <Check className="h-4 w-4" />
                  : <span className={`h-5 w-5 rounded-full border flex items-center justify-center text-xs font-bold ${i === step ? "border-primary-foreground" : "border-current"}`}>{i + 1}</span>
                }
                {label}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 mx-1 rounded-full ${i < step ? "bg-success" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Left: steps */}
          <div>
            <AnimatePresence mode="wait">
              {/* Step 0: Details */}
              {step === 0 && (
                <motion.div key="step0" {...fadeInUp} className="bg-card rounded-2xl border border-border p-6">
                  <h2 className="font-bold text-foreground mb-5" style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem" }}>Appointment Details</h2>

                  {/* Booking summary */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border mb-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                      {expertInitials}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{expertName}</div>
                      <div className="text-muted-foreground text-sm">{service.title} · {service.duration_minutes} min</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-foreground">
                        {new Date(date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      <div className="text-muted-foreground text-sm flex items-center gap-1 justify-end"><Clock className="h-3.5 w-3.5" />{slot}</div>
                    </div>
                  </div>

                  {/* Client details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground text-sm">Your Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">First name</Label>
                        <Input
                          className="mt-1.5 rounded-xl"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Last name</Label>
                        <Input
                          className="mt-1.5 rounded-xl"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Email</Label>
                      <Input
                        className="mt-1.5 rounded-xl"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">What would you like to discuss?</Label>
                      <textarea
                        className="mt-1.5 w-full rounded-xl border border-border bg-input-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        rows={3}
                        placeholder="Briefly describe your goals for this session..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button className="w-full mt-6 rounded-xl gap-2" onClick={() => setStep(1)}>
                    Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {/* Step 1: Communication */}
              {step === 1 && (
                <motion.div key="step1" {...fadeInUp} className="bg-card rounded-2xl border border-border p-6">
                  <h2 className="font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem" }}>Choose Communication Method</h2>
                  <p className="text-muted-foreground text-sm mb-5">How would you like to connect with {expertName}?</p>

                  <div className="space-y-3">
                    {commTools.map(tool => {
                      const Icon = tool.icon
                      const active = commTool === tool.id
                      return (
                        <button
                          key={tool.id}
                          onClick={() => setCommTool(tool.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                            active ? "border-primary bg-brand-50" : "border-border bg-card hover:border-primary/40"
                          }`}
                        >
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground text-sm">{tool.label}</span>
                              {tool.recommended && <Badge className="bg-success/10 text-success border-success/20 text-xs">Recommended</Badge>}
                            </div>
                            <div className="text-muted-foreground text-xs mt-0.5">{tool.description}</div>
                          </div>
                          <div className={`h-4 w-4 rounded-full border-2 shrink-0 ${active ? "border-primary bg-primary" : "border-border"}`}>
                            {active && <div className="h-full w-full rounded-full bg-primary-foreground scale-50" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {commTool === "phone" && (
                    <motion.div {...fadeInUp} className="mt-4">
                      <Label className="text-sm">Your phone number</Label>
                      <Input
                        className="mt-1.5 rounded-xl"
                        placeholder="+1 (555) 000-0000"
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                    </motion.div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(0)}>Back</Button>
                    <Button className="flex-1 rounded-xl gap-2" onClick={handlePay} disabled={loading}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                            <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                          </motion.div>
                          Preparing...
                        </span>
                      ) : (
                        <>Continue to Payment <ChevronRight className="h-4 w-4" /></>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div key="step2" {...fadeInUp} className="bg-card rounded-2xl border border-border p-6">
                  <h2 className="font-bold text-foreground mb-5" style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem" }}>Payment Details</h2>

                  {razorpayPayment ? (
                    <RazorpayPaymentPanel
                      payment={razorpayPayment}
                      currentUser={currentUser}
                      customerName={`${firstName} ${lastName}`.trim()}
                      phone={phone}
                      serviceTitle={service.title}
                      expertName={expertName}
                      marketplaceName={tenant.name}
                      onBack={() => setStep(1)}
                      onSubmitted={handleRazorpaySubmitted}
                    />
                  ) : clientSecret && stripePromise ? (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
                      <StripePaymentForm
                        total={total}
                        onBack={() => setStep(1)}
                        onSuccess={handlePaymentSuccess}
                      />
                    </Elements>
                  ) : clientSecret && !stripePromise ? (
                    // Has a client_secret but no publishable key — free/external payment, skip Stripe
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <p>Payment method unavailable. Please contact support.</p>
                      <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setStep(1)}>Go Back</Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"
                      />
                      <p>Preparing payment...</p>
                      <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setStep(1)}>Go Back</Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Order summary */}
          <div className="h-fit">
            <div className="glass-light rounded-2xl p-5 shadow-raised border border-border/60 sticky top-24">
              <h3 className="font-bold text-foreground mb-4" style={{ fontFamily: "var(--font-heading)", fontSize: "1rem" }}>Order Summary</h3>

              {/* Expert & service */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {expertInitials}
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">{expertName}</div>
                  <div className="text-muted-foreground text-xs truncate max-w-[200px]">{service.title}</div>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" /> {new Date(date).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} at {slot}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {service.duration_minutes} minutes
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-3.5 w-3.5" /> {commTools.find(t => t.id === commTool)?.label}
                </div>
              </div>

              <Separator className="mb-4" />

              {/* Coupon */}
              <div className="mb-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-success/10 border border-success/20 text-sm">
                    <div className="flex items-center gap-2 text-success font-medium">
                      <Tag className="h-4 w-4" /> {appliedCoupon.toUpperCase()} validated
                    </div>
                    <button onClick={() => { setAppliedCoupon(null); setDiscountCents(null); setCoupon("") }} className="text-muted-foreground hover:text-foreground">×</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      className="rounded-xl text-sm"
                      placeholder="Coupon code"
                      value={coupon}
                      onChange={e => { setCoupon(e.target.value); setCouponError("") }}
                    />
                    <Button variant="outline" size="sm" className="rounded-xl shrink-0" onClick={handleApplyCoupon}>Apply</Button>
                  </div>
                )}
                {couponError && (
                  <p className="flex items-center gap-1.5 text-error text-xs mt-1.5">
                     <AlertCircle className="h-3.5 w-3.5" /> {couponError}
                  </p>
                )}
                {!appliedCoupon && !couponError && (
                  <p className="text-muted-foreground text-xs mt-1.5">Have a coupon? Enter it above.</p>
                )}
              </div>

              <Separator className="mb-4" />

              {/* Bill breakdown */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consultation fee</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee (10%)</span>
                  <span className="font-medium">${platformFee.toFixed(2)}</span>
                </div>
                {appliedCoupon && discountCents != null && (
                  <div className="flex justify-between text-success">
                    <span>Coupon discount</span>
                    <span className="font-medium">-${discount.toFixed(2)}</span>
                  </div>
                )}
                {appliedCoupon && discountCents == null && (
                  <div className="flex justify-between text-success">
                    <span>Coupon validated</span>
                    <span className="font-medium">Applied at booking</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold" style={{ fontSize: "1rem" }}>
                  <span>Total</span>
                  <span className="text-primary" style={{ fontFamily: "var(--font-heading)" }}>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 text-muted-foreground text-xs">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                Secure checkout · Free cancellation 24h before
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
