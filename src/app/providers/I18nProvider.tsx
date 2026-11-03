import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useTenant } from "./TenantThemeProvider"

export type LocaleCode = "en" | "hi" | "ar" | "es" | "fr" | "de" | "pt" | "ja"

export interface LanguageMeta {
  code: LocaleCode
  name: string
  nativeName: string
  flag: string
  rtl: boolean
  countries: string[]
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", rtl: false, countries: ["IN", "US", "GB", "CA", "AU", "SG", "AE"] },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", rtl: false, countries: ["IN"] },
  { code: "ar", name: "Arabic (RTL)", nativeName: "العربية", flag: "🇦🇪", rtl: true, countries: ["AE", "SA", "QA", "EG", "KW"] },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", rtl: false, countries: ["ES", "MX", "CO", "AR", "CL"] },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", rtl: false, countries: ["FR", "BE", "SN", "CI", "CH", "CA"] },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", rtl: false, countries: ["DE", "AT", "CH"] },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷", rtl: false, countries: ["BR", "PT"] },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", rtl: false, countries: ["JP"] },
]

export interface CountryPreset {
  code: string
  name: string
  flag: string
  defaultLocale: LocaleCode
  recommendedLocales: LocaleCode[]
}

export const COUNTRY_PRESETS: CountryPreset[] = [
  { code: "IN", name: "India", flag: "🇮🇳", defaultLocale: "en", recommendedLocales: ["en", "hi"] },
  { code: "US", name: "United States", flag: "🇺🇸", defaultLocale: "en", recommendedLocales: ["en", "es"] },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", defaultLocale: "en", recommendedLocales: ["en"] },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", defaultLocale: "en", recommendedLocales: ["en", "ar"] },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", defaultLocale: "ar", recommendedLocales: ["ar", "en"] },
  { code: "ES", name: "Spain", flag: "🇪🇸", defaultLocale: "es", recommendedLocales: ["es", "en"] },
  { code: "MX", name: "Mexico", flag: "🇲🇽", defaultLocale: "es", recommendedLocales: ["es", "en"] },
  { code: "FR", name: "France", flag: "🇫🇷", defaultLocale: "fr", recommendedLocales: ["fr", "en"] },
  { code: "DE", name: "Germany", flag: "🇩🇪", defaultLocale: "de", recommendedLocales: ["de", "en"] },
  { code: "BR", name: "Brazil", flag: "🇧🇷", defaultLocale: "pt", recommendedLocales: ["pt", "en"] },
  { code: "JP", name: "Japan", flag: "🇯🇵", defaultLocale: "ja", recommendedLocales: ["ja", "en"] },
]

