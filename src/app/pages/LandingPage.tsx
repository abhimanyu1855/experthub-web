import { useState, useEffect } from "react"
import { Link } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  ArrowRight, Zap, Globe, Users,
  Sparkles, TrendingUp, Video, BookOpen, Clock,
  Building2, DollarSign, Settings, Laptop, ArrowUpRight,
  Check, X, Heart, Scale, GraduationCap, Dumbbell, Star,
  ChevronRight, Activity, Shield, Layers
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { staggerContainer, staggerItem, revealContainer, revealItem, revealItemPop, revealItemFade, viewport } from "@/app/lib/motion"
import { useTenant } from "@/app/providers/TenantThemeProvider"
import { api, getSubdomain } from "@/app/lib/api"
import { Counter } from "@/app/components/ui/Counter"
import { BentoGrid, BentoCard } from "@/app/components/ui/BentoGrid"
import { Marquee } from "@/app/components/ui/Marquee"
import { Footer } from "@/app/components/layout/Footer"

// ─── Colors for Card Gradients ──────────────────────────────────────────────────
const EXPERT_COLORS = [
  ["from-indigo-500 to-violet-600", "bg-indigo-50 text-indigo-600"],
  ["from-emerald-400 to-teal-600", "bg-emerald-50 text-emerald-600"],
  ["from-rose-400 to-pink-600", "bg-rose-50 text-rose-600"],
  ["from-amber-400 to-orange-500", "bg-amber-50 text-amber-600"],
]

// ─── Stats ───────────────────────────────────────────────────────────────────
const STATS = [
  { value: 500, suffix: "+", label: "Marketplaces launched" },
  { value: 12000, suffix: "+", label: "Sessions delivered" },
  { value: 98, suffix: "%", label: "Operator satisfaction" },
  { value: 150, suffix: "+", label: "Countries reached" },
]

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "We went from idea to a live expert marketplace in under 3 weeks. ExpertHub handled everything from video infrastructure to payment splits.",
    author: "Sarah Chen",
    role: "CEO, TechConsult Pro",
    avatar: "SC",
    gradient: "from-indigo-500 to-violet-600",
    rating: 5,
  },
  {
    quote: "The white-labeling is seamless. Our clients don't even know we're running on ExpertHub — they just see our brand, our colors, our domain.",
    author: "Marcus Reid",
    role: "Founder, FinanceHub",
    avatar: "MR",
    gradient: "from-emerald-400 to-teal-600",
    rating: 5,
  },
  {
    quote: "AI expert matching alone has increased our booking rate by 40%. The ROI was visible within the first month of using the platform.",
    author: "Dr. Anya Kapoor",
    role: "Director, MedAdvisors",
    avatar: "AK",
    gradient: "from-rose-400 to-pink-600",
    rating: 5,
  },
  {
    quote: "Setting up Razorpay with automated commission splits took 10 minutes. It used to take our engineering team weeks to build this ourselves.",
    author: "Rohan Sharma",
    role: "CTO, LegalEdge India",
    avatar: "RS",
    gradient: "from-amber-400 to-orange-500",
    rating: 5,
  },
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
  { icon: Heart, label: "Healthcare" },
  { icon: Scale, label: "Legal Services" },
  { icon: TrendingUp, label: "Finance" },
  { icon: GraduationCap, label: "Education" },
  { icon: Dumbbell, label: "Fitness" },
  { icon: Globe, label: "Consulting" },
  { icon: Shield, label: "Compliance" },
  { icon: Activity, label: "Wellness" },
  { icon: Layers, label: "Technology" },
  { icon: Users, label: "HR & Recruiting" },
]

