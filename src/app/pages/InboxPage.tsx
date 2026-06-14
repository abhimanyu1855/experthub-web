import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Send, Search, Paperclip, MoreHorizontal, Phone, Video,
  CheckCheck, MessageSquare, ArrowLeft
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { api, getStoredUser } from "@/app/lib/api"
import { getCableConsumer } from "@/app/lib/cable"
import { toast } from "sonner"

export function InboxPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<any>(null)

  const currentUser = getStoredUser()

  const fetchConversations = useCallback((isInitial = false) => {
    api.get("/conversations")
      .then(data => {
        setConversations(data)
        if (isInitial && data.length > 0) setActiveThreadId(data[0].id)
        if (isInitial) setLoading(false)
      })
      .catch(err => {
        if (isInitial) setLoading(false)
        console.error("Failed to load conversations:", err)
      })
  }, [])

  // Fetch conversations once on mount — updates arrive via WebSocket after that
  useEffect(() => {
    fetchConversations(true)
  }, [fetchConversations])

  // Load message history when switching conversations
  useEffect(() => {
    if (activeThreadId === null) return
    setLoadingMessages(true)
    api.get(`/conversations/${activeThreadId}/messages`)
      .then(data => {
        setMessages(data)
        setLoadingMessages(false)
      })
      .catch(err => {
        setLoadingMessages(false)
        console.error("Failed to load messages:", err)
      })
  }, [activeThreadId])

  // Subscribe to the active conversation channel via ActionCable
  useEffect(() => {
    subscriptionRef.current?.unsubscribe()
    subscriptionRef.current = null
    if (activeThreadId === null) return

    const consumer = getCableConsumer()
    subscriptionRef.current = consumer.subscriptions.create(
      { channel: "ConversationChannel", conversation_id: activeThreadId },
      {
        received(data: any) {
          setMessages(prev => {
            // Deduplicate: ignore if message id already present (optimistic insert)
            if (prev.some(m => m.id === data.id)) return prev
            return [...prev, data]
          })
          // Bubble up to conversation list so last_message updates
          setConversations(prev =>
            prev.map(c =>
              c.id === activeThreadId
                ? { ...c, last_message: { content: data.content, created_at: data.created_at } }
                : c
            )
          )
        }
      }
    )

    return () => {
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
    }
  }, [activeThreadId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || activeThreadId === null) return
    const text = input.trim()
    setInput("")

    // Optimistic insert
    const optimistic = { id: `temp-${Date.now()}`, content: text, created_at: new Date().toISOString(), sender: { id: currentUser?.id, name: "You" } }
    setMessages(prev => [...prev, optimistic])

    try {
      await api.post(`/conversations/${activeThreadId}/messages`, {
        message: { content: text }
      })
      // Server will broadcast the real message via ActionCable; dedup handles it
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      toast.error(err.message || "Failed to send message")
    }
  }

  const activeThread = conversations.find(c => c.id === activeThreadId)
  
  // Find recipient user
  const getRecipient = (convo: any) => {
    if (!convo || !convo.participants) return null
    return convo.participants.find((p: any) => p.id !== currentUser?.id) || convo.participants[0]
  }

  const recipient = getRecipient(activeThread)
  const recipientName = recipient ? recipient.name || recipient.email : "Chat"
  const recipientInitials = recipientName ? recipientName.split(" ").map((n: any) => n[0]).join("").slice(0, 2).toUpperCase() : "CH"

  // Filter conversations by search query
  const filteredConversations = conversations.filter(c => {
    const r = getRecipient(c)
    if (!r) return false
    const nameMatch = (r.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    const emailMatch = (r.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    return nameMatch || emailMatch
  })

  const ThreadList = (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b border-border shrink-0">
        <h2 className="font-bold text-foreground mb-3 shadow-sm" style={{ fontFamily: "var(--font-heading)", fontSize: "1.125rem" }}>Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            className="pl-9 rounded-xl bg-muted border-border text-foreground placeholder:text-muted-foreground" 
            placeholder="Search messages..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-foreground text-sm font-medium mb-1">
              {searchQuery ? "No results found" : "No conversations yet"}
            </p>
            <p className="text-muted-foreground text-xs max-w-[200px]">
              {searchQuery
                ? "Try a different name or email"
                : "Book a session to start chatting with an expert"}
            </p>
          </div>
        ) : (
          filteredConversations.map(c => {
            const convoRecipient = getRecipient(c)
            const isSelected = activeThreadId === c.id
            const initials = convoRecipient ? (convoRecipient.name || convoRecipient.email).split(" ").map((n: any) => n[0]).join("").slice(0, 2).toUpperCase() : "CH"
            return (
              <button
                key={c.id}
                onClick={() => { setActiveThreadId(c.id); setShowMobileChat(true) }}
                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors ${
                  isSelected ? "bg-accent" : "hover:bg-accent/50"
                }`}
              >
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                    {initials}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-semibold text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {convoRecipient ? convoRecipient.name : "Chat"}
                    </span>
                    {c.last_message && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(c.last_message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs mt-0.5 truncate">
                    {c.last_message ? c.last_message.content : "No messages yet"}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )

  const ChatView = activeThreadId === null ? (
    <div className="flex-1 flex flex-col items-center justify-center bg-background text-muted-foreground p-6 text-center">
      <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
      <p className="text-sm">Select a conversation to start messaging</p>
    </div>
  ) : (
    <div className="flex flex-col h-full bg-background">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 bg-card">
        <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setShowMobileChat(false)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {recipientInitials}
          </div>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-foreground text-sm">{recipientName}</div>
          <div className="text-xs text-muted-foreground">Conversation</div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-5 w-5" /></Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loadingMessages ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
            <MessageSquare className="h-8 w-8 text-muted-foreground/20 mb-2" />
            <p>No messages yet. Send a greeting!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isSelf = msg.sender?.id === currentUser?.id
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex items-end gap-2 ${isSelf ? "justify-end" : "justify-start"}`}
              >
                {!isSelf && (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {recipientInitials}
                  </div>
                )}
                <div className="max-w-[70%]">
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isSelf
                      ? "bg-primary text-primary-foreground rounded-br-sm shadow-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}>
                    {msg.content}
                  </div>
                  <div className={`flex items-center gap-1 mt-1 ${isSelf ? "justify-end" : "justify-start"}`}>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isSelf && (
                      <CheckCheck className="h-3 w-3 text-primary" />
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-border shrink-0 bg-card">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-muted border border-border rounded-2xl px-4 py-2.5">
            <textarea
              rows={1}
              className="w-full bg-transparent outline-none resize-none text-foreground placeholder:text-muted-foreground text-sm border-0 focus:ring-0 p-0"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
          </div>
          <Button
            size="icon"
            className="rounded-full shrink-0 bg-primary hover:bg-primary/95 text-white"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading messages...</p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] flex bg-background">
      {/* Thread list */}
      <div className={`w-full md:w-80 border-r border-border shrink-0 ${showMobileChat ? "hidden md:flex" : "flex"} flex-col`}>
        {ThreadList}
      </div>

      {/* Chat view */}
      <div className={`flex-1 min-w-0 ${showMobileChat ? "flex" : "hidden md:flex"} flex-col`}>
        {ChatView}
      </div>
    </div>
  )
}
