import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import { api } from "@/app/lib/api"

interface TenantConfig {
  name: string
  slogan: string
  primaryColor: string
  logoText: string
  borderRadius?: string
  fontFamily?: string
  plan: string
  planFeatures: Record<string, any>
  trialDaysRemaining: number | null
  loading: boolean
}

const defaultTenant: TenantConfig = {
  name: "ExpertHub",
  slogan: "Connect with world-class experts",
  primaryColor: "#6366f1",
  logoText: "EH",
  borderRadius: "0.5rem",
  fontFamily: undefined,
  plan: "free",
  planFeatures: {},
  trialDaysRemaining: null,
  loading: true,
}

export const TenantThemeContext = createContext<TenantConfig>(defaultTenant)

export function useTenant() {
  return useContext(TenantThemeContext)
}

/** Compute WCAG relative luminance from a 6-digit hex color string. */
function getRelativeLuminance(hex: string): number {
  const clean = hex.replace("#", "")
  if (clean.length !== 6) return 0.5
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

export function TenantThemeProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig>(defaultTenant)

  useEffect(() => {
    api.get("/tenant")
      .then((res: any) => {
        if (res) {
          setTenant({
            name: res.name || defaultTenant.name,
            slogan: res.slogan || defaultTenant.slogan,
            primaryColor: res.theme?.primary_color || res.settings?.primaryColor || defaultTenant.primaryColor,
            logoText: res.theme?.logo_text || res.settings?.logoText || defaultTenant.logoText,
            borderRadius: res.theme?.border_radius || defaultTenant.borderRadius,
            fontFamily: res.theme?.font_family || undefined,
            plan: res.plan || "free",
            planFeatures: res.plan_features || {},
            trialDaysRemaining: res.trial_days_remaining ?? null,
            loading: false,
          })
          if (res.name) {
            document.title = res.name
            const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]')
            appleTitle?.setAttribute("content", res.name)
          }
          const primary = res.theme?.primary_color || res.settings?.primaryColor
          if (primary) {
            document.querySelector('meta[name="theme-color"]')?.setAttribute("content", primary)
          }
        } else {
          setTenant(current => ({ ...current, loading: false }))
        }
      })
      .catch((err) => {
        console.error("Failed to load tenant config for branding:", err)
        setTenant({ ...defaultTenant, loading: false })
      })
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const primary = tenant.primaryColor

    root.style.setProperty("--tenant-primary", primary)

    const luminance = getRelativeLuminance(primary)
    const foreground = luminance > 0.35 ? "#0f172a" : "#ffffff"
    root.style.setProperty("--tenant-primary-foreground", foreground)

    if (tenant.borderRadius) {
      root.style.setProperty("--tenant-radius", tenant.borderRadius)
    }

    if (tenant.fontFamily) {
      root.style.setProperty("--tenant-font", tenant.fontFamily)
      root.style.setProperty("--font-body", tenant.fontFamily)
    }
  }, [tenant])

  return (
    <TenantThemeContext.Provider value={tenant}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange storageKey="experthub-theme">
        {children}
      </ThemeProvider>
    </TenantThemeContext.Provider>
  )
}
