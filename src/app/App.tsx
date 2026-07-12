import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { Toaster } from "sonner"
import { TenantThemeProvider } from "./providers/TenantThemeProvider"
import { AppShell } from "./components/layout/AppShell"
import { ProtectedRoute } from "./components/auth/ProtectedRoute"
import { AdminShell, AdminOnboardingPage } from "./pages/admin/AdminOnboardingPage"
import { AdminAnalyticsPage } from "./pages/admin/AdminAnalyticsPage"
import { AdminBrandingPage } from "./pages/admin/AdminBrandingPage"
import { AdminExpertApplicationsPage } from "./pages/admin/AdminExpertApplicationsPage"
import { AdminUsersPage } from "./pages/admin/AdminUsersPage"
import { AdminBookingsPage } from "./pages/admin/AdminBookingsPage"
import { AdminPaymentsPage } from "./pages/admin/AdminPaymentsPage"
import { AdminMarketplacePage } from "./pages/admin/AdminMarketplacePage"
import { AdminDomainsPage } from "./pages/admin/AdminDomainsPage"
import { AdminCoursesPage } from "./pages/admin/AdminCoursesPage"
import { AdminSessionsPage } from "./pages/admin/AdminSessionsPage"
import { AdminServicesPage } from "./pages/admin/AdminServicesPage"
import { LandingPage } from "./pages/LandingPage"
import { HomePage } from "./pages/HomePage"
import { ExpertStorefrontPage } from "./pages/ExpertStorefrontPage"
import { CheckoutPage } from "./pages/CheckoutPage"
import { LessonPlayerPage } from "./pages/LessonPlayerPage"
import { QuizPage } from "./pages/QuizPage"
import { InboxPage } from "./pages/InboxPage"
import { DashboardPage } from "./pages/DashboardPage"
import { PricingPage } from "./pages/PricingPage"
import { ContactPage } from "./pages/ContactPage"
import { SettingsPage } from "./pages/SettingsPage"
import {
  LoginEntry,
  SignupEntry,
  CustomerLoginPage,
  ExpertLoginPage,
  CustomerSignupPage,
  ExpertSignupPage,
} from "./pages/AuthPages"
import { ApplyPage } from "./pages/ApplyPage"
import { OnboardingPage } from "./pages/OnboardingPage"
import { SessionRoomPage } from "./pages/SessionRoomPage"
import { NotificationsPage } from "./pages/NotificationsPage"
import { EarningsPage } from "./pages/EarningsPage"

function AdminLandingPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-2 text-foreground">Landing Page Builder</h1>
      <p className="text-muted-foreground mb-6">Customize the layout, colors, hero text, and call-to-actions on your marketplace's landing page.</p>
      
      <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-muted/20">
        <svg className="h-10 w-10 text-brand-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/>
          <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5Z"/>
          <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/>
        </svg>
        <h3 className="font-semibold text-foreground mb-1">Visual Builder Coming Soon</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">We're developing a drag-and-drop editor to let you customize every section of your landing page in real-time.</p>
        <div className="text-xs text-brand-600 bg-brand-50 rounded-lg px-3 py-1.5 inline-block font-medium">
          Planned release: Version 1.2
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <TenantThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes (no Topbar) */}
          <Route path="/login" element={<LoginEntry />} />
          <Route path="/login/customer" element={<CustomerLoginPage />} />
          <Route path="/login/expert" element={<ExpertLoginPage />} />
          <Route path="/signup" element={<SignupEntry />} />
          <Route path="/signup/customer" element={<CustomerSignupPage />} />
          <Route path="/signup/expert" element={<ExpertSignupPage />} />

          {/* Fullscreen standalone routes (no Topbar) */}
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/session/:bookingId" element={<SessionRoomPage />} />
          <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonPlayerPage />} />
          <Route path="/courses/:courseId/lessons/:lessonId/quiz" element={<QuizPage />} />

          {/* Public app routes (with Topbar) */}
          <Route element={<AppShell />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/explore" element={<HomePage />} />
            <Route path="/expert/:username" element={<ExpertStorefrontPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Protected: any authenticated user */}
            <Route element={<ProtectedRoute roles={['expert', 'client', 'operator']} />}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/inbox" element={<InboxPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/earnings" element={<EarningsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Admin routes (with admin sidebar) — operator only */}
          <Route element={<ProtectedRoute roles={['operator']} />}>
            <Route path="/admin" element={<AdminShell />}>
              <Route index element={<Navigate to="/admin/getting-started" replace />} />
              <Route path="getting-started" element={<AdminOnboardingPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="branding" element={<AdminBrandingPage />} />
              <Route path="experts" element={<AdminExpertApplicationsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="payments/stripe" element={<AdminPaymentsPage />} />
              <Route path="payments/razorpay" element={<AdminPaymentsPage />} />
              <Route path="payments/payouts" element={<AdminPaymentsPage />} />
              <Route path="analytics/transactions" element={<AdminAnalyticsPage />} />
              <Route path="analytics/payouts" element={<AdminAnalyticsPage />} />
              <Route path="custom-fields" element={<AdminMarketplacePage />} />
              <Route path="settings" element={<AdminMarketplacePage />} />
              <Route path="categories" element={<AdminMarketplacePage />} />
              <Route path="promo-codes" element={<AdminMarketplacePage />} />
              <Route path="domains" element={<AdminDomainsPage />} />
              <Route path="services" element={<AdminServicesPage />} />
              <Route path="courses" element={<AdminCoursesPage />} />
              <Route path="sessions" element={<AdminSessionsPage />} />
              <Route path="landing-page" element={<AdminLandingPage />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" richColors />
    </TenantThemeProvider>
  )
}
