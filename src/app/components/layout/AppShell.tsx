import { Outlet } from "react-router"
import { useEffect } from "react"
import { Topbar } from "./Topbar"
import { TriageChatbot } from "@/app/components/ai/TriageChatbot"
import { api, getSubdomain, syncAuthSession } from "@/app/lib/api"

export function AppShell() {
  const isTenant = !!getSubdomain()

  useEffect(() => {
    syncAuthSession()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <main>
        <Outlet />
      </main>
      {/* AI triage chatbot shown only on tenant marketplaces */}
      {isTenant && <TriageChatbot />}
    </div>
  )
}
