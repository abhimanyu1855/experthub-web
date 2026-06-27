import { useState, useEffect } from "react"
import { Link, useSearchParams, useNavigate, Navigate, useLocation } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  Eye, EyeOff, ArrowRight, CheckCircle2,
  Github, Chrome, ArrowLeft, Sparkles, Gift, Shield
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Separator } from "@/app/components/ui/separator"
import { Badge } from "@/app/components/ui/badge"
import { toast } from "sonner"
import { api, getSubdomain } from "@/app/lib/api"
import {
  type AuthAudience,
  audienceAllowsRole,
  loginPathForAudience,
  roleForAudience,
  signupPathForAudience,
} from "@/app/lib/auth-routes"
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/motion"
import { useTenant } from "@/app/providers/TenantThemeProvider"

const PENDING_CHECKOUT_KEY = "experthub.pendingCheckout"

function getSafeReturnTo(searchParams: URLSearchParams) {
  const returnTo = searchParams.get("returnTo")
  return returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : null
}

function readPendingCheckoutState() {
  try {
    const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    sessionStorage.removeItem(PENDING_CHECKOUT_KEY)
    return undefined
  }
}

const AUTH_PANELS: Record<AuthAudience, {
  badge: string
  title: string
  subtitle: string
  features: string[]
  accentClass: string
}> = {
  customer: {
    badge: "For clients",
    title: "Book trusted experts on your schedule",
    subtitle: "Sign in to manage bookings, join video sessions, and message your experts.",
    features: [
      "Book 1:1 sessions in minutes",
      "Secure messaging with experts",
      "Session reminders and history",
      "Courses and live group sessions",
    ],
    accentClass: "from-brand-500/30 to-violet-600/20",
  },
  expert: {
    badge: "For experts & admins",
    title: "Manage your practice and earnings",
    subtitle: "Sign in to manage bookings, payouts, and your expert profile. Marketplace admins use this page too.",
    features: [
      "Instant video rooms — no Zoom needed",
      "Real-time earnings dashboard",
      "AI-powered client matching",
      "Built-in scheduling and reminders",
    ],
    accentClass: "from-emerald-500/30 to-teal-600/20",
  },
  operator: {
    badge: "Platform operator",
    title: "Run your expert marketplace",
    subtitle: "Sign in to manage experts, bookings, payouts, and branding for your community.",
    features: [
      "Custom subdomain and branding",
      "Expert onboarding and approvals",
      "Commission and payout controls",
      "Analytics across your marketplace",
    ],
    accentClass: "from-amber-500/30 to-orange-600/20",
  },
}

const LOGIN_HEADINGS: Record<AuthAudience, { title: string; subtitle: string; badge: string }> = {
  customer: {
    badge: "Client sign in",
    title: "Sign in to book experts",
    subtitle: "Use your client account to book sessions and manage consultations.",
  },
  expert: {
    badge: "Expert & admin sign in",
    title: "Sign in to your expert dashboard",
    subtitle: "Experts and marketplace admins sign in here.",
  },
  operator: {
    badge: "Marketplace operator",
    title: "Sign in to ExpertHub",
    subtitle: "Platform sign-in for marketplace operators.",
  },
}

const SIGNUP_HEADINGS: Record<AuthAudience, { title: string; subtitle: string; badge: string }> = {
  customer: {
    badge: "Client account",
    title: "Create your client account",
    subtitle: "Sign up to book experts, join sessions, and track your consultations.",
  },
  expert: {
    badge: "Expert account",
    title: "Apply as an expert",
    subtitle: "Create an expert account to offer services on this marketplace.",
  },
  operator: {
    badge: "New marketplace",
    title: "Launch your marketplace",
    subtitle: "Create your white-label expert community on ExpertHub.",
  },
}

function resolveTenantSignupPath(search: string) {
  const params = new URLSearchParams(search)
  const role = params.get("role")
  params.delete("role")
  const rest = params.toString()
  const base = role === "expert" ? "/signup/expert" : "/signup/customer"
  return `${base}${rest ? `?${rest}` : ""}`
}

function MarketplaceHomeLink({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Link to="/" className={className}>
      {children}
    </Link>
  )
}

// ─── Entry routes (redirect legacy paths to dedicated pages) ─────────────────