const DICTIONARY: Record<LocaleCode, Record<string, string>> = {
  en: {
    "nav.explore": "Explore",
    "nav.courses": "Courses",
    "nav.pricing": "Pricing",
    "nav.search_placeholder": "Search experts...",
    "nav.client_signin": "Client sign in",
    "nav.expert_signin": "Expert sign in",
    "nav.signin": "Sign in",
    "nav.signup": "Sign up",
    "hero.badge": "Welcome to our expert community",
    "hero.welcome": "Welcome to",
    "hero.explore_cta": "Explore Listings",
    "hero.apply_expert": "Apply as an Expert",
    "hero.featured_1on1": "Featured 1:1 Consultations",
    "hero.available_courses": "Available Courses",
    "hero.live_sessions": "Upcoming Live Sessions",
    "hero.book": "Book",
    "hero.enroll": "Enroll",
    "hero.register": "Register",
    "geo.auto_banner": "Select your preferred language (Admin-enabled)",
    "geo.default_label": "Marketplace Default",
  },
  hi: {
    "nav.explore": "विशेषज्ञ खोजें",
    "nav.courses": "कोर्सेज",
    "nav.pricing": "मूल्य निर्धारण",
    "nav.search_placeholder": "विशेषज्ञों को खोजें...",
    "nav.client_signin": "क्लाइंट लॉग इन",
    "nav.expert_signin": "विशेषज्ञ लॉग इन",
    "nav.signin": "लॉग इन",
    "nav.signup": "साइन अप",
    "hero.badge": "हमारे विशेषज्ञ समुदाय में आपका स्वागत है",
    "hero.welcome": "स्वागत है",
    "hero.explore_cta": "विशेषज्ञ सेवाएं देखें",
    "hero.apply_expert": "विशेषज्ञ के रूप में जुड़ें",
    "hero.featured_1on1": "प्रमुख 1:1 लाइव परामर्श",
    "hero.available_courses": "उपलब्ध कोर्सेज",
    "hero.live_sessions": "आगामी लाइव कार्यशालाएं",
    "hero.book": "बुक करें",
    "hero.enroll": "नामांकन करें",
    "hero.register": "रजिस्टर करें",
    "geo.auto_banner": "अपनी पसंदीदा भाषा चुनें",
    "geo.default_label": "मार्केटप्लेस डिफ़ॉल्ट भाषा",
  },
  ar: {
    "nav.explore": "استكشف الخبراء",
    "nav.courses": "الدورات التدريبية",
    "nav.pricing": "الأسعار",
    "nav.search_placeholder": "ابحث عن خبير...",
    "nav.client_signin": "دخول العميل",
    "nav.expert_signin": "دخول الخبير",
    "nav.signin": "تسجيل الدخول",
    "nav.signup": "إنشاء حساب",
    "hero.badge": "مرحباً بكم في مجتمع الخبراء المعتمدين",
    "hero.welcome": "مرحباً بك في",
    "hero.explore_cta": "استكشف الاستشارات",
    "hero.apply_expert": "انضم كخبير معتمد",
    "hero.featured_1on1": "استشارات فردية مباشرة 1:1",
    "hero.available_courses": "الدورات التدريبية المتاحة",
    "hero.live_sessions": "الجلسات الجماعية المباشرة",
    "hero.book": "احجز الآن",
    "hero.enroll": "اشترك",
    "hero.register": "سجّل مقعدك",
    "geo.auto_banner": "اختر لغتك المفضلة",
    "geo.default_label": "اللغة الافتراضية للمنصة",
  },
  es: {
    "nav.explore": "Explorar",
    "nav.courses": "Cursos",
    "nav.pricing": "Precios",
    "nav.search_placeholder": "Buscar expertos...",
    "nav.client_signin": "Acceso clientes",
    "nav.expert_signin": "Acceso expertos",
    "nav.signin": "Iniciar sesión",
    "nav.signup": "Registrarse",
    "hero.badge": "Bienvenido a nuestra comunidad de expertos",
    "hero.welcome": "Bienvenido a",
    "hero.explore_cta": "Explorar Especialistas",
    "hero.apply_expert": "Postular como Experto",
    "hero.featured_1on1": "Consultas 1:1 Destacadas",
    "hero.available_courses": "Cursos Disponibles",
    "hero.live_sessions": "Próximas Sesiones en Vivo",
    "hero.book": "Reservar",
    "hero.enroll": "Inscribirse",
    "hero.register": "Registrarse",
    "geo.auto_banner": "Selecciona tu idioma preferido",
    "geo.default_label": "Idioma predeterminado",
  },
  fr: {
    "nav.explore": "Explorer",
    "nav.courses": "Cours",
    "nav.pricing": "Tarifs",
    "nav.search_placeholder": "Rechercher des experts...",
    "nav.client_signin": "Accès client",
    "nav.expert_signin": "Accès expert",
    "nav.signin": "Connexion",
    "nav.signup": "S'inscrire",
    "hero.badge": "Bienvenue dans notre communauté d'experts",
    "hero.welcome": "Bienvenue sur",
    "hero.explore_cta": "Explorer les Experts",
    "hero.apply_expert": "Devenir Expert",
    "hero.featured_1on1": "Consultations 1:1 à la Une",
    "hero.available_courses": "Formations Disponibles",
    "hero.live_sessions": "Sessions de Groupe en Direct",
    "hero.book": "Réserver",
    "hero.enroll": "S'inscrire",
    "hero.register": "Participer",
    "geo.auto_banner": "Choisissez votre langue préférée",
    "geo.default_label": "Langue par défaut",
  },
  de: {
    "nav.explore": "Entdecken",
    "nav.courses": "Kurse",
    "nav.pricing": "Preise",
    "nav.search_placeholder": "Experten suchen...",
    "nav.client_signin": "Kunden-Login",
    "nav.expert_signin": "Experten-Login",
    "nav.signin": "Anmelden",
    "nav.signup": "Registrieren",
    "hero.badge": "Willkommen in unserer Experten-Community",
    "hero.welcome": "Willkommen bei",
    "hero.explore_cta": "Experten entdecken",
    "hero.apply_expert": "Als Experte bewerben",
    "hero.featured_1on1": "Empfohlene 1:1-Beratungen",
    "hero.available_courses": "Verfügbare Kurse",
    "hero.live_sessions": "Kommende Live-Sitzungen",
    "hero.book": "Buchen",
    "hero.enroll": "Einschreiben",
    "hero.register": "Anmelden",
    "geo.auto_banner": "Wählen Sie Ihre bevorzugte Sprache",
    "geo.default_label": "Standardsprache",
  },
  pt: {
    "nav.explore": "Explorar",
    "nav.courses": "Cursos",
    "nav.pricing": "Preços",
    "nav.search_placeholder": "Buscar especialistas...",
    "nav.client_signin": "Entrar como cliente",
    "nav.expert_signin": "Entrar como especialista",
    "nav.signin": "Entrar",
    "nav.signup": "Cadastrar",
    "hero.badge": "Bem-vindo à nossa comunidade de especialistas",
    "hero.welcome": "Bem-vindo ao",
    "hero.explore_cta": "Explorar Especialistas",
    "hero.apply_expert": "Candidatar-se como Especialista",
    "hero.featured_1on1": "Consultorias 1:1 em Destaque",
    "hero.available_courses": "Cursos Disponíveis",
    "hero.live_sessions": "Próximas Sessões ao Vivo",
    "hero.book": "Agendar",
    "hero.enroll": "Matricular",
    "hero.register": "Inscrever-se",
    "geo.auto_banner": "Selecione seu idioma de preferência",
    "geo.default_label": "Idioma padrão",
  },
  ja: {
    "nav.explore": "専門家を探す",
    "nav.courses": "コース",
    "nav.pricing": "料金プラン",
    "nav.search_placeholder": "専門家を検索...",
    "nav.client_signin": "クライアントログイン",
    "nav.expert_signin": "専門家ログイン",
    "nav.signin": "ログイン",
    "nav.signup": "新規登録",
    "hero.badge": "認定エキスパートコミュニティへようこそ",
    "hero.welcome": "ようこそ",
    "hero.explore_cta": "出品サービスを見る",
    "hero.apply_expert": "専門家として登録",
    "hero.featured_1on1": "注目の1対1オンライン相談",
    "hero.available_courses": "オンデマンド講座",
    "hero.live_sessions": "開催予定のライブセッション",
    "hero.book": "予約する",
    "hero.enroll": "受講する",
    "hero.register": "参加登録",
    "geo.auto_banner": "ご希望の言語を選択してください",
    "geo.default_label": "デフォルト言語",
  },
}

