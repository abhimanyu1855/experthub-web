import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { useTheme } from "next-themes"
import { useTenant } from "@/app/providers/TenantThemeProvider"
import { api, getSubdomain } from "@/app/lib/api"
import { useAuthSession } from "@/app/lib/useAuthSession"
import {
  Bell, Menu, Search, X, ChevronDown, MessageSquare,
  LayoutDashboard, Settings, LogOut, User,
  Sun, Moon, Check, TrendingUp, Calendar, CalendarCheck, CalendarX
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/app/components/ui/sheet"
import { Badge } from "@/app/components/ui/badge"
import { useNotifications, type ApiNotification } from "@/app/lib/notifications"

const navLinks = [
  { label: "Explore", href: "/explore" },
  { label: "Courses", href: "/explore?tab=courses" },
  { label: "Pricing", href: "/pricing" },
]

const NOTIF_TYPE_META: Record<string, { Icon: React.ElementType; iconColor: string; iconBg: string; label: string }> = {
  new_message:        { Icon: MessageSquare,  iconColor: "text-blue-600",   iconBg: "bg-blue-50",   label: "New message" },
  booking_confirmed:  { Icon: CalendarCheck,  iconColor: "text-green-600",  iconBg: "bg-green-50",  label: "Booking confirmed" },
  booking_cancelled:  { Icon: CalendarX,      iconColor: "text-red-600",    iconBg: "bg-red-50",    label: "Booking cancelled" },
  new_booking:        { Icon: Calendar,       iconColor: "text-brand-600",  iconBg: "bg-brand-50",  label: "New booking" },
}

const DEFAULT_NOTIF_META = { Icon: Bell, iconColor: "text-muted-foreground", iconBg: "bg-muted", label: "Notification" }

function notifMeta(type: string) {
  return NOTIF_TYPE_META[type] ?? DEFAULT_NOTIF_META
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function notifDestination(n: ApiNotification): string {
  if (n.data?.conversation_id) return "/inbox"
  if (n.data?.booking_id) return "/dashboard"
  return "/notifications"
}

function NotificationCenter({ onClose, notifications, unreadCount, markRead, markAllRead }: {
  onClose: () => void
  notifications: ApiNotification[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
}) {
  const navigate = useNavigate()

  function handleClick(n: ApiNotification) {
    if (!n.read) markRead(n.id)
    navigate(notifDestination(n))
    onClose()
  }

  return (
    <div className="w-80 flex flex-col max-h-[28rem]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Badge className="h-5 px-1.5 text-[10px] bg-brand-500">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
          >
            <Check className="h-3 w-3" /> Mark all read
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">No notifications yet</div>
        ) : notifications.map((n) => {
          const { Icon, iconColor, iconBg, label } = notifMeta(n.notification_type)
          const snippet = n.data?.snippet ?? n.data?.message ?? label
          return (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
                !n.read ? "bg-brand-50/50" : ""
              }`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-semibold truncate ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{relativeTime(n.created_at)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{snippet}</p>
              </div>
              {!n.read && (
                <div className="h-2 w-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
              )}
            </button>
          )
        })}
      </div>

      <div className="border-t border-border px-4 py-2.5">
        <Link to="/notifications" className="text-xs text-brand-600 hover:text-brand-700 font-medium w-full text-center block">
          View all notifications
        </Link>
      </div>
    </div>
  )
}

export function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const darkMode = theme === "dark"

  const toggleDark = () => setTheme(darkMode ? "light" : "dark")

  const { user, membership, isAuthenticated } = useAuthSession()

  const isOperator = membership?.role === "operator"
  const isExpert = membership?.role === "expert"
  const isClient = membership?.role === "client"
  const displayName = user ? (user.display_name || `${user.given_name || ""} ${user.family_name || ""}`.trim() || user.email) : ""
  const email = user ? user.email : ""
  const initial = user ? (user.given_name?.[0] || user.display_name?.[0] || user.email?.[0] || "U").toUpperCase() : "?"

  const tenantConfig = useTenant()
  const isTenant = !!getSubdomain()

  const visibleLinks = !isAuthenticated
    ? (!isTenant
        ? [{ label: "Pricing", href: "/pricing" }]
        : [
            { label: "Explore", href: "/explore" },
            { label: "Courses", href: "/explore?tab=courses" }
          ]
      )
    : []

  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(isAuthenticated)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span style={{ fontFamily: "var(--font-heading)" }} className="text-sm font-bold">{tenantConfig.logoText}</span>
          </div>
          <span style={{ fontFamily: "var(--font-heading)" }} className="hidden text-lg font-bold text-foreground sm:block">
            {tenantConfig.name}
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {visibleLinks.map((link) => {
            const isActive = location.pathname === link.href.split("?")[0] && !link.href.includes("?")
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary bg-brand-50" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Search pill (desktop) */}
        {isTenant && (
          <div className="hidden md:flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground cursor-pointer hover:border-primary/40 hover:bg-brand-50/50 transition-colors w-56">
            <Search className="h-4 w-4 shrink-0" />
            <span>Search experts...</span>
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex text-muted-foreground hover:text-foreground"
            onClick={toggleDark}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Notifications */}
          {isAuthenticated && (
            <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hidden sm:flex">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-0 rounded-2xl overflow-hidden shadow-modal" sideOffset={8}>
                <NotificationCenter
                  onClose={() => setNotifOpen(false)}
                  notifications={notifications}
                  unreadCount={unreadCount}
                  markRead={markRead}
                  markAllRead={markAllRead}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Messages */}
          {isAuthenticated && (
            <Link to="/inbox" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="relative">
                <MessageSquare className="h-5 w-5" />
              </Button>
            </Link>
          )}

          {/* User Menu */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-1 ml-1 transition-colors hover:bg-muted focus-visible:outline-none">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-semibold">
                    {initial}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl" sideOffset={8}>
                <div className="px-3 py-2.5">
                  <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                </div>
                <DropdownMenuSeparator />
                {isExpert && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer rounded-lg">
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/earnings" className="flex items-center gap-2 cursor-pointer rounded-lg">
                        <TrendingUp className="h-4 w-4" /> Earnings
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                {isClient && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer rounded-lg">
                        <LayoutDashboard className="h-4 w-4" /> My Bookings
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2 cursor-pointer rounded-lg">
                    <User className="h-4 w-4" /> Profile & Settings
                  </Link>
                </DropdownMenuItem>
                {isOperator && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin/getting-started" className="flex items-center gap-2 cursor-pointer rounded-lg">
                        <Settings className="h-4 w-4" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer rounded-lg text-destructive focus:text-destructive"
                  onClick={async () => {
                    await api.logout()
                    navigate("/")
                  }}
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isTenant ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login/customer">Client sign in</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login/expert">Expert sign in</Link>
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm" asChild>
                <Link to="/signup/customer">Sign up</Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm" asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
            </div>
          )}

          {/* Mobile burger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden ml-1">
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex items-center gap-2 p-5 border-b border-border">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {tenantConfig.logoText}
                </div>
                <span className="font-bold text-lg" style={{ fontFamily: "var(--font-heading)" }}>{tenantConfig.name}</span>
              </div>
              <nav className="p-4 space-y-1">
                {visibleLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-brand-50 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                {isAuthenticated ? (
                  <div className="pt-2 border-t border-border mt-2 space-y-1">
                    {isExpert && (
                      <>
                        <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-brand-50 transition-colors">
                          <LayoutDashboard className="h-4 w-4" /> Dashboard
                        </Link>
                        <Link to="/earnings" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-brand-50 transition-colors">
                          <TrendingUp className="h-4 w-4" /> Earnings
                        </Link>
                      </>
                    )}
                    {isClient && (
                      <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-brand-50 transition-colors">
                        <LayoutDashboard className="h-4 w-4" /> My Bookings
                      </Link>
                    )}
                    <Link to="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-brand-50 transition-colors">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    {isOperator && (
                      <Link to="/admin/getting-started" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-brand-50 transition-colors">
                        <Settings className="h-4 w-4" /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={async () => {
                        await api.logout()
                        setMobileOpen(false)
                        navigate("/")
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-border mt-2 space-y-1">
                    {isTenant ? (
                      <>
                        <Link to="/login/customer" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-brand-50 transition-colors">
                          Client sign in
                        </Link>
                        <Link to="/login/expert" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-brand-50 transition-colors">
                          Expert / admin sign in
                        </Link>
                      </>
                    ) : (
                      <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-brand-50 transition-colors">
                        Sign in
                      </Link>
                    )}
                    <Link to={isTenant ? "/signup/customer" : "/signup"} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-brand-50 transition-colors">
                      Sign up
                    </Link>
                    {isTenant && (
                      <Link to="/signup/expert" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-brand-50 transition-colors">
                        Expert sign up
                      </Link>
                    )}
                  </div>
                )}
                <div className="pt-2 border-t border-border mt-2">
                  <button
                    onClick={toggleDark}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-brand-50 transition-colors w-full text-left"
                  >
                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {darkMode ? "Light mode" : "Dark mode"}
                  </button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
