import { getSubdomain } from "@/app/lib/api"

export type AuthAudience = "customer" | "expert" | "operator"

export function loginPathForAudience(audience: AuthAudience) {
  if (audience === "operator") return "/login"
  return `/login/${audience}`
}

export function signupPathForAudience(audience: AuthAudience) {
  if (audience === "operator") return "/signup"
  return `/signup/${audience}`
}

/** Pick the best sign-in route for an unauthenticated redirect. */
export function loginPathForReturnTo(pathname: string, requiredRoles?: string[]) {
  if (requiredRoles?.length === 1 && requiredRoles[0] === "operator") {
    return loginPathForAudience("expert")
  }
  if (pathname.startsWith("/admin")) return loginPathForAudience("expert")
  if (pathname.startsWith("/checkout")) return loginPathForAudience("customer")
  if (pathname.startsWith("/earnings")) return loginPathForAudience("expert")
  return getSubdomain() ? loginPathForAudience("customer") : loginPathForAudience("operator")
}

export function roleForAudience(audience: AuthAudience) {
  if (audience === "customer") return "client"
  if (audience === "expert") return "expert"
  return "operator"
}

export function audienceAllowsRole(audience: AuthAudience, role: string) {
  if (audience === "customer") return role === "client"
  if (audience === "expert") return role === "expert" || role === "operator"
  return role === "operator"
}