function detectBrowserCountry(): string {
  try {
    const urlCountry = new URLSearchParams(window.location.search).get("country")
    if (urlCountry && urlCountry.length === 2) {
      const upper = urlCountry.toUpperCase()
      localStorage.setItem("experthub_country", upper)
      return upper
    }
    const stored = localStorage.getItem("experthub_country")
    if (stored && stored.length === 2) return stored.toUpperCase()

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
    if (tz.includes("Kolkata") || tz.includes("Calcutta")) return "IN"
    if (tz.includes("Dubai") || tz.includes("Muscat")) return "AE"
    if (tz.includes("Riyadh") || tz.includes("Qatar") || tz.includes("Kuwait")) return "SA"
    if (tz.includes("Madrid")) return "ES"
    if (tz.includes("Mexico") || tz.includes("Bogota") || tz.includes("Buenos_Aires")) return "MX"
    if (tz.includes("Paris") || tz.includes("Brussels")) return "FR"
    if (tz.includes("Berlin") || tz.includes("Vienna") || tz.includes("Zurich")) return "DE"
    if (tz.includes("Sao_Paulo") || tz.includes("Lisbon")) return "BR"
    if (tz.includes("Tokyo")) return "JP"
    if (tz.includes("London")) return "GB"
  } catch {
    // ignore
  }
  return "IN"
}

interface I18nContextValue {
  locale: LocaleCode
  country: string
  isRtl: boolean
  resolutionSource: "user_override" | "country_auto" | "tenant_default"
  supportedLanguages: LanguageMeta[]
  recommendedLanguagesForCountry: LanguageMeta[]
  setLocale: (code: LocaleCode) => void
  setSimulatedCountry: (countryCode: string) => void
  resetToTenantDefault: () => void
  t: (key: string, fallback?: string) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  country: "IN",
  isRtl: false,
  resolutionSource: "tenant_default",
  supportedLanguages: SUPPORTED_LANGUAGES,
  recommendedLanguagesForCountry: SUPPORTED_LANGUAGES.slice(0, 2),
  setLocale: () => {},
  setSimulatedCountry: () => {},
  resetToTenantDefault: () => {},
  t: (_k, fb) => fb || _k,
})

