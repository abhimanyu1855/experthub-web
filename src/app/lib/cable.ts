import { createConsumer } from "@rails/actioncable"
import { AUTH_CLEARED_EVENT, getSubdomain } from "./api"

function resolveCableBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001"
  const configured = import.meta.env.VITE_CABLE_URL
  const raw = configured || apiUrl.replace(/^http/, "ws")
  // Avoid ws://host/cable/cable when env already includes /cable
  return raw.replace(/\/cable\/?$/, "")
}

function getCableUrl(): string {
  const token = localStorage.getItem("token")
  const tenant = getSubdomain()
  const params = new URLSearchParams()
  if (token) params.set("token", token)
  if (tenant) params.set("tenant", tenant)
  const qs = params.toString()
  return `${resolveCableBaseUrl()}/cable${qs ? `?${qs}` : ""}`
}

// Lazily create one consumer per session. Re-create when token changes.
let consumer: ReturnType<typeof createConsumer> | null = null
let consumerToken: string | null = null

export function getCableConsumer() {
  const currentToken = localStorage.getItem("token")
  if (!currentToken) {
    disconnectCable()
    throw new Error("No auth token for ActionCable")
  }

  if (!consumer || consumerToken !== currentToken) {
    consumer?.disconnect()
    consumer = createConsumer(getCableUrl())
    consumerToken = currentToken
  }
  return consumer
}

export function disconnectCable() {
  consumer?.disconnect()
  consumer = null
  consumerToken = null
}

if (typeof window !== "undefined") {
  window.addEventListener(AUTH_CLEARED_EVENT, disconnectCable)
}
