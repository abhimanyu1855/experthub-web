import { useEffect, useState } from "react"
import {
  AUTH_CLEARED_EVENT,
  api,
  getStoredMembership,
  getStoredUser,
  syncAuthSession,
} from "@/app/lib/api"

type SessionState = "checking" | "authenticated" | "guest"

export function useAuthSession() {
  const [sessionState, setSessionState] = useState<SessionState>("checking")
  const [version, setVersion] = useState(0)

  useEffect(() => {
    syncAuthSession()
    const token = localStorage.getItem("token")
    if (!token) {
      setSessionState("guest")
      return
    }

    let cancelled = false
    setSessionState("checking")

    api.get("/me")
      .then(() => {
        if (!cancelled) setSessionState("authenticated")
      })
      .catch(() => {
        if (!cancelled) setSessionState("guest")
      })

    return () => {
      cancelled = true
    }
  }, [version])

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    window.addEventListener(AUTH_CLEARED_EVENT, bump)
    window.addEventListener("storage", bump)
    return () => {
      window.removeEventListener(AUTH_CLEARED_EVENT, bump)
      window.removeEventListener("storage", bump)
    }
  }, [])

  const token = sessionState === "authenticated" ? localStorage.getItem("token") : null
  const user = token ? getStoredUser() : null
  const membership = token ? getStoredMembership() : null

  return {
    token,
    user,
    membership,
    isAuthenticated: sessionState === "authenticated",
    sessionReady: sessionState !== "checking",
  }
}
