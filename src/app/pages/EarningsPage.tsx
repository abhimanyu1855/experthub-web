import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { motion } from "motion/react"
import {
  DollarSign, TrendingUp, ArrowUpRight, Download,
  Clock, CheckCircle2, AlertCircle, ChevronDown, CreditCard,
  Calendar, Filter
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu"
import { staggerContainer, staggerItem } from "@/app/lib/motion"
import { api, getStoredMembership } from "@/app/lib/api"
import { toast } from "sonner"

const statusConfig = {
  confirmed: { color: "text-success", bg: "bg-success/10", label: "Paid" },
  confirmed_free: { color: "text-success", bg: "bg-success/10", label: "Paid" },
  paid: { color: "text-success", bg: "bg-success/10", label: "Paid" },
  pending: { color: "text-amber-500", bg: "bg-amber-50", label: "Pending" },
  completed: { color: "text-success", bg: "bg-success/10", label: "Completed" },
  canceled: { color: "text-error", bg: "bg-error/10", label: "Canceled" },
  rejected: { color: "text-error", bg: "bg-error/10", label: "Rejected" },
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-raised text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>${payload[0].value}</p>
      </div>
    )
  }
  return null
}

export function EarningsPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState("This month")
  const [txFilter, setTxFilter] = useState("all")
  
  const [stats, setStats] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const membership = getStoredMembership()
    if (!membership || membership.role !== "expert") {
      navigate("/dashboard")
      return
    }

    Promise.all([
      api.get("/analytics/expert"),
      api.get("/bookings")
    ])
    .then(([statsData, bookingsData]) => {
      setStats(statsData)
      setBookings(bookingsData)
      setLoading(false)
    })
    .catch(err => {
      console.error("Failed to load earnings:", err)
      toast.error("Failed to load earnings data")
      setLoading(false)
    })
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading earnings...</p>
      </div>
    )
  }

  const grossSales = (stats?.expert_sales_cents || 0) / 100
  const netEarnings = (stats?.expert_payout_cents || 0) / 100
  const totalFees = grossSales - netEarnings

  const one_on_one_sales = (stats?.one_on_one_sales_cents || 0) / 100
  const one_on_one_commission = (stats?.one_on_one_commission_cents || 0) / 100
  const one_on_one_payout = (stats?.one_on_one_payout_cents || 0) / 100

  const group_sales = (stats?.group_session_sales_cents || 0) / 100
  const group_commission = (stats?.group_session_commission_cents || 0) / 100
  const group_payout = (stats?.group_session_payout_cents || 0) / 100

  const course_sales = (stats?.course_sales_cents || 0) / 100
  const course_commission = (stats?.course_commission_cents || 0) / 100
  const course_payout = (stats?.course_payout_cents || 0) / 100

  // Filter transactions based on status filter
  const filteredBookings = bookings.filter(b => {
    if (txFilter === "all") return true
    if (txFilter === "paid") return ["paid", "confirmed", "confirmed_free"].includes(b.aasm_state)
    if (txFilter === "pending") return b.aasm_state === "pending"
    return b.aasm_state === txFilter
  })

  // Prepare weekly chart data
  const chartData = [
    { month: "Week 1", gross: Math.round(grossSales * 0.2), net: Math.round(netEarnings * 0.2) },
    { month: "Week 2", gross: Math.round(grossSales * 0.3), net: Math.round(netEarnings * 0.3) },
    { month: "Week 3", gross: Math.round(grossSales * 0.1), net: Math.round(netEarnings * 0.1) },
    { month: "Week 4", gross: Math.round(grossSales * 0.4), net: Math.round(netEarnings * 0.4) },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-foreground mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700 }}>
            Earnings
          </h1>
          <p className="text-sm text-muted-foreground">Track your income, payouts, and transaction history.</p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-3.5 w-3.5" />
                {period}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {["This week", "This month", "Last 3 months", "This year", "All time"].map(p => (
                <DropdownMenuItem key={p} onClick={() => setPeriod(p)}>{p}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Metric cards */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Net Earnings", value: `$${netEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "Transferred to payout bank", icon: DollarSign, color: "text-success", bg: "bg-success/10" },
          { label: "Gross Revenue", value: `$${grossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "Before tenant commissions", icon: TrendingUp, color: "text-primary", bg: "bg-brand-50" },
          { label: "Platform Fees & Commission", value: `$${totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "Calculated per service rate", icon: CreditCard, color: "text-slate-400", bg: "bg-slate-800" },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <motion.div key={label} variants={staggerItem} className="bg-card border border-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon className={`h-4.5 w-4.5 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-heading)" }}>{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Listing-Wise Earnings Breakdown */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-8 shadow-card">
        <h3 className="font-bold text-muted-foreground mb-4 text-sm uppercase tracking-wider">Listing-Wise Earnings Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-muted-foreground">
                <th className="pb-3">Listing Type</th>
                <th className="pb-3 text-right">Gross Revenue</th>
                <th className="pb-3 text-right">Commission Deducted</th>
                <th className="pb-3 text-right text-success">Net Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {[
                { type: "1:1 Consultation Services", gross: one_on_one_sales, comm: one_on_one_commission, net: one_on_one_payout },
                { type: "1-to-Many Group Sessions", gross: group_sales, comm: group_commission, net: group_payout },
                { type: "On-Demand Courses", gross: course_sales, comm: course_commission, net: course_payout },
              ].map(row => (
                <tr key={row.type} className="text-sm hover:bg-accent/10">
                  <td className="py-3.5 font-medium text-foreground">{row.type}</td>
                  <td className="py-3.5 text-right text-foreground">${row.gross.toFixed(2)}</td>
                  <td className="py-3.5 text-right text-red-500">-${row.comm.toFixed(2)}</td>
                  <td className="py-3.5 text-right font-bold text-success">${row.net.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts + Breakdown */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-8 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <p className="font-semibold text-foreground">Monthly Net Earnings</p>
          <Badge variant="secondary" className="text-xs">Last 30 Days</Badge>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={(v: number) => [`$${v}`, "Net"]} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" }} />
            <Area type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={2} fill="url(#earningsGrad)" dot={false} activeDot={{ r: 4, fill: "#6366f1" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Transactions Tab */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Transaction Logs</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["all", "paid", "pending"].map(f => (
              <DropdownMenuItem key={f} onClick={() => setTxFilter(f)} className={txFilter === f ? "text-primary" : ""}>
                {f === "all" ? "All Statuses" : f === "paid" ? "Paid Only" : "Pending Only"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Client / Service</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Gross</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Commission Fee</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Net Payout</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredBookings.map(tx => {
                  const statusKey = tx.aasm_state as keyof typeof statusConfig
                  const status = statusConfig[statusKey] || statusConfig.pending
                  return (
                    <tr key={tx.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground font-medium">{tx.client?.given_name} {tx.client?.family_name}</p>
                        <p className="text-xs text-muted-foreground">{tx.service?.title}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground text-right">${(tx.price_cents / 100).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-red-500 text-right">-${((tx.commission_cents || 0) / 100).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-success text-right">${((tx.expert_payout_cents || tx.price_cents) / 100).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={`${status.bg} ${status.color} border-0 text-xs`}>{status.label}</Badge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Connected payout method details */}
      <div className="mt-6 bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-card">
        <div>
          <p className="text-sm font-medium text-foreground">Direct Deposits & Payouts Account</p>
          <p className="text-xs text-muted-foreground mt-0.5">Stripe Connect Account resolving with instant settlement.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <CreditCard className="h-3.5 w-3.5" /> Stripe Settings
        </Button>
      </div>
    </div>
  )
}
