import { useState } from "react"
import { Link, Navigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { getStoredMembership, getSubdomain, api } from "@/app/lib/api"
import { Check, X, Zap, Building2, Users, HelpCircle, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/motion"
import { toast } from "sonner"

const plans = [
  {
    id: "trial",
    name: "Free Trial",
    icon: Zap,
    tagline: "Start building your marketplace with a 14-day free trial",
    monthlyPrice: 0,
    annualPrice: 0,
    cta: "Get started free",
    ctaVariant: "outline" as const,
    highlight: false,
    badge: "14-day trial",
    features: [
      { label: "2 expert profiles", included: true },
      { label: "5 services", included: true },
      { label: "Basic booking calendar", included: true },
      { label: "Chat messaging", included: true },
      { label: "Platform payment processing", included: true },
      { label: "Custom domain", included: false },
      { label: "Group Sessions", included: false },
      { label: "Promo Codes", included: false },
      { label: "Advanced Analytics", included: false },
      { label: "Courses & LMS", included: false },
      { label: "Subscriptions", included: false },
      { label: "Remove Branding", included: false },
    ],
    commission: "15% per booking",
  },
  {
    id: "starter",
    name: "Starter",
    icon: Users,
    tagline: "Perfect for small marketplaces just getting started",
    monthlyPrice: 49,
    annualPrice: 39,
    cta: "Get Started",
    ctaVariant: "outline" as const,
    highlight: false,
    badge: null,
    features: [
      { label: "5 expert profiles", included: true },
      { label: "20 services", included: true },
      { label: "AI Matching", included: true },
      { label: "Custom domain", included: true },
      { label: "Group Sessions", included: true },
      { label: "Promo Codes", included: true },
      { label: "Basic Analytics", included: true },
      { label: "Webhooks", included: false },
      { label: "Courses & LMS", included: false },
      { label: "Subscriptions", included: false },
      { label: "Remove Branding", included: false },
    ],
    commission: "10% per booking",
  },
  {
    id: "pro",
    name: "Pro",
    icon: Zap,
    tagline: "For growing expert businesses and professional teams",
    monthlyPrice: 149,
    annualPrice: 119,
    cta: "Get Started",
    ctaVariant: "default" as const,
    highlight: true,
    badge: "Most Popular",
    features: [
      { label: "25 expert profiles", included: true },
      { label: "Unlimited services", included: true },
      { label: "All AI features (triage & summaries)", included: true },
      { label: "Custom domain", included: true },
      { label: "Webhooks", included: true },
      { label: "Courses & LMS", included: true },
      { label: "Advanced Analytics", included: true },
      { label: "Booking Packages", included: true },
      { label: "Subscriptions", included: true },
      { label: "Session Summaries", included: true },
      { label: "Remove Branding", included: false },
    ],
    commission: "7% per booking",
  },
  {
    id: "scale",
    name: "Scale",
    icon: Building2,
    tagline: "For large marketplaces requiring full customizability",
    monthlyPrice: 399,
    annualPrice: 319,
    cta: "Contact sales",
    ctaVariant: "outline" as const,
    highlight: false,
    badge: null,
    features: [
      { label: "Unlimited expert profiles", included: true },
      { label: "Unlimited services", included: true },
      { label: "All AI + Pro features", included: true },
      { label: "Custom domain", included: true },
      { label: "Remove Branding", included: true },
      { label: "Dedicated Support + SLA", included: true },
      { label: "API access", included: true },
      { label: "Webhooks", included: true },
      { label: "Courses & LMS", included: true },
      { label: "Subscriptions", included: true },
      { label: "Multi-operator teams", included: true },
    ],
    commission: "4% per booking",
  },
]

const featureCategories = [
  {
    category: "Profiles & Experts",
    rows: [
      { label: "Expert profiles", trial: "2", starter: "5", pro: "25", scale: "Unlimited" },
      { label: "Custom profile URL", trial: "✓", starter: "✓", pro: "✓", scale: "✓" },
      { label: "Verified badge", trial: "—", starter: "—", pro: "✓", scale: "✓" },
    ],
  },
  {
    category: "Bookings & Scheduling",
    rows: [
      { label: "Monthly bookings", trial: "Unlimited", starter: "Unlimited", pro: "Unlimited", scale: "Unlimited" },
      { label: "Booking calendar", trial: "Basic", starter: "Basic", pro: "Advanced", scale: "Advanced" },
      { label: "Buffer time settings", trial: "—", starter: "✓", pro: "✓", scale: "✓" },
      { label: "Group sessions", trial: "—", starter: "✓", pro: "✓", scale: "✓" },
    ],
  },
  {
    category: "Communication",
    rows: [
      { label: "Chat messaging", trial: "✓", starter: "✓", pro: "✓", scale: "✓" },
      { label: "Video calls", trial: "—", starter: "✓", pro: "✓", scale: "✓" },
      { label: "Phone sessions", trial: "—", starter: "✓", pro: "✓", scale: "✓" },
      { label: "Session summaries & transcript", trial: "—", starter: "—", pro: "✓", scale: "✓" },
    ],
  },
  {
    category: "Payments",
    rows: [
      { label: "Payment processing", trial: "✓", starter: "✓", pro: "✓", scale: "✓" },
      { label: "Platform commission", trial: "15%", starter: "10%", pro: "7%", scale: "4%" },
      { label: "Stripe Connect", trial: "✓", starter: "✓", pro: "✓", scale: "✓" },
      { label: "Razorpay (India)", trial: "—", starter: "✓", pro: "✓", scale: "✓" },
      { label: "Promo codes", trial: "—", starter: "✓", pro: "✓", scale: "✓" },
    ],
  },
  {
    category: "Learning & Content",
    rows: [
      { label: "Course builder", trial: "—", starter: "—", pro: "✓", scale: "✓" },
      { label: "Live session hosting", trial: "—", starter: "✓", pro: "✓", scale: "✓" },
      { label: "Quiz & assessments", trial: "—", starter: "—", pro: "✓", scale: "✓" },
      { label: "Certificate issuance", trial: "—", starter: "—", pro: "✓", scale: "✓" },
    ],
  },
  {
    category: "Branding & Domain",
    rows: [
      { label: "Custom domain", trial: "—", starter: "✓", pro: "✓", scale: "✓" },
      { label: "White-label branding", trial: "—", starter: "—", pro: "—", scale: "✓" },
      { label: "Subdomain", trial: "✓", starter: "✓", pro: "✓", scale: "✓" },
      { label: "Remove ExpertHub badge", trial: "—", starter: "—", pro: "—", scale: "✓" },
    ],
  },
  {
    category: "Analytics & API",
    rows: [
      { label: "Analytics dashboard", trial: "Basic", starter: "Basic", pro: "Advanced", scale: "Advanced" },
      { label: "API access", trial: "—", starter: "—", pro: "—", scale: "✓" },
      { label: "Webhooks", trial: "—", starter: "—", pro: "✓", scale: "✓" },
    ],
  },
]

const faqs = [
  {
    question: "Can I switch plans at any time?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately; downgrades take effect at the end of your billing cycle.",
  },
  {
    question: "What is the platform commission?",
    answer: "The platform commission is a percentage taken from each completed booking, which covers payment processing, automated payouts, and platform maintenance. Free Trial: 15%, Starter: 10%, Pro: 7%, Scale: 4%.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! ExpertHub offers a 14-day free trial, no credit card required, allowing you to list up to 2 experts and test the system completely.",
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team and we'll process a full refund.",
  },
  {
    question: "Can I use my own payment processor?",
    answer: "Paid plans connect Stripe Connect and Razorpay for direct routing. Scale customers can discuss custom payment processor integrations with their account manager.",
  },
  {
    question: "What counts as an \"expert profile\"?",
    answer: "An expert profile is any verified expert listed on your marketplace. Multiple service offerings by the same expert count as one profile.",
  },
]

function PlanCard({
  plan, isAnnual, isTenant, onCheckout, checkingOut, currentPlanId
}: {
  plan: typeof plans[0]
  isAnnual: boolean
  isTenant: boolean
  onCheckout: (planId: string) => void
  checkingOut: string | null
  currentPlanId: string | null
}) {
  const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
  const Icon = plan.icon
  const isCurrentPlan = currentPlanId === plan.id
  const isLoading = checkingOut === plan.id

  return (
    <motion.div
      {...staggerItem}
      className={`relative flex flex-col rounded-2xl border p-6 ${
        plan.highlight
          ? "border-brand-500 bg-gradient-to-b from-brand-50 to-white shadow-raised"
          : "border-border bg-surface shadow-card"
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-brand-500 text-white px-3 py-1 shadow-sm">{plan.badge}</Badge>
        </div>
      )}

      <div className="mb-5">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${
          plan.highlight ? "bg-brand-500 text-white" : "bg-brand-50 text-brand-600"
        }`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 style={{ fontFamily: "var(--font-heading)" }} className="text-xl font-bold text-foreground">
          {plan.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span style={{ fontFamily: "var(--font-heading)" }} className="text-4xl font-extrabold text-foreground">
            {price === 0 ? "Free" : `$${price}`}
          </span>
          {price > 0 && (
            <span className="text-muted-foreground mb-1">/mo</span>
          )}
        </div>
        {isAnnual && price > 0 && (
          <p className="text-xs text-success font-medium mt-1">
            Save ${(plan.monthlyPrice - plan.annualPrice) * 12}/yr with annual billing
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{plan.commission}</p>
      </div>

      {isCurrentPlan ? (
        <Badge className="w-full justify-center py-2.5 mb-6 rounded-xl bg-success/10 text-success border-success/20 text-sm font-semibold">
          Current plan
        </Badge>
      ) : plan.id === "scale" ? (
        <Button
          variant={plan.ctaVariant}
          className="w-full rounded-xl mb-6"
          asChild
        >
          <Link to="/contact">{plan.cta}</Link>
        </Button>
      ) : isTenant ? (
        <Button
          variant={plan.ctaVariant}
          className={`w-full rounded-xl mb-6 ${plan.highlight ? "glow-brand" : ""}`}
          onClick={() => onCheckout(plan.id)}
          disabled={isLoading || !!checkingOut || plan.id === "trial"}
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting...</>
          ) : plan.cta}
        </Button>
      ) : (
        <Button
          variant={plan.ctaVariant}
          className={`w-full rounded-xl mb-6 ${plan.highlight ? "glow-brand" : ""}`}
          asChild
        >
          <Link to={`/signup?role=operator&plan=${plan.id}`}>{plan.cta}</Link>
        </Button>
      )}

      <div className="space-y-2.5 flex-1">
        {plan.features.map((feature) => (
          <div key={feature.label} className="flex items-start gap-2.5">
            {feature.included ? (
              <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
            )}
            <span className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground/60"}`}>
              {feature.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function FaqItem({ faq }: { faq: typeof faqs[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border">
      <button
        className="w-full flex items-center justify-between py-5 text-left gap-4"
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-medium text-foreground">{faq.question}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-muted-foreground text-sm pb-5 leading-relaxed">{faq.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function PricingPage() {
  const isTenant = !!getSubdomain()

  const [isAnnual, setIsAnnual] = useState(true)
  const [showTable, setShowTable] = useState(false)
  const [checkingOut, setCheckingOut] = useState<string | null>(null)

  // Detect current plan from localStorage membership (operator context)
  const membership = typeof window !== "undefined" ? getStoredMembership() : null
  const currentPlanId: string | null = membership?.role === "operator" ? (membership?.plan || null) : null

  const handleCheckout = async (planId: string) => {
    setCheckingOut(planId)
    try {
      const data = await api.post("/billing/checkout", { plan: planId })
      if (data?.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        toast.error("Could not start checkout. Please try again.")
      }
    } catch (err: any) {
      toast.error(err.message || "Checkout failed. Please try again.")
    } finally {
      setCheckingOut(null)
    }
  }

  if (isTenant && !membership) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 hero-gradient opacity-5 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div {...fadeInUp}>
            <Badge variant="secondary" className="mb-4 px-3 py-1">Simple, transparent pricing</Badge>
            <h1 style={{ fontFamily: "var(--font-heading)" }} className="text-5xl font-extrabold tracking-tight text-foreground mb-4">
              Pay only for what you need
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free with no credit card required. Scale as your expert marketplace grows.
            </p>
          </motion.div>

          {/* Billing toggle */}
          <motion.div {...fadeInUp} className="flex items-center justify-center gap-4 mt-10">
            <span className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(a => !a)}
              className={`relative h-6 w-12 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                isAnnual ? "bg-brand-500" : "bg-border"
              }`}
            >
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                isAnnual ? "translate-x-7" : "translate-x-1"
              }`} />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Annual
            </span>
            <Badge className="bg-success/10 text-success border-success/20">Save 20%</Badge>
          </motion.div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          {...staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
        >
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isAnnual={isAnnual}
              isTenant={isTenant}
              onCheckout={handleCheckout}
              checkingOut={checkingOut}
              currentPlanId={currentPlanId}
            />
          ))}
        </motion.div>

        {/* Compare all features toggle */}
        <div className="mt-12 text-center">
          <button
            onClick={() => setShowTable(s => !s)}
            className="inline-flex items-center gap-2 text-brand-600 font-medium hover:text-brand-700 transition-colors"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showTable ? "rotate-180" : ""}`} />
            {showTable ? "Hide" : "Compare"} all features
          </button>
        </div>

        {/* Feature comparison table */}
        <AnimatePresence>
          {showTable && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-8"
            >
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left py-4 px-5 font-medium text-foreground w-1/2">Feature</th>
                      {plans.map(p => (
                        <th key={p.id} className={`py-4 px-4 text-center font-semibold ${p.highlight ? "text-brand-600" : "text-foreground"}`}>
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {featureCategories.map((cat) => (
                      <>
                        <tr key={cat.category} className="bg-muted/20">
                          <td colSpan={plans.length + 1} className="py-2.5 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {cat.category}
                          </td>
                        </tr>
                        {cat.rows.map((row) => (
                          <tr key={row.label} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="py-3 px-5 text-foreground">{row.label}</td>
                            {plans.map(p => {
                              const val = (row as any)[p.id]
                              return (
                                <td key={p.id} className="py-3 px-4 text-center text-muted-foreground">
                                  {val === "✓" ? <Check className="h-4 w-4 text-success mx-auto" /> : val === "—" ? <X className="h-4 w-4 text-muted-foreground/30 mx-auto" /> : val}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Social proof strip */}
      <section className="border-y border-border bg-muted/30 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "12,000+", label: "Active experts" },
              { value: "$2.4M+", label: "Paid to experts" },
              { value: "98%", label: "Satisfaction rate" },
              { value: "4.9★", label: "App store rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontFamily: "var(--font-heading)" }} className="text-3xl font-extrabold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise callout */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          {...fadeInUp}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 to-slate-900 p-8 md:p-12 text-white"
        >
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "radial-gradient(circle at 20px 20px, white 1px, transparent 0)",
            backgroundSize: "40px 40px"
          }} />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-brand-300" />
                <span className="text-brand-300 text-sm font-semibold uppercase tracking-wide">Enterprise</span>
              </div>
              <h2 style={{ fontFamily: "var(--font-heading)" }} className="text-3xl font-bold mb-2">
                Need a custom solution?
              </h2>
              <p className="text-brand-200 text-lg max-w-lg">
                Multi-tenant deployments, custom integrations, dedicated infrastructure, and white-glove onboarding.
              </p>
              <ul className="mt-4 space-y-2">
                {["Custom commission rates", "Dedicated infrastructure", "SLA guarantees", "24/7 dedicated support"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-brand-100">
                    <Check className="h-4 w-4 text-brand-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50 rounded-xl px-8 font-semibold">
                Contact sales
              </Button>
              <Button variant="ghost" size="lg" className="text-white hover:bg-white/10 rounded-xl">
                View documentation
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-12">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 mb-4">
            <HelpCircle className="h-5 w-5 text-brand-600" />
          </div>
          <h2 style={{ fontFamily: "var(--font-heading)" }} className="text-3xl font-bold text-foreground">
            Frequently asked questions
          </h2>
        </div>
        <div>
          {faqs.map((faq) => (
            <FaqItem key={faq.question} faq={faq} />
          ))}
        </div>
      </section>
    </div>
  )
}
