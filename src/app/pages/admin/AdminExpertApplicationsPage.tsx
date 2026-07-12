import { useState, useEffect } from "react"
import { motion } from "motion/react"
import {
  Search, Filter, ChevronDown, CheckCircle2, XCircle, Clock,
  Star, MapPin, Globe, Linkedin, ExternalLink, Mail, MoreHorizontal,
  Eye, ThumbsUp, ThumbsDown, MessageSquare, Download, Users
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/app/components/ui/dialog"
import { staggerContainer, staggerItem } from "@/app/lib/motion"
import { toast } from "sonner"
import { api } from "@/app/lib/api"

type ApplicationStatus = "pending" | "approved" | "rejected" | "review"

type Application = {
  id: string
  name: string
  initials: string
  gradient: string
  headline: string
  categories: string[]
  location: string
  experience: string
  hourlyRate: number
  appliedAt: string
  status: ApplicationStatus
  website?: string
  linkedin?: string
  bio: string
  credentials: string
  languages: string[]
  services: string[]
  rating?: number
  reviewCount?: number
}

const statusConfig = {
  pending: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Pending Review" },
  approved: { color: "text-success", bg: "bg-success/10", border: "border-success/20", label: "Approved" },
  rejected: { color: "text-error", bg: "bg-error/10", border: "border-error/20", label: "Rejected" },
  review: { color: "text-info", bg: "bg-info/10", border: "border-info/20", label: "In Review" },
}

export function AdminExpertApplicationsPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | ApplicationStatus>("all")
  const [selected, setSelected] = useState<any | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [dialogRejectMode, setDialogRejectMode] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = () => {
    setLoading(true)
    api.get("/admin/expert_applications")
      .then((res: any) => {
        const mapped = res.map((app: any) => {
          const user = app.user || {}
          const data = app.application_data || {}
          return {
            id: app.id.toString(),
            name: `${user.given_name || ""} ${user.family_name || ""}`.trim() || user.email || "Unknown User",
            email: user.email || "",
            initials: ((user.given_name?.[0] || "") + (user.family_name?.[0] || "")).toUpperCase() || "EX",
            gradient: "from-brand-500 to-violet-600",
            headline: data.headline || data.specialization || "Professional Expert",
            categories: data.categories || ["General"],
            location: data.location || "Remote",
            experience: data.experience || "N/A",
            hourlyRate: parseFloat(data.hourly_rate || data.price || "0"),
            appliedAt: new Date(app.created_at).toLocaleDateString(),
            status: app.status as ApplicationStatus,
            website: data.website,
            linkedin: data.linkedin,
            bio: data.bio || "No bio provided.",
            credentials: data.credentials || "No credentials provided.",
            languages: data.languages || ["English"],
            services: data.services || ["1on1"]
          }
        })
        setItems(mapped)
      })
      .catch((err: any) => {
        toast.error("Failed to load expert applications: " + err.message)
      })
      .finally(() => setLoading(false))
  }

  const handleApprove = async (id: string) => {
    // Optimistic update
    setItems(prev => prev.map(a => a.id === id ? { ...a, status: "approved" } : a))
    if (selected?.id === id) setSelected((s: any) => s ? { ...s, status: "approved" } : null)
    try {
      await api.post(`/admin/expert_applications/${id}/approve`)
      toast.success("Application approved — email sent to applicant")
      setSelected(null)
    } catch (err: any) {
      // Revert on failure
      loadApplications()
      toast.error("Failed to approve: " + err.message)
    }
  }

  const handleRejectInitiate = (id: string) => {
    setRejectingId(id)
    setRejectionReason("")
  }

  const handleRejectConfirm = async (id: string) => {
    const reason = rejectionReason.trim()
    // Optimistic update
    setItems(prev => prev.map(a => a.id === id ? { ...a, status: "rejected" } : a))
    if (selected?.id === id) setSelected((s: any) => s ? { ...s, status: "rejected" } : null)
    setRejectingId(null)
    setRejectionReason("")
    setDialogRejectMode(false)
    try {
      await api.post(`/admin/expert_applications/${id}/reject`, { reason })
      toast.success("Application rejected — email sent to applicant")
      setSelected(null)
    } catch (err: any) {
      loadApplications()
      toast.error("Failed to reject: " + err.message)
    }
  }

  const counts = {
    all: items.length,
    pending: items.filter(a => a.status === "pending").length,
    review: items.filter(a => a.status === "review").length,
    approved: items.filter(a => a.status === "approved").length,
    rejected: items.filter(a => a.status === "rejected").length,
  }

  const filtered = items.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.headline.toLowerCase().includes(search.toLowerCase()) ||
      a.categories.some(c => c.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = filterStatus === "all" || a.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-foreground mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 700 }}>
            Expert Applications
          </h1>
          <p className="text-sm text-muted-foreground">Review and approve experts to join your marketplace.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {/* Status counts */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {(["all", "pending", "review", "approved", "rejected"] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all border
              ${filterStatus === status ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"}`}
          >
            {status === "all" ? "All" : statusConfig[status].label}
            <span className={`text-xs font-bold ${filterStatus === status ? "text-background/70" : "text-muted-foreground"}`}>
              {counts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, category, or keyword..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>

      {/* Applications list */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
        {filtered.map(app => {
          const s = statusConfig[app.status]
          const isRejecting = rejectingId === app.id
          return (
            <motion.div
              key={app.id}
              variants={staggerItem}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-card transition-shadow"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center text-white font-bold shrink-0`}>
                  {app.initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-foreground">{app.name}</p>
                    <Badge className={`${s.bg} ${s.color} border ${s.border} text-xs`}>{s.label}</Badge>
                    {app.rating && (
                      <span className="flex items-center gap-1 text-xs text-amber-500">
                        <Star className="h-3 w-3 fill-current" />{app.rating} ({app.reviewCount})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-0.5">{app.email}</p>
                  <p className="text-sm text-muted-foreground mb-1.5">{app.headline}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {app.categories.map((c: string) => (
                      <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                    ))}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{app.location}
                    </span>
                    <span className="text-xs text-muted-foreground">${app.hourlyRate}/hr</span>
                    <span className="text-xs text-muted-foreground">{app.appliedAt}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => { setSelected(app); setDialogRejectMode(false) }} className="gap-1.5">
                    <Eye className="h-3.5 w-3.5" /> Review
                  </Button>
                  {(app.status === "pending" || app.status === "review") && !isRejecting && (
                    <>
                      <Button size="sm" onClick={() => handleApprove(app.id)} className="gap-1.5 bg-success hover:bg-success/90 text-white">
                        <ThumbsUp className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectInitiate(app.id)} className="gap-1.5 text-error border-error/30 hover:bg-error/5">
                        <ThumbsDown className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2"><Mail className="h-4 w-4" /> Send Email</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2"><MessageSquare className="h-4 w-4" /> Add Note</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { toast.success("Marked as review"); setItems(prev => prev.map(a => a.id === app.id ? { ...a, status: "review" } : a)) }} className="gap-2">
                        <Clock className="h-4 w-4" /> Mark In Review
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Inline rejection reason input */}
              {isRejecting && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <p className="text-sm font-medium text-foreground">Rejection reason (optional — sent to applicant via email):</p>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    autoFocus
                    rows={2}
                    placeholder="e.g. Application lacks sufficient credentials for this specialty..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-error/30 focus:border-error/50 resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => { setRejectingId(null); setRejectionReason("") }}>
                      Cancel
                    </Button>
                    <Button size="sm" className="bg-error hover:bg-error/90 text-white gap-1.5" onClick={() => handleRejectConfirm(app.id)}>
                      <ThumbsDown className="h-3.5 w-3.5" /> Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </motion.div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground mb-1">
            {filterStatus === "pending" ? "No pending applications" :
             filterStatus === "approved" ? "No approved applications" :
             filterStatus === "rejected" ? "No rejected applications" :
             "No applications found"}
          </p>
          <p className="text-sm text-muted-foreground">
            {search ? "Try adjusting your search query." : "Applications submitted by experts will appear here."}
          </p>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${selected.gradient} flex items-center justify-center text-white font-bold`}>
                    {selected.initials}
                  </div>
                  <div>
                    <p className="text-foreground">{selected.name}</p>
                    <p className="text-xs text-muted-foreground font-normal">{selected.email}</p>
                    <p className="text-sm text-muted-foreground font-normal">{selected.headline}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 py-2">
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selected.location}</span>
                  <span>{selected.experience} experience</span>
                  <span>${selected.hourlyRate}/hr</span>
                  {selected.website && (
                    <a href={selected.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Globe className="h-3.5 w-3.5" />{selected.website}
                    </a>
                  )}
                  {selected.linkedin && (
                    <a href={selected.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Linkedin className="h-3.5 w-3.5" />LinkedIn
                    </a>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Bio</p>
                  <p className="text-sm text-foreground leading-relaxed">{selected.bio}</p>
                </div>

                <div className="rounded-xl border border-border p-4 bg-muted/20">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Credentials Submitted</p>
                  <p className="text-sm text-foreground mb-4">{selected.credentials}</p>
                  
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40">
                    <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground font-medium">Admins should verify degrees, certificates, or professional license numbers prior to approval.</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Categories</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.categories.map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Languages</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.languages.map(l => <Badge key={l} variant="outline" className="text-xs">{l}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Services</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.services.map(s => <Badge key={s} variant="outline" className="text-xs capitalize">{s}</Badge>)}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Admin Note</p>
                  <textarea
                    rows={2}
                    placeholder="Add an internal note..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
              </div>

              {/* Rejection reason in dialog */}
              {dialogRejectMode && (
                <div className="px-1 pb-2 space-y-2">
                  <p className="text-sm font-medium text-foreground">Rejection reason (sent to applicant):</p>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    autoFocus
                    rows={3}
                    placeholder="e.g. Insufficient credentials for this specialty..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-error/30 focus:border-error/50 resize-none"
                  />
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => { setSelected(null); setDialogRejectMode(false); setRejectionReason("") }}>Close</Button>
                {(selected.status === "pending" || selected.status === "review") && (
                  <>
                    {dialogRejectMode ? (
                      <>
                        <Button variant="outline" onClick={() => { setDialogRejectMode(false); setRejectionReason("") }}>
                          Back
                        </Button>
                        <Button
                          className="bg-error hover:bg-error/90 text-white"
                          onClick={() => handleRejectConfirm(selected.id)}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1.5" /> Confirm Rejection
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          className="text-error border-error/30 hover:bg-error/5"
                          onClick={() => setDialogRejectMode(true)}
                        >
                          <ThumbsDown className="h-4 w-4 mr-1.5" /> Reject
                        </Button>
                        <Button
                          className="bg-success hover:bg-success/90 text-white"
                          onClick={() => handleApprove(selected.id)}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1.5" /> Approve
                        </Button>
                      </>
                    )}
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
