import { useState, useEffect } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router"
import { motion } from "motion/react"
import {
  LayoutDashboard, Settings, CreditCard, Globe, Palette, Users,
  BookOpen, Calendar, BarChart2, ChevronDown, ChevronRight,
  CheckCircle2, Circle, ExternalLink, ArrowRight, Zap, Store,
  ChevronLeft, Menu, X, Building, Sparkles, AlertTriangle, LogOut
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Progress } from "@/app/components/ui/progress"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu"
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/motion"
import { toast } from "sonner"
import { api } from "@/app/lib/api"

// ─── Admin Sidebar ─────────────────────────────────────────────────────────────

const sidebarGroups = [
  {
    id: "start",
    icon: Zap,
    label: "Getting Started",
    href: "/admin/getting-started",
    badge: "3 remaining",
  },
  {
    id: "analytics",
    icon: BarChart2,
    label: "Analytics",
    children: [
      { label: "Dashboard", href: "/admin/analytics" },
      { label: "Transactions", href: "/admin/analytics/transactions" },
      { label: "Payouts", href: "/admin/analytics/payouts" },
    ],
  },
  {
    id: "configure",
    icon: Settings,
    label: "Configure",
    children: [
      { label: "Marketplace Settings", href: "/admin/settings" },
      { label: "Categories", href: "/admin/categories" },
      { label: "Custom Fields", href: "/admin/custom-fields" },
      { label: "Promo Codes", href: "/admin/promo-codes" },
    ],
  },
  {
    id: "payments",
    icon: CreditCard,
    label: "Payments",
    children: [
      { label: "Stripe Connect", href: "/admin/payments/stripe" },
      { label: "Razorpay", href: "/admin/payments/razorpay" },
      { label: "Payout Settings", href: "/admin/payments/payouts" },
    ],
  },
  {
    id: "design",
    icon: Palette,
    label: "Design & Brand",
    children: [
      { label: "Logo & Colors", href: "/admin/branding" },
      { label: "Landing Page", href: "/admin/landing-page" },
      { label: "Custom Domain", href: "/admin/domains" },
    ],
  },
  {
    id: "users",
    icon: Users,
    label: "Users & Experts",
    children: [
      { label: "All Users", href: "/admin/users" },
      { label: "Expert Applications", href: "/admin/experts" },
    ],
  },
  {
    id: "catalog",
    icon: Store,
    label: "Catalog",
    children: [
      { label: "Listings / Services", href: "/admin/services" },
      { label: "Courses", href: "/admin/courses" },
      { label: "Group Sessions", href: "/admin/sessions" },
    ],
  },
  {
    id: "bookings",
    icon: Calendar,
    label: "Bookings & Chat",
    children: [
      { label: "All Bookings", href: "/admin/bookings" },
      { label: "Inbox", href: "/inbox" },
    ],
  },
]

