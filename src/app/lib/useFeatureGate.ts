import { useContext } from "react"
import { TenantThemeContext } from "../providers/TenantThemeProvider"
import { getStoredMembership, getSubdomain } from "@/app/lib/api"

const FEATURE_PLAN_FALLBACKS: Record<string, string[]> = {
  ai_matching: ["starter", "pro", "scale", "trial"],
}

export function useFeatureGate(feature: string): { allowed: boolean; plan: string; loading: boolean; role: string; isTenant: boolean } {
  const ctx = useContext(TenantThemeContext)
  const membership = getStoredMembership()
  const plan = (ctx?.plan || "free").toLowerCase()
  const allowedByPlan = FEATURE_PLAN_FALLBACKS[feature]?.includes(plan) === true

  return {
    allowed: ctx?.planFeatures?.[feature] === true || allowedByPlan,
    plan,
    loading: ctx?.loading === true,
    role: membership?.role || "",
    isTenant: !!getSubdomain(),
  }
}
