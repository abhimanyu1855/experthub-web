import { useState } from "react"
import { useNavigate } from "react-router"
import { motion } from "motion/react"
import { ArrowLeft, Send, Sparkles, CheckCircle2, MessageSquare, Mail, Building, User } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { toast } from "sonner"

export function ContactPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    plan: "pro",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.")
      return
    }

    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setSubmitted(true)
    toast.success("Thank you! We've received your request and will contact you shortly.")
  }

  if (submitted) {
    return (
      <div className="bg-slate-950 text-white min-h-screen flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center bg-white/[0.02] border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(99,102,241,0.1)]"
        >
          <div className="h-16 w-16 bg-brand-500/20 border border-brand-500/30 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)" }}>Message Sent!</h1>
          <p className="text-slate-400 mb-8 leading-relaxed text-sm">
            Thank you for reaching out to ExpertHub. An onboarding specialist will email you at <strong className="text-white">{formData.email}</strong> within 24 business hours to set up your marketplace demo.
          </p>
          <Button onClick={() => navigate("/")} className="w-full bg-brand-500 hover:bg-brand-600 rounded-xl py-3 font-semibold gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="bg-slate-950 text-white min-h-screen relative overflow-hidden flex flex-col justify-between">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[450px] w-[800px] rounded-full bg-brand-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-violet-600/10 blur-[100px]" />
      </div>

      {/* Header / Nav */}
      <header className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </header>

      {/* Main Content */}
      <main className="relative max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 z-10 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.5fr] gap-12 w-full">
          {/* Left info column */}
          <div className="flex flex-col justify-center">
            <Badge className="mb-4 bg-brand-500/10 text-brand-300 border-brand-500/20 max-w-max">Let's Connect</Badge>
            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2rem,4vw,2.75rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              Launch Your <br />
              Custom Platform
            </h1>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-md">
              Whether you are planning a healthcare clinic consultation portal, professional legal network, or high-ticket coaching mastermind, we are here to support your launch.
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-white/5 border border-white/8 rounded-xl flex items-center justify-center shrink-0 text-brand-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Direct Support</h3>
                  <p className="text-slate-400 text-xs mt-1">support@experthub.app</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="h-10 w-10 bg-white/5 border border-white/8 rounded-xl flex items-center justify-center shrink-0 text-brand-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Response Time</h3>
                  <p className="text-slate-400 text-xs mt-1">Under 24 hours (Monday to Friday)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right form column */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(99,102,241,0.05)]">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-brand-400" />
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>Request a Demo / Callback</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                    <User className="h-3 w-3" /> Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                  <Building className="h-3 w-3" /> Company Name
                </label>
                <input
                  type="text"
                  placeholder="Enter organization/clinic name"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Plan of Interest
                </label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors select-custom"
                >
                  <option value="starter" className="bg-slate-900 text-white">Starter ($49/mo)</option>
                  <option value="pro" className="bg-slate-900 text-white">Pro ($149/mo)</option>
                  <option value="scale" className="bg-slate-900 text-white">Scale ($399/mo)</option>
                  <option value="other" className="bg-slate-900 text-white">Custom / Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Tell us about your marketplace goals *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your project, timeline, or any custom integrations you require..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-500 hover:bg-brand-600 rounded-xl py-3.5 font-semibold gap-2 transition-all mt-4"
              >
                {isSubmitting ? "Sending..." : "Submit Inquiry"}
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-6 px-4 text-center text-slate-500 text-xs z-10">
        <div>© 2026 ExpertHub SaaS, Inc. All rights reserved.</div>
      </footer>
    </div>
  )
}
