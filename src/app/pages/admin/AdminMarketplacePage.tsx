import { useState, useEffect } from "react"
import { useLocation } from "react-router"
import { motion } from "motion/react"
import {
  Store, Tag, Globe, Clock, Star, Shield, Search,
  Plus, Trash2, Edit2, Save, X, ChevronDown, Check,
  GripVertical, Settings, Zap, Users, BookOpen, Video, Webhook,
  RefreshCw, Percent, DollarSign, Calendar
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import { FeatureGate } from "@/app/components/ui/FeatureGate"
import { toast } from "sonner"
import { api } from "@/app/lib/api"

type Category = {
  id: string
  name: string
  slug: string
  icon: string
  count: number
  active: boolean
}

const durationOptions = ["15 min", "30 min", "45 min", "60 min", "90 min", "120 min"]
const currencyOptions = ["USD", "EUR", "GBP", "INR", "CAD", "AUD"]

export function AdminMarketplacePage() {
  const location = useLocation()
  const currentPath = location.pathname

  const [categories, setCategories] = useState<Category[]>([])
  const [newCatName, setNewCatName] = useState("")
  const [newCatIcon, setNewCatIcon] = useState("📌")
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  
  const [name, setName] = useState("")
  const [slogan, setSlogan] = useState("")
  const [description, setDescription] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [webhookUrl, setWebhookUrl] = useState("")
  const [savingWebhook, setSavingWebhook] = useState(false)
  const [savedWebhook, setSavedWebhook] = useState(false)

  // Checkout Fields State
  const [customFields, setCustomFields] = useState<any[]>([])
  const [newFieldName, setNewFieldName] = useState("")
  const [newFieldType, setNewFieldType] = useState("text")
  const [newFieldRequired, setNewFieldRequired] = useState(false)
  const [newFieldOptions, setNewFieldOptions] = useState("")
  const [addingField, setAddingField] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [savedGeneral, setSavedGeneral] = useState(false)

  // Cancellation Policy state
  const [cancelPolicy, setCancelPolicy] = useState<"flexible" | "moderate" | "strict" | "custom">("flexible")
  const [cancelRefundPct, setCancelRefundPct] = useState("100")
  const [cancelPriorHours, setCancelPriorHours] = useState("24")
  const [savingPolicy, setSavingPolicy] = useState(false)
  const [savedPolicy, setSavedPolicy] = useState(false)

  // Promo Codes State
  const [promoCodes, setPromoCodes] = useState<any[]>([])
  const [loadingPromo, setLoadingPromo] = useState(false)
  const [newPromoCode, setNewPromoCode] = useState("")
  const [newPromoDiscountType, setNewPromoDiscountType] = useState("percent")
  const [newPromoDiscountValue, setNewPromoDiscountValue] = useState("")
  const [newPromoMaxUses, setNewPromoMaxUses] = useState("")
  const [newPromoExpiry, setNewPromoExpiry] = useState("")
  const [creatingPromo, setCreatingPromo] = useState(false)

  const loadPromoCodes = () => {
    setLoadingPromo(true)
    api.get("/promo_codes")
      .then((res: any) => setPromoCodes(Array.isArray(res) ? res : []))
      .catch(() => {})
      .finally(() => setLoadingPromo(false))
  }

  const handleCreatePromoCode = async () => {
    if (!newPromoCode.trim() || !newPromoDiscountValue) return
    setCreatingPromo(true)
    try {
      const res = await api.post("/promo_codes", {
        promo_code: {
          code: newPromoCode.trim().toUpperCase(),
          discount_type: newPromoDiscountType,
          discount_value: parseFloat(newPromoDiscountValue),
          max_redemptions: newPromoMaxUses ? parseInt(newPromoMaxUses) : null,
          expires_at: newPromoExpiry || null
        }
      })
      setPromoCodes(prev => [res, ...prev])
      setNewPromoCode("")
      setNewPromoDiscountValue("")
      setNewPromoMaxUses("")
      setNewPromoExpiry("")
      toast.success("Promo code created successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to create promo code")
    } finally {
      setCreatingPromo(false)
    }
  }

  const handleDeletePromoCode = async (id: number) => {
    try {
      await api.delete(`/promo_codes/${id}`)
      setPromoCodes(prev => prev.filter(p => p.id !== id))
      toast.success("Promo code deleted")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete promo code")
    }
  }

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    setNewPromoCode(code)
  }

  useEffect(() => {
    Promise.all([
      api.get("/categories"),
      api.get("/tenant"),
      api.get("/checkout_fields"),
      api.get("/cancellation_policy").catch(() => null)
    ])
    .then(([cats, tenant, fields, policy]: any) => {
      if (Array.isArray(cats)) {
        setCategories(cats.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
          slug: c.slug,
          icon: c.icon || "📌",
          count: c.services_count || 0,
          active: true
        })))
      }
      if (tenant) {
        setName(tenant.name || "")
        setSlogan(tenant.slogan || "")
        setDescription(tenant.description || "")
        setCurrency(tenant.default_currency || "USD")
        setWebhookUrl(tenant.settings?.webhook_url || "")
      }
      if (Array.isArray(fields)) {
        setCustomFields(fields)
      }
      if (policy && policy.prior_hours !== undefined) {
        setCancelPriorHours(String(policy.prior_hours))
        setCancelRefundPct(String(policy.refund_percentage))
        if (policy.refund_percentage === 100 && policy.prior_hours === 24) setCancelPolicy("flexible")
        else if (policy.refund_percentage === 50 && policy.prior_hours === 48) setCancelPolicy("moderate")
        else if (parseFloat(String(policy.refund_percentage)) === 0) setCancelPolicy("strict")
        else setCancelPolicy("custom")
      }
      setLoading(false)
    })
    .catch(err => {
      console.error("Failed to load marketplace settings:", err)
      setLoading(false)
    })

    if (currentPath === "/admin/promo-codes") {
      loadPromoCodes()
    }
  }, [])

  function toggleCategory(id: string) {
    // Local toggle visual representation
    setCategories(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c))
  }

  const deleteCategory = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`)
      setCategories(prev => prev.filter(c => c.id !== id))
      toast.success("Category deleted successfully!")
    } catch (err: any) {
      toast.error("Failed to delete category: " + err.message)
    }
  }

  const addCategory = async () => {
    if (!newCatName.trim()) return
    try {
      const res = await api.post("/categories", {
        category: {
          name: newCatName.trim(),
          category_type: "service"
        }
      })
      setCategories(prev => [...prev, {
        id: res.id.toString(),
        name: res.name,
        slug: res.slug,
        icon: "📌",
        count: 0,
        active: true
      }])
      setNewCatName("")
      toast.success("Category added successfully!")
    } catch (err: any) {
      toast.error("Failed to add category: " + err.message)
    }
  }

  function startEdit(cat: Category) {
    setEditingCat(cat.id)
    setEditName(cat.name)
  }

  const saveEdit = async (id: string) => {
    try {
      const res = await api.patch(`/categories/${id}`, {
        category: { name: editName }
      })
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name: res.name } : c))
      setEditingCat(null)
      toast.success("Category updated successfully!")
    } catch (err: any) {
      toast.error("Failed to update category: " + err.message)
    }
  }

  const addCustomField = async () => {
    if (!newFieldName.trim()) return
    setAddingField(true)
    try {
      const optionsArray = newFieldOptions
        .split(",")
        .map(o => o.trim())
        .filter(o => o.length > 0)

      const res = await api.post("/checkout_fields", {
        checkout_field: {
          field_name: newFieldName.trim(),
          field_type: newFieldType,
          required: newFieldRequired,
          options: optionsArray
        }
      })
      setCustomFields(prev => [...prev, res])
      setNewFieldName("")
      setNewFieldOptions("")
      setNewFieldRequired(false)
      toast.success("Custom field added successfully!")
    } catch (err: any) {
      toast.error("Failed to add custom field: " + err.message)
    } finally {
      setAddingField(false)
    }
  }

  const deleteCustomField = async (id: number) => {
    try {
      await api.delete(`/checkout_fields/${id}`)
      setCustomFields(prev => prev.filter(f => f.id !== id))
      toast.success("Custom field deleted successfully!")
    } catch (err: any) {
      toast.error("Failed to delete custom field: " + err.message)
    }
  }

  const handleSaveGeneral = async () => {
    setSavingGeneral(true)
    try {
      await api.patch("/tenant", {
        tenant: {
          name,
          slogan,
          description,
          default_currency: currency
        }
      })
      setSavedGeneral(true)
      toast.success("Settings saved successfully!")
      setTimeout(() => setSavedGeneral(false), 2000)
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings")
    } finally {
      setSavingGeneral(false)
    }
  }

  const handleSaveWebhook = async () => {
    setSavingWebhook(true)
    try {
      await api.patch("/tenant", {
        tenant: {
          settings: { webhook_url: webhookUrl.trim() }
        }
      })
      setSavedWebhook(true)
      toast.success("Webhook URL saved!")
      setTimeout(() => setSavedWebhook(false), 2000)
    } catch (err: any) {
      toast.error(err.message || "Failed to save webhook URL")
    } finally {
      setSavingWebhook(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground text-sm">Loading settings...</p>
      </div>
    )
  }

  // Rendering for Categories standalone view
  if (currentPath === "/admin/categories") {
    return (
      <div className="p-6 max-w-5xl mx-auto text-foreground space-y-6">
        <div>
          <h1 className="text-foreground mb-1 font-bold text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
            Expert Categories
          </h1>
          <p className="text-sm text-muted-foreground">Manage service categories and classifications for expert listings.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <p className="font-semibold text-foreground">Active Categories</p>
            <p className="text-xs text-muted-foreground">{categories.length} total categories configured</p>
          </div>

          <div className="divide-y divide-border">
            {categories.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No categories configured.</div>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="px-5 py-3 flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                  <span className="text-lg shrink-0">{cat.icon}</span>
                  {editingCat === cat.id ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && saveEdit(cat.id)}
                      autoFocus
                      className="flex-1 px-3 py-1.5 rounded-lg border border-primary bg-background text-sm focus:outline-none text-foreground"
                    />
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat.slug} · {cat.count} experts</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 shrink-0">
                    {editingCat === cat.id ? (
                      <>
                        <button onClick={() => saveEdit(cat.id)} className="h-7 w-7 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success/20 transition-colors">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditingCat(null)} className="h-7 w-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/80 transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(cat)} className="h-7 w-7 rounded-lg hover:bg-muted text-muted-foreground flex items-center justify-center transition-colors">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteCategory(cat.id)} className="h-7 w-7 rounded-lg hover:bg-error/10 text-muted-foreground hover:text-error flex items-center justify-center transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add category form */}
          <div className="px-5 py-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center gap-3">
            <input
              value={newCatIcon}
              onChange={e => setNewCatIcon(e.target.value)}
              className="w-full sm:w-14 px-3 py-2 rounded-xl border border-border bg-background text-center text-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
              placeholder="📌"
              maxLength={2}
            />
            <input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCategory()}
              placeholder="Enter new category name..."
              className="flex-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            />
            <Button onClick={addCategory} className="w-full sm:w-auto gap-1.5 rounded-xl">
              <Plus className="h-3.5 w-3.5" /> Add Category
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Rendering for Checkout Custom Fields standalone view
  if (currentPath === "/admin/custom-fields") {
    return (
      <div className="p-6 max-w-5xl mx-auto text-foreground space-y-6">
        <div>
          <h1 className="text-foreground mb-1 font-bold text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
            Checkout Custom Fields
          </h1>
          <p className="text-sm text-muted-foreground">Define details required from clients on appointment checkout checkout sessions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6">
          {/* List of current fields */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
              <h3 className="font-semibold text-foreground mb-4">Configured Fields</h3>
              {customFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                  No custom fields defined yet. Checkout will show standard name and email.
                </div>
              ) : (
                <div className="space-y-3">
                  {customFields.map((field) => (
                    <div key={field.id} className="flex items-start justify-between p-4 border border-border rounded-xl bg-background hover:bg-muted/10 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground">{field.field_name}</p>
                          {field.required && (
                            <Badge variant="outline" className="text-xs bg-error/10 text-error border-error/20 font-semibold">
                              Required
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Type: <span className="text-foreground capitalize">{field.field_type}</span>
                        </p>
                        {field.options && field.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {field.options.map((opt: string) => (
                              <span key={opt} className="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground border border-border">
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deleteCustomField(field.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-error hover:bg-error/5 rounded-lg flex items-center justify-center transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add custom field form panel */}
          <div className="h-fit bg-card border border-border rounded-2xl p-5 shadow-card space-y-4">
            <h3 className="font-semibold text-foreground">Add Custom Field</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Field Label / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Briefly describe your case"
                  value={newFieldName}
                  onChange={e => setNewFieldName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Input Type</label>
                <select
                  value={newFieldType}
                  onChange={e => setNewFieldType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                >
                  <option value="text">Single Line Text</option>
                  <option value="textarea">Paragraph text</option>
                  <option value="number">Number input</option>
                  <option value="select">Dropdown select list</option>
                  <option value="checkbox">Single checkbox toggle</option>
                </select>
              </div>

              {newFieldType === "select" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Select Options (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Strategy, Health, Legal"
                    value={newFieldOptions}
                    onChange={e => setNewFieldOptions(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Separate dropdown items with commas.</p>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer py-1.5">
                <input
                  type="checkbox"
                  checked={newFieldRequired}
                  onChange={e => setNewFieldRequired(e.target.checked)}
                  className="accent-primary h-4 w-4 rounded"
                />
                <span className="text-sm text-foreground">Make this field mandatory</span>
              </label>
            </div>

            <Button
              onClick={addCustomField}
              disabled={addingField || !newFieldName.trim()}
              className="w-full rounded-xl gap-2 mt-2"
            >
              <Plus className="h-4 w-4" /> {addingField ? "Adding..." : "Create Field"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Promo Codes management view (/admin/promo-codes)
  if (currentPath === "/admin/promo-codes") {
    return (
      <FeatureGate feature="promo_codes">
      <div className="p-6 max-w-5xl mx-auto text-foreground space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-foreground mb-1 font-bold text-2xl" style={{ fontFamily: "var(--font-heading)" }}>
              Promo Codes
            </h1>
            <p className="text-sm text-muted-foreground">Create and manage discount codes for your marketplace.</p>
          </div>
          <button
            onClick={loadPromoCodes}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loadingPromo ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Promo codes table */}
          <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <p className="font-semibold text-foreground">Active Codes</p>
              <p className="text-xs text-muted-foreground">{promoCodes.length} total</p>
            </div>

            {loadingPromo ? (
              <div className="p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : promoCodes.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm border-2 border-dashed border-border m-4 rounded-2xl">
                No promo codes yet. Create your first one →
              </div>
            ) : (
              <div className="divide-y divide-border">
                {promoCodes.map((pc: any) => (
                  <div key={pc.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-foreground text-sm">{pc.code}</span>
                        {pc.valid_for_use ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-success/10 text-success border border-success/20">Active</span>
                        ) : (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-error/10 text-error border border-error/20">
                            {pc.expired_ ? "Expired" : "Maxed out"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          {pc.discount_type === "percent" ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                          {pc.discount_type === "percent" ? `${pc.discount_value}% off` : `$${pc.discount_value} off`}
                        </span>
                        {pc.max_redemptions && (
                          <span>{pc.redemptions_count || 0} / {pc.max_redemptions} uses</span>
                        )}
                        {pc.expires_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Expires {new Date(pc.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePromoCode(pc.id)}
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-error hover:bg-error/5 flex items-center justify-center transition-colors shrink-0"
                      title="Delete promo code"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create form */}
          <div className="h-fit bg-card border border-border rounded-2xl p-5 shadow-card space-y-4">
            <h3 className="font-semibold text-foreground">Create Promo Code</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPromoCode}
                    onChange={e => setNewPromoCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SAVE20"
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                  />
                  <button
                    onClick={generateCode}
                    className="px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Auto-generate code"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Discount Type</label>
                <div className="flex gap-2">
                  {[
                    { value: "percent", label: "Percentage", icon: Percent },
                    { value: "fixed", label: "Fixed amount", icon: DollarSign }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setNewPromoDiscountType(value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                        newPromoDiscountType === value ? "bg-primary border-primary text-white" : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                  {newPromoDiscountType === "percent" ? "Discount %" : "Discount Amount ($)"}
                </label>
                <input
                  type="number"
                  min="0"
                  step={newPromoDiscountType === "percent" ? "1" : "0.01"}
                  max={newPromoDiscountType === "percent" ? "100" : undefined}
                  value={newPromoDiscountValue}
                  onChange={e => setNewPromoDiscountValue(e.target.value)}
                  placeholder={newPromoDiscountType === "percent" ? "20" : "10.00"}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Max Uses (optional)</label>
                <input
                  type="number"
                  min="1"
                  value={newPromoMaxUses}
                  onChange={e => setNewPromoMaxUses(e.target.value)}
                  placeholder="e.g. 100 (leave blank for unlimited)"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Expiry Date (optional)</label>
                <input
                  type="date"
                  value={newPromoExpiry}
                  onChange={e => setNewPromoExpiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                />
              </div>
            </div>

            <button
              onClick={handleCreatePromoCode}
              disabled={creatingPromo || !newPromoCode.trim() || !newPromoDiscountValue}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" /> {creatingPromo ? "Creating..." : "Create Promo Code"}
            </button>
          </div>
        </div>
      </div>
      </FeatureGate>
    )
  }

  // Operator General Settings path default view (/admin/settings)
  return (
    <div className="p-6 max-w-5xl mx-auto text-foreground">
      <div className="mb-6">
        <h1 className="text-foreground mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700 }}>
          Marketplace Settings
        </h1>
        <p className="text-sm text-muted-foreground">Configure general details, service types, discovery rules, and policies.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="services">Service Types</TabsTrigger>
          <TabsTrigger value="discovery">Discovery</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <div className="bg-card border border-border rounded-2xl divide-y divide-border">
            <div className="px-6 py-5">
              <p className="font-semibold text-foreground mb-4">Platform Identity</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Marketplace Name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Tagline</label>
                  <input
                    value={slogan}
                    onChange={e => setSlogan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-foreground"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-foreground block mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="font-semibold text-foreground mb-4">Defaults</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Default Currency</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                  >
                    {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Default Session Length</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
                    {durationOptions.map(d => <option key={d} selected={d === "60 min"}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Time Zone Display</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
                    <option>Client's local time</option>
                    <option>Expert's local time</option>
                    <option>UTC</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="font-semibold text-foreground mb-4">Expert Requirements</p>
              <div className="space-y-3">
                {[
                  { id: "req_approval", label: "Require admin approval for new experts", defaultChecked: true },
                  { id: "req_verify", label: "Require identity verification (ID + selfie)", defaultChecked: false },
                  { id: "req_linkedin", label: "Require LinkedIn profile on application", defaultChecked: true },
                  { id: "req_video", label: "Require intro video for expert profiles", defaultChecked: false },
                ].map(({ id, label, defaultChecked }) => (
                  <label key={id} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" defaultChecked={defaultChecked} className="accent-primary h-4 w-4 rounded" />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="px-6 py-5 flex justify-end">
              <Button onClick={handleSaveGeneral} disabled={savingGeneral} className="gap-2">
                {savedGeneral ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {savingGeneral ? "Saving..." : savedGeneral ? "Saved!" : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Developer Webhooks */}
          <FeatureGate feature="webhooks">
            <div className="bg-card border border-border rounded-2xl divide-y divide-border mt-6">
              <div className="px-6 py-5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <Webhook className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Developer Webhooks</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    We'll POST booking events (booking.paid, booking.confirmed, etc.) to this URL
                  </p>
                </div>
              </div>

              <div className="px-6 py-5 space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Webhook Endpoint URL</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={e => setWebhookUrl(e.target.value)}
                    placeholder="https://your-server.com/webhooks/experthub"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-foreground font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Each request includes <code className="bg-muted px-1 py-0.5 rounded text-[11px]">X-ExpertHub-Event</code> and{" "}
                    <code className="bg-muted px-1 py-0.5 rounded text-[11px]">X-ExpertHub-Tenant</code> headers.
                  </p>
                </div>
              </div>

              <div className="px-6 py-5 flex justify-end">
                <Button onClick={handleSaveWebhook} disabled={savingWebhook} className="gap-2">
                  {savedWebhook ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {savingWebhook ? "Saving..." : savedWebhook ? "Saved!" : "Save Webhook"}
                </Button>
              </div>
            </div>
          </FeatureGate>
        </TabsContent>

        {/* Service Types */}
        <TabsContent value="services">
          <div className="space-y-3">
            {[
              { icon: Video, label: "1:1 Video Call", desc: "Live private consultations via video", enabled: true, minDuration: "30 min", maxDuration: "120 min" },
              { icon: BookOpen, label: "Online Course", desc: "Self-paced recorded content with modules", enabled: true, minDuration: "—", maxDuration: "—" },
              { icon: Users, label: "Group Session", desc: "Live sessions with multiple attendees (up to 50)", enabled: true, minDuration: "30 min", maxDuration: "90 min" },
              { icon: Store, label: "Async Q&A", desc: "Text-based questions answered within 48h", enabled: true, minDuration: "—", maxDuration: "—" },
            ].map(({ icon: Icon, label, desc, enabled, minDuration, maxDuration }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                  <Icon className="h-5.5 w-5.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-foreground">{label}</p>
                    <Badge className={enabled ? "bg-success/10 text-success border-0 text-xs" : "bg-muted text-muted-foreground border-0 text-xs"}>
                      {enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{desc}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Min duration: {minDuration}</span>
                    <span>Max duration: {maxDuration}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Settings className="h-3.5 w-3.5" /> Configure
                  </Button>
                  <label className="relative inline-flex items-center cursor-pointer self-center">
                    <input type="checkbox" defaultChecked={enabled} className="sr-only peer" />
                    <div className="w-9 h-5 bg-muted peer-checked:bg-primary rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-primary/30"></div>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Discovery */}
        <TabsContent value="discovery">
          <div className="bg-card border border-border rounded-2xl divide-y divide-border">
            <div className="px-6 py-5">
              <p className="font-semibold text-foreground mb-4">Search & Filtering</p>
              <div className="space-y-3">
                {[
                  { label: "Enable full-text search on expert profiles", defaultChecked: true },
                  { label: "Show expert availability on listing cards", defaultChecked: true },
                  { label: "Show expert pricing on listing cards", defaultChecked: true },
                  { label: "Enable category browsing on homepage", defaultChecked: true },
                  { label: "Show 'Featured Experts' section", defaultChecked: true },
                ].map(({ label, defaultChecked }) => (
                  <label key={label} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked={defaultChecked} className="accent-primary h-4 w-4 rounded" />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="font-semibold text-foreground mb-4">Default Sort Order</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["Featured", "Highest Rated", "Most Reviewed", "Newest", "Price: Low–High", "Price: High–Low"].map(sort => (
                  <button
                    key={sort}
                    className={`px-3 py-2 rounded-xl border text-sm transition-all ${sort === "Featured" ? "border-primary bg-brand-50 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                  >
                    {sort}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="font-semibold text-foreground mb-4">SEO & Meta</p>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Meta Title</label>
                  <input defaultValue="ExpertHub — Book Consultations with Top Experts" className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Meta Description</label>
                  <textarea rows={2} defaultValue="Connect with world-class experts for 1:1 sessions, courses, and group workshops. Book instantly." className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-foreground" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 flex justify-end">
              <Button className="gap-2" onClick={() => toast.success("Discovery settings saved")}>
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Policies */}
        <TabsContent value="policies">
          <div className="bg-card border border-border rounded-2xl divide-y divide-border">
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-foreground">Cancellation Policy</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Applied to all bookings on this marketplace</p>
                </div>
                {cancelPolicy !== "custom" && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    cancelPolicy === "flexible" ? "bg-success/10 text-success" :
                    cancelPolicy === "moderate" ? "bg-warning/10 text-warning" :
                    "bg-error/10 text-error"
                  }`}>
                    {cancelPolicy.charAt(0).toUpperCase() + cancelPolicy.slice(1)}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {[
                  { key: "flexible", label: "Flexible — full refund if cancelled 24h+ before", hours: 24, refund: 100 },
                  { key: "moderate", label: "Moderate — 50% refund if cancelled 48h+ before", hours: 48, refund: 50 },
                  { key: "strict", label: "Strict — no refund after booking is confirmed", hours: 0, refund: 0 },
                  { key: "custom", label: "Custom — set your own refund window and percentage", hours: null, refund: null },
                ].map(opt => (
                  <label key={opt.key} className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-colors ${
                    cancelPolicy === opt.key ? "border-primary bg-brand-50" : "border-border hover:border-primary/30"
                  }`}>
                    <input
                      type="radio"
                      name="cancel"
                      value={opt.key}
                      checked={cancelPolicy === opt.key}
                      onChange={() => {
                        setCancelPolicy(opt.key as any)
                        if (opt.hours !== null) setCancelPriorHours(String(opt.hours))
                        if (opt.refund !== null) setCancelRefundPct(String(opt.refund))
                      }}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground">{opt.label}</span>
                  </label>
                ))}
              </div>

              {/* Custom policy fields */}
              {cancelPolicy === "custom" && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Free cancellation window (hours before)</label>
                    <input
                      type="number"
                      min="0"
                      value={cancelPriorHours}
                      onChange={e => setCancelPriorHours(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                      placeholder="24"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Refund percentage (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={cancelRefundPct}
                      onChange={e => setCancelRefundPct(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                      placeholder="100"
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Button
                  onClick={async () => {
                    setSavingPolicy(true)
                    try {
                      await api.patch("/cancellation_policy", {
                        cancellation_policy: {
                          name: cancelPolicy,
                          refund_percentage: parseFloat(cancelRefundPct),
                          prior_hours: parseInt(cancelPriorHours),
                          is_active: true
                        }
                      })
                      setSavedPolicy(true)
                      toast.success("Cancellation policy saved!")
                      setTimeout(() => setSavedPolicy(false), 2000)
                    } catch (err: any) {
                      toast.error(err.message || "Failed to save policy")
                    } finally {
                      setSavingPolicy(false)
                    }
                  }}
                  disabled={savingPolicy}
                  className="gap-2"
                  size="sm"
                >
                  {savedPolicy ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {savingPolicy ? "Saving..." : savedPolicy ? "Saved!" : "Save Policy"}
                </Button>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="font-semibold text-foreground mb-4">Refund Policy</p>
              <div className="space-y-3">
                {[
                  { label: "Full refund if expert cancels", defaultChecked: true },
                  { label: "Full refund within cancellation window", defaultChecked: true },
                  { label: "Allow clients to dispute session quality", defaultChecked: true },
                  { label: "Partial refund for no-shows (50%)", defaultChecked: false },
                ].map(({ label, defaultChecked }) => (
                  <label key={label} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked={defaultChecked} className="accent-primary h-4 w-4 rounded" />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="font-semibold text-foreground mb-1">Review Policy</p>
              <p className="text-xs text-muted-foreground mb-4">When and how reviews are collected</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Review Window</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
                    <option>7 days after session</option>
                    <option>14 days after session</option>
                    <option>30 days after session</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Moderation</label>
                  <select className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground">
                    <option>Auto-publish reviews</option>
                    <option>Manual review before publishing</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 flex justify-end">
              <Button className="gap-2" onClick={() => toast.success("Policy settings saved")}>
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
