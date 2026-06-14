import { useState, useEffect } from "react"
import { useLocation, Link } from "react-router"
import { motion } from "motion/react"
import {
  CreditCard, DollarSign, ArrowUpRight, ArrowDownRight, Clock,
  CheckCircle2, AlertCircle, ExternalLink, Download, Filter,
  ChevronDown, RefreshCw, Settings, Zap, Shield, Building,
  TrendingUp, MoreHorizontal, ArrowLeft, Coins
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import { Separator } from "@/app/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu"
import { api } from "@/app/lib/api"
import { toast } from "sonner"

type PayoutStatus = "completed" | "processing" | "failed" | "scheduled"

type ExpertPayout = {
  id: string
  expert: string
  initials: string
  gradient: string
  amount: number
  platformFee: number
  period: string
  method: string
  status: PayoutStatus
  date: string
}

const statusConfig = {
  completed: { color: "text-success", bg: "bg-success/10", label: "Completed", icon: CheckCircle2 },
  processing: { color: "text-info", bg: "bg-info/10", label: "Processing", icon: Clock },
  failed: { color: "text-error", bg: "bg-error/10", label: "Failed", icon: AlertCircle },
  scheduled: { color: "text-muted-foreground", bg: "bg-muted", label: "Scheduled", icon: Clock },
}

const gateways = [
  {
    id: "stripe",
    name: "Stripe Connect",
    logo: "S",
    gradient: "from-violet-500 to-indigo-600",
    status: "connected",
    volume: "$18,240",
    fee: "2.9% + $0.30",
    lastSync: "2m ago",
    desc: "Primary payment gateway for card processing and payouts.",
  },
  {
    id: "razorpay",
    name: "Razorpay",
    logo: "R",
    gradient: "from-blue-500 to-cyan-500",
    status: "disconnected",
    volume: "—",
    fee: "2% + ₹3",
    lastSync: "Never",
    desc: "Indian payment gateway. Best for INR transactions.",
  },
  {
    id: "paypal",
    name: "PayPal Payouts",
    logo: "P",
    gradient: "from-sky-500 to-blue-600",
    status: "connected",
    volume: "$1,340",
    fee: "0% for verified experts",
    lastSync: "15m ago",
    desc: "Instant payouts to expert PayPal accounts.",
  },
]

export function AdminPaymentsPage() {
  const location = useLocation()
  const currentPath = location.pathname
  const normalizedPath = currentPath.replace(/\/$/, "")

  const [platformRevenue, setPlatformRevenue] = useState(0)
  const [expertPayouts, setExpertPayouts] = useState(0)
  const [pendingPayouts, setPendingPayouts] = useState(0)
  const [failedPayoutsCount, setFailedPayoutsCount] = useState(0)
  const [payoutsList, setPayoutsList] = useState<ExpertPayout[]>([])
  const [revenueChartData, setRevenueChartData] = useState<{ month: string; platform: number; expert: number }[]>([])
  
  // Settings
  const [payoutSchedule, setPayoutSchedule] = useState("Weekly (every Monday)")
  const [minPayoutLimit, setMinPayoutLimit] = useState(50)
  const [maxPayoutLimit, setMaxPayoutLimit] = useState(10000)
  const [platformFee, setPlatformFee] = useState(15)
  const [flatFee, setFlatFee] = useState(5.00)
  const [commissionModel, setCommissionModel] = useState("percentage")
  const [minCommissionFloor, setMinCommissionFloor] = useState(1.50)
  const [maxCommissionCap, setMaxCommissionCap] = useState<number | "">("")
  const [payoutCurrency, setPayoutCurrency] = useState("USD")
  const [autoPayout, setAutoPayout] = useState(true)
  
  // Gateway Configuration States
  const [paymentConfigs, setPaymentConfigs] = useState<any[]>([])
  const [stripePublishableKey, setStripePublishableKey] = useState("")
  const [stripeSecretKey, setStripeSecretKey] = useState("")
  const [razorpayKeyId, setRazorpayKeyId] = useState("")
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("")
  
  const [showStripeConfig, setShowStripeConfig] = useState(false)
  const [showRazorpayConfig, setShowRazorpayConfig] = useState(false)
  const [savingGateway, setSavingGateway] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchPaymentsData = () => {
    Promise.all([
      api.get("/analytics/dashboard"),
      api.get("/bookings"),
      api.get("/tenant"),
      api.get("/payment_configs")
    ])
    .then(([dashboard, bookings, tenant, configs]: any) => {
      setPlatformRevenue((dashboard.total_commission_cents || 0) / 100)
      const sales = (dashboard.total_sales_cents || 0) / 100
      const commission = (dashboard.total_commission_cents || 0) / 100
      setExpertPayouts(sales - commission)

      if (Array.isArray(bookings)) {
        // Sum pending/authorized
        const pending = bookings
          .filter((b: any) => ["pending", "authorized"].includes(b.aasm_state))
          .reduce((sum: number, b: any) => sum + (b.price_cents / 100), 0)
        setPendingPayouts(pending)

        // Count failed
        const failed = bookings.filter((b: any) => b.aasm_state === "errored" || b.aasm_state === "payment_failed").length
        setFailedPayoutsCount(failed)

        // Payouts list
        const list = bookings
          .filter((b: any) => ["paid", "confirmed", "confirmed_free"].includes(b.aasm_state))
          .map((b: any) => {
            const expertName = b.expert ? `${b.expert.given_name} ${b.expert.family_name}` : "Expert"
            const initials = b.expert ? `${b.expert.given_name?.[0] || ""}${b.expert.family_name?.[0] || ""}` : "EX"
            return {
              id: `PO-${b.id}`,
              expert: expertName,
              initials: initials,
              gradient: "from-violet-500 to-purple-600",
              amount: (b.expert_payout_cents || b.price_cents) / 100,
              platformFee: (b.commission_cents || 0) / 100,
              period: new Date(b.created_at).toLocaleDateString([], { month: "short", day: "numeric" }),
              method: "Stripe Connect",
              status: "completed" as const,
              date: new Date(b.created_at).toLocaleDateString()
            }
          })
        setPayoutsList(list)
      }

      if (tenant) {
        setPlatformFee(tenant.seller_commission_pct || 15)
        setMinCommissionFloor((tenant.minimum_commission_cents || 0) / 100)
        setPayoutCurrency(tenant.default_currency || "USD")
        if (tenant.settings) {
          setPayoutSchedule(tenant.settings.payout_schedule || "Weekly (every Monday)")
          setAutoPayout(tenant.settings.auto_payout !== false)
          setCommissionModel(tenant.settings.commission_model || "percentage")
          setFlatFee((tenant.settings.commission_flat_fee_cents || 500) / 100)
          setMinPayoutLimit((tenant.settings.min_payout_cents || 5000) / 100)
          setMaxPayoutLimit((tenant.settings.max_payout_cents || 1000000) / 100)
          setMaxCommissionCap(tenant.settings.max_commission_cents ? tenant.settings.max_commission_cents / 100 : "")
        }
      }

      // Revenue split chart — computed from real API data
      if (Array.isArray(dashboard.revenue_by_month)) {
        const rate = ((tenant?.seller_commission_pct) || 15) / 100
        const computed = dashboard.revenue_by_month.map((m: any) => {
          const total = Math.round(m.revenue_cents / 100)
          const platform = Math.round(total * rate)
          const expert = total - platform
          return { month: m.month, platform, expert }
        })
        setRevenueChartData(computed)
      }

      if (Array.isArray(configs)) {
        setPaymentConfigs(configs)
        const stripeConfig = configs.find((c: any) => c.gateway === "stripe")
        const razorpayConfig = configs.find((c: any) => c.gateway === "razorpay")
        if (stripeConfig) {
          setStripePublishableKey(stripeConfig.publishable_key || "")
          setStripeSecretKey("••••••••••••••••")
        }
        if (razorpayConfig) {
          setRazorpayKeyId(razorpayConfig.publishable_key || "")
          setRazorpayKeySecret("••••••••••••••••")
        }
      }
      setLoading(false)
    })
    .catch(err => {
      console.error("Failed to load payments data:", err)
      setLoading(false)
    })
  }

  const handleSaveGateway = async (gateway: "stripe" | "razorpay") => {
    setSavingGateway(true)
    try {
      const payload: any = {
        payment_config: {
          gateway,
          is_active: true
        }
      }
      if (gateway === "stripe") {
        payload.payment_config.publishable_key = stripePublishableKey
        if (stripeSecretKey !== "••••••••••••••••") {
          payload.payment_config.encrypted_credentials = stripeSecretKey
        }
      } else if (gateway === "razorpay") {
        payload.payment_config.publishable_key = razorpayKeyId
        if (razorpayKeySecret !== "••••••••••••••••") {
          payload.payment_config.encrypted_credentials = razorpayKeySecret
        }
      }

      await api.post("/payment_configs", payload)
      toast.success(`${gateway === "stripe" ? "Stripe" : "Razorpay"} configuration saved successfully!`)
      setShowStripeConfig(false)
      setShowRazorpayConfig(false)
      
      // Re-fetch configuration
      const configs = await api.get("/payment_configs")
      if (Array.isArray(configs)) {
        setPaymentConfigs(configs)
      }
    } catch (err: any) {
      toast.error("Failed to save gateway details: " + err.message)
    } finally {
      setSavingGateway(false)
    }
  }

  useEffect(() => {
    fetchPaymentsData()
  }, [])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await api.patch("/tenant", {
        tenant: {
          seller_commission_pct: platformFee,
          minimum_commission_cents: minCommissionFloor * 100,
          default_currency: payoutCurrency,
          settings: {
            payout_schedule: payoutSchedule,
            auto_payout: autoPayout,
            commission_model: commissionModel,
            commission_flat_fee_cents: flatFee * 100,
            min_payout_cents: minPayoutLimit * 100,
            max_payout_cents: maxPayoutLimit * 100,
            max_commission_cents: maxCommissionCap ? maxCommissionCap * 100 : null
          }
        }
      })
      toast.success("Payout settings saved successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to save payout settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground text-sm">Loading payments details...</p>
      </div>
    )
  }

  if (normalizedPath === "/admin/payments/stripe") {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <Link to="/admin/payments" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Payments Overview
          </Link>
          <h1 style={{ fontFamily: "var(--font-heading)" }} className="text-2xl font-bold text-foreground">
            Stripe Connect Setup
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Configure Stripe keys to accept credit cards, digital wallets, and process expert payouts.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  S
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Stripe Credentials</h3>
                  <p className="text-xs text-muted-foreground">Keys are encrypted and stored securely on your server.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Stripe Publishable Key</label>
                  <input
                    type="text"
                    placeholder="pk_test_..."
                    value={stripePublishableKey}
                    onChange={e => setStripePublishableKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Stripe Secret Key</label>
                  <input
                    type="password"
                    placeholder="sk_test_..."
                    value={stripeSecretKey}
                    onChange={e => setStripeSecretKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Link to="/admin/payments">
                  <Button size="sm" variant="outline">Cancel</Button>
                </Link>
                <Button size="sm" disabled={savingGateway} onClick={() => handleSaveGateway("stripe")}>
                  {savingGateway ? "Saving..." : "Save Stripe Keys"}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Status card */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-foreground text-sm">Connection Status</h3>
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  paymentConfigs.some(c => c.gateway === "stripe" && c.is_active) 
                    ? "bg-success/10 text-success" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <Badge className={
                    paymentConfigs.some(c => c.gateway === "stripe" && c.is_active) 
                      ? "bg-success/10 text-success border-success/20 text-xs" 
                      : "bg-muted text-muted-foreground border-border text-xs"
                  }>
                    {paymentConfigs.some(c => c.gateway === "stripe" && c.is_active) ? "Active & Connected" : "Disconnected"}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {paymentConfigs.some(c => c.gateway === "stripe" && c.is_active) ? "Gateway is processing payments." : "Gateway is not configured."}
                  </p>
                </div>
              </div>
            </div>

            {/* Instruction Card */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Configuration Guide</h3>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">1.</span>
                  <span>Log in to your <strong>Stripe Dashboard</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">2.</span>
                  <span>Go to <strong>Developers &gt; API Keys</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">3.</span>
                  <span>Copy the <strong>Publishable key</strong> and <strong>Secret key</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">4.</span>
                  <span>Ensure your Stripe Connect setup is enabled for split payouts.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (normalizedPath === "/admin/payments/razorpay") {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <Link to="/admin/payments" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Payments Overview
          </Link>
          <h1 style={{ fontFamily: "var(--font-heading)" }} className="text-2xl font-bold text-foreground">
            Razorpay Setup
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Configure Razorpay credentials to accept UPI, net banking, cards, and mobile wallets in India.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  R
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Razorpay Credentials</h3>
                  <p className="text-xs text-muted-foreground">Keys are encrypted and stored securely on your server.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Razorpay Key ID</label>
                  <input
                    type="text"
                    placeholder="rzp_test_..."
                    value={razorpayKeyId}
                    onChange={e => setRazorpayKeyId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Razorpay Key Secret</label>
                  <input
                    type="password"
                    placeholder="Secret key..."
                    value={razorpayKeySecret}
                    onChange={e => setRazorpayKeySecret(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Link to="/admin/payments">
                  <Button size="sm" variant="outline">Cancel</Button>
                </Link>
                <Button size="sm" disabled={savingGateway} onClick={() => handleSaveGateway("razorpay")}>
                  {savingGateway ? "Saving..." : "Save Razorpay Keys"}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Status card */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-foreground text-sm">Connection Status</h3>
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  paymentConfigs.some(c => c.gateway === "razorpay" && c.is_active) 
                    ? "bg-success/10 text-success" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <Badge className={
                    paymentConfigs.some(c => c.gateway === "razorpay" && c.is_active) 
                      ? "bg-success/10 text-success border-success/20 text-xs" 
                      : "bg-muted text-muted-foreground border-border text-xs"
                  }>
                    {paymentConfigs.some(c => c.gateway === "razorpay" && c.is_active) ? "Active & Connected" : "Disconnected"}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {paymentConfigs.some(c => c.gateway === "razorpay" && c.is_active) ? "Gateway is processing payments." : "Gateway is not configured."}
                  </p>
                </div>
              </div>
            </div>

            {/* Instruction Card */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Configuration Guide</h3>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">1.</span>
                  <span>Log in to your <strong>Razorpay Dashboard</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">2.</span>
                  <span>Navigate to <strong>Account & Settings &gt; API Keys</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">3.</span>
                  <span>Click <strong>Generate Key</strong> to download your Key ID and Key Secret.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-foreground">4.</span>
                  <span>Ensure your account is in Live Mode for accepting production payments.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (normalizedPath === "/admin/payments/payouts") {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <Link to="/admin/payments" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Payments Overview
          </Link>
          <h1 style={{ fontFamily: "var(--font-heading)" }} className="text-2xl font-bold text-foreground">
            Payout Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Configure platform commission models, payout limits, scheduling, and settlement currencies.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl divide-y divide-border shadow-sm">
          {/* Commission Model Selection */}
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Commission Model</p>
              <p className="text-xs text-muted-foreground mt-0.5">Charge experts via percentage rates or flat fee per consultation</p>
            </div>
            <select
              value={commissionModel}
              onChange={e => setCommissionModel(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            >
              <option value="percentage">Percentage Rate</option>
              <option value="flat">Flat Fee</option>
            </select>
          </div>

          {/* Conditional Commission Rates */}
          {commissionModel === "percentage" ? (
            <>
              <div className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Platform Percentage Fee</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Percentage taken from each consultation or course transaction</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={platformFee}
                    onChange={e => setPlatformFee(Number(e.target.value))}
                    className="w-20 px-3 py-1.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                  />
                  <span className="text-muted-foreground text-sm">%</span>
                </div>
              </div>

              <div className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Minimum Commission Floor</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Enforces a minimum platform fee per transaction</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    value={minCommissionFloor}
                    onChange={e => setMinCommissionFloor(Number(e.target.value))}
                    className="w-20 px-3 py-1.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                  />
                </div>
              </div>

              <div className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Maximum Commission Cap</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Optional maximum platform fee cap per transaction (leave empty for no cap)</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    placeholder="None"
                    value={maxCommissionCap}
                    onChange={e => setMaxCommissionCap(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-20 px-3 py-1.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Flat Commission Fee</p>
                <p className="text-xs text-muted-foreground mt-0.5">Fixed rate deducted from each consultation payment</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  value={flatFee}
                  onChange={e => setFlatFee(Number(e.target.value))}
                  className="w-20 px-3 py-1.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                />
              </div>
            </div>
          )}

          {/* Minimum Payout Threshold */}
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Minimum Payout Threshold</p>
              <p className="text-xs text-muted-foreground mt-0.5">Minimum expert balance required before payout is triggered</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">$</span>
              <input
                type="number"
                value={minPayoutLimit}
                onChange={e => setMinPayoutLimit(Number(e.target.value))}
                className="w-20 px-3 py-1.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
              />
            </div>
          </div>

          {/* Maximum Payout Limit */}
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Maximum Payout Limit</p>
              <p className="text-xs text-muted-foreground mt-0.5">Maximum expert balance allowed per individual payout disburse</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">$</span>
              <input
                type="number"
                value={maxPayoutLimit}
                onChange={e => setMaxPayoutLimit(Number(e.target.value))}
                className="w-20 px-3 py-1.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
              />
            </div>
          </div>

          {/* Payout Schedule */}
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Payout Schedule</p>
              <p className="text-xs text-muted-foreground mt-0.5">How often are experts paid out?</p>
            </div>
            <select
              value={payoutSchedule}
              onChange={e => setPayoutSchedule(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            >
              <option value="Weekly (every Monday)">Weekly (every Monday)</option>
              <option value="Bi-weekly">Bi-weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          {/* Payout Currency */}
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Payout Currency</p>
              <p className="text-xs text-muted-foreground mt-0.5">Default currency for all payouts</p>
            </div>
            <select
              value={payoutCurrency}
              onChange={e => setPayoutCurrency(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            >
              {["USD", "EUR", "GBP", "INR"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Auto-Payout Toggle */}
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Auto-payout</p>
              <p className="text-xs text-muted-foreground mt-0.5">Automatically trigger payouts when threshold is reached</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoPayout}
                onChange={e => setAutoPayout(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-muted peer-checked:bg-primary rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-primary/30"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
            </label>
          </div>

          <div className="px-5 py-4 flex justify-end">
            <Button size="sm" onClick={handleSaveSettings} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700 }}>
            Payments & Payouts Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Configure payment gateways, monitor transactions, and review payouts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchPaymentsData}>
            <RefreshCw className="h-3.5 w-3.5" /> Sync
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Platform Revenue", value: `$${platformRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "Commission fees", icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
          { label: "Expert Payouts", value: `$${expertPayouts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "Total disbursed", icon: DollarSign, color: "text-primary", bg: "bg-brand-50" },
          { label: "Pending Payouts", value: `$${pendingPayouts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "Processing or scheduled", icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Failed Payouts", value: failedPayoutsCount.toString(), sub: "Requires attention", icon: AlertCircle, color: "text-error", bg: "bg-error/10" },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${bg} shrink-0`}>
              <Icon className={`h-4.5 w-4.5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>{value}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Gateways Grid */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Payment Gateways
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stripe card */}
              <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-border/80 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      S
                    </div>
                    <Badge className={paymentConfigs.some(c => c.gateway === "stripe" && c.is_active) ? "bg-success/10 text-success border-success/20 text-xs" : "bg-muted text-muted-foreground border-border text-xs"}>
                      {paymentConfigs.some(c => c.gateway === "stripe" && c.is_active) ? "Connected & Active" : "Disconnected"}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Stripe Connect</h3>
                    <p className="text-xs text-muted-foreground mt-1">Accept credit cards globally, handle Apple Pay/Google Pay, and split payouts to expert accounts.</p>
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-border/50">
                  <span className="text-[10px] font-mono text-muted-foreground">Fee: 2.9% + $0.30</span>
                  <Link to="/admin/payments/stripe">
                    <Button variant="outline" size="sm" className="gap-1.5 h-8">
                      <Settings className="h-3 w-3" /> Configure
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Razorpay card */}
              <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-border/80 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      R
                    </div>
                    <Badge className={paymentConfigs.some(c => c.gateway === "razorpay" && c.is_active) ? "bg-success/10 text-success border-success/20 text-xs" : "bg-muted text-muted-foreground border-border text-xs"}>
                      {paymentConfigs.some(c => c.gateway === "razorpay" && c.is_active) ? "Connected & Active" : "Disconnected"}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">Razorpay</h3>
                    <p className="text-xs text-muted-foreground mt-1">Process UPI, netbanking, cards, and mobile wallets. Optimized for Indian markets and INR transactions.</p>
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-border/50">
                  <span className="text-[10px] font-mono text-muted-foreground">Fee: 2.0% + ₹3</span>
                  <Link to="/admin/payments/razorpay">
                    <Button variant="outline" size="sm" className="gap-1.5 h-8">
                      <Settings className="h-3 w-3" /> Configure
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Payouts Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                Recent Payouts
              </h2>
              <Badge variant="outline">Completed Disbursements</Badge>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Expert</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Period</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Expert Amount</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Platform Fee</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Method</th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payoutsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                          No expert payout records found.
                        </td>
                      </tr>
                    ) : (
                      payoutsList.slice(0, 5).map(p => {
                        const s = statusConfig[p.status]
                        const SIcon = s.icon
                        return (
                          <tr key={p.id} className="hover:bg-muted/30 transition-colors text-foreground">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`h-6 w-6 rounded-full bg-gradient-to-br ${p.gradient} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                                  {p.initials}
                                </div>
                                <p className="font-medium">{p.expert}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{p.period}</td>
                            <td className="px-4 py-3 font-semibold text-success text-right">${p.amount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-muted-foreground text-right">${p.platformFee.toLocaleString()}</td>
                            <td className="px-4 py-3 text-muted-foreground">{p.method}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge className={`${s.bg} ${s.color} border-0 text-[10px] gap-1 px-2 py-0.5`}>
                                <SIcon className="h-2.5 w-2.5" />{s.label}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Revenue Chart Card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Revenue Split</h3>
              <p className="text-[10px] text-muted-foreground">Platform Share vs. Expert Earnings · Based on completed bookings</p>
            </div>
            {revenueChartData.length === 0 || revenueChartData.every(d => d.platform === 0 && d.expert === 0) ? (
              <div className="flex items-center justify-center h-[160px] px-4 text-center">
                <p className="text-xs text-muted-foreground">No revenue data yet. Revenue will appear here after your first completed booking.</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={revenueChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip formatter={(v: number, name: string) => [`$${v.toLocaleString()}`, name === "platform" ? "Platform Fee" : "Expert Share"]} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                    <Bar dataKey="platform" fill="#6366f1" radius={[2, 2, 0, 0]} name="platform" minPointSize={2} />
                    <Bar dataKey="expert" fill="#c4b5fd" radius={[2, 2, 0, 0]} name="expert" minPointSize={2} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-3 mt-1 justify-end text-[10px]">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <div className="h-2 w-2 rounded-sm bg-primary" />
                    Platform
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <div className="h-2 w-2 rounded-sm bg-violet-300" />
                    Expert
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Payout Settings card */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Payout Settings</h3>
                <p className="text-[10px] text-muted-foreground">Current disbursement rules</p>
              </div>
              <Coins className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commission Model:</span>
                <span className="font-medium text-foreground capitalize">{commissionModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate:</span>
                <span className="font-medium text-foreground">
                  {commissionModel === "percentage" ? `${platformFee}%` : `$${flatFee}`}
                </span>
              </div>
              {commissionModel === "percentage" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission Floor:</span>
                    <span className="font-medium text-foreground">${minCommissionFloor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Commission Cap:</span>
                    <span className="font-medium text-foreground">{maxCommissionCap ? `$${maxCommissionCap}` : "None"}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Min Payout Threshold:</span>
                <span className="font-medium text-foreground">${minPayoutLimit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Payout Limit:</span>
                <span className="font-medium text-foreground">${maxPayoutLimit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Schedule:</span>
                <span className="font-medium text-foreground">{payoutSchedule}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency:</span>
                <span className="font-medium text-foreground uppercase">{payoutCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auto-Payout:</span>
                <span className="font-medium text-foreground">{autoPayout ? "Enabled" : "Disabled"}</span>
              </div>
            </div>

            <Link to="/admin/payments/payouts" className="block w-full">
              <Button variant="outline" size="sm" className="w-full text-xs">
                Edit Payout Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
