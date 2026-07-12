import { useState, useEffect } from "react"
import { Link } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  ArrowRight, Star, CheckCircle2, Zap, Shield, Globe, Users,
  Play, Sparkles, TrendingUp, Video, BookOpen, Clock, ChevronDown,
  Building2, DollarSign, Settings, Laptop, ArrowUpRight,
  Check, X, Heart, Scale, GraduationCap, Dumbbell
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { fadeInUp, staggerContainer, staggerItem, ease } from "@/app/lib/motion"
import { useTenant } from "@/app/providers/TenantThemeProvider"
import { api, getSubdomain } from "@/app/lib/api"

// ─── Colors for Card Gradients ──────────────────────────────────────────────────
const EXPERT_COLORS = [
  ["from-indigo-500 to-violet-600", "bg-indigo-50 text-indigo-600"],
  ["from-emerald-400 to-teal-600", "bg-emerald-50 text-emerald-600"],
  ["from-rose-400 to-pink-600", "bg-rose-50 text-rose-600"],
  ["from-amber-400 to-orange-500", "bg-amber-50 text-amber-600"],
]

// ─── Pricing Data ────────────────────────────────────────────────────────────
const PLANS_PRICING = [
  {
    key: "free",
    name: "Free",
    badge: "14-day trial",
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: "Start Free Trial",
    ctaVariant: "outline" as const,
    ctaLink: "/signup",
    popular: false,
    commission: "15% platform commission",
    features: [
      { label: "2 experts", included: true },
      { label: "5 services", included: true },
      { label: "Basic booking", included: true },
      { label: "AI Matching", included: false },
      { label: "Custom Domain", included: false },
      { label: "Group Sessions", included: false },
      { label: "Promo Codes", included: false },
      { label: "Advanced Analytics", included: false },
      { label: "Courses & LMS", included: false },
      { label: "Subscriptions", included: false },
      { label: "Remove Branding", included: false },
    ],
  },
  {
    key: "starter",
    name: "Starter",
    badge: null,
    monthlyPrice: 49,
    yearlyPrice: 39,
    cta: "Get Started",
    ctaVariant: "outline" as const,
    ctaLink: "/signup",
    popular: false,
    commission: "10% platform commission",
    features: [
      { label: "5 experts", included: true },
      { label: "20 services", included: true },
      { label: "AI Matching", included: true },
      { label: "Custom Domain", included: true },
      { label: "Group Sessions", included: true },
      { label: "Promo Codes", included: true },
      { label: "Basic Analytics", included: true },
      { label: "Webhooks", included: false },
      { label: "Courses & LMS", included: false },
      { label: "Subscriptions", included: false },
      { label: "Remove Branding", included: false },
    ],
  },
  {
    key: "pro",
    name: "Pro",
    badge: "Most Popular",
    monthlyPrice: 149,
    yearlyPrice: 119,
    cta: "Get Started",
    ctaVariant: "cta" as const,
    ctaLink: "/signup",
    popular: true,
    commission: "7% platform commission",
    features: [
      { label: "25 experts", included: true },
      { label: "Unlimited services", included: true },
      { label: "All AI Features", included: true },
      { label: "Custom Domain", included: true },
      { label: "Webhooks", included: true },
      { label: "Courses & LMS", included: true },
      { label: "Advanced Analytics", included: true },
      { label: "Booking Packages", included: true },
      { label: "Subscriptions", included: true },
      { label: "Session Summaries", included: true },
      { label: "Remove Branding", included: false },
    ],
  },
  {
    key: "scale",
    name: "Scale",
    badge: null,
    monthlyPrice: 399,
    yearlyPrice: 319,
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
    ctaLink: "/contact",
    popular: false,
    commission: "4% platform commission",
    features: [
      { label: "Unlimited experts", included: true },
      { label: "Unlimited services", included: true },
      { label: "All AI Features", included: true },
      { label: "Custom Domain", included: true },
      { label: "Remove Branding", included: true },
      { label: "Dedicated Support", included: true },
      { label: "SLA Guarantee", included: true },
      { label: "Advanced Analytics", included: true },
      { label: "All Pro features", included: true },
      { label: "Priority onboarding", included: true },
      { label: "Custom integrations", included: true },
    ],
  },
]

