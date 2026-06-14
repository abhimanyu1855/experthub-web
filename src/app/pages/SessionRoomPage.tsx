import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MessageSquare,
  Users, Settings, Clock, X, Send, LayoutGrid, Hand, Star, AlertCircle
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { api, getStoredUser } from "@/app/lib/api"
import { toast } from "sonner"

type ChatMessage = {
  id: string
  sender: string
  text: string
  time: string
  self: boolean
}

export function SessionRoomPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<"waiting" | "active" | "ended">("waiting")
  
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [screenShare, setScreenShare] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [participantsOpen, setParticipantsOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [timer, setTimer] = useState(0)
  const [layout, setLayout] = useState<"spotlight" | "grid">("spotlight")
  const [handRaised, setHandRaised] = useState(false)
  const [countdown, setCountdown] = useState(5)

  // Review states
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)

  // Conversation for in-call chat persistence
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [sessionTranscript, setSessionTranscript] = useState("")
  const [savingTranscript, setSavingTranscript] = useState(false)

  const currentUser = getStoredUser()

  useEffect(() => {
    if (!bookingId) return

    let pollInterval: any = null

    const fetchBooking = () => {
      api.get(`/bookings/${bookingId}`)
        .then(data => {
          setBooking(data)
          setLoading(false)
          if (phase === "waiting" && data.video_room_url) {
            setPhase("active")
            if (pollInterval) {
              clearInterval(pollInterval)
            }
          }
        })
        .catch(err => {
          setError(err.message)
          setLoading(false)
        })
    }

    fetchBooking()

    // Poll every 5s if video_room_url is not ready yet
    pollInterval = setInterval(() => {
      if (phase === "waiting") {
        fetchBooking()
      }
    }, 5000)

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [bookingId, phase])

  // Load/create conversation and fetch message history once booking is known
  useEffect(() => {
    if (!booking || !currentUser) return

    const isExpertUser = currentUser.id === booking.expert?.id
    const otherPartyUser = isExpertUser ? booking.client : booking.expert
    if (!otherPartyUser?.id) return

    api.post("/conversations", { recipient_id: otherPartyUser.id })
      .then(data => {
        const convId = data.id
        setConversationId(convId)
        return api.get(`/conversations/${convId}/messages`)
      })
      .then(msgs => {
        if (!Array.isArray(msgs)) return
        setMessages(msgs.map((m: any) => ({
          id: String(m.id),
          sender: m.sender?.given_name || m.sender?.name || "User",
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          self: m.sender?.id === currentUser?.id,
        })))
      })
      .catch(err => console.error("Failed to load in-call conversation:", err))
  }, [booking, currentUser?.id])

  useEffect(() => {
    if (phase !== "active") return
    const t = setInterval(() => setTimer(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (booking?.metadata?.transcript) {
      setSessionTranscript(booking.metadata.transcript)
    }
  }, [booking?.metadata?.transcript])

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0")
    const s = (secs % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  function sendMessage() {
    if (!chatInput.trim()) return
    const text = chatInput.trim()
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: "You",
      text,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      self: true,
    }
    setMessages(prev => [...prev, optimistic])
    setChatInput("")

    if (conversationId) {
      api.post(`/conversations/${conversationId}/messages`, { message: { content: text } })
        .catch(err => {
          console.error("Failed to send in-call message:", err)
          setMessages(prev => prev.filter(m => m.id !== optimistic.id))
          toast.error("Failed to send message")
        })
    }
  }

  function endCall() {
    setPhase("ended")
  }

  const submitReview = async () => {
    if (!booking?.service?.id) return
    setSubmittingReview(true)
    try {
      await api.post(`/services/${booking.service.id}/reviews`, {
        review: {
          rating,
          comment,
          booking_id: booking.id
        }
      })
      toast.success("Thank you for your feedback!")
      navigate("/dashboard")
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review")
    } finally {
      setSubmittingReview(false)
    }
  }

  const saveSessionTranscript = async () => {
    if (!bookingId || !sessionTranscript.trim()) return

    setSavingTranscript(true)
    try {
      const updatedBooking = await api.patch(`/bookings/${bookingId}/transcript`, {
        transcript: sessionTranscript.trim(),
        source: "manual"
      })
      setBooking(updatedBooking)
      toast.success(updatedBooking.session_summary ? "Session notes saved and summarized" : "Session notes saved")
    } catch (err: any) {
      toast.error(err.message || "Failed to save session notes")
    } finally {
      setSavingTranscript(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-slate-400">Loading session room...</p>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Error Loading Session</h2>
        <p className="text-slate-400 text-center max-w-md mb-6">{error || "Booking not found."}</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    )
  }

  const isExpert = currentUser?.id === booking.expert?.id
  const otherParty = isExpert ? booking.client : booking.expert
  const otherInitials = otherParty ? `${otherParty.given_name?.[0] || ""}${otherParty.family_name?.[0] || ""}` : "EX"
  const selfInitials = currentUser ? `${currentUser.given_name?.[0] || ""}${currentUser.family_name?.[0] || ""}` : "YO"

  if (phase === "waiting") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md w-full"
        >
          {/* Partner avatar */}
          <div className="relative mx-auto w-28 h-28 mb-6">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
              {otherInitials}
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 rounded-full border-2 border-violet-400/40"
            />
            <motion.div
              animate={{ scale: [1, 1.35, 1] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
              className="absolute inset-0 rounded-full border border-violet-400/20"
            />
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            {otherParty ? `${otherParty.given_name} ${otherParty.family_name}` : "Expert"}
          </h2>
          <p className="text-slate-400 mb-2">{isExpert ? "Client" : booking.service?.title}</p>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-8">
            <Clock className="h-3 w-3 mr-1" /> Waiting for video room...
          </Badge>

          <div className="bg-slate-900/80 rounded-2xl p-5 mb-6 border border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Session Details</p>
            <div className="space-y-2 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Service</span>
                <span className="text-white">{booking.service?.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Duration</span>
                <span className="text-white">{booking.duration_minutes || 60} minutes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Booking ID</span>
                <span className="text-slate-300 font-mono text-xs">{booking.id}</span>
              </div>
            </div>
          </div>

          {/* Camera preview */}
          <div className="relative bg-slate-800 rounded-2xl overflow-hidden h-40 mb-6 border border-slate-700">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-2">
                  {selfInitials}
                </div>
                <p className="text-xs text-slate-400">Your camera preview</p>
              </div>
            </div>
            <div className="absolute bottom-3 left-3 flex gap-2">
              <button
                onClick={() => setMicOn(v => !v)}
                className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${micOn ? "bg-slate-700 text-white" : "bg-red-500 text-white"}`}
              >
                {micOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setCamOn(v => !v)}
                className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${camOn ? "bg-slate-700 text-white" : "bg-red-500 text-white"}`}
              >
                {camOn ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-400">Please stay on this page. We will connect you automatically.</p>
        </motion.div>
      </div>
    )
  }

  if (phase === "ended") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-2xl w-full">
          <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6">
            <PhoneOff className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>Session Ended</h2>
          <p className="text-slate-400 mb-2">Duration: {formatTime(timer)}</p>
          <p className="text-slate-400 mb-8">
            Your session has ended.
          </p>

          <div className="bg-slate-900 rounded-2xl p-5 mb-6 border border-slate-800 text-left">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-sm font-medium text-white">Session notes / transcript</p>
                <p className="text-xs text-slate-500 mt-1">
                  Paste the call notes or transcript here to generate an AI session summary.
                </p>
              </div>
              {booking.metadata?.transcript_source && (
                <Badge className="bg-slate-800 text-slate-300 border-slate-700 capitalize">
                  {booking.metadata.transcript_source}
                </Badge>
              )}
            </div>
            <textarea
              placeholder="Expert: We reviewed the launch plan...\nClient: I will share the analytics access..."
              rows={6}
              value={sessionTranscript}
              onChange={e => setSessionTranscript(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-primary/50 placeholder:text-slate-500"
            />
            <div className="flex items-center justify-between gap-3 mt-3">
              <p className="text-xs text-slate-500">
                Summaries generate immediately for bookings past their scheduled end time.
              </p>
              <Button
                size="sm"
                onClick={saveSessionTranscript}
                disabled={savingTranscript || !sessionTranscript.trim()}
              >
                {savingTranscript ? "Saving..." : "Save Notes"}
              </Button>
            </div>

            {booking.session_summary?.summary && (
              <div className="mt-5 rounded-xl border border-primary/20 bg-primary/10 p-4">
                <p className="text-sm font-medium text-white mb-2">AI session summary</p>
                <p className="text-sm text-slate-300 whitespace-pre-line">{booking.session_summary.summary}</p>
                {Array.isArray(booking.session_summary.action_items) && booking.session_summary.action_items.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">Action items</p>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {booking.session_summary.action_items.map((item: any, index: number) => (
                        <li key={index}>
                          {item.description || item} {item.assignee ? <span className="text-slate-500">({item.assignee})</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isExpert && (
            <div className="bg-slate-900 rounded-2xl p-5 mb-6 border border-slate-800">
              <p className="text-sm font-medium mb-4">How was your session with {otherParty ? `${otherParty.given_name} ${otherParty.family_name}` : "your expert"}?</p>
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-3xl hover:scale-110 transition-transform ${rating >= star ? "text-amber-400" : "text-slate-600"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Share feedback (optional)..."
                rows={2}
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-primary/50 placeholder:text-slate-500"
              />
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            {!isExpert ? (
              <Button className="flex-1" onClick={submitReview} disabled={submittingReview}>
                {submittingReview ? "Submitting..." : "Submit & Close"}
              </Button>
            ) : (
              <Button className="flex-1" onClick={() => navigate("/dashboard")}>Close Room</Button>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-white">LIVE</span>
          <span className="text-sm text-slate-400 font-mono">{formatTime(timer)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-slate-800 text-slate-300 border-slate-700">
            {booking.service?.title}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLayout(l => l === "spotlight" ? "grid" : "spotlight")}
            className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 transition-colors"
            title="Toggle layout"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          <div className="flex-1 bg-slate-800 rounded-2xl overflow-hidden relative min-h-0">
            {booking.video_room_url ? (
              <iframe
                src={booking.video_room_url}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
                    {otherInitials}
                  </div>
                  <p className="text-slate-300 text-sm">
                    {otherParty ? `${otherParty.given_name} ${otherParty.family_name}` : "Participant"}
                  </p>
                  <p className="text-slate-500 text-xs">Connecting to Daily.co video room...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <AnimatePresence>
          {(chatOpen || participantsOpen) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden shrink-0"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <span className="font-medium text-sm">{chatOpen ? "Chat" : "Participants"}</span>
                <button onClick={() => { setChatOpen(false); setParticipantsOpen(false) }} className="text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {chatOpen && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(m => (
                      <div key={m.id} className={`flex flex-col ${m.self ? "items-end" : "items-start"}`}>
                        {!m.self && <p className="text-xs text-slate-500 mb-1">{m.sender}</p>}
                        <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${m.self ? "bg-primary text-white" : "bg-slate-800 text-slate-200"}`}>
                          {m.text}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{m.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-slate-800">
                    <div className="flex gap-2">
                      <input
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 placeholder:text-slate-500"
                      />
                      <button onClick={sendMessage} className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors">
                        <Send className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {participantsOpen && (
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {selfInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium">You</p>
                      <p className="text-xs text-slate-400">{isExpert ? "Expert" : "Client"}</p>
                    </div>
                  </div>
                  {otherParty && (
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {otherInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium">{otherParty.given_name} {otherParty.family_name}</p>
                        <p className="text-xs text-slate-400">{isExpert ? "Client" : "Expert"}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-sm">
        <ControlBtn active={micOn} activeIcon={<Mic className="h-5 w-5" />} inactiveIcon={<MicOff className="h-5 w-5" />} label={micOn ? "Mute" : "Unmute"} danger={!micOn} onClick={() => setMicOn(v => !v)} />
        <ControlBtn active={camOn} activeIcon={<Video className="h-5 w-5" />} inactiveIcon={<VideoOff className="h-5 w-5" />} label={camOn ? "Stop video" : "Start video"} danger={!camOn} onClick={() => setCamOn(v => !v)} />
        <ControlBtn active={screenShare} activeIcon={<Monitor className="h-5 w-5" />} inactiveIcon={<Monitor className="h-5 w-5" />} label="Share screen" onClick={() => setScreenShare(v => !v)} />
        <ControlBtn active={handRaised} activeIcon={<Hand className="h-5 w-5" />} inactiveIcon={<Hand className="h-5 w-5" />} label="Raise hand" onClick={() => setHandRaised(v => !v)} accent />

        <div className="w-px h-8 bg-slate-700 mx-1" />

        <ControlBtn active={chatOpen} activeIcon={<MessageSquare className="h-5 w-5" />} inactiveIcon={<MessageSquare className="h-5 w-5" />} label="Chat" onClick={() => { setChatOpen(v => !v); setParticipantsOpen(false) }} />
        <ControlBtn active={participantsOpen} activeIcon={<Users className="h-5 w-5" />} inactiveIcon={<Users className="h-5 w-5" />} label="People" onClick={() => { setParticipantsOpen(v => !v); setChatOpen(false) }} />

        <div className="w-px h-8 bg-slate-700 mx-1" />

        <button
          onClick={endCall}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg">
            <PhoneOff className="h-5 w-5 text-white" />
          </div>
          <span className="text-xs text-slate-400">End</span>
        </button>
      </div>
    </div>
  )
}

function ControlBtn({ active, activeIcon, inactiveIcon, label, onClick, danger, accent, badge }: {
  active: boolean
  activeIcon: React.ReactNode
  inactiveIcon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
  accent?: boolean
  badge?: string
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group relative">
      <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors
        ${danger && active ? "bg-red-500 text-white" : accent && active ? "bg-amber-500 text-white" : active ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
        {active ? activeIcon : inactiveIcon}
      </div>
      <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{label}</span>
      {badge && (
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
          {badge}
        </div>
      )}
    </button>
  )
}