// ─── Bento feature data ───────────────────────────────────────────────────────
const BENTO_FEATURES = [
  {
    size: "lg" as const,
    icon: Laptop,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10 border-indigo-500/20",
    title: "Custom Branding & Subdomains",
    desc: "Create a fully personalized tenant subdomain. Customize logo, colors, branding parameters, and match your business style in minutes.",
    tag: "White-label",
    tagColor: "bg-indigo-500/10 text-indigo-300",
  },
  {
    size: "sm" as const,
    icon: DollarSign,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Flexible Payouts",
    desc: "Set flat or percentage commission models with caps.",
    tag: "Payments",
    tagColor: "bg-emerald-500/10 text-emerald-300",
  },
  {
    size: "sm" as const,
    icon: Settings,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    title: "Multi-Gateway",
    desc: "Stripe + Razorpay. Both. Independently configured.",
    tag: "Integrations",
    tagColor: "bg-amber-500/10 text-amber-300",
  },
  {
    size: "md" as const,
    icon: Video,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/10 border-rose-500/20",
    title: "Integrated Video Sessions",
    desc: "Built-in Daily.co video rooms fire automatically at booking time. No Zoom links, no external apps.",
    tag: "1:1 Video",
    tagColor: "bg-rose-500/10 text-rose-300",
  },
  {
    size: "md" as const,
    icon: BookOpen,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10 border-violet-500/20",
    title: "Structured LMS & Course Builder",
    desc: "Experts upload video modules, structure lessons, create quizzes, and sell curriculum access — all self-serve.",
    tag: "LMS",
    tagColor: "bg-violet-500/10 text-violet-300",
  },
  {
    size: "sm" as const,
    icon: Users,
    iconColor: "text-teal-400",
    iconBg: "bg-teal-500/10 border-teal-500/20",
    title: "Live Group Sessions",
    desc: "Host cohort workshops with real-time seat tracking.",
    tag: "Workshops",
    tagColor: "bg-teal-500/10 text-teal-300",
  },
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

        {/* ── Hero ── */}
        <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 pt-24 pb-20 overflow-hidden">
          {/* Upgraded background — noise + animated gradient mesh */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Primary glow — animated slow shift */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 h-[700px] w-[1100px] rounded-full opacity-60"
              style={{
                background: "radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.08) 50%, transparent 75%)",
                filter: "blur(60px)",
                animation: "subtle-drift 8s ease-in-out infinite alternate",
              }}
            />
            {/* Secondary accent glow */}
            <div className="absolute bottom-0 right-[-5%] h-80 w-80 rounded-full opacity-40"
              style={{ background: "radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%)", filter: "blur(50px)" }}
            />
            {/* Refined grid — finer, subtler */}
            <div className="absolute inset-0 opacity-[0.025]" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)",
              backgroundSize: "40px 40px"
            }} />
            {/* Noise texture */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "200px 200px",
            }} />
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="relative max-w-5xl mx-auto z-10"
          >
            {/* Pill badge */}
            <motion.div variants={staggerItem}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm text-sm text-slate-300 mb-8 hover:border-white/20 transition-colors cursor-default">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                Launch your own branded marketplace
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              </div>
            </motion.div>

            {/* Headline — animated gradient instead of static */}
            <motion.h1
              variants={staggerItem}
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(2.75rem,6vw,4.75rem)",
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-0.035em",
              }}
            >
              Launch Your Custom{" "}
              <br className="hidden sm:block" />
              <span className="gradient-text-animated">Expert Marketplace</span>
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="mt-7 text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed"
            >
              The complete white-label platform for businesses to launch, run, and scale expert consulting communities — with 1:1 sessions, live webinars, and on-demand courses under your own brand.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={staggerItem} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-base glow-brand transition-colors"
                >
                  Create a Marketplace <ArrowRight className="h-5 w-5" />
                </motion.button>
              </Link>
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/15 bg-white/5 text-white font-semibold text-base hover:bg-white/10 hover:border-white/25 transition-all"
                >
                  Admin Login <ArrowUpRight className="h-4 w-4" />
                </motion.button>
              </Link>
            </motion.div>

            {/* Trust micro-line */}
            <motion.p variants={staggerItem} className="mt-8 text-slate-600 text-sm">
              No credit card required · 14-day free trial · Setup in &lt;10 minutes
            </motion.p>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="h-6 w-px bg-gradient-to-b from-transparent to-slate-700" />
            <div className="h-1 w-1 rounded-full bg-slate-600" />
          </motion.div>
        </section>

        {/* ── Stats Strip ── */}
        <section className="py-16 px-4 border-y border-white/5 bg-white/[0.01]">
          <motion.div
            variants={revealContainer}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {STATS.map((stat, i) => (
              <motion.div key={i} variants={revealItem} className="text-center">
                <div
                  className="text-4xl font-extrabold text-white mb-1"
                  style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.03em" }}
                >
                  <Counter target={stat.value} suffix={stat.suffix} duration={2.2} />
                </div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Marquee / Industries ── */}
        <section className="py-14 px-4">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewport}
            className="text-center text-slate-500 text-sm font-medium mb-8"
          >
            Used across every industry vertical
          </motion.p>
          <Marquee duration={25}>
            {TRUST_INDUSTRIES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/8 bg-white/[0.025] text-slate-400 whitespace-nowrap shrink-0 hover:text-slate-200 hover:border-white/15 transition-colors"
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </Marquee>
        </section>

        {/* ── Bento Grid Features ── */}
        <section className="py-24 px-4 bg-white/[0.01] border-t border-white/5" id="features">
          <div className="mx-auto max-w-6xl">
            <motion.div
              variants={revealContainer}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              className="text-center mb-16"
            >
              <motion.div variants={revealItemPop}>
                <Badge className="mb-4 bg-brand-500/10 text-brand-300 border-brand-500/20">Platform Features</Badge>
              </motion.div>
              <motion.h2
                variants={revealItem}
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(2rem,4vw,2.75rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                Everything you need to run a B2B marketplace
              </motion.h2>
              <motion.p variants={revealItemFade} className="text-slate-400 mt-4 max-w-xl mx-auto text-sm">
                Focus on growth while we handle scheduling, video, courses, domain routing, and payout distributions.
              </motion.p>
            </motion.div>

            <BentoGrid>
              {BENTO_FEATURES.map((f, i) => {
                const Icon = f.icon
                return (
                  <BentoCard key={i} size={f.size} delay={i * 0.05}>
                    <div className="p-6 h-full flex flex-col justify-between">
                      <div>
                        <div className={`h-11 w-11 rounded-xl border flex items-center justify-center mb-4 ${f.iconBg}`}>
                          <Icon className={`h-5 w-5 ${f.iconColor}`} />
                        </div>
                        <h3 className="font-bold text-white mb-2" style={{ fontFamily: "var(--font-heading)", fontSize: "0.9375rem" }}>
                          {f.title}
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                      </div>
                      <div className="mt-4">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${f.tagColor}`}>
                          {f.tag}
                        </span>
                      </div>
                    </div>
                  </BentoCard>
                )
              })}
            </BentoGrid>
          </div>
        </section>

        {/* ── How it Works ── */}
        <section className="py-24 px-4 border-t border-white/5">
          <div className="mx-auto max-w-5xl">
            <motion.div
              variants={revealContainer}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              className="text-center mb-16"
            >
              <motion.div variants={revealItemPop}>
                <Badge className="mb-4 bg-violet-500/10 text-violet-300 border-violet-500/20">How it works</Badge>
              </motion.div>
              <motion.h2
                variants={revealItem}
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(2rem,4vw,2.75rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                Three steps to launch your community
              </motion.h2>
            </motion.div>

            <motion.div
              variants={revealContainer}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
            >
              {/* Connector line (desktop only) */}
              <div className="hidden md:block absolute top-8 left-[calc(16.666%+2rem)] right-[calc(16.666%+2rem)] h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />

              {[
                {
                  step: "01",
                  icon: Zap,
                  title: "Sign up & set subdomain",
                  desc: "Choose your custom tenant identifier and name. Your marketplace is live at yourname.experthub.io in seconds.",
                  color: "text-indigo-400",
                  bg: "bg-indigo-500/10 border-indigo-500/20",
                },
                {
                  step: "02",
                  icon: DollarSign,
                  title: "Configure payments",
                  desc: "Connect Stripe or Razorpay. Define flat or percentage-based commission models with minimum and maximum caps.",
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10 border-emerald-500/20",
                },
                {
                  step: "03",
                  icon: Users,
                  title: "Invite experts & launch",
                  desc: "Onboard experts who manage their own schedules. They create listings, sessions, and courses from day one.",
                  color: "text-violet-400",
                  bg: "bg-violet-500/10 border-violet-500/20",
                },
              ].map((s, idx) => {
                const Icon = s.icon
                return (
                  <motion.div key={idx} variants={revealItem} className="relative text-center">
                    <div className={`h-16 w-16 rounded-2xl border ${s.bg} flex items-center justify-center mx-auto mb-6`}>
                      <Icon className={`h-7 w-7 ${s.color}`} />
                    </div>
                    <div className={`absolute top-1 right-[calc(50%-2rem)] font-extrabold text-xs ${s.color} opacity-40`} style={{ fontFamily: "var(--font-heading)" }}>
                      {s.step}
                    </div>
                    <h3 className="font-bold text-white text-base mb-3" style={{ fontFamily: "var(--font-heading)" }}>{s.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="py-24 px-4 bg-white/[0.01] border-t border-white/5">
          <div className="mx-auto max-w-6xl">
            <motion.div
              variants={revealContainer}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              className="text-center mb-16"
            >
              <motion.div variants={revealItemPop}>
                <Badge className="mb-4 bg-emerald-500/10 text-emerald-300 border-emerald-500/20">Customer Stories</Badge>
              </motion.div>
              <motion.h2
                variants={revealItem}
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "clamp(2rem,4vw,2.75rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                Trusted by operators worldwide
              </motion.h2>
            </motion.div>

            <motion.div
              variants={revealContainer}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={i}
                  variants={revealItem}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="relative p-6 rounded-2xl border border-white/8 bg-white/[0.025] overflow-hidden group"
                >
                  {/* Subtle glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, si) => (
                        <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                      "{t.quote}"
                    </p>

                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {t.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{t.author}</div>
                        <div className="text-xs text-slate-500">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="py-24 px-4 border-t border-white/5" id="pricing">
          <div className="mx-auto max-w-6xl">
            <motion.div
              variants={revealContainer}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              className="text-center mb-12"
            >
              <motion.div variants={revealItemPop}>
                <Badge className="mb-4 bg-brand-500/10 text-brand-300 border-brand-500/20">Pricing</Badge>
              </motion.div>
              <motion.h2
                variants={revealItem}
                style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,4vw,2.75rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
              >
                Simple, transparent pricing
              </motion.h2>
              <motion.p variants={revealItemFade} className="text-slate-400 mt-4 max-w-xl mx-auto text-sm">
                Start free and scale as your marketplace grows. No hidden fees.
              </motion.p>

              {/* Billing toggle — with layoutId sliding pill */}
              <motion.div variants={revealItemPop} className="mt-8 inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 relative">
                {["monthly", "yearly"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setBillingPeriod(period as "monthly" | "yearly")}
                    className="relative px-5 py-2 rounded-lg text-sm font-semibold z-10"
                  >
                    <AnimatePresence>
                      {billingPeriod === period && (
                        <motion.div
                          layoutId="billing-pill"
                          className="absolute inset-0 bg-brand-600 rounded-lg"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                    <span className={`relative z-10 transition-colors ${billingPeriod === period ? "text-white" : "text-slate-400 hover:text-white"}`}>
                      {period === "yearly" ? (
                        <span className="flex items-center gap-2">
                          Yearly
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">−20%</span>
                        </span>
                      ) : "Monthly"}
                    </span>
                  </button>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              variants={revealContainer}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5"
            >
              {PLANS_PRICING.map((plan) => {
                const price = billingPeriod === "monthly" ? plan.monthlyPrice : plan.yearlyPrice
                return (
                  <motion.div
                    key={plan.key}
                    variants={revealItem}
                    whileHover={{ y: plan.popular ? -2 : -4, scale: plan.popular ? 1 : 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`relative flex flex-col rounded-2xl border p-6 ${
                      plan.popular
                        ? "border-brand-500/60 bg-brand-500/5 shadow-[0_0_40px_-8px_rgba(99,102,241,0.3)] scale-[1.02]"
                        : "border-white/8 bg-white/[0.02]"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-bold shadow">
                        Most Popular
                      </div>
                    )}

                    <div className="mb-5">
                      <h3 className="font-bold text-white" style={{ fontFamily: "var(--font-heading)", fontSize: "1.0625rem" }}>
                        {plan.name}
                      </h3>

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
                        <p className="text-slate-400 text-[11px] mt-1 font-medium opacity-80">{plan.commission}</p>
                      )}
                    </div>

                    <ul className="space-y-2.5 flex-1 mb-6">
                      {plan.features.map((f) => (
                        <li key={f.label} className="flex items-center gap-2.5">
                          {f.included ? (
                            <Check className="h-4 w-4 text-brand-400 shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-slate-700 shrink-0" />
                          )}
                          <span className={`text-sm ${f.included ? "text-slate-300" : "text-slate-600"}`}>{f.label}</span>
                        </li>
                      ))}
                    </ul>

                    <Link to={plan.ctaLink}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          plan.ctaVariant === "cta"
                            ? "bg-brand-500 hover:bg-brand-600 text-white glow-brand"
                            : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                        }`}
                      >
                        {plan.cta}
                      </motion.button>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>

            <p className="text-center text-slate-600 text-xs mt-8">
              All plans include SSL, 99.9% uptime SLA on infrastructure, and email support.
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <Footer />
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
      {/* Hero — differentiated from SaaS root */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 pt-24 pb-20 overflow-hidden">
        {/* Tenant-specific gradient: uses a conic gradient anchored to brand color */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-[-20%] left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full opacity-50"
            style={{ background: "radial-gradient(ellipse, var(--brand-600,rgba(99,102,241,0.2)) 0%, transparent 70%)", filter: "blur(80px)" }}
          />
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.3) 40px, rgba(255,255,255,0.3) 41px)",
          }} />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="relative max-w-4xl mx-auto z-10"
        >
          <motion.div variants={staggerItem}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm text-sm text-slate-300 mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
              Welcome to our expert community
            </div>
          </motion.div>

          <motion.h1
            variants={staggerItem}
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.5rem,5vw,4rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.035em" }}
          >
            Welcome to <br />
            <span className="gradient-text-animated">{tenant.name}</span>
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="mt-6 text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed"
          >
            {tenant.slogan}
          </motion.p>

          <motion.div variants={staggerItem} className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/explore">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-base glow-brand transition-colors"
              >
                Explore Listings <ArrowRight className="h-5 w-5" />
              </motion.button>
            </Link>
            <Link to="/signup/expert">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/15 bg-white/5 text-white font-semibold text-base hover:bg-white/10 transition-all"
              >
                Apply as an Expert <ArrowUpRight className="h-4 w-4" />
              </motion.button>
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
                <motion.div variants={revealContainer} initial="hidden" whileInView="show" viewport={viewport}>
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
                        <motion.div key={svc.id} variants={revealItem} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-500/30 transition-colors flex flex-col justify-between shimmer-on-hover"
                        >
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
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* 2. Featured Courses */}
              {courses.length > 0 && (
                <motion.div variants={revealContainer} initial="hidden" whileInView="show" viewport={viewport}>
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
                        <motion.div key={course.id} variants={revealItem} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-500/30 transition-colors flex flex-col justify-between shimmer-on-hover"
                        >
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
                              <Link to="/explore?tab=courses">
                                <Button size="sm" variant="outline" className="rounded-full text-xs h-7 px-3 border-white/10 hover:bg-white/10">Enroll</Button>
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* 3. Live Group Sessions */}
              {sessions.length > 0 && (
                <motion.div variants={revealContainer} initial="hidden" whileInView="show" viewport={viewport}>
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
                      const formattedDate = new Date(session.start_time).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      return (
                        <motion.div key={session.id} variants={revealItem} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-brand-500/30 transition-colors p-4 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-2">
                              <Clock className="h-3.5 w-3.5" />{formattedDate}
                            </div>
                            <h3 className="font-bold text-white text-sm line-clamp-2">{session.title}</h3>
                            <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">{session.description}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                            <span className="text-white font-extrabold text-sm">${(session.price_cents / 100).toFixed(0)}</span>
                            <Link to="/explore?tab=sessions">
                              <Button size="sm" className="rounded-full text-xs h-7 px-3 bg-brand-500 hover:bg-brand-600">Register</Button>
                            </Link>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Tenant footer — minimal branded */}
      <footer className="border-t border-white/5 py-10 px-4">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>{tenant.name}</span>
          </div>
          <span>© {new Date().getFullYear()} {tenant.name}. All rights reserved.</span>
          <span className="text-slate-700">Powered by ExpertHub</span>
        </div>
      </footer>
    </div>
  )
}
