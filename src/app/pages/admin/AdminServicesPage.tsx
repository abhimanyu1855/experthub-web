import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  CreditCard, Plus, Loader2, Check, X, Users,
  ToggleLeft, ToggleRight, DollarSign
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { toast } from "sonner"
import { api } from "@/app/lib/api"

export function AdminServicesPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)

  const [planName, setPlanName] = useState("")
  const [planDesc, setPlanDesc] = useState("")
  const [planPrice, setPlanPrice] = useState("")
  const [planInterval, setPlanInterval] = useState<"monthly" | "yearly">("monthly")
  const [planTargetRole, setPlanTargetRole] = useState("client")
  const [featuresInput, setFeaturesInput] = useState("")

  const fetchPlans = async () => {
    try {
      const data = await api.get("/subscription_plans")
      setPlans(Array.isArray(data) ? data : [])
    } catch (err: any) {
      toast.error("Failed to load subscription plans: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    const features = featuresInput.split(",").map(f => f.trim()).filter(Boolean)
    try {
      const res = await api.post("/subscription_plans", {
        subscription_plan: {
          name: planName,
          description: planDesc,
          price_cents: Math.round(parseFloat(planPrice || "0") * 100),
          billing_interval: planInterval,
          target_role: planTargetRole,
          features,
          is_active: true
        }
      })
      toast.success("Subscription plan created!")
      setPlans(prev => [...prev, res])
      setShowCreate(false)
      setPlanName(""); setPlanDesc(""); setPlanPrice("")
      setPlanInterval("monthly"); setPlanTargetRole("client"); setFeaturesInput("")
    } catch (err: any) {
      toast.error(err.message || "Failed to create plan")
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (plan: any) => {
    try {
      const res = await api.patch(`/subscription_plans/${plan.id}`, {
        subscription_plan: { is_active: !plan.is_active }
      })
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: !plan.is_active } : p))
      toast.success(plan.is_active ? "Plan deactivated" : "Plan activated")
    } catch (err: any) {
      toast.error(err.message || "Failed to update plan")
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-foreground">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Subscription Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">Create recurring subscription tiers for clients and experts.</p>
        </div>
        <Button className="gap-2 rounded-xl" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Create Plan
        </Button>
      </div>

      {/* Create Plan Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-modal space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-lg">Create Subscription Plan</h3>
                <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Plan Name</Label>
                  <Input value={planName} onChange={e => setPlanName(e.target.value)} required placeholder="e.g. Pro Monthly" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <textarea
                    value={planDesc}
                    onChange={e => setPlanDesc(e.target.value)}
                    rows={2}
                    placeholder="What's included in this plan?"
                    className="w-full bg-background border border-input rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Price (USD/period)</Label>
                    <Input type="number" step="0.01" min="0" value={planPrice} onChange={e => setPlanPrice(e.target.value)} required placeholder="49.00" className="rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Billing Interval</Label>
                    <select
                      value={planInterval}
                      onChange={e => setPlanInterval(e.target.value as "monthly" | "yearly")}
                      className="w-full bg-background border border-input rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Target Audience</Label>
                  <select
                    value={planTargetRole}
                    onChange={e => setPlanTargetRole(e.target.value)}
                    className="w-full bg-background border border-input rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="client">Clients</option>
                    <option value="expert">Experts</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Features (comma-separated)</Label>
                  <Input
                    value={featuresInput}
                    onChange={e => setFeaturesInput(e.target.value)}
                    placeholder="Unlimited bookings, Priority support, Analytics access"
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">Separate each feature with a comma</p>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating} className="gap-2">
                    {creating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...</> : <><Check className="h-3.5 w-3.5" /> Create Plan</>}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
          <CreditCard className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">No subscription plans yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create plans to offer recurring revenue streams.</p>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Plan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => {
            const features: string[] = Array.isArray(plan.features) ? plan.features : []
            return (
              <div key={plan.id} className={`bg-card rounded-2xl border shadow-card overflow-hidden transition-all ${plan.is_active ? "border-border" : "border-border opacity-60"}`}>
                <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>{plan.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={plan.is_active ? "bg-success/10 text-success border-0 text-xs" : "bg-muted text-muted-foreground border-0 text-xs"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge className="bg-brand-50 text-brand-600 border-0 text-xs capitalize">
                        {plan.target_role}s
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(plan)}
                    className={`shrink-0 transition-colors ${plan.is_active ? "text-success" : "text-muted-foreground"}`}
                    title={plan.is_active ? "Deactivate" : "Activate"}
                  >
                    {plan.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                      ${(plan.price_cents / 100).toFixed(0)}
                    </span>
                    <span className="text-muted-foreground text-sm">/{plan.billing_interval}</span>
                  </div>

                  {plan.description && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}

                  {features.length > 0 && (
                    <ul className="space-y-1.5">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                          <Check className="h-3.5 w-3.5 text-success shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="pt-3 border-t border-border flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs">{plan.active_subscribers_count || 0} active subscribers</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