export function useI18n() {
  return useContext(I18nContext)
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const tenant = useTenant()
  const [country, setCountryState] = useState<string>(() => detectBrowserCountry())
  const [userOverrideLocale, setUserOverrideLocale] = useState<LocaleCode | null>(() => {
    try {
      const urlLoc = new URLSearchParams(window.location.search).get("locale") as LocaleCode | null
      if (urlLoc && DICTIONARY[urlLoc]) {
        localStorage.setItem("experthub_locale", urlLoc)
        return urlLoc
      }
      const saved = localStorage.getItem("experthub_locale") as LocaleCode | null
      return saved && DICTIONARY[saved] ? saved : null
    } catch {
      return null
    }
  })

  // Strictly enforce the locales enabled by the Marketplace Admin (`tenant.supportedLocales`)
  const tenantDefault = ((tenant.defaultLocale as LocaleCode) || "en")
  const tenantSupportedCodes = Array.from(
    new Set([
      ...(tenant.supportedLocales && tenant.supportedLocales.length > 0 ? tenant.supportedLocales : [tenantDefault]),
      tenantDefault,
    ])
  )

  const supportedLanguages = SUPPORTED_LANGUAGES.filter((l) =>
    tenantSupportedCodes.includes(l.code)
  )

  // Country recommendations are ALSO strictly intersected with the Admin's `tenantSupportedCodes`.
  // If the Admin only enabled ["en"], Hindi ("hi") is NOT offered or auto-converted!
  const activeCountryPreset = COUNTRY_PRESETS.find((c) => c.code === country) || COUNTRY_PRESETS[0]
  const recommendedLanguagesForCountry = supportedLanguages.filter((l) =>
    activeCountryPreset.recommendedLocales.includes(l.code)
  )

  // Resolve active locale strictly within Admin's `tenantSupportedCodes`:
  // 1. User's explicit language selection (ONLY if permitted in `tenantSupportedCodes`)
  // 2. If Admin's defaultLocale is already valid for the visitor's country (e.g., "en" for India), keep `tenantDefault` ("en")
  // 3. Otherwise use the first country-recommended locale that the Admin has enabled in `tenantSupportedCodes`
  // 4. Fallback to Admin's `tenantDefault`
  let resolvedLocale: LocaleCode = tenantDefault
  let resolutionSource: "user_override" | "country_auto" | "tenant_default" = "tenant_default"

  if (userOverrideLocale && tenantSupportedCodes.includes(userOverrideLocale) && DICTIONARY[userOverrideLocale]) {
    resolvedLocale = userOverrideLocale
    resolutionSource = "user_override"
  } else if (tenant.autoDetectCountryLocale !== false) {
    const allowedForCountry = activeCountryPreset.recommendedLocales.filter((code) =>
      tenantSupportedCodes.includes(code)
    )
    if (allowedForCountry.includes(tenantDefault)) {
      resolvedLocale = tenantDefault
      resolutionSource = "tenant_default"
    } else if (allowedForCountry.length > 0) {
      resolvedLocale = allowedForCountry[0]
      resolutionSource = "country_auto"
    }
  }

  const isRtl = resolvedLocale === "ar"

  useEffect(() => {
    const html = document.documentElement
    html.setAttribute("lang", resolvedLocale)
    html.setAttribute("dir", isRtl ? "rtl" : "ltr")
  }, [resolvedLocale, isRtl])

  const setLocale = (code: LocaleCode) => {
    // Only allow switching to a language enabled by the Marketplace Admin
    if (!tenantSupportedCodes.includes(code)) return
    setUserOverrideLocale(code)
    try {
      localStorage.setItem("experthub_locale", code)
    } catch {
      // ignore
    }
  }

  const setSimulatedCountry = (countryCode: string) => {
    const upper = countryCode.toUpperCase()
    setCountryState(upper)
    setUserOverrideLocale(null)
    try {
      localStorage.setItem("experthub_country", upper)
      localStorage.removeItem("experthub_locale")
    } catch {
      // ignore
    }
  }

  const resetToTenantDefault = () => {
    setUserOverrideLocale(null)
    try {
      localStorage.removeItem("experthub_locale")
    } catch {
      // ignore
    }
  }

  const t = (key: string, fallback?: string): string => {
    return DICTIONARY[resolvedLocale]?.[key] || DICTIONARY.en[key] || fallback || key
  }

  return (
    <I18nContext.Provider
      value={{
        locale: resolvedLocale,
        country,
        isRtl,
        resolutionSource,
        supportedLanguages: supportedLanguages.length > 0 ? supportedLanguages : [SUPPORTED_LANGUAGES[0]],
        recommendedLanguagesForCountry: recommendedLanguagesForCountry.length > 0 ? recommendedLanguagesForCountry : [SUPPORTED_LANGUAGES[0]],
        setLocale,
        setSimulatedCountry,
        resetToTenantDefault,
        t,
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}
