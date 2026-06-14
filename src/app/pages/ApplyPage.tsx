import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  User, Briefcase, Star, DollarSign, ChevronRight, ChevronLeft,
  Check, Upload, Plus, X, Globe, Twitter, Linkedin, Youtube,
  ArrowLeft, Sparkles, Clock, Video, BookOpen, MessageSquare
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import { toast } from "sonner"
import { api } from "@/app/lib/api"
import { useTenant } from "@/app/providers/TenantThemeProvider"

const steps = [
  { id: 1, label: "Personal Info", icon: User },
  { id: 2, label: "Expertise", icon: Briefcase },
  { id: 3, label: "Services", icon: Star },
  { id: 4, label: "Pricing", icon: DollarSign },
  { id: 5, label: "Review", icon: Check },
]

const categories = [
  "Business Strategy", "Marketing", "Finance", "Technology", "Design",
  "Legal", "HR & Recruiting", "Sales", "Product Management", "Data Science",
  "AI & Machine Learning", "Career Coaching", "Life Coaching", "Health & Wellness",
  "Education", "Real Estate", "E-commerce", "Content Creation",
]

const serviceTypes = [
  { id: "1on1", icon: Video, label: "1:1 Video Call", desc: "Private consultations" },
  { id: "async", icon: MessageSquare, label: "Async Q&A", desc: "Written responses" },
  { id: "course", icon: BookOpen, label: "Course", desc: "Self-paced learning" },
  { id: "group", icon: Clock, label: "Group Session", desc: "Up to 50 attendees" },
]

type FormData = {
  firstName: string
  lastName: string
  headline: string
  bio: string
  location: string
  website: string
  twitter: string
  linkedin: string
  youtube: string
  categories: string[]
  yearsExperience: string
  credentials: string
  languages: string[]
  services: string[]
  hourlyRate: string
  currency: string
  availability: string
  paidout: string
}

const defaultForm: FormData = {
  firstName: "",
  lastName: "",
  headline: "",
  bio: "",
  location: "",
  website: "",
  twitter: "",
  linkedin: "",
  youtube: "",
  categories: [],
  yearsExperience: "3–5",
  credentials: "",
  languages: [],
  services: [],
  hourlyRate: "",
  currency: "USD",
  availability: "10",
  paidout: "stripe",
}

