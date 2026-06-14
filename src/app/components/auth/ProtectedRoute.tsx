import { Navigate, Outlet, useLocation } from "react-router"
import { getStoredMembership } from "@/app/lib/api"
import { loginPathForReturnTo } from "@/app/lib/auth-routes"

interface ProtectedRouteProps {
  roles?: string[]
}

export function ProtectedRoute({ roles = [] }: ProtectedRouteProps) {
  const location = useLocation()
  const token = localStorage.getItem("token")

  if (!token) {
    if (location.pathname === "/checkout" && location.state) {
      sessionStorage.setItem("experthub.pendingCheckout", JSON.stringify(location.state))
    }
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    const loginPath = loginPathForReturnTo(location.pathname, roles)
    return <Navigate to={`${loginPath}?returnTo=${encodeURIComponent(returnTo)}`} replace state={{ returnTo }} />
  }

  if (roles.length > 0) {
    const membership = getStoredMembership()
    const userRole: string = membership?.role ?? ""

    if (!roles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <Outlet />
}