function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<string[]>(["start"])

  const rawUser = localStorage.getItem("user")
  const user = rawUser ? JSON.parse(rawUser) : null
  const displayName = [user?.given_name, user?.family_name].filter(Boolean).join(" ")
    || user?.display_name
    || user?.email
    || "Account"
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "A"
  const role = JSON.parse(localStorage.getItem("membership") || "{}")?.role || "operator"

  function toggleGroup(id: string) {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className={`flex flex-col bg-card border-r border-border transition-all duration-300 ${collapsed ? "w-16" : "w-60"} shrink-0`}>
      {/* Logo */}
      <div className={`flex items-center h-14 px-4 border-b border-border ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">EH</div>
            <span className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "0.9375rem" }}>ExpertHub</span>
          </div>
        )}
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {sidebarGroups.map(group => {
          const Icon = group.icon
          const isExpanded = expanded.includes(group.id)
          const isActive = location.pathname === group.href || group.children?.some(c => location.pathname === c.href)

          if (!group.children) {
            return (
              <Link key={group.id} to={group.href!} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-colors ${isActive ? "bg-brand-50 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium">{group.label}</span>
                    {group.badge && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">{group.badge}</Badge>}
                  </>
                )}
              </Link>
            )
          }

          return (
            <div key={group.id} className="mb-0.5">
              <button
                onClick={() => !collapsed && toggleGroup(group.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"} ${collapsed ? "justify-center" : ""}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium text-left">{group.label}</span>
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </>
                )}
              </button>
              {!collapsed && isExpanded && (
                <div className="ml-4 pl-3 border-l border-border mt-0.5 space-y-0.5 mb-1">
                  {group.children.map(child => (
                    <Link
                      key={child.label}
                      to={child.href}
                      className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${location.pathname === child.href ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom user */}
      <div className="p-3 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`flex items-center gap-2 px-2 py-2 w-full rounded-xl hover:bg-muted transition-colors focus-visible:outline-none ${collapsed ? "justify-center" : ""}`}>
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-xs font-semibold text-foreground truncate">{displayName}</div>
                    <div className="text-xs text-muted-foreground capitalize">{role}</div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48 rounded-xl mb-1">
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-4 w-4" />
              Profile &amp; Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
              onClick={async () => {
                await api.logout()
                window.location.href = "/login/expert"
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ─── Admin Topbar ──────────────────────────────────────────────────────────────

const pathnameLabels: Record<string, string> = {
  "/admin/getting-started": "Getting Started",
  "/admin/analytics": "Analytics",
  "/admin/analytics/transactions": "Transactions",
  "/admin/analytics/payouts": "Payouts",
  "/admin/settings": "Marketplace Settings",
  "/admin/categories": "Categories",
  "/admin/custom-fields": "Custom Fields",
  "/admin/promo-codes": "Promo Codes",
  "/admin/payments/stripe": "Stripe Connect",
  "/admin/payments/razorpay": "Razorpay",
  "/admin/payments/payouts": "Payout Settings",
  "/admin/branding": "Logo & Colors",
  "/admin/landing-page": "Landing Page",
  "/admin/domains": "Custom Domain",
  "/admin/users": "All Users",
  "/admin/experts": "Expert Applications",
  "/admin/services": "Listings / Services",
  "/admin/courses": "Courses",
  "/admin/sessions": "Group Sessions",
  "/admin/bookings": "All Bookings",
}

function AdminTopbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const pageLabel = pathnameLabels[location.pathname] ?? "Admin"

  const rawUser = localStorage.getItem("user")
  const user = rawUser ? JSON.parse(rawUser) : null
  const displayName = [user?.given_name, user?.family_name].filter(Boolean).join(" ")
    || user?.display_name
    || user?.email
    || "Account"
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "A"

  return (
    <div className="h-14 flex items-center justify-between px-6 border-b border-border bg-background shrink-0">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground">Admin</span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium text-foreground">{pageLabel}</span>
      </div>

      {/* Right: back link + user avatar */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-48 rounded-xl mt-1">
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-4 w-4" />
              Profile &amp; Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
              onClick={async () => {
                await api.logout()
                window.location.href = "/login/expert"
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ─── Pricing Banner ────────────────────────────────────────────────────────────

function PricingBanner() {
  const [tenant, setTenant] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    api.get("/tenant")
      .then((data: any) => setTenant(data))
      .catch(() => {})
  }, [])

  if (dismissed || !tenant) return null

  const isPaid = tenant.plan && !["free", "trial"].includes(tenant.plan)
  if (isPaid) return null

  const trialEndsAt = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null
  const now = new Date()
  const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86400000) : null
  const trialExpired = trialEndsAt && trialEndsAt < now

  const shouldShow = trialExpired || (daysLeft !== null && daysLeft <= 3) || tenant.plan === "free"
  if (!shouldShow) return null

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const res = await api.post("/billing/checkout", { plan: "pro" })
      window.location.href = res.checkout_url
    } catch (err: any) {
      toast.error("Upgrade failed: " + err.message)
      setUpgrading(false)
    }
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 text-sm ${trialExpired ? "bg-destructive/10 border-b border-destructive/20 text-destructive" : "bg-amber-50 border-b border-amber-200 text-amber-800"}`}>
      {trialExpired
        ? <AlertTriangle className="h-4 w-4 shrink-0" />
        : <Sparkles className="h-4 w-4 shrink-0 text-amber-600" />
      }
      <span className="flex-1">
        {trialExpired
          ? "Your trial has expired. Upgrade to keep accepting bookings and managing your marketplace."
          : daysLeft !== null && daysLeft <= 3
          ? `Your trial expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Upgrade now to avoid any interruption.`
          : "You're on the free plan. Upgrade to unlock all features."
        }
      </span>
      <Button
        size="sm"
        variant={trialExpired ? "destructive" : "default"}
        className="rounded-full shrink-0 gap-1.5"
        onClick={handleUpgrade}
        disabled={upgrading}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {upgrading ? "Redirecting…" : "Upgrade Plan"}
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity ml-1"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ─── Admin Shell ───────────────────────────────────────────────────────────────

export function AdminShell() {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminTopbar />
        <PricingBanner />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// ─── Onboarding Steps ─────────────────────────────────────────────────────────

const steps = [
  {
    id: "name",
    icon: Building,
    title: "Name your marketplace",
    description: "Set your platform name, slogan, and description so experts and clients know what you're about.",
    href: "/admin/settings",
    completed: true,
  },
  {
    id: "brand",
    icon: Palette,
    title: "Set up your brand",
    description: "Upload your logo, choose your brand colors and fonts to match your company identity.",
    href: "/admin/branding",
    completed: true,
  },
  {
    id: "payments",
    icon: CreditCard,
    title: "Connect payments",
    description: "Link your Stripe account to start accepting bookings and processing payouts to experts.",
    href: "/admin/payments/stripe",
    completed: true,
  },
  {
    id: "domain",
    icon: Globe,
    title: "Set up your domain",
    description: "Connect your custom domain so your marketplace runs on your own brand URL.",
    href: "/admin/domains",
    completed: false,
    active: true,
  },
  {
    id: "landing",
    icon: LayoutDashboard,
    title: "Customize landing page",
    description: "Build your homepage with the drag-and-drop composer. Add sections, hero images, and CTAs.",
    href: "/admin/landing-page",
    completed: false,
  },
  {
    id: "experts",
    icon: Users,
    title: "Invite your first experts",
    description: "Send invitation emails to experts you want on your platform and approve their profiles.",
    href: "/admin/experts",
    completed: false,
  },
]

export function AdminOnboardingPage() {
  const [stepsState, setStepsState] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/admin/onboarding_status")
      .then((res: any) => {
        const mapped = steps.map(staticStep => {
          const apiStep = res.steps.find((s: any) => s.id === staticStep.id)
          return {
            ...staticStep,
            completed: apiStep ? apiStep.completed : staticStep.completed,
            active: apiStep ? apiStep.active : staticStep.active
          }
        })
        setStepsState(mapped)
      })
      .catch((err: any) => {
        console.error("Failed to load onboarding steps status:", err)
      })
      .finally(() => setLoading(false))
  }, [])

  const completed = stepsState.filter(s => s.completed).length
  const total = steps.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const handleToggleStep = async (stepId: string, currentCompleted: boolean) => {
    try {
      const updatedVal = !currentCompleted
      const res = await api.patch(`/admin/onboarding_status/${stepId}`, {
        completed: updatedVal,
        active: !updatedVal
      })
      
      setStepsState(prev => prev.map(s => {
        if (s.id === stepId) {
          return { ...s, completed: res.step.completed, active: res.step.active }
        }
        if (updatedVal) {
          const currentIdx = steps.findIndex(x => x.id === stepId)
          if (currentIdx !== -1 && currentIdx < steps.length - 1) {
            const nextStepId = steps[currentIdx + 1].id
            if (s.id === nextStepId) {
              return { ...s, active: true }
            }
          }
        }
        return s
      }))
      toast.success("Checklist updated!")
    } catch (err: any) {
      toast.error("Failed to update checklist item: " + err.message)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
          <Link to="/" className="hover:text-foreground transition-colors">ExpertHub</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Admin</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Getting Started</span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700 }}>
              Set up your marketplace
            </h1>
            <p className="text-muted-foreground mt-1 max-w-lg">
              Complete these steps to launch your expert marketplace. You can skip any step and come back later.
            </p>
          </div>
          <Link to="/">
            <Button variant="outline" className="rounded-xl gap-2">
              <ExternalLink className="h-4 w-4" /> Preview site
            </Button>
          </Link>
        </div>

        {/* Progress */}
        <div className="mt-6 bg-card rounded-2xl border border-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              {completed} of {total} steps complete
            </span>
            <span className="font-bold text-primary" style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem" }}>{pct}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-500 to-violet-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />
          </div>
          <div className="flex gap-1 mt-3">
            {stepsState.map(s => (
              <div key={s.id} className={`flex-1 h-1 rounded-full ${s.completed ? "bg-success" : s.active ? "bg-primary animate-pulse" : "bg-muted"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Steps grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading onboarding status...</div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {stepsState.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.id}
                variants={staggerItem}
                className={`relative bg-card rounded-2xl border shadow-card overflow-hidden transition-all ${
                  step.completed
                    ? "border-success/30 bg-success/5"
                    : step.active
                    ? "border-primary/50 ring-2 ring-primary/20"
                    : "border-border"
                } ${!step.completed ? "card-hover" : ""}`}
              >
                {step.active && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-brand-50 text-brand-600 border-brand-200 text-xs">In Progress</Badge>
                  </div>
                )}

                <div className="p-5">
                  {/* Step number + icon */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      step.completed ? "bg-success/10" : step.active ? "bg-brand-50" : "bg-muted"
                    }`}>
                      {step.completed
                        ? <CheckCircle2 className="h-5 w-5 text-success" />
                        : <Icon className={`h-5 w-5 ${step.active ? "text-primary" : "text-muted-foreground"}`} />
                      }
                    </div>
                    <div className={`text-xs font-semibold uppercase tracking-wide ${
                      step.completed ? "text-success" : step.active ? "text-primary" : "text-muted-foreground"
                    }`}>
                      Step {i + 1}
                    </div>
                  </div>

                  <h3 className="font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-heading)", fontSize: "1rem" }}>
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">{step.description}</p>

                  <div className="flex items-center justify-between">
                    {step.completed ? (
                      <button onClick={() => handleToggleStep(step.id, true)} className="text-success text-sm font-medium flex items-center gap-1.5 hover:opacity-85">
                        <CheckCircle2 className="h-4 w-4" /> Completed
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Link to={step.href}>
                          <Button
                            size="sm"
                            variant={step.active ? "default" : "outline"}
                            className="rounded-full gap-2"
                          >
                            {step.active ? "Continue" : "Start"} <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStep(step.id, false)}
                          className="text-xs text-muted-foreground"
                        >
                          Mark done
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {step.completed && (
                  <div className="h-1 bg-gradient-to-r from-success/60 to-success rounded-b-none" />
                )}
                {step.active && (
                  <div className="h-1 bg-gradient-to-r from-brand-400 to-brand-600" />
                )}
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Help section */}
      <div className="mt-8 bg-gradient-to-r from-brand-50 to-violet-50 border border-brand-100 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "1rem" }}>Need help getting started?</h3>
          <p className="text-muted-foreground text-sm mt-1">Our onboarding team is ready to walk you through setup on a 30-minute call.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl border-brand-200">Read docs</Button>
          <Button className="rounded-xl gap-2">
            <Calendar className="h-4 w-4" /> Book onboarding call
          </Button>
        </div>
      </div>
    </div>
  )
}