export function ApplyPage() {
  const navigate = useNavigate()
  const tenant = useTenant()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(defaultForm)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newLang, setNewLang] = useState("")

  function next() { if (step < 5) setStep(s => s + 1) }
  function prev() { if (step > 1) setStep(s => s - 1) }

  async function handleSubmit() {
    setLoading(true)
    try {
      await api.post("/expert_applications", { application: form })
      toast.success("Expert application submitted successfully!")
      setSubmitted(true)
    } catch (err: any) {
      toast.error(err.message || "Failed to submit application. Please check your credentials and try again.")
    } finally {
      setLoading(false)
    }
  }

  function toggleCategory(cat: string) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : f.categories.length < 3 ? [...f.categories, cat] : f.categories
    }))
  }

  function toggleService(id: string) {
    setForm(f => ({
      ...f,
      services: f.services.includes(id) ? f.services.filter(s => s !== id) : [...f.services, id]
    }))
  }

  function addLanguage() {
    if (newLang.trim() && !form.languages.includes(newLang.trim())) {
      setForm(f => ({ ...f, languages: [...f.languages, newLang.trim()] }))
      setNewLang("")
    }
  }

  function removeLanguage(lang: string) {
    setForm(f => ({ ...f, languages: f.languages.filter(l => l !== lang) }))
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-foreground mb-3" style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700 }}>
            Application submitted!
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Thank you for applying to {tenant.name}. Our team will review your application and get back to you within 2-3 business days.
          </p>
          <div className="bg-muted/50 rounded-2xl p-5 mb-8 text-left space-y-3">
            <p className="text-sm font-medium text-foreground">What happens next?</p>
            {[
              "We'll review your profile and credentials",
              "You may receive a verification call from our team",
              "Once approved, you'll get an email to set up your storefront",
            ].map((s, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-brand-100 text-primary flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">{i + 1}</div>
                <p className="text-sm text-muted-foreground">{s}</p>
              </div>
            ))}
          </div>
          <Button onClick={() => navigate("/")} className="w-full">Back to Home</Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "0.9375rem" }}>{tenant.name}</span>
          </div>
          <div className="w-20 text-right">
            <span className="text-xs text-muted-foreground">Step {step} of 5</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-foreground mb-2" style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700 }}>
            Apply as an Expert
          </h1>
          <p className="text-muted-foreground">Share your expertise. Set your own rates. Build your client base.</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {steps.map((s, i) => {
            const Icon = s.icon
            const done = step > s.id
            const active = step === s.id
            return (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => done && setStep(s.id)}
                  className={`flex flex-col items-center gap-1.5 ${done ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all border-2
                    ${done ? "bg-primary border-primary" : active ? "bg-background border-primary" : "bg-muted border-border"}`}>
                    {done ? <Check className="h-4 w-4 text-white" /> : <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 w-12 sm:w-16 mx-1 sm:mx-2 ${step > s.id ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-card">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && <StepPersonal form={form} setForm={setForm} />}
              {step === 2 && <StepExpertise form={form} setForm={setForm} toggleCategory={toggleCategory} newLang={newLang} setNewLang={setNewLang} addLanguage={addLanguage} removeLanguage={removeLanguage} />}
              {step === 3 && <StepServices form={form} toggleService={toggleService} />}
              {step === 4 && <StepPricing form={form} setForm={setForm} />}
              {step === 5 && <StepReview form={form} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button variant="outline" onClick={prev} disabled={step === 1} className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          {step < 5 ? (
            <Button onClick={next} className="gap-2">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="gap-2 bg-success hover:bg-success/90 text-white">
              {loading ? "Submitting..." : <>Submit Application <Check className="h-4 w-4" /></>}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Step 1: Personal Info ──────────────────────────────────────────────────

function StepPersonal({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700 }}>Personal Information</h2>
        <p className="text-sm text-muted-foreground">This will appear on your public expert profile.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {(form.firstName[0] || "") + (form.lastName[0] || "")}
        </div>
        <div>
          <Button variant="outline" size="sm" className="gap-2 mb-1.5">
            <Upload className="h-3.5 w-3.5" /> Upload photo
          </Button>
          <p className="text-xs text-muted-foreground">JPG or PNG, max 2MB. Square recommended.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">First Name</label>
          <input
            value={form.firstName}
            onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Last Name</label>
          <input
            value={form.lastName}
            onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Professional Headline</label>
        <input
          value={form.headline}
          onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
          placeholder="e.g. Senior Product Designer & UX Strategist"
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Bio</label>
        <textarea
          value={form.bio}
          onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
          rows={4}
          placeholder="Tell potential clients about your background, expertise, and what makes you unique..."
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">{form.bio.length}/500 characters</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Location</label>
          <input
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="City, Country"
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Website</label>
          <div className="flex">
            <span className="px-3 py-2 rounded-l-xl border border-r-0 border-border bg-muted text-muted-foreground text-sm flex items-center">
              <Globe className="h-3.5 w-3.5" />
            </span>
            <input
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              placeholder="yoursite.com"
              className="flex-1 px-3 py-2 rounded-r-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-3">Social Links (optional)</label>
        <div className="space-y-2">
          {[
            { icon: Twitter, field: "twitter" as const, placeholder: "@handle" },
            { icon: Linkedin, field: "linkedin" as const, placeholder: "linkedin.com/in/..." },
            { icon: Youtube, field: "youtube" as const, placeholder: "youtube.com/@..." },
          ].map(({ icon: Icon, field, placeholder }) => (
            <div key={field} className="flex">
              <span className="px-3 py-2 rounded-l-xl border border-r-0 border-border bg-muted text-muted-foreground text-sm flex items-center">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <input
                value={form[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                placeholder={placeholder}
                className="flex-1 px-3 py-2 rounded-r-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Expertise ──────────────────────────────────────────────────────

function StepExpertise({ form, setForm, toggleCategory, newLang, setNewLang, addLanguage, removeLanguage }: {
  form: FormData
  setForm: React.Dispatch<React.SetStateAction<FormData>>
  toggleCategory: (cat: string) => void
  newLang: string
  setNewLang: (v: string) => void
  addLanguage: () => void
  removeLanguage: (lang: string) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700 }}>Your Expertise</h2>
        <p className="text-sm text-muted-foreground">Help clients find you by selecting the right categories.</p>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">
          Expert Categories <span className="text-muted-foreground font-normal">(select up to 3)</span>
        </label>
        <div className="flex flex-wrap gap-2 mt-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all border
                ${form.categories.includes(cat)
                  ? "bg-primary text-white border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Years of Experience</label>
          <select
            value={form.yearsExperience}
            onChange={e => setForm(f => ({ ...f, yearsExperience: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          >
            {["1–2", "3–5", "5–10", "10+"].map(v => <option key={v} value={v}>{v} years</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Languages</label>
          <div className="flex gap-2">
            <input
              value={newLang}
              onChange={e => setNewLang(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addLanguage()}
              placeholder="Add language..."
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
            <Button size="sm" variant="outline" onClick={addLanguage}><Plus className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.languages.map(lang => (
              <span key={lang} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-sm text-foreground">
                {lang}
                <button onClick={() => removeLanguage(lang)}><X className="h-3 w-3 text-muted-foreground hover:text-foreground" /></button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Notable Credentials</label>
        <textarea
          value={form.credentials}
          onChange={e => setForm(f => ({ ...f, credentials: e.target.value }))}
          rows={3}
          placeholder="Past companies, degrees, certifications, publications, awards..."
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Portfolio / Work Samples (optional)</label>
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-foreground font-medium">Drop files here or click to upload</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, images up to 10MB each</p>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Services ───────────────────────────────────────────────────────

function StepServices({ form, toggleService }: { form: FormData; toggleService: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700 }}>Services You'll Offer</h2>
        <p className="text-sm text-muted-foreground">Select all the types of services you want to provide on {tenant.name}.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {serviceTypes.map(({ id, icon: Icon, label, desc }) => {
          const selected = form.services.includes(id)
          return (
            <button
              key={id}
              onClick={() => toggleService(id)}
              className={`flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all
                ${selected ? "border-primary bg-brand-50/50" : "border-border hover:border-primary/40 bg-background"}`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${selected ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-medium text-foreground text-sm">{label}</p>
                  {selected && <Check className="h-4 w-4 text-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800 font-medium mb-1">You can always add more later</p>
        <p className="text-xs text-amber-700">After your profile is approved, you can create additional service listings directly from your dashboard.</p>
      </div>
    </div>
  )
}

// ─── Step 4: Pricing ────────────────────────────────────────────────────────

function StepPricing({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  const hourly = parseFloat(form.hourlyRate) || 0
  const platform = hourly * 0.15
  const net = hourly - platform

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700 }}>Pricing & Payouts</h2>
        <p className="text-sm text-muted-foreground">Set your base rate and configure how you'd like to receive payments.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Hourly Rate</label>
          <div className="flex">
            <span className="px-3 py-2 rounded-l-xl border border-r-0 border-border bg-muted text-muted-foreground text-sm flex items-center">$</span>
            <input
              type="number"
              value={form.hourlyRate}
              onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
              min={25}
              className="flex-1 px-3 py-2 rounded-r-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Currency</label>
          <select
            value={form.currency}
            onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          >
            {["USD", "EUR", "GBP", "INR", "CAD", "AUD"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {hourly > 0 && (
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium text-foreground mb-3">Earnings breakdown per hour</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Client pays</span>
            <span className="text-foreground font-medium">${hourly.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform fee (15%)</span>
            <span className="text-error">-${platform.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-foreground">You receive</span>
            <span className="text-success">${net.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Weekly Availability (hours)</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={40}
            value={form.availability}
            onChange={e => setForm(f => ({ ...f, availability: e.target.value }))}
            className="flex-1 accent-primary"
          />
          <span className="text-sm font-medium text-foreground w-20 text-right">{form.availability} hrs/wk</span>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-3">Payout Method</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: "stripe", label: "Stripe", desc: "1–2 business days" },
            { id: "paypal", label: "PayPal", desc: "Instant" },
            { id: "bank", label: "Bank Transfer", desc: "3–5 business days" },
          ].map(({ id, label, desc }) => (
            <button
              key={id}
              onClick={() => setForm(f => ({ ...f, paidout: id }))}
              className={`p-4 rounded-xl border-2 text-left transition-all
                ${form.paidout === id ? "border-primary bg-brand-50/50" : "border-border hover:border-primary/40"}`}
            >
              <p className="font-medium text-foreground text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 5: Review ─────────────────────────────────────────────────────────

function StepReview({ form }: { form: FormData }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "1.25rem", fontWeight: 700 }}>Review Your Application</h2>
        <p className="text-sm text-muted-foreground">Everything look good? Submit when you're ready.</p>
      </div>

      <div className="flex items-center gap-4 p-5 bg-muted/40 rounded-2xl">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {form.firstName[0]}{form.lastName[0]}
        </div>
        <div>
          <p className="font-semibold text-foreground">{form.firstName} {form.lastName}</p>
          <p className="text-sm text-muted-foreground">{form.headline}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{form.location}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ReviewSection title="Categories" items={form.categories} />
        <ReviewSection title="Languages" items={form.languages} />
        <ReviewSection title="Services" items={form.services.map(s => serviceTypes.find(t => t.id === s)?.label || s)} />
        <div className="bg-muted/40 rounded-xl p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Pricing</p>
          <p className="text-sm text-foreground">${form.hourlyRate}/{form.currency} per hour</p>
          <p className="text-xs text-muted-foreground mt-1">{form.availability} hrs/wk availability</p>
          <p className="text-xs text-muted-foreground">Payout via {form.paidout}</p>
        </div>
      </div>

      <div className="bg-muted/40 rounded-xl p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Bio</p>
        <p className="text-sm text-foreground leading-relaxed">{form.bio}</p>
      </div>

      <div className="border border-border rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" defaultChecked className="mt-0.5 accent-primary" />
          <span className="text-sm text-muted-foreground">
            I agree to the <span className="text-primary">Terms of Service</span> and <span className="text-primary">Expert Guidelines</span>. I confirm that all information provided is accurate.
          </span>
        </label>
      </div>
    </div>
  )
}

function ReviewSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="bg-muted/40 rounded-xl p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <Badge key={item} variant="secondary" className="text-xs">{item}</Badge>
        ))}
      </div>
    </div>
  )
}
