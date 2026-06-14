import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { Check, Upload, RefreshCw, Globe, Palette, Type, Eye, ExternalLink } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Separator } from "@/app/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import { toast } from "sonner"
import { fadeInUp } from "@/app/lib/motion"
import { api } from "@/app/lib/api"
import { Badge } from "@/app/components/ui/badge"

const PRESET_COLORS = [
  { name: "Indigo", primary: "#6366f1", secondary: "#e0e7ff" },
  { name: "Violet", primary: "#7c3aed", secondary: "#ede9fe" },
  { name: "Rose", primary: "#e11d48", secondary: "#ffe4e6" },
  { name: "Emerald", primary: "#059669", secondary: "#d1fae5" },
  { name: "Amber", primary: "#d97706", secondary: "#fef3c7" },
  { name: "Sky", primary: "#0284c7", secondary: "#e0f2fe" },
  { name: "Slate", primary: "#334155", secondary: "#f1f5f9" },
  { name: "Orange", primary: "#ea580c", secondary: "#ffedd5" },
]

const FONT_OPTIONS = [
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans", preview: "Premium & Modern" },
  { value: "Inter", label: "Inter", preview: "Clean & Professional" },
  { value: "DM Sans", label: "DM Sans", preview: "Friendly & Readable" },
  { value: "Sora", label: "Sora", preview: "Geometric & Bold" },
  { value: "Outfit", label: "Outfit", preview: "Contemporary & Clear" },
]

