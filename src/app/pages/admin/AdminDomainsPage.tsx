import { useState, useEffect } from "react"
import { Link } from "react-router"
import { Globe, Copy, CheckCircle2, Clock, ChevronRight, Info, ExternalLink } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { toast } from "sonner"
import { api } from "@/app/lib/api"

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard"))
}

export function AdminDomainsPage() {
  const [tenant, setTenant] = useState<any>(null)
  const [customDomain, setCustomDomain] = useState("")
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/tenant")
      .then((data: any) => {
        setTenant(data)
        setCustomDomain(data.custom_domain || "")
      })
      .catch((err: any) => toast.error("Failed to load tenant: " + err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await api.patch("/tenant", { tenant: { custom_domain: customDomain.trim() || null } })
      setTenant(updated)
      toast.success("Custom domain saved.")
    } catch (err: any) {
      toast.error("Failed to save: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    await new Promise(r => setTimeout(r, 800))
    setVerifying(false)
    toast.info("DNS verification coming soon — check back later.")
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">Loading domain settings…</div>
    )
  }

  const subdomain = tenant?.ident
  const appDomain = import.meta.env.VITE_APP_DOMAIN || "experthub.app"
  const defaultUrl = `${subdomain}.${appDomain}`
  const domainStatus: string = tenant?.custom_domain_status || "pending"
  const dnsTxtRecord: string = tenant?.dns_txt_record || ""

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-6">
        <Link to="/" className="hover:text-foreground transition-colors">ExpertHub</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span>Admin</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Custom Domain</span>
      </div>

      <h1 className="text-foreground mb-1" style={{ fontFamily: "var(--font-heading)", fontSize: "1.75rem", fontWeight: 700 }}>
        Custom Domain
      </h1>
      <p className="text-muted-foreground mb-8">
        Connect your own domain so your marketplace runs on your brand URL.
      </p>

      {/* Default subdomain */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-card mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            Default Subdomain
          </h2>
        </div>
        <p className="text-muted-foreground text-sm mb-3">
          Your marketplace is always available at this address, even after connecting a custom domain.
        </p>
        <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-2.5">
          <span className="font-mono text-sm text-foreground flex-1">{defaultUrl}</span>
          <button
            onClick={() => copyToClipboard(`https://${defaultUrl}`)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Copy URL"
          >
            <Copy className="h-4 w-4" />
          </button>
          <a
            href={`https://${defaultUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Custom domain input */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-card mb-5">
        <h2 className="font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          Custom Domain
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          Enter your domain (e.g. <span className="font-mono">experts.acme.com</span>). Point a CNAME record at <span className="font-mono">{defaultUrl}</span> before saving.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={customDomain}
            onChange={e => setCustomDomain(e.target.value)}
            placeholder="experts.yourdomain.com"
            className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* DNS verification */}
      {tenant?.custom_domain && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-card mb-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-foreground mb-0.5" style={{ fontFamily: "var(--font-heading)" }}>
                DNS Verification
              </h2>
              <p className="text-muted-foreground text-sm">
                Add a TXT record to verify you own this domain.
              </p>
            </div>
            {domainStatus === "verified" ? (
              <Badge className="bg-success/10 text-success border-success/30 gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
              </Badge>
            ) : (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Pending
              </Badge>
            )}
          </div>

          {dnsTxtRecord && (
            <div className="bg-muted rounded-xl px-4 py-3 mb-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">TXT Record Value</div>
              <div className="flex items-center gap-3">
                <code className="font-mono text-sm text-foreground break-all flex-1">{dnsTxtRecord}</code>
                <button
                  onClick={() => copyToClipboard(dnsTxtRecord)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Copy TXT record"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            className="rounded-xl"
            onClick={handleVerify}
            disabled={verifying}
          >
            {verifying ? "Checking…" : "Verify DNS"}
          </Button>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-brand-50/60 border border-brand-100 rounded-2xl p-5">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              How to connect your domain
            </h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>
                In your DNS provider, create a <strong>CNAME</strong> record pointing your custom domain to{" "}
                <code className="font-mono bg-white/70 px-1 rounded">{defaultUrl}</code>.
              </li>
              <li>
                Add a <strong>TXT</strong> record with the verification value shown above to confirm domain ownership.
              </li>
              <li>
                Click <strong>Save</strong> to register your domain, then <strong>Verify DNS</strong> once your DNS changes have propagated (may take up to 48 hours).
              </li>
              <li>
                Once verified, your marketplace will be accessible at your custom domain with HTTPS automatically provisioned.
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
