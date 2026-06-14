import type { ReactNode } from "react"
import { Link } from "react-router"
import { Lock } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { useFeatureGate } from "@/app/lib/useFeatureGate"

const PLAN_UPGRADE_LABELS: Record<string, string> = {
  ai_matching: "Starter",
  triage_chatbot: "Pro",
  session_summaries: "Pro",
  custom_domain: "Starter",
  webhooks: "Pro",
  promo_codes: "Starter",
  booking_packages: "Pro",
  subscriptions: "Pro",
  group_sessions: "Starter",
  courses: "Pro",
  advanced_analytics: "Pro",
  remove_branding: "Scale",
}

interface FeatureGateProps {
  feature: string
  children: ReactNode
}

/**
 * Wraps children and shows a premium upgrade overlay when the current plan
 * does not include the given feature.
 *
 * Usage: <FeatureGate feature="ai_matching"><AiMatchBar /></FeatureGate>
 */
export function FeatureGate({ feature, children }: FeatureGateProps) {
  const { allowed, loading, role, isTenant } = useFeatureGate(feature)

  if (allowed) return <>{children}</>
  if (loading) return null

  const requiredPlan = PLAN_UPGRADE_LABELS[feature] || "higher"
  const canUpgrade = !isTenant || role === "operator"
  const title = canUpgrade ? `${requiredPlan} Plan Required` : "Marketplace Upgrade Required"
  const description = canUpgrade ? "Upgrade to unlock this feature" : "Ask the marketplace admin to upgrade."

  return (
    <div className="relative">
      {/* Blurred children */}
      <div className="pointer-events-none select-none" style={{ filter: "blur(4px)", opacity: 0.45 }}>
        {children}
      </div>

      {/* Glass morphism overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div
          className="flex flex-col items-center gap-3 rounded-2xl border border-white/20 px-8 py-6 text-center shadow-2xl"
          style={{
            background: "rgba(15, 23, 42, 0.72)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500/20 border border-brand-500/30">
            <Lock className="h-5 w-5 text-brand-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm" style={{ fontFamily: "var(--font-heading)" }}>
              {title}
            </p>
            <p className="text-slate-400 text-xs mt-0.5">
              {description}
            </p>
          </div>
          {canUpgrade && (
            <Link to={isTenant ? "/admin/payments" : "/pricing"}>
              <Button size="sm" variant="cta" className="rounded-full px-5 text-xs">
                Upgrade to unlock →
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