function ColorSwatch({
  color,
  label,
  selected,
  onClick,
}: { color: string; label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
        selected ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500/30" : "border-border hover:border-brand-200 hover:bg-muted/40"
      }`}
    >
      <div
        className="h-8 w-8 rounded-lg shrink-0 shadow-sm"
        style={{ background: color }}
      />
      <span className="text-sm font-medium text-foreground">{label}</span>
      {selected && (
        <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-brand-500 flex items-center justify-center">
          <Check className="h-2.5 w-2.5 text-white" />
        </div>
      )}
    </button>
  )
}

function LivePreview({
  name,
  slogan,
  primaryColor,
  secondaryColor,
  logoText,
  font,
}: {
  name: string
  slogan: string
  primaryColor: string
  secondaryColor: string
  logoText: string
  font: string
}) {
  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-raised bg-white">
      {/* Mock browser bar */}
      <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 border-b border-slate-200">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </div>
        <div className="flex-1 bg-white rounded border border-slate-200 px-3 py-1 text-xs text-slate-400 font-mono">
          {name.toLowerCase().replace(/\s+/g, "")}.experthub.io
        </div>
      </div>

      {/* Mock topbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: primaryColor }}
          >
            {logoText.slice(0, 2).toUpperCase()}
          </div>
          <span style={{ fontFamily: font, fontWeight: 700, color: "#0f172a", fontSize: "15px" }}>{name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Experts</span>
          <span className="text-xs text-slate-400">Courses</span>
          <div
            className="px-3 py-1.5 rounded-full text-white text-xs font-semibold"
            style={{ background: primaryColor }}
          >
            Get Started
          </div>
        </div>
      </div>

      {/* Mock hero */}
      <div className="px-5 py-8 text-center" style={{ background: secondaryColor }}>
        <h1 style={{ fontFamily: font, fontWeight: 800, color: "#0f172a", fontSize: "20px", lineHeight: "1.2" }}>
          Find Your Perfect Expert
        </h1>
        <p style={{ fontFamily: "Inter, sans-serif", color: "#64748b", fontSize: "12px", marginTop: "6px" }}>
          {slogan}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div
            className="px-4 py-2 rounded-lg text-white text-xs font-semibold"
            style={{ background: primaryColor }}
          >
            Browse Experts
          </div>
          <div className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: primaryColor, color: primaryColor }}>
            Become an Expert
          </div>
        </div>
      </div>

      {/* Mock expert card strip */}
      <div className="px-5 py-4 flex gap-3 overflow-hidden">
        {[
          { name: "Dr. Sarah C.", tag: "AI Expert", rate: "$120/h" },
          { name: "Marcus R.", tag: "Strategy", rate: "$100/h" },
          { name: "Dr. Priya P.", tag: "Wellness", rate: "$90/h" },
        ].map((e) => (
          <div key={e.name} className="flex-1 rounded-xl border border-slate-100 p-3 min-w-0">
            <div
              className="h-6 w-6 rounded-full mb-2 text-white text-[10px] font-bold flex items-center justify-center"
              style={{ background: primaryColor }}
            >
              {e.name[0]}
            </div>
            <div style={{ fontFamily: font, fontWeight: 600, fontSize: "11px", color: "#0f172a" }}>{e.name}</div>
            <div style={{ fontSize: "10px", color: "#64748b" }}>{e.tag}</div>
            <div
              className="mt-2 rounded-md text-center py-1 text-[9px] font-semibold text-white"
              style={{ background: primaryColor }}
            >
              Book · {e.rate}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminBrandingPage() {
  const [name, setName] = useState("")
  const [slogan, setSlogan] = useState("")
  const [logoText, setLogoText] = useState("")
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [customColor, setCustomColor] = useState("")
  const [selectedFont, setSelectedFont] = useState("Plus Jakarta Sans")
  const [domain, setDomain] = useState("")
  const [saved, setSaved] = useState(false)

  const primaryColor = customColor || PRESET_COLORS[selectedPreset].primary
  const secondaryColor = PRESET_COLORS[selectedPreset].secondary

  useEffect(() => {
    api.get("/tenant")
      .then((res: any) => {
        if (res) {
          setName(res.name || "")
          setSlogan(res.slogan || "")
          setDomain(res.custom_domain || "")
          if (res.theme) {
            setLogoText(res.theme.logo_text || "EH")
            if (res.theme.primary_color) {
              const idx = PRESET_COLORS.findIndex(p => p.primary.toLowerCase() === res.theme.primary_color.toLowerCase())
              if (idx !== -1) {
                setSelectedPreset(idx)
                setCustomColor("")
              } else {
                setCustomColor(res.theme.primary_color)
              }
            }
            setSelectedFont(res.theme.font || "Plus Jakarta Sans")
          }
        }
      })
      .catch((err: any) => {
        toast.error("Failed to load branding: " + err.message)
      })
  }, [])

  const handleSave = async () => {
    try {
      await api.patch("/tenant", {
        tenant: {
          name,
          slogan,
          custom_domain: domain || null,
          theme: {
            primary_color: primaryColor,
            font: selectedFont,
            logo_text: logoText
          }
        }
      })
      setSaved(true)
      toast.success("Branding saved!", { description: "Changes are now live on your marketplace." })
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      toast.error("Failed to save branding: " + err.message)
    }
  }

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: "var(--font-heading)" }} className="text-2xl font-bold text-foreground">
            Branding & Design
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Customize your marketplace's visual identity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open("/", "_blank")}>
            <Eye className="h-3.5 w-3.5" /> Preview
          </Button>
          <Button onClick={handleSave} size="sm" className="gap-2">
            {saved ? <Check className="h-3.5 w-3.5" /> : null}
            {saved ? "Saved!" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Settings panel */}
        <div className="space-y-4">
          <Tabs defaultValue="identity">
            <TabsList className="mb-4">
              <TabsTrigger value="identity" className="gap-2"><Type className="h-3.5 w-3.5" /> Identity</TabsTrigger>
              <TabsTrigger value="colors" className="gap-2"><Palette className="h-3.5 w-3.5" /> Colors</TabsTrigger>
              <TabsTrigger value="domain" className="gap-2"><Globe className="h-3.5 w-3.5" /> Domain</TabsTrigger>
            </TabsList>

            <TabsContent value="identity" className="space-y-5">
              <motion.div {...fadeInUp} className="rounded-2xl border border-border bg-surface p-5 shadow-card space-y-4">
                <h3 className="font-semibold text-foreground">Marketplace Identity</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mkt-name">Marketplace Name</Label>
                    <Input
                      id="mkt-name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. ConsultPro"
                      className="rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground">Appears in the browser tab and emails</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="logo-text">Logo Initials</Label>
                    <Input
                      id="logo-text"
                      value={logoText}
                      onChange={e => setLogoText(e.target.value.slice(0, 3))}
                      placeholder="EH"
                      maxLength={3}
                      className="rounded-lg"
                    />
                    <p className="text-xs text-muted-foreground">2–3 characters shown in the logo icon</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slogan">Tagline / Slogan</Label>
                  <Input
                    id="slogan"
                    value={slogan}
                    onChange={e => setSlogan(e.target.value)}
                    placeholder="Connect with world-class experts..."
                    className="rounded-lg"
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Logo Upload</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-brand-300 hover:bg-brand-50/30 transition-colors cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Upload logo image</p>
                        <p className="text-xs text-muted-foreground">PNG, SVG, or WebP · Max 2MB · Recommended 200×200px</p>
                      </div>
                      <Button variant="outline" size="sm" className="mt-1">Browse files</Button>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div {...fadeInUp} className="rounded-2xl border border-border bg-surface p-5 shadow-card space-y-4">
                <h3 className="font-semibold text-foreground">Typography</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FONT_OPTIONS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setSelectedFont(f.value)}
                      className={`text-left rounded-xl border p-3.5 transition-all ${
                        selectedFont === f.value
                          ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500/30"
                          : "border-border hover:border-brand-200"
                      }`}
                    >
                      <div style={{ fontFamily: f.value, fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>{f.label}</div>
                      <div style={{ fontFamily: f.value, fontSize: "11px", color: "#64748b" }}>{f.preview}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="colors" className="space-y-4">
              <motion.div {...fadeInUp} className="rounded-2xl border border-border bg-surface p-5 shadow-card space-y-4">
                <h3 className="font-semibold text-foreground">Color Presets</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_COLORS.map((p, i) => (
                    <ColorSwatch
                      key={p.name}
                      color={p.primary}
                      label={p.name}
                      selected={selectedPreset === i && !customColor}
                      onClick={() => { setSelectedPreset(i); setCustomColor("") }}
                    />
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="custom-color">Custom Brand Color</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg border border-border shrink-0 cursor-pointer"
                      style={{ background: primaryColor }}
                    />
                    <Input
                      id="custom-color"
                      value={customColor}
                      onChange={e => setCustomColor(e.target.value)}
                      placeholder="#6366f1"
                      className="rounded-lg font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCustomColor("")}
                      title="Reset to preset"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Enter a hex code to use a fully custom brand color.</p>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="domain" className="space-y-4">
              <motion.div {...fadeInUp} className="rounded-2xl border border-border bg-surface p-5 shadow-card space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                  <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Free subdomain</p>
                    <p className="text-sm text-muted-foreground font-mono">{name.toLowerCase().replace(/\s+/g, "")}.experthub.io</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto shrink-0">Active</Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Custom Domain</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your own domain for a fully white-labeled experience. Available on Pro and Enterprise plans.
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="custom-domain">Your domain</Label>
                    <div className="flex gap-2">
                      <Input
                        id="custom-domain"
                        value={domain}
                        onChange={e => setDomain(e.target.value)}
                        placeholder="experts.yourcompany.com"
                        className="rounded-lg"
                      />
                      <Button variant="outline" className="shrink-0">
                        Verify
                      </Button>
                    </div>
                  </div>

                  {domain && (
                    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                      <p className="text-sm font-medium text-foreground">DNS Configuration</p>
                      <p className="text-xs text-muted-foreground">Add these records to your DNS provider:</p>
                      <div className="space-y-2">
                        {[
                          { type: "CNAME", name: domain, value: "cname.experthub.io" },
                          { type: "TXT", name: `_experthub.${domain}`, value: "verify=xh-abc123" },
                        ].map(r => (
                          <div key={r.type} className="rounded-lg bg-muted/60 p-2.5 text-xs font-mono">
                            <span className="text-brand-600 font-bold">{r.type}</span>
                            <span className="text-muted-foreground ml-2">{r.name}</span>
                            <span className="text-foreground ml-2">→ {r.value}</span>
                          </div>
                        ))}
                      </div>
                      <a href="#" className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700">
                        <ExternalLink className="h-3 w-3" /> View DNS setup guide
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse-online" />
            <p className="text-sm font-medium text-foreground">Live Preview</p>
            <p className="text-xs text-muted-foreground">— Updates as you type</p>
          </div>
          <motion.div {...fadeInUp}>
            <LivePreview
              name={name}
              slogan={slogan}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              logoText={logoText}
              font={selectedFont}
            />
          </motion.div>
          <p className="text-xs text-muted-foreground text-center">Preview is illustrative — actual marketplace may vary.</p>
        </div>
      </div>
    </div>
  )
}
