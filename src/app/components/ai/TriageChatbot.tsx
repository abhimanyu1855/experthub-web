import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { MessageSquare, X, Send, Sparkles, Bot, Loader2 } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { api } from "@/app/lib/api"
import { useFeatureGate } from "@/app/lib/useFeatureGate"

type Message = {
  role: "user" | "assistant"
  content: string
}

export function TriageChatbot() {
  const { allowed } = useFeatureGate("triage_chatbot")
  const [open, setOpen] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function startSession() {
    if (sessionToken || starting) return
    setStarting(true)
    try {
      const res = await api.post("/ai/triage_sessions", {})
      setSessionToken(res.session_token)
      if (res.message) {
        setMessages([{ role: "assistant", content: res.message }])
      }
    } catch {
      setMessages([{ role: "assistant", content: "Hi! I'm here to help you find the right expert. What do you need help with?" }])
    } finally {
      setStarting(false)
    }
  }

  function handleOpen() {
    setOpen(true)
    if (!sessionToken) startSession()
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: text }])
    setLoading(true)
    try {
      if (sessionToken) {
        const res = await api.post(`/ai/triage_sessions/${sessionToken}/chat`, { message: text })
        setMessages(prev => [...prev, { role: "assistant", content: res.message }])
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I had trouble connecting. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  if (!allowed) return null

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary shadow-raised flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity"
            aria-label="Open AI assistant"
          >
            <Sparkles className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-2xl border border-border bg-background shadow-raised overflow-hidden"
            style={{ height: "480px" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold leading-tight">AI Expert Finder</p>
                <p className="text-xs opacity-75">Describe your problem, we'll match you</p>
              </div>
              <button onClick={() => setOpen(false)} className="opacity-75 hover:opacity-100 transition-opacity" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {starting && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Starting your session...</span>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 ml-8">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="h-2 w-2 rounded-full bg-muted-foreground/50"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border shrink-0 flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="What do you need help with?"
                className="rounded-xl text-sm h-9"
                disabled={loading || starting}
              />
              <Button
                size="icon"
                className="h-9 w-9 rounded-xl shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || loading || starting}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
