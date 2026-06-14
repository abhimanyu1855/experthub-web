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
            <Route path="/contact" element={<div className="p-8"><h1 className="text-2xl font-semibold">Contact Us</h1><p className="text-slate-500 mt-2">Contact page coming soon.</p></div>} />

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
              <Route path="landing-page" element={<div className="p-8"><h1 className="text-2xl font-semibold">Landing Page Builder</h1><p className="text-slate-500 mt-2">Landing page builder coming soon.</p></div>} />
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