export function LoginEntry() {
  const location = useLocation()
  if (getSubdomain()) {
    return <Navigate to={`/login/customer${location.search}`} replace />
  }
  return <LoginPage audience="operator" />
}

export function SignupEntry() {
  const location = useLocation()
  if (getSubdomain()) {
    return <Navigate to={resolveTenantSignupPath(location.search)} replace />
  }
  return <SignupPage audience="operator" />
}

// ─── Login Page ──────────────────────────────────────────────────────────────

export function LoginPage({ audience }: { audience: AuthAudience }) {
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [searchParams] = useSearchParams()
  const isTenant = !!getSubdomain()
  const tenant = useTenant()
  const returnTo = getSafeReturnTo(searchParams)
  const brandName = isTenant ? tenant.name : "ExpertHub"
  const logoText = isTenant ? tenant.logoText : "EH"
  const panel = AUTH_PANELS[audience]
  const heading = LOGIN_HEADINGS[audience]

  if (isTenant && audience === "operator") {
    return <Navigate to="/login/expert" replace />
  }
  if (!isTenant && audience !== "operator") {
    return <Navigate to="/login" replace />
  }

  const alternateAudience = audience === "customer" ? "expert" : audience === "expert" ? "customer" : null
  const signupAudience = audience === "operator" ? "operator" : audience

  const navigateAfterLogin = (role?: string) => {
    if (returnTo && (isTenant || audience === "operator")) {
      const checkoutState = returnTo.startsWith("/checkout") ? readPendingCheckoutState() : undefined
      navigate(returnTo, { replace: true, state: checkoutState })
    } else if (role === "operator") {
      navigate("/admin/getting-started")
    } else if (role === "expert") {
      navigate("/dashboard")
    } else {
      navigate("/explore")
    }
  }

  useEffect(() => {
    const queryToken = searchParams.get("token")
    if (!queryToken) return

    setLoading(true)
    localStorage.setItem("token", queryToken)
    api.get("/me")
      .then((meRes: any) => {
        localStorage.setItem("user", JSON.stringify(meRes.user))
        if (meRes.membership) {
          localStorage.setItem("membership", JSON.stringify(meRes.membership))
          const role = meRes.membership.role
          if (!audienceAllowsRole(audience, role)) {
            api.logout()
            toast.error(
              audience === "customer"
                ? "This account is for experts or admins. Use the expert sign-in page."
                : "This account is for clients. Use the client sign-in page."
            )
            return
          }
          toast.success("Signed in successfully.")
          navigateAfterLogin(role)
        } else {
          toast.success("Signed in successfully.")
          navigateAfterLogin()
        }
      })
      .catch(() => {
        toast.error("Auto-login failed. Please sign in manually.")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post("/login", { user: { email, password } })
      const meRes = await api.get("/me")

      const isRootDomain = !isTenant
      const role = meRes.membership?.role

      if (isRootDomain && role !== "operator") {
        api.logout()
        toast.error("Access denied. Only marketplace operators can sign in here.")
        setLoading(false)
        return
      }

      if (isTenant && role && !audienceAllowsRole(audience, role)) {
        api.logout()
        if (audience === "customer") {
          toast.error("This account is for experts or admins. Use the expert sign-in page instead.")
        } else {
          toast.error("This account is for clients. Use the client sign-in page instead.")
        }
        setLoading(false)
        return
      }

      localStorage.setItem("user", JSON.stringify(meRes.user))
      if (meRes.membership) {
        localStorage.setItem("membership", JSON.stringify(meRes.membership))
        toast.success("Welcome back! Signed in successfully.")

        const tenantIdent = meRes.membership.tenant_ident
        if (isRootDomain && tenantIdent) {
          const token = localStorage.getItem("token")
          const host = window.location.host
          let newUrl = `${window.location.protocol}//${tenantIdent}.${host}`
          if (host.includes("localhost")) {
            newUrl = `${window.location.protocol}//${tenantIdent}.localhost:${window.location.port || "5173"}`
          }
          window.location.href = `${newUrl}/login/expert?token=${token}`
          return
        }

        navigateAfterLogin(role)
      } else {
        toast.success("Welcome back! Signed in successfully.")
        navigateAfterLogin()
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid email or password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 lg:px-16 bg-background">
        <motion.div {...fadeInUp} className="max-w-sm mx-auto w-full">
          <MarketplaceHomeLink className="flex items-center gap-2 mb-10">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">{logoText}</div>
            <span className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "1rem" }}>{brandName}</span>
          </MarketplaceHomeLink>

          <Badge variant="outline" className="mb-4">
            {heading.badge}
          </Badge>

          <h1 className="text-foreground mb-2" style={{ fontFamily: "var(--font-heading)", fontSize: "1.875rem", fontWeight: 700 }}>
            {heading.title}
          </h1>
          <p className="text-muted-foreground mb-8">
            {heading.subtitle}
          </p>

          {audience === "expert" && isTenant && (
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3 mb-6 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>Marketplace admins sign in here too — use your operator credentials.</span>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <Button variant="outline" className="w-full rounded-xl gap-3 h-11">
              <Chrome className="h-4 w-4" /> Continue with Google
            </Button>
            <Button variant="outline" className="w-full rounded-xl gap-3 h-11">
              <Github className="h-4 w-4" /> Continue with GitHub
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-sm">or</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="text-sm">Email address</Label>
              <Input
                type="email"
                className="mt-1.5 rounded-xl h-11"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-sm">Password</Label>
                <a href="#" className="text-primary text-xs font-medium hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  className="rounded-xl h-11 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full rounded-xl h-11 mt-2" disabled={loading}>
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                </motion.div>
              ) : (
                <>Sign in <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link
              to={`${signupPathForAudience(signupAudience)}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
              className="text-primary font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>

          {isTenant && alternateAudience && (
            <p className="text-center text-muted-foreground text-sm mt-3">
              {audience === "customer" ? "Expert or admin?" : "Booking as a client?"}{" "}
              <Link
                to={`${loginPathForAudience(alternateAudience)}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
                className="text-primary font-medium hover:underline"
              >
                {audience === "customer" ? "Expert sign in" : "Client sign in"}
              </Link>
            </p>
          )}

        </motion.div>
      </div>

      <div className="hidden lg:flex flex-col justify-center hero-gradient relative overflow-hidden p-16">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        <div className={`absolute top-0 right-0 h-64 w-64 rounded-full bg-gradient-to-br ${panel.accentClass} blur-[80px]`} />

        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="relative max-w-md">
          <motion.div variants={staggerItem}>
            <Badge className="mb-6 bg-white/10 text-white border-white/20 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-brand-300" />
              {panel.badge}
            </Badge>
          </motion.div>

          <motion.h2
            variants={staggerItem}
            className="text-white"
            style={{ fontFamily: "var(--font-heading)", fontSize: "2.25rem", fontWeight: 700, lineHeight: 1.2 }}
          >
            {panel.title}
          </motion.h2>

          <motion.p variants={staggerItem} className="text-slate-300 mt-4 leading-relaxed">
            {panel.subtitle}
          </motion.p>

          <motion.div variants={staggerContainer} className="mt-8 space-y-3">
            {panel.features.map(f => (
              <motion.div key={f} variants={staggerItem} className="flex items-center gap-3 text-slate-300 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> {f}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

// ─── Signup Page ─────────────────────────────────────────────────────────────

type SignupStep = "details" | "verify"

export function SignupPage({ audience }: { audience: AuthAudience }) {
  const [searchParams] = useSearchParams()
  const isTenant = !!getSubdomain()
  const tenant = useTenant()
  const brandName = isTenant ? tenant.name : "ExpertHub"
  const logoText = isTenant ? tenant.logoText : "EH"
  const referredByCode = searchParams.get("ref") || null
  const returnTo = getSafeReturnTo(searchParams)
  const role = roleForAudience(audience)

  if (isTenant && audience === "operator") {
    return <Navigate to="/signup/expert" replace />
  }
  if (!isTenant && audience !== "operator") {
    return <Navigate to="/signup" replace />
  }

  const alternateAudience = audience === "customer" ? "expert" : audience === "expert" ? "customer" : null

  const [step, setStep] = useState<SignupStep>("details")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [expertise, setExpertise] = useState("")
  const [marketplaceName, setMarketplaceName] = useState("")
  const [marketplaceIdent, setMarketplaceIdent] = useState("")

  async function handleSubmit() {
    if (!firstName || !lastName || !email || !password) {
      toast.error("Please fill in all account fields.")
      return
    }
    if (role === "operator" && (!marketplaceName || !marketplaceIdent)) {
      toast.error("Please provide a name and subdomain for your marketplace.")
      return
    }

    setLoading(true)
    try {
      if (role === "operator") {
        const slug = marketplaceIdent.toLowerCase().replace(/[^a-z0-9-]/g, "")
        await api.post("/tenants", {
          tenant: { ident: slug, name: marketplaceName },
          admin: {
            email,
            password,
            given_name: firstName,
            family_name: lastName,
          },
        })

        await api.post("/login", { user: { email, password } })
        const meRes = await api.get("/me", { headers: { "X-Tenant-Id": slug } })
        localStorage.setItem("user", JSON.stringify(meRes.user))
        if (meRes.membership) {
          localStorage.setItem("membership", JSON.stringify(meRes.membership))
        }
        toast.success("Marketplace community built successfully!")
        setStep("verify")
      } else {
        await api.post("/signup", {
          user: {
            email,
            password,
            password_confirmation: password,
            given_name: firstName,
            family_name: lastName,
            ...(referredByCode ? { referred_by_code: referredByCode } : {}),
          },
          role,
          specialization: expertise,
        })
        try {
          const meRes = await api.get("/me")
          localStorage.setItem("user", JSON.stringify(meRes.user))
          if (meRes.membership) {
            localStorage.setItem("membership", JSON.stringify(meRes.membership))
          }
        } catch (meErr) {
          console.error("Failed to fetch user profile after signup:", meErr)
        }
        toast.success("Registration completed! Please verify email.")
        setStep("verify")
      }
    } catch (err: any) {
      toast.error(err.message || "Signup process encountered an error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const accountLabel = SIGNUP_HEADINGS[audience]
  const panel = AUTH_PANELS[audience]

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-background">
        <div className="max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between mb-10">
            <MarketplaceHomeLink className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">{logoText}</div>
              <span className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "1rem" }}>{brandName}</span>
            </MarketplaceHomeLink>
            {isTenant && step === "details" && (
              <MarketplaceHomeLink className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
              </MarketplaceHomeLink>
            )}
          </div>

          <AnimatePresence mode="wait">
            {step === "details" && (
              <motion.div key="details" {...fadeInUp}>
                <Badge variant="outline" className="mb-4">{accountLabel.badge}</Badge>
                <h1 className="text-foreground mb-2" style={{ fontFamily: "var(--font-heading)", fontSize: "1.875rem", fontWeight: 700 }}>
                  {accountLabel.title}
                </h1>
                <p className="text-muted-foreground mb-8">
                  {accountLabel.subtitle}
                </p>

                <div className="space-y-4">
                  {referredByCode && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm">
                      <Gift className="h-4 w-4 shrink-0" />
                      <span>You were referred by a friend! You&apos;ll both receive credits after your first booking.</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">First name</Label>
                      <Input className="mt-1.5 rounded-xl h-11" placeholder="Alex" value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-sm">Last name</Label>
                      <Input className="mt-1.5 rounded-xl h-11" placeholder="Johnson" value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Email address</Label>
                    <Input type="email" className="mt-1.5 rounded-xl h-11" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-sm">Password</Label>
                    <div className="relative mt-1.5">
                      <Input type={showPw ? "text" : "password"} className="rounded-xl h-11 pr-10" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {role === "expert" && (
                    <div>
                      <Label className="text-sm">Your primary expertise</Label>
                      <Input className="mt-1.5 rounded-xl h-11" placeholder="e.g. Cardiology, UX Design, Corporate Law" value={expertise} onChange={e => setExpertise(e.target.value)} />
                    </div>
                  )}

                  {role === "operator" && (
                    <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 mt-4">
                      <div>
                        <Label className="text-sm">Marketplace Name</Label>
                        <Input className="mt-1.5 rounded-xl h-11" placeholder="e.g. Acme Experts" value={marketplaceName} onChange={e => setMarketplaceName(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-sm">Subdomain Identifier</Label>
                        <div className="relative mt-1.5 flex items-center">
                          <Input className="rounded-xl h-11 pr-24 w-full" placeholder="e.g. acme" value={marketplaceIdent} onChange={e => setMarketplaceIdent(e.target.value)} />
                          <span className="absolute right-3 text-muted-foreground text-xs font-semibold">.localhost</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button className="w-full rounded-xl h-11 gap-2 mt-2" onClick={handleSubmit} disabled={loading}>
                    {loading ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                      </motion.div>
                    ) : (
                      <>Create account <ArrowRight className="h-4 w-4" /></>
                    )}
                  </Button>
                </div>

                <p className="text-muted-foreground text-xs mt-4 text-center">
                  By signing up you agree to our{" "}
                  <a href="#" className="text-primary hover:underline">Terms of Service</a>{" "}
                  and{" "}
                  <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                </p>

                <p className="text-center text-muted-foreground text-sm mt-6">
                  Already have an account?{" "}
                  <Link
                    to={`${loginPathForAudience(audience)}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in
                  </Link>
                </p>

                {isTenant && alternateAudience && (
                  <p className="text-center text-muted-foreground text-sm mt-3">
                    {audience === "customer" ? "Want to offer services?" : "Just here to book?"}{" "}
                    <Link
                      to={`${signupPathForAudience(alternateAudience)}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {audience === "customer" ? "Expert sign up" : "Client sign up"}
                    </Link>
                  </p>
                )}
              </motion.div>
            )}

            {step === "verify" && (
              <motion.div key="verify" {...fadeInUp} className="text-center">
                <div className="h-20 w-20 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-foreground mb-2" style={{ fontFamily: "var(--font-heading)", fontSize: "1.875rem", fontWeight: 700 }}>
                  {role === "operator" ? "Marketplace Created!" : "Check your email"}
                </h1>
                <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
                  {role === "operator" ? (
                    <>Your community <span className="font-semibold text-foreground">{marketplaceName}</span> has been configured and is ready to launch.</>
                  ) : (
                    <>We sent a confirmation link to <span className="font-medium text-foreground">{email || "your email"}</span>. Click the link to activate your account.</>
                  )}
                </p>
                <div className="flex flex-col gap-3">
                  {role === "operator" ? (
                    <a href={`http://${marketplaceIdent.toLowerCase().replace(/[^a-z0-9-]/g, "")}.localhost:${window.location.port || "5173"}/login/expert?token=${localStorage.getItem("token")}`}>
                      <Button className="w-full rounded-xl h-11">Go to Marketplace Admin Dashboard</Button>
                    </a>
                  ) : (
                    <Link to={audience === "expert" ? loginPathForAudience("expert") : "/explore"}>
                      <Button className="w-full rounded-xl h-11">
                        {audience === "expert" ? "Continue to expert sign in" : `Continue to ${brandName}`}
                      </Button>
                    </Link>
                  )}
                  <Button variant="outline" className="w-full rounded-xl h-11" onClick={() => toast.success("Confirmation email resent successfully!")}>
                    Resend email
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs mt-6">Didn&apos;t receive it? Check your spam folder.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="hidden xl:flex w-[420px] shrink-0 hero-gradient relative overflow-hidden flex-col justify-center p-12">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        <div className={`absolute top-0 right-0 h-64 w-64 rounded-full bg-gradient-to-br ${panel.accentClass} blur-[80px]`} />
        <div className="relative">
          <Badge className="mb-4 bg-white/10 text-white border-white/20 backdrop-blur-sm">
            {panel.badge}
          </Badge>
          <div className="text-white" style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700, lineHeight: 1.2 }}>
            {panel.title}
          </div>
          <p className="text-slate-300 mt-4 leading-relaxed text-sm">{panel.subtitle}</p>
          <div className="mt-6 space-y-2">
            {panel.features.slice(0, 3).map(feature => (
              <div key={feature} className="flex items-center gap-2 text-slate-300 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> {feature}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Legacy exports for route aliases
export function CustomerLoginPage() {
  return <LoginPage audience="customer" />
}

export function ExpertLoginPage() {
  return <LoginPage audience="expert" />
}

export function CustomerSignupPage() {
  return <SignupPage audience="customer" />
}

export function ExpertSignupPage() {
  return <SignupPage audience="expert" />
}