const TRUST_INDUSTRIES = [
  { icon: Heart, label: "Healthcare", color: "text-rose-400" },
  { icon: Scale, label: "Legal", color: "text-amber-400" },
  { icon: TrendingUp, label: "Finance", color: "text-emerald-400" },
  { icon: GraduationCap, label: "Education", color: "text-brand-400" },
  { icon: Dumbbell, label: "Fitness", color: "text-violet-400" },
]

export function LandingPage() {
  const tenant = useTenant()
  const isTenant = !!getSubdomain()
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")

  // Tenant-specific dynamic listings state
  const [services, setServices] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (isTenant) {
      setLoadingData(true)
      Promise.all([
        api.get("/services").catch(() => []),
        api.get("/courses").catch(() => []),
        api.get("/group_sessions").catch(() => [])
      ]).then(([svcs, crs, gs]) => {
        setServices(Array.isArray(svcs) ? svcs.slice(0, 4) : [])
        setCourses(Array.isArray(crs) ? crs.slice(0, 4) : [])
        setSessions(Array.isArray(gs) ? gs.slice(0, 4) : [])
      }).catch((err) => {
        console.error("Failed to load tenant listings:", err)
      }).finally(() => {
        setLoadingData(false)
      })
    }
  }, [isTenant])

  if (!isTenant) {
    // ────────────────────────────────────────────────────────────────────────────
    // 1. SAAS PLATFORM LANDING PAGE (Root Domain)
    // ────────────────────────────────────────────────────────────────────────────
    return (
      <div className="bg-slate-950 text-white min-h-screen overflow-x-hidden">
        {/* Hero */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 pt-24 pb-20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-indigo-600/10 blur-[120px]" />
            <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-brand-600/10 blur-[100px]" />
            <div className="absolute top-1/3 left-0 h-64 w-64 rounded-full bg-violet-800/10 blur-[80px]" />
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
              backgroundSize: "60px 60px"
            }} />
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="relative max-w-5xl mx-auto z-10"
          >
            <motion.div variants={staggerItem}>
              <Badge className="mb-6 bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 backdrop-blur-sm px-4 py-1.5 gap-2 inline-flex">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                Launch your own branded marketplace
                <ArrowRight className="h-3.5 w-3.5" />
              </Badge>
            </motion.div>

            <motion.h1
              variants={staggerItem}
              style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.75rem,6vw,4.5rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}
            >
              Launch Your Custom <br />
              <span className="bg-gradient-to-r from-brand-400 via-indigo-400 to-violet-500 bg-clip-text text-transparent">Expert Marketplace</span>
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="mt-6 text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed"
            >
              ExpertHub is the complete B2B white-label platform for businesses to launch, run, and scale expert consulting communities. Provide 1:1 sessions, live webinars, and on-demand courses under your own brand.
            </motion.p>

            <motion.div variants={staggerItem} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button variant="cta" className="gap-2">
                  Create a Marketplace <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="rounded-xl px-8 py-4 h-auto gap-2 text-base font-semibold border-white/15 bg-white/5 text-white hover:bg-white/10">
                  Marketplace Admin Login <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Core SaaS Features Grid */}
        <section className="py-24 px-4 bg-white/[0.01] border-y border-white/5">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-brand-500/10 text-brand-300 border-brand-500/20">Platform Features</Badge>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,4vw,2.75rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>
                Everything you need to run a B2B marketplace
              </h2>
              <p className="text-slate-400 mt-4 max-w-xl mx-auto text-sm">
                Focus on growth while we handle the scheduling, video streaming, course delivery, custom domain routing, and payout distributions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Laptop,
                  title: "Custom Branding & Subdomains",
                  desc: "Create a fully personalized tenant subdomain. Customize logo, colors, branding parameters, and match your business style in minutes."
                },
                {
                  icon: DollarSign,
                  title: "Flexible Payouts & Commissions",
                  desc: "Set flat or percentage commission models. Define minimum and maximum caps for commissions and payouts to protect your margin."
                },
                {
                  icon: Settings,
                  title: "Multi-Gateway Integrations",
                  desc: "Connect Stripe and Razorpay independently inside the admin dashboard. Enter secure credentials to route local payments and automate provider payouts."
                },
                {
                  icon: Video,
                  title: "Integrated 1:1 Daily.co Video",
                  desc: "Built-in scheduling syncs expert calendars, sends notification reminders, and fires up dedicated Daily.co video rooms without external apps."
                },
                {
                  icon: BookOpen,
                  title: "Structured LMS & Course Builder",
                  desc: "Enables experts to upload on-demand video courses, structure modules and lessons, offer quizzes, and sell curriculum access."
                },
                {
                  icon: Users,
                  title: "Live 1-to-Many Cohort Sessions",
                  desc: "Host interactive group workshops and webinars. Real-time seats remaining counter encourages instant checkout registrations."
                }
              ].map((f, i) => {
                const Icon = f.icon
                return (
                  <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
                    <div className="h-11 w-11 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                      <Icon className="h-5 w-5 text-brand-400" />
                    </div>
                    <h3 className="font-bold text-white mb-2" style={{ fontFamily: "var(--font-heading)", fontSize: "1rem" }}>{f.title}</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* How it works SaaS */}
        <section className="py-24 px-4">
          <div className="mx-auto max-w-5xl text-center">
            <Badge className="mb-4 bg-violet-500/10 text-violet-300 border-violet-500/20">How it works</Badge>
            <h2 className="mb-16" style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,4vw,2.75rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Three steps to launch your community
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: "01", title: "Sign up and set subdomain", desc: "Select your custom tenant identifier (e.g. acme) and choose name details." },
                { step: "02", title: "Configure configurations", desc: "Integrate Stripe or Razorpay keys and define flat or percentage-based payouts." },
                { step: "03", title: "Invite experts and launch", desc: "Onboard experts who manage their own schedules. They create lists, sessions, and courses." }
              ].map((s, idx) => (
                <div key={idx} className="relative">
                  <div className="h-12 w-12 rounded-xl bg-brand-500 flex items-center justify-center mx-auto mb-4 text-white font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                    {s.step}
                  </div>
                  <h3 className="font-bold text-white text-base mb-2">{s.title}</h3>
                  <p className="text-slate-400 text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="py-14 px-4 border-t border-white/5">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-slate-400 text-sm font-medium mb-8">
              Join <span className="text-white font-semibold">500+</span> marketplaces built on ExpertHub
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {TRUST_INDUSTRIES.map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-2.5 text-slate-400 hover:text-slate-200 transition-colors">
                  <div className={`h-9 w-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24 px-4 bg-white/[0.01] border-y border-white/5" id="pricing">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-brand-500/10 text-brand-300 border-brand-500/20">Pricing</Badge>
              <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,4vw,2.75rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>
                Simple, transparent pricing
              </h2>
              <p className="text-slate-400 mt-4 max-w-xl mx-auto text-sm">
                Start free and scale as your marketplace grows. No hidden fees.
              </p>

              {/* Monthly / Yearly toggle */}
              <div className="mt-8 inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    billingPeriod === "monthly"
                      ? "bg-brand-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingPeriod("yearly")}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    billingPeriod === "yearly"
                      ? "bg-brand-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Yearly
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    −20%
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {PLANS_PRICING.map((plan) => {
                const price = billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice
                return (
                  <div
                    key={plan.key}
                    className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                      plan.popular
                        ? "border-brand-500/60 bg-brand-500/5 shadow-[0_0_40px_-8px_rgba(99,102,241,0.3)]"
                        : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-bold shadow">
                        ⭐ Most Popular
                      </div>
                    )}

                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white" style={{ fontFamily: "var(--font-heading)", fontSize: "1.0625rem" }}>
                          {plan.name}
                        </h3>
                        {plan.badge && plan.key !== "pro" && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                            {plan.badge}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-end gap-1">
                        {plan.monthlyPrice === 0 ? (
                          <span className="text-3xl font-extrabold text-white" style={{ fontFamily: "var(--font-heading)" }}>Free</span>
                        ) : (
                          <>
                            {billingPeriod === "yearly" && (
                              <span className="text-slate-500 line-through text-sm self-center mr-1">${plan.monthlyPrice}</span>
                            )}
                            <span className="text-3xl font-extrabold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                              ${price}
                            </span>
                            <span className="text-slate-400 text-sm mb-1">/mo</span>
                          </>
                        )}
                      </div>
                      {plan.monthlyPrice === 0 && (
                        <p className="text-slate-500 text-xs mt-1">14-day trial, no credit card</p>
                      )}
                      {billingPeriod === "yearly" && plan.monthlyPrice > 0 && (
                        <p className="text-emerald-400 text-xs mt-1 font-medium">
                          Billed ${price * 12}/yr · save ${(plan.monthlyPrice - price) * 12}
                        </p>
                      )}
                      {plan.commission && (
                        <p className="text-slate-400 text-[11px] mt-1 font-medium opacity-80">
                          {plan.commission}
                        </p>
                      )}
                    </div>

                    <ul className="space-y-2.5 flex-1 mb-6">
                      {plan.features.map((f) => (
                        <li key={f.label} className="flex items-center gap-2.5">
                          {f.included ? (
                            <Check className="h-4 w-4 text-brand-400 shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-slate-600 shrink-0" />
                          )}
                          <span className={`text-sm ${f.included ? "text-slate-300" : "text-slate-600"}`}>
                            {f.label}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Link to={plan.ctaLink}>
                      <Button
                        variant={plan.ctaVariant}
                        className={`w-full rounded-xl ${
                          plan.ctaVariant === "outline"
                            ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
                            : ""
                        }`}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>

            <p className="text-center text-slate-500 text-xs mt-8">
              All plans include SSL, 99.9% uptime SLA on infrastructure, and email support.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-10 px-4 text-center text-slate-500 text-xs">
          <div>© 2026 ExpertHub SaaS, Inc. All rights reserved. Platform for custom marketplaces.</div>
        </footer>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 2. TENANT MARKETPLACE LANDING PAGE (Subdomain Domain)
  // ────────────────────────────────────────────────────────────────────────────
  const colorIndexForTenant = (tenant.name.charCodeAt(0) || 0) % EXPERT_COLORS.length
  const [tenantGradient] = EXPERT_COLORS[colorIndexForTenant]

  return (
    <div className="bg-slate-950 text-white min-h-screen overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-brand-600/10 blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="relative max-w-4xl mx-auto z-10"
        >
          <motion.div variants={staggerItem}>
            <Badge className="mb-6 bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 backdrop-blur-sm px-4 py-1.5">
              Welcome to our expert community
            </Badge>
          </motion.div>

          <motion.h1
            variants={staggerItem}
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem,5vw,4rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}
          >
            Welcome to <br />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-400 to-violet-500 bg-clip-text text-transparent">{tenant.name}</span>
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="mt-6 text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed"
          >
            {tenant.slogan}
          </motion.p>

          <motion.div variants={staggerItem} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/explore">
              <Button className="rounded-xl px-8 py-4 h-auto gap-2 glow-brand text-base font-semibold bg-brand-500 hover:bg-brand-600">
                Explore Listings <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/signup/expert">
              <Button variant="outline" className="rounded-xl px-8 py-4 h-auto gap-2 text-base font-semibold border-white/15 bg-white/5 text-white hover:bg-white/10">
                Apply as an Expert <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Dynamic Showcases */}
      <section className="py-16 px-4 bg-slate-900/40 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          {loadingData ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-slate-400">Loading listings...</p>
            </div>
          ) : (
            <div className="space-y-20">
              {/* If empty state across all data */}
              {services.length === 0 && courses.length === 0 && sessions.length === 0 && (
                <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl p-10">
                  <Building2 className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Marketplace Ready!</h3>
                  <p className="text-slate-400 max-w-md mx-auto mb-6 text-sm">
                    This community has been configured successfully. Operators can log in to onboard experts, create consultations, launch live sessions, or add courses.
                  </p>
                  <Link to="/login/expert">
                    <Button className="bg-brand-500 hover:bg-brand-600 rounded-xl">Expert or Admin Sign In</Button>
                  </Link>
                </div>
              )}

              {/* 1. Featured Consultations */}
              {services.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <Badge className="bg-brand-500/10 text-brand-300 border-brand-500/20 mb-2">1:1 Sessions</Badge>
                      <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Featured 1:1 Consultations</h2>
                    </div>
                    <Link to="/explore?tab=experts" className="text-brand-400 hover:text-brand-300 text-sm font-semibold flex items-center gap-1">
                      See all <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {services.map((svc) => {
                      const ep = svc.expert_profile
                      const user = ep?.user
                      const expertIdentifier = user?.username || ep?.id || user?.id
                      const initials = `${user?.given_name?.[0] || ""}${user?.family_name?.[0] || ""}`.toUpperCase() || "EX"
                      const colorIdx = (ep?.id || 0) % EXPERT_COLORS.length
                      const [gradient] = EXPERT_COLORS[colorIdx]
                      return (
                        <div key={svc.id} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-500/30 transition-all flex flex-col justify-between">
                          <div className={`h-20 bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white text-lg`}>
                            {initials}
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-bold text-white text-sm line-clamp-1">{svc.title}</h3>
                              <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">{svc.description}</p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                              <span className="text-white font-extrabold text-sm">${(svc.price_cents / 100).toFixed(0)}</span>
                              <Link to={expertIdentifier ? `/expert/${expertIdentifier}` : "/explore?tab=experts"}>
                                <Button size="sm" className="rounded-full text-xs h-7 px-3 bg-brand-500 hover:bg-brand-600">Book</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 2. Featured Courses */}
              {courses.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 mb-2">On-Demand</Badge>
                      <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Available Courses</h2>
                    </div>
                    <Link to="/explore?tab=courses" className="text-brand-400 hover:text-brand-300 text-sm font-semibold flex items-center gap-1">
                      See all <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {courses.map((course) => {
                      const colorIdx = (course.id || 0) % EXPERT_COLORS.length
                      const [gradient] = EXPERT_COLORS[colorIdx]
                      return (
                        <div key={course.id} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-500/30 transition-all flex flex-col justify-between">
                          <div className={`h-24 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                            <BookOpen className="h-10 w-10 text-white/55" />
                          </div>
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-bold text-white text-sm line-clamp-2">{course.title}</h3>
                              <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">{course.description}</p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                              <span className="text-white font-extrabold text-sm">${(course.price_cents / 100).toFixed(0)}</span>
                              <Link to={`/explore?tab=courses`}>
                                <Button size="sm" variant="outline" className="rounded-full text-xs h-7 px-3 border-white/10 hover:bg-white/10">Enroll</Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 3. Live Group Sessions */}
              {sessions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <Badge className="bg-rose-500/10 text-rose-300 border-rose-500/20 mb-2">Live Workshops</Badge>
                      <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Upcoming Live Sessions</h2>
                    </div>
                    <Link to="/explore?tab=sessions" className="text-brand-400 hover:text-brand-300 text-sm font-semibold flex items-center gap-1">
                      See all <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {sessions.map((session) => {
                      const colorIdx = (session.id || 0) % EXPERT_COLORS.length
                      const [gradient] = EXPERT_COLORS[colorIdx]
                      const formattedDate = new Date(session.start_time).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      return (
                        <div key={session.id} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-500/30 transition-all p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-2">
                              <Clock className="h-3.5 w-3.5" />
                              {formattedDate}
                            </div>
                            <h3 className="font-bold text-white text-sm line-clamp-2">{session.title}</h3>
                            <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">{session.description}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                            <span className="text-white font-extrabold text-sm">${(session.price_cents / 100).toFixed(0)}</span>
                            <Link to={`/explore?tab=sessions`}>
                              <Button size="sm" className="rounded-full text-xs h-7 px-3 bg-brand-500 hover:bg-brand-600">Register</Button>
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>{tenant.name}</span>
          </div>
          <span>© 2026 {tenant.name}. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
