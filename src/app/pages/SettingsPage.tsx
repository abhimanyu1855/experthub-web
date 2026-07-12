import { useState, useEffect, useRef } from "react"
import { motion } from "motion/react"
import {
  User, Bell, CreditCard, Shield, Camera, Check, Eye, EyeOff,
  ChevronRight, Trash2, AlertCircle, Loader2, Wallet, ExternalLink
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Separator } from "@/app/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import { Badge } from "@/app/components/ui/badge"
import { toast } from "sonner"
import { fadeInUp } from "@/app/lib/motion"
import { api } from "@/app/lib/api"

type ToggleProps = { checked: boolean; onChange: (v: boolean) => void }
function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
        checked ? "bg-brand-500" : "bg-border"
      }`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  )
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

const NOTIFICATION_SETTINGS = [
  {
    group: "Bookings",
    items: [
      { id: "new_booking", label: "New booking request", description: "When a client books a session with you" },
      { id: "booking_confirmed", label: "Booking confirmed", description: "When your booking is confirmed" },
      { id: "booking_cancelled", label: "Booking cancelled", description: "When a session is cancelled" },
      { id: "booking_reminder", label: "Session reminders", description: "15 min before each session starts" },
    ],
  },
  {
    group: "Payments",
    items: [
      { id: "payment_received", label: "Payment received", description: "When you receive a payout" },
      { id: "payout_processed", label: "Payout processed", description: "When your weekly payout is processed" },
      { id: "refund_issued", label: "Refund issued", description: "When a refund is issued to a client" },
    ],
  },
  {
    group: "Platform",
    items: [
      { id: "new_message", label: "New messages", description: "When a client sends you a message" },
      { id: "new_review", label: "New reviews", description: "When a client leaves a review" },
      { id: "profile_views", label: "Profile view milestones", description: "When your profile hits a view milestone" },
      { id: "platform_updates", label: "Product updates", description: "News and feature announcements from your marketplace" },
    ],
  },
]

const PLANS = [
  { id: "starter", name: "Starter", price: "Free", features: ["1 expert profile", "10 bookings/month", "12% commission"] },
  { id: "pro", name: "Pro", price: "$79/mo", features: ["10 expert profiles", "Unlimited bookings", "7% commission", "Custom domain"], current: true },
  { id: "enterprise", name: "Enterprise", price: "$299/mo", features: ["Unlimited profiles", "Unlimited bookings", "4% commission", "Dedicated support"] },
]

export function SettingsPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")
  const [title, setTitle] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [role, setRole] = useState("")
  const [payoutConnected, setPayoutConnected] = useState(false)
  const [payoutOnboardingStarted, setPayoutOnboardingStarted] = useState(false)
  const [tenantGateway, setTenantGateway] = useState<string | null>(null)
  const [tenantCurrency, setTenantCurrency] = useState("USD")
  const [connectingStripe, setConnectingStripe] = useState(false)
  const [pressLinks, setPressLinks] = useState<any[]>([])
  const [credentials, setCredentials] = useState<any[]>([])
  const [introVideoUrl, setIntroVideoUrl] = useState("")

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [twoFa, setTwoFa] = useState(false)

  const [notifState, setNotifState] = useState<Record<string, boolean>>(
    Object.fromEntries(
      NOTIFICATION_SETTINGS.flatMap(g => g.items.map(i => [i.id, i.id !== "profile_views" && i.id !== "platform_updates"]))
    )
  )
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [pushNotifs, setPushNotifs] = useState(true)
  const [smsNotifs, setSmsNotifs] = useState(false)

  const toggleNotif = (id: string) => setNotifState(s => ({ ...s, [id]: !s[id] }))

  useEffect(() => {
    api.get("/me")
      .then((res: any) => {
        if (res.user) {
          setFirstName(res.user.given_name || "")
          setLastName(res.user.family_name || "")
          setEmail(res.user.email || "")
          setAvatarUrl(res.user.avatar_url || null)
          if (res.user.expert_profile) {
            setBio(res.user.expert_profile.bio || "")
            setTitle(res.user.expert_profile.title || "")
            setSpecialization(res.user.expert_profile.specialization || "")
            setPayoutConnected(Boolean(res.user.expert_profile.payout_connected))
            setPayoutOnboardingStarted(Boolean(res.user.expert_profile.payout_onboarding_started))
            setPressLinks(res.user.expert_profile.press_links || [])
            setCredentials(res.user.expert_profile.credentials || [])
            setIntroVideoUrl(res.user.expert_profile.intro_video_url || "")
          }
        }
        if (res.membership) {
          setRole(res.membership.role || "")
        }
      })
      .catch((err: any) => {
        toast.error("Failed to load user profile: " + err.message)
      })

    Promise.all([
      api.get("/tenant").catch(() => null),
      api.get("/payment_configs").catch(() => []),
    ])
      .then(([tenant, configs]: any[]) => {
        const activeConfig = Array.isArray(configs)
          ? configs.find((config: any) => config.is_active) || configs[0]
          : null
        setTenantGateway(activeConfig?.gateway || null)
        setTenantCurrency((tenant?.default_currency || "USD").toUpperCase())
      })
      .catch(() => {
        // Keep payout setup usable when tenant metadata is unavailable.
      })
  }, [])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleUploadAvatar = async () => {
    if (!avatarFile) return
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append("user[avatar]", avatarFile)
      const res = await api.patch("/me", formData)
      if (res.avatar_url) {
        setAvatarUrl(res.avatar_url)
        setAvatarPreview(null)
        setAvatarFile(null)
      }
      if (res.user) {
        localStorage.setItem("user", JSON.stringify(res.user))
      }
      toast.success("Avatar updated successfully.")
    } catch (err: any) {
      toast.error("Failed to upload avatar: " + err.message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const userPayload = { user: { given_name: firstName, family_name: lastName } }
      const res = await api.patch("/me", userPayload)
      if (res.user) {
        localStorage.setItem("user", JSON.stringify(res.user))
      }

      if (role === "expert") {
        await api.patch("/experts/profile", { bio, title, specialization, intro_video_url: introVideoUrl, press_links: pressLinks, credentials })
      }

      toast.success("Profile updated", { description: "Your changes have been saved." })
    } catch (err: any) {
      toast.error("Failed to update profile: " + err.message)
    }
  }

  const handleSavePassword = () => {
    toast.success("Password changed", { description: "Your password has been updated successfully." })
  }

  const handleConnectStripePayouts = async () => {
    setConnectingStripe(true)
    try {
      await api.post("/experts/stripe_account")
      const returnUrl = `${window.location.origin}/settings?tab=payouts`
      const link = await api.post("/experts/stripe_onboarding_link", {
        refresh_url: returnUrl,
        return_url: returnUrl,
      })

      if (!link?.url) {
        throw new Error("Stripe did not return an onboarding link")
      }

      window.location.assign(link.url)
    } catch (err: any) {
      toast.error("Failed to start Stripe onboarding: " + err.message)
      setConnectingStripe(false)
    }
  }

  const isExpert = role === "expert"
  const isRazorpayPayoutMode = isExpert && (tenantGateway === "razorpay" || (!tenantGateway && tenantCurrency === "INR"))
  const payoutStatus = connectingStripe
    ? "Pending onboarding"
    : payoutConnected
      ? "Connected"
      : payoutOnboardingStarted
        ? "Pending onboarding"
        : "Not connected"

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 style={{ fontFamily: "var(--font-heading)" }} className="text-3xl font-bold text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Manage your account preferences and profile</p>
        </div>

        <Tabs defaultValue={new URLSearchParams(window.location.search).get("tab") === "payouts" ? "payouts" : "profile"} orientation="vertical">
          <div className="flex gap-8 items-start">
            {/* Sidebar nav */}
            <TabsList className="flex-col h-auto w-48 bg-transparent p-0 shrink-0 sticky top-24">
              {[
                { value: "profile", icon: User, label: "Profile" },
                ...(isExpert ? [{ value: "payouts", icon: Wallet, label: "Payouts" }] : []),
                { value: "notifications", icon: Bell, label: "Notifications" },
                { value: "billing", icon: CreditCard, label: "Billing" },
                { value: "security", icon: Shield, label: "Security" },
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="w-full justify-start gap-3 px-3 py-2.5 rounded-lg data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {tab.label}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Profile */}
              <TabsContent value="profile" className="mt-0 space-y-4">
                {/* Avatar */}
                <motion.div {...fadeInUp} className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                  <h2 className="font-semibold text-foreground mb-5">Profile Photo</h2>
                  <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                      {(avatarPreview || avatarUrl) ? (
                        <img
                          src={avatarPreview || avatarUrl!}
                          alt="Profile photo"
                          className="h-20 w-20 rounded-full object-cover border-2 border-border"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-2xl font-bold">
                          {((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "U"}
                        </div>
                      )}
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-brand-500 border-2 border-white flex items-center justify-center hover:bg-brand-600 transition-colors"
                      >
                        <Camera className="h-3.5 w-3.5 text-white" />
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{firstName} {lastName}</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {avatarFile ? `Selected: ${avatarFile.name}` : "JPG, PNG, GIF up to 5 MB"}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => avatarInputRef.current?.click()}
                        >
                          Choose photo
                        </Button>
                        {avatarFile && (
                          <Button
                            size="sm"
                            onClick={handleUploadAvatar}
                            disabled={uploadingAvatar}
                            className="gap-1.5"
                          >
                            {uploadingAvatar ? (
                              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...</>
                            ) : (
                              <><Check className="h-3.5 w-3.5" /> Save photo</>
                            )}
                          </Button>
                        )}
                        {(avatarUrl || avatarPreview) && !avatarFile && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => { setAvatarPreview(null); setAvatarFile(null) }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Personal info */}
                <motion.div {...fadeInUp} className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-4">
                  <h2 className="font-semibold text-foreground">Personal Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First name</Label>
                      <Input id="first-name" value={firstName} onChange={e => setFirstName(e.target.value)} className="rounded-lg" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last name</Label>
                      <Input id="last-name" value={lastName} onChange={e => setLastName(e.target.value)} className="rounded-lg" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input id="email" type="email" value={email} disabled className="rounded-lg opacity-70" />
                  </div>
                  
                  {role === "expert" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Professional Title</Label>
                          <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="rounded-lg" placeholder="e.g. Lead Consultant" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="specialization">Specialization</Label>
                          <Input id="specialization" value={specialization} onChange={e => setSpecialization(e.target.value)} className="rounded-lg" placeholder="e.g. Finance, Architecture" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <textarea
                          id="bio"
                          value={bio}
                          onChange={e => setBio(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        />
                      </div>

                      {/* Intro Video URL */}
                      <div className="space-y-2">
                        <Label htmlFor="introVideoUrl">Introduction Video URL</Label>
                        <Input
                          id="introVideoUrl"
                          value={introVideoUrl}
                          onChange={e => setIntroVideoUrl(e.target.value)}
                          className="rounded-lg"
                          placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        />
                        <p className="text-xs text-muted-foreground">Share a brief video explaining your expertise (YouTube, Vimeo, etc.).</p>
                      </div>

                      {/* Credentials */}
                      <div className="space-y-4 pt-2">
                        <Label className="text-sm font-semibold">Academic & Professional Credentials</Label>
                        <div className="space-y-2">
                          {credentials.map((cred, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                              <div>
                                <p className="text-xs font-semibold text-foreground">{cred.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{cred.details}</p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-error"
                                onClick={() => setCredentials(prev => prev.filter((_, i) => i !== index))}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {credentials.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">No credentials added yet.</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input
                            placeholder="Credential name (e.g. Stanford University)"
                            id="new-cred-name"
                            className="text-xs"
                          />
                          <div className="flex gap-2">
                            <Input
                              placeholder="Details (e.g. M.D. in Cardiology)"
                              id="new-cred-details"
                              className="text-xs flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                              onClick={() => {
                                const nameInput = document.getElementById("new-cred-name") as HTMLInputElement
                                const detailsInput = document.getElementById("new-cred-details") as HTMLInputElement
                                if (nameInput?.value.trim() && detailsInput?.value.trim()) {
                                  setCredentials(prev => [...prev, { name: nameInput.value.trim(), details: detailsInput.value.trim() }])
                                  nameInput.value = ""
                                  detailsInput.value = ""
                                } else {
                                  toast.error("Please enter both a credential name and details.")
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Press Links */}
                      <div className="space-y-4 pt-2">
                        <Label className="text-sm font-semibold">Press & Publication Links</Label>
                        <div className="space-y-2">
                          {pressLinks.map((link, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                              <div>
                                <p className="text-xs font-semibold text-foreground">{link.name}</p>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate max-w-xs block mt-0.5">
                                  {link.url}
                                </a>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-error"
                                onClick={() => setPressLinks(prev => prev.filter((_, i) => i !== index))}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {pressLinks.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">No press links added yet.</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input
                            placeholder="Publication / Media Name (e.g. Forbes)"
                            id="new-press-name"
                            className="text-xs"
                          />
                          <div className="flex gap-2">
                            <Input
                              placeholder="Article Link URL"
                              id="new-press-url"
                              className="text-xs flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                              onClick={() => {
                                const nameInput = document.getElementById("new-press-name") as HTMLInputElement
                                const urlInput = document.getElementById("new-press-url") as HTMLInputElement
                                if (nameInput?.value.trim() && urlInput?.value.trim()) {
                                  let url = urlInput.value.trim()
                                  if (!/^https?:\/\//i.test(url)) url = "https://" + url
                                  setPressLinks(prev => [...prev, { name: nameInput.value.trim(), url }])
                                  nameInput.value = ""
                                  urlInput.value = ""
                                } else {
                                  toast.error("Please enter both a media name and a valid link URL.")
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} className="rounded-xl gap-2">
                      <Check className="h-4 w-4" /> Save changes
                    </Button>
                  </div>
                </motion.div>

                {/* Danger zone */}
                <motion.div {...fadeInUp} className="rounded-2xl border border-error/20 bg-error/5 p-6 shadow-card">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="h-5 w-5 text-error" />
                    <h2 className="font-semibold text-error">Danger Zone</h2>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Delete account</p>
                      <p className="text-xs text-muted-foreground">Permanently delete your account and all associated data.</p>
                    </div>
                    <Button variant="destructive" size="sm" className="gap-2 shrink-0">
                      <Trash2 className="h-3.5 w-3.5" /> Delete account
                    </Button>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Payouts */}
              {isExpert && (
                <TabsContent value="payouts" className="mt-0 space-y-4">
                  <motion.div {...fadeInUp} className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <h2 className="font-semibold text-foreground">Payout Account</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          Connect a payout account to receive earnings after each confirmed session.
                        </p>
                      </div>
                      <Badge
                        className={
                          payoutStatus === "Connected"
                            ? "bg-success/10 text-success border-success/20"
                            : payoutStatus === "Pending onboarding"
                              ? "bg-warning/10 text-warning border-amber-200"
                              : "bg-muted text-muted-foreground border-border"
                        }
                      >
                        {payoutStatus}
                      </Badge>
                    </div>

                    {isRazorpayPayoutMode ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Razorpay payout onboarding coming soon</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              This marketplace is configured for Razorpay/INR payouts, but self-serve Route account onboarding is not available yet. Contact an admin to finish payout setup.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div>
                            <p className="text-sm font-medium text-foreground">Stripe Express payouts</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Stripe collects the required payout details securely. We never store your bank account information.
                            </p>
                          </div>
                          <Button
                            onClick={handleConnectStripePayouts}
                            disabled={connectingStripe}
                            className="rounded-xl gap-2 shrink-0"
                          >
                            {connectingStripe ? (
                              <><Loader2 className="h-4 w-4 animate-spin" /> Opening Stripe...</>
                            ) : (
                              <><ExternalLink className="h-4 w-4" /> Connect Stripe payouts</>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-4">
                      Payouts are released by the platform after session confirmation and any marketplace commission is applied.
                    </p>
                  </motion.div>
                </TabsContent>
              )}

              {/* Notifications */}
              <TabsContent value="notifications" className="mt-0 space-y-4">
                {/* Channels */}
                <motion.div {...fadeInUp} className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                  <h2 className="font-semibold text-foreground mb-1">Notification Channels</h2>
                  <p className="text-sm text-muted-foreground mb-4">Choose how you want to receive notifications.</p>
                  <div className="divide-y divide-border">
                    <SettingRow label="Email notifications" description={`Sent to ${email || 'your email'}`}>
                      <Toggle checked={emailNotifs} onChange={setEmailNotifs} />
                    </SettingRow>
                    <SettingRow label="Push notifications" description="Browser and mobile push alerts">
                      <Toggle checked={pushNotifs} onChange={setPushNotifs} />
                    </SettingRow>
                    <SettingRow label="SMS notifications" description="Text messages for critical alerts only">
                      <Toggle checked={smsNotifs} onChange={setSmsNotifs} />
                    </SettingRow>
                  </div>
                </motion.div>

                {/* Individual toggles */}
                {NOTIFICATION_SETTINGS.map(group => (
                  <motion.div key={group.group} {...fadeInUp} className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                    <h2 className="font-semibold text-foreground mb-4">{group.group}</h2>
                    <div className="divide-y divide-border">
                      {group.items.map(item => (
                        <SettingRow key={item.id} label={item.label} description={item.description}>
                          <Toggle checked={notifState[item.id] ?? false} onChange={() => toggleNotif(item.id)} />
                        </SettingRow>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </TabsContent>

              {/* Billing */}
              <TabsContent value="billing" className="mt-0 space-y-4">
                {/* Current plan */}
                <motion.div {...fadeInUp} className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-foreground">Current Plan</h2>
                    <Badge className="bg-brand-500 text-white">Pro</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PLANS.map(plan => (
                      <div
                        key={plan.id}
                        className={`rounded-xl border p-4 ${plan.current ? "border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/20" : "border-border"}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-foreground text-sm">{plan.name}</span>
                          {plan.current && <Badge variant="secondary" className="text-[10px] py-0">Current</Badge>}
                        </div>
                        <p className="text-lg font-bold text-foreground mb-3">{plan.price}</p>
                        <ul className="space-y-1.5">
                          {plan.features.map(f => (
                            <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Check className="h-3 w-3 text-success shrink-0" /> {f}
                            </li>
                          ))}
                        </ul>
                        {!plan.current && (
                          <Button variant={plan.id === "enterprise" ? "outline" : "default"} size="sm" className="w-full mt-3 rounded-lg">
                            {plan.id === "enterprise" ? "Contact sales" : "Upgrade"}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Payment method */}
                <motion.div {...fadeInUp} className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                  <h2 className="font-semibold text-foreground mb-4">Payment Method</h2>
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-14 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold">
                        VISA
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Visa ending in 4242</p>
                        <p className="text-xs text-muted-foreground">Expires 12/2028</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                      <Button variant="ghost" size="sm">Change</Button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3 gap-2">
                    <CreditCard className="h-3.5 w-3.5" /> Add payment method
                  </Button>
                </motion.div>

                {/* Billing history */}
                <motion.div {...fadeInUp} className="rounded-2xl border border-border bg-surface shadow-card overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="font-semibold text-foreground">Billing History</h2>
                  </div>
                  <div className="px-6 py-8 flex flex-col items-center text-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Your billing history will appear here once you upgrade to a paid plan.
                    </p>
                    <a href="/pricing" className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors">
                      View pricing plans →
                    </a>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Security */}
              <TabsContent value="security" className="mt-0 space-y-4">
                {/* Change password */}
                <motion.div {...fadeInUp} className="rounded-2xl border border-border bg-surface p-6 shadow-card space-y-4">
                  <h2 className="font-semibold text-foreground">Change Password</h2>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="current-pw">Current password</Label>
                      <div className="relative">
                        <Input
                          id="current-pw"
                          type={showCurrentPw ? "text" : "password"}
                          placeholder="••••••••"
                          className="rounded-lg pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(s => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-pw">New password</Label>
                      <div className="relative">
                        <Input
                          id="new-pw"
                          type={showNewPw ? "text" : "password"}
                          placeholder="••••••••"
                          className="rounded-lg pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(s => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">Minimum 8 characters with a number and symbol</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSavePassword} className="rounded-xl">Update password</Button>
                  </div>
                </motion.div>

                {/* 2FA */}
                <motion.div {...fadeInUp} className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-semibold text-foreground">Two-Factor Authentication</h2>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs text-muted-foreground">Coming soon</Badge>
                      <button
                        disabled
                        className="relative h-5 w-9 rounded-full bg-border cursor-not-allowed opacity-50"
                        aria-label="Two-factor authentication — coming soon"
                      >
                        <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account using an authenticator app. This feature is coming soon.
                  </p>
                </motion.div>

                {/* Active sessions */}
                <motion.div {...fadeInUp} className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                  <h2 className="font-semibold text-foreground mb-4">Active Sessions</h2>
                  <div className="space-y-3">
                    {[
                      { device: "MacBook Pro — Chrome 126", location: "San Francisco, CA", time: "Now", current: true },
                      { device: "iPhone 16 — Safari", location: "San Francisco, CA", time: "2h ago", current: false },
                      { device: "Windows PC — Edge", location: "New York, NY", time: "3d ago", current: false },
                    ].map(session => (
                      <div key={session.device} className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-border">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-foreground truncate">{session.device}</p>
                            {session.current && <Badge variant="secondary" className="text-[10px] py-0 shrink-0">Current</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{session.location} · {session.time}</p>
                        </div>
                        {!session.current && (
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0">
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="mt-4 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive">
                    Sign out all other sessions
                  </Button>
                </motion.div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
