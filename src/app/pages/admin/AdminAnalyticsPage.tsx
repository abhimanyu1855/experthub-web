import { useState, useEffect } from "react"
import { useLocation } from "react-router"
import { motion } from "motion/react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts"
import {
  TrendingUp, TrendingDown, DollarSign, Users, CalendarCheck,
  Star, Download, ArrowUpRight, ArrowDownRight, Filter, Search, RefreshCw
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import { FeatureGate } from "@/app/components/ui/FeatureGate"
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/motion"
import { toast } from "sonner"
import { api } from "@/app/lib/api"


function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-10 w-10 rounded-xl bg-muted" />
        <div className="h-4 w-12 rounded bg-muted" />
      </div>
      <div className="h-8 w-24 rounded bg-muted mb-2" />
      <div className="h-3 w-32 rounded bg-muted" />
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <div className="space-y-2">
          <div className="h-4 w-36 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
      </div>
      <div className="h-52 rounded-xl bg-muted" />
    </div>
  )
}

const statusColors: Record<string, string> = {
  completed: "bg-success/10 text-success border-success/20",
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  refunded: "bg-error/10 text-error border-error/20",
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-surface-elevated shadow-raised px-3 py-2.5">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.dataKey === "revenue" ? `$${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  )
}

export function AdminAnalyticsPage() {
  const location = useLocation()
  const currentPath = location.pathname

  const [range, setRange] = useState<"30d" | "90d" | "6m">("6m")
  const [metricsState, setMetricsState] = useState<any[]>([])
  const [categoriesState, setCategoriesState] = useState<any[]>([])
  const [transactionsState, setTransactionsState] = useState<any[]>([])
  const [expertsState, setExpertsState] = useState<any[]>([])
  const [revenueChartData, setRevenueChartData] = useState<any[]>([])
  const [allBookings, setAllBookings] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get("/analytics/dashboard"),
      api.get("/bookings"),
    ]).then(([dashboard, bookings]: any) => {
      if (Array.isArray(bookings)) {
        setAllBookings(bookings)
      }

      // Stats cards
      const totalSalesVal = dashboard.total_sales_cents ? `$${(dashboard.total_sales_cents / 100).toLocaleString()}` : "$0"
      const commissionVal = dashboard.total_commission_cents ? `$${(dashboard.total_commission_cents / 100).toLocaleString()}` : "$0"
      setMetricsState([
        {
          label: "Total Sales",
          value: totalSalesVal,
          delta: "+10.2%",
          deltaPositive: true,
          sub: "Bookings + packages",
          icon: DollarSign,
          iconBg: "bg-brand-50",
          iconColor: "text-brand-600",
        },
        {
          label: "Total Bookings",
          value: (dashboard.total_bookings_count ?? 0).toString(),
          delta: "+8.4%",
          deltaPositive: true,
          sub: "All time",
          icon: CalendarCheck,
          iconBg: "bg-success/10",
          iconColor: "text-success",
        },
        {
          label: "Active Experts",
          value: (dashboard.active_experts_count ?? 0).toString(),
          delta: "+5.1%",
          deltaPositive: true,
          sub: `${dashboard.active_clients_count ?? 0} clients`,
          icon: Users,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-500",
        },
        {
          label: "Net Commissions",
          value: commissionVal,
          delta: "+12.1%",
          deltaPositive: true,
          sub: "Platform revenue",
          icon: Star,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-500",
        }
      ])

      // Revenue chart from real API data
      if (Array.isArray(dashboard.revenue_by_month)) {
        setRevenueChartData(dashboard.revenue_by_month.map((m: any) => ({
          month: m.month,
          revenue: Math.round(m.revenue_cents / 100),
          bookings: m.bookings_count,
        })))
      }

      // Top experts from real API
      if (Array.isArray(dashboard.top_experts) && dashboard.top_experts.length > 0) {
        setExpertsState(dashboard.top_experts.map((e: any) => ({
          name: e.name,
          specialization: e.specialization || "Expert Consultant",
          bookings: e.bookings,
          revenue: Math.round(e.revenue_cents / 100),
          rating: e.rating || 0,
          trend: "up",
        })))
      }

      // Recent transactions from API (recent_bookings or fallback to bookings list)
      const recentSource = Array.isArray(dashboard.recent_bookings) && dashboard.recent_bookings.length > 0
        ? dashboard.recent_bookings.map((b: any) => ({
            id: `TXN-${b.id}`,
            client: b.client || "Client",
            expert: b.expert || "Expert",
            amount: (b.price_cents || 0) / 100,
            status: ["confirmed", "paid", "confirmed_free"].includes(b.aasm_state) ? "completed" : b.aasm_state === "pending" ? "pending" : "refunded",
            date: new Date(b.created_at).toLocaleDateString(),
          }))
        : Array.isArray(bookings)
          ? bookings.slice(0, 8).map((b: any) => ({
              id: `TXN-${b.id}`,
              client: b.client ? `${b.client.given_name || ""} ${b.client.family_name?.[0] || ""}.`.trim() : "Client",
              expert: b.expert ? `${b.expert.given_name || ""} ${b.expert.family_name?.[0] || ""}.`.trim() : "Expert",
              amount: (b.price_cents || 0) / 100,
              status: ["confirmed", "paid", "confirmed_free"].includes(b.aasm_state) ? "completed" : b.aasm_state === "pending" ? "pending" : "refunded",
              date: new Date(b.created_at).toLocaleDateString(),
            }))
          : []
      setTransactionsState(recentSource)

      // Category donut
      if (dashboard.top_categories && Object.keys(dashboard.top_categories).length > 0) {
        const colors = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#94a3b8"]
        const sum = Object.values(dashboard.top_categories).reduce((a: number, b: number) => a + b, 0) as number || 1
        const mappedCats = Object.entries(dashboard.top_categories).map(([name, count], i) => ({
          name,
          value: Math.round(((count as number) / sum) * 100),
          color: colors[i % colors.length],
        }))
        if (mappedCats.length > 0) setCategoriesState(mappedCats)
      }
    }).catch(err => {
      console.error("Failed to load admin analytics dashboard:", err)
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  const displayData = range === "30d" ? revenueChartData.slice(-2)
    : range === "90d" ? revenueChartData.slice(-3)
    : revenueChartData

  const mappedTransactions = allBookings.map((b: any) => {
    return {
      id: `TXN-${b.id}`,
      client: b.client ? `${b.client.given_name || ""} ${b.client.family_name || ""}`.trim() : "Client",
      expert: b.expert ? `${b.expert.given_name || ""} ${b.expert.family_name || ""}`.trim() : "Expert",
      amount: b.price_cents / 100,
      status: b.aasm_state === "confirmed" || b.aasm_state === "paid" ? "completed" : b.aasm_state === "pending" ? "pending" : "refunded",
      date: new Date(b.created_at).toLocaleDateString()
    }
  })

  const filteredTransactions = mappedTransactions.filter((t: any) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = t.client.toLowerCase().includes(query) ||
                          t.expert.toLowerCase().includes(query) ||
                          t.id.toLowerCase().includes(query)
    const matchesStatus = statusFilter === "all" || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const mappedPayouts = allBookings
    .filter((b: any) => ["paid", "confirmed", "confirmed_free"].includes(b.aasm_state))
    .map((b: any) => {
      const expertName = b.expert ? `${b.expert.given_name || ""} ${b.expert.family_name || ""}`.trim() : "Expert"
      const initials = b.expert ? `${b.expert.given_name?.[0] || ""}${b.expert.family_name?.[0] || ""}`.toUpperCase() : "EX"
      return {
        id: `PO-${b.id}`,
        expert: expertName,
        initials,
        amount: (b.expert_payout_cents || b.price_cents) / 100,
        platformFee: (b.commission_cents || 0) / 100,
        period: new Date(b.created_at).toLocaleDateString([], { month: "short", day: "numeric" }),
        method: "Stripe Connect",
        status: "completed" as const,
        date: new Date(b.created_at).toLocaleDateString()
      }
    })

  const filteredPayouts = mappedPayouts.filter((p: any) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = p.expert.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)
    return matchesSearch
  })

  // Rendering for Transactions path
  if (currentPath === "/admin/analytics/transactions") {
    return (
      <div className="p-6 max-w-7xl space-y-6">
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)" }} className="text-2xl font-bold text-foreground">
            Transactions Log
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Audit log of all platform bookings and expert payments</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card border border-border rounded-2xl p-4 shadow-card">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search TXN ID, client or expert..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {["all", "completed", "pending", "refunded"].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all ${
                  statusFilter === status
                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted-foreground">ID</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted-foreground">Client</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted-foreground">Expert</th>
                  <th className="text-right py-3.5 px-5 text-xs font-semibold text-muted-foreground">Amount</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                      No matching transactions found.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-5 text-muted-foreground font-mono text-xs">{t.id}</td>
                      <td className="py-3 px-5 text-foreground font-medium">{t.client}</td>
                      <td className="py-3 px-5 text-muted-foreground">{t.expert}</td>
                      <td className="py-3 px-5 text-foreground font-semibold text-right">${t.amount.toFixed(2)}</td>
                      <td className="py-3 px-5">
                        <Badge variant="outline" className={`text-xs ${statusColors[t.status] || "bg-muted text-muted-foreground"}`}>
                          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 text-muted-foreground text-xs">{t.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Rendering for Payouts path
  if (currentPath === "/admin/analytics/payouts") {
    return (
      <div className="p-6 max-w-7xl space-y-6">
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)" }} className="text-2xl font-bold text-foreground">
            Payouts Ledger
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track expert earnings distribution and platform commission splits</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card border border-border rounded-2xl p-4 shadow-card">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search expert name or PO ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" /> Export Payouts
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted-foreground">Payout ID</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted-foreground">Expert</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted-foreground">Period</th>
                  <th className="text-right py-3.5 px-5 text-xs font-semibold text-muted-foreground">Expert Amount</th>
                  <th className="text-right py-3.5 px-5 text-xs font-semibold text-muted-foreground">Platform Fee</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted-foreground">Method</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-muted-foreground">Date</th>
                  <th className="text-center py-3.5 px-5 text-xs font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground text-sm">
                      No matching payout logs found.
                    </td>
                  </tr>
                ) : (
                  filteredPayouts.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-5 text-muted-foreground font-mono text-xs">{p.id}</td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {p.initials}
                          </div>
                          <p className="text-sm font-medium text-foreground">{p.expert}</p>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-muted-foreground text-xs">{p.period}</td>
                      <td className="py-3 px-5 text-success font-semibold text-right">${p.amount.toFixed(2)}</td>
                      <td className="py-3 px-5 text-muted-foreground text-right">${p.platformFee.toFixed(2)}</td>
                      <td className="py-3 px-5 text-muted-foreground text-xs">{p.method}</td>
                      <td className="py-3 px-5 text-muted-foreground text-xs">{p.date}</td>
                      <td className="py-3 px-5 text-center">
                        <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                          Completed
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard path default view
  return (
    <FeatureGate feature="advanced_analytics">
    <div className="p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)" }} className="text-2xl font-bold text-foreground">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Platform performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5 bg-muted/40">
            {(["30d", "90d", "6m"] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  range === r ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <motion.div
          {...staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {metricsState.map((m) => {
            const Icon = m.icon
            return (
              <motion.div key={m.label} {...staggerItem} className="rounded-2xl border border-border bg-surface p-5 shadow-card">
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${m.iconBg}`}>
                    <Icon className={`h-5 w-5 ${m.iconColor}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${m.deltaPositive ? "text-success" : "text-error"}`}>
                    {m.deltaPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {m.delta}
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-heading)" }} className="text-3xl font-extrabold text-foreground">{m.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{m.label} · {m.sub}</div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue area chart */}
        {loading ? (
          <div className="xl:col-span-2"><SkeletonChart /></div>
        ) : null}
        <motion.div {...fadeInUp} className={`xl:col-span-2 rounded-2xl border border-border bg-surface p-5 shadow-card ${loading ? "hidden" : ""}`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)" }} className="font-semibold text-foreground">Revenue & Bookings</h3>
              <p className="text-xs text-muted-foreground">Monthly trend</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" /> Revenue</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Bookings</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={displayData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#gradRevenue)" />
              <Area type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} fill="url(#gradBookings)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category donut */}
        {loading ? <SkeletonChart /> : null}
        <motion.div {...fadeInUp} className={`rounded-2xl border border-border bg-surface p-5 shadow-card ${loading ? "hidden" : ""}`}>
          <div className="mb-5">
            <h3 style={{ fontFamily: "var(--font-heading)" }} className="font-semibold text-foreground">Bookings by Category</h3>
            <p className="text-xs text-muted-foreground">This month</p>
          </div>
          {categoriesState.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-center px-4">
              <p className="text-xs text-muted-foreground">No category data yet. Bookings by category will appear here once experts receive confirmed bookings.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoriesState}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoriesState.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [`${val}%`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {categoriesState.map(c => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="text-muted-foreground">{c.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{c.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Bookings bar chart */}
      {loading ? (
        <SkeletonChart />
      ) : (
        <motion.div {...fadeInUp} className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)" }} className="font-semibold text-foreground">Bookings per Month</h3>
              <p className="text-xs text-muted-foreground">Confirmed & paid bookings</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-success">
              <TrendingUp className="h-3.5 w-3.5" /> last 6 months
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={displayData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="bookings" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Bottom tables */}
      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card animate-pulse space-y-3">
          {[0,1,2,3,4].map(i => <div key={i} className="h-10 rounded-lg bg-muted" />)}
        </div>
      ) : null}
      <Tabs defaultValue="transactions" className={loading ? "hidden" : ""}>
        <TabsList className="mb-4">
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="experts">Top Experts</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <div className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground text-sm">Transactions</h3>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <Filter className="h-3.5 w-3.5" /> Filter
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground">ID</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground">Client</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground">Expert</th>
                    <th className="text-right py-3 px-5 text-xs font-semibold text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsState.map((t) => (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-5 text-muted-foreground font-mono text-xs">{t.id}</td>
                      <td className="py-3 px-5 text-foreground font-medium">{t.client}</td>
                      <td className="py-3 px-5 text-muted-foreground">{t.expert}</td>
                      <td className="py-3 px-5 text-foreground font-semibold text-right">${t.amount}</td>
                      <td className="py-3 px-5">
                        <Badge variant="outline" className={`text-xs ${statusColors[t.status]}`}>
                          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 text-muted-foreground text-xs">{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="experts">
          <div className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground">#</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground">Expert</th>
                    <th className="text-right py-3 px-5 text-xs font-semibold text-muted-foreground">Bookings</th>
                    <th className="text-right py-3 px-5 text-xs font-semibold text-muted-foreground">Revenue</th>
                    <th className="text-right py-3 px-5 text-xs font-semibold text-muted-foreground">Rating</th>
                    <th className="text-center py-3 px-5 text-xs font-semibold text-muted-foreground">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {expertsState.map((e, i) => (
                    <tr key={e.name} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-5 text-muted-foreground">{i + 1}</td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                            {e.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{e.name}</div>
                            <div className="text-xs text-muted-foreground">{e.specialization}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-foreground font-medium text-right">{e.bookings}</td>
                      <td className="py-3 px-5 text-foreground font-semibold text-right">${e.revenue.toLocaleString()}</td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-medium text-foreground">{e.rating}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-center">
                        {e.trend === "up"
                          ? <TrendingUp className="h-4 w-4 text-success mx-auto" />
                          : <TrendingDown className="h-4 w-4 text-error mx-auto" />
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </FeatureGate>
  )
}
