'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { Send, LogOut, ArrowDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// ============ Types ============
type User = 'eayashen' | 'nusaiba' | null

interface ChatMessage {
  id: string
  sender: 'eayashen' | 'nusaiba'
  content: string
  createdAt: string
}

// ============ Constants ============
const PARTNER_NAMES: Record<string, string> = {
  eayashen: 'Nusaiba',
  nusaiba: 'Eayashen',
}

const DISPLAY_NAMES: Record<string, string> = {
  eayashen: 'Eayashen',
  nusaiba: 'Nusaiba',
}

const LOVE_MESSAGES = [
  'Every moment with you is a treasure 💎',
  'You make my heart skip a beat 💓',
  'Forever and always, my love 🌹',
  'You are my sunshine ☀️',
  'My heart is yours 💕',
  'Love you to the moon and back 🌙',
  'You are my everything 🥰',
  'Together is my favorite place 💖',
  'You complete me 💗',
  'My heart beats for you 💓',
]

// ============ Login Page ============
function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loveQuote] = useState(() =>
    LOVE_MESSAGES[Math.floor(Math.random() * LOVE_MESSAGES.length)]
  )
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      })

      const data = await res.json()

      if (res.ok && data.user) {
        localStorage.setItem('love-chat-user', data.user)
        onLogin(data.user)
      } else {
        setError(data.error || 'Wrong password')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8 fade-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-love-100 dark:bg-love-900/30 mb-4">
            <span className="text-3xl font-bold text-love-500 heartbeat font-[family-name:var(--font-cursive)]">Hi</span>
          </div>
          <h1 className="text-3xl font-bold text-love-800 dark:text-love-200 font-[family-name:var(--font-cursive)]">
            Our Chat
          </h1>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 dark:bg-love-950/40 backdrop-blur-xl rounded-2xl p-6 shadow-lg shadow-love-200/30 dark:shadow-love-950/30 border border-love-200/50 dark:border-love-800/30 fade-in-up-delay-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                ref={inputRef}
                id="password"
                type="password"
                placeholder="Your secret password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                className="h-12 bg-love-50/50 dark:bg-love-900/20 border-love-200 dark:border-love-800 text-love-800 dark:text-love-200 placeholder:text-love-300 dark:placeholder:text-love-600 focus-visible:ring-love-400"
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="text-sm text-love-600 dark:text-love-400 text-center">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full h-12 bg-love-500 hover:bg-love-600 text-white btn-shine rounded-xl text-base font-medium transition-all duration-300 hover:shadow-lg hover:shadow-love-300/40 dark:hover:shadow-love-900/40 active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Decrypting...
                </span>
              ) : (
                <span className="font-[family-name:var(--font-cursive)]">Decrypt &gt;&gt;&gt;</span>
              )}
            </Button>
          </form>
        </div>

        {/* Love Quote */}
        <p className="text-center text-love-400/70 dark:text-love-500/70 text-xs mt-6 fade-in-up-delay-2">
          {loveQuote}
        </p>
      </div>
    </div>
  )
}

// ============ Chat Page ============
function ChatPage({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isPartnerOnline, setIsPartnerOnline] = useState(false)
  const [isPartnerTyping, setIsPartnerTyping] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const partnerName = user ? PARTNER_NAMES[user] : ''
  const partnerUser = user === 'eayashen' ? 'nusaiba' : 'eayashen'

  // Load message history
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetch('/api/messages')
        const data = await res.json()
        setMessages(data.messages || [])
      } catch (err) {
        console.error('Failed to load messages:', err)
      } finally {
        setIsLoadingHistory(false)
      }
    }
    loadMessages()
  }, [])

  // Connect WebSocket
  useEffect(() => {
    if (!user) return

    const socket = io('/?XTransformPort=3004', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Connected to love chat')
      socket.emit('join', { user })
    })

    socket.on('message', (msg: ChatMessage) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    })

    socket.on('online-status', (data: { users: string[] }) => {
      setIsPartnerOnline(data.users.includes(partnerUser))
    })

    socket.on('typing', (data: { user: string; isTyping: boolean }) => {
      if (data.user === partnerUser) {
        setIsPartnerTyping(data.isTyping)
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [user, partnerUser])

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom])

  // Track scroll position for "scroll down" button
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollDown(!isNearBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Send message
  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() || !user) return

      const content = newMessage.trim()
      const tempId = `temp-${Date.now()}`
      const msgData: ChatMessage = {
        id: tempId,
        sender: user,
        content,
        createdAt: new Date().toISOString(),
      }

      // Optimistically add message
      setMessages((prev) => [...prev, msgData])
      setNewMessage('')

      // Stop typing indicator
      socketRef.current?.emit('typing', { user, isTyping: false })

      try {
        // Save to database
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: user, content }),
        })

        const data = await res.json()

        // Replace temp message with real one
        if (data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? data.message : m))
          )
          // Broadcast via WebSocket
          socketRef.current?.emit('message', data.message)
        }
      } catch (err) {
        console.error('Failed to send message:', err)
      }

      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100)
    },
    [newMessage, user]
  )

  // Handle typing indicator
  const handleTyping = useCallback(
    (value: string) => {
      setNewMessage(value)

      if (!socketRef.current || !user) return

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      socketRef.current.emit('typing', { user, isTyping: true })

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', { user, isTyping: false })
      }, 2000)
    },
    [user]
  )

  // Handle Enter key for send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Group messages by date
  const groupByDate = (msgs: ChatMessage[]) => {
    const groups: { date: string; messages: ChatMessage[] }[] = []
    let currentDate = ''

    for (const msg of msgs) {
      const msgDate = new Date(msg.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })

      if (msgDate !== currentDate) {
        currentDate = msgDate
        groups.push({ date: msgDate, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    }

    return groups
  }

  const messageGroups = groupByDate(messages)

  const handleLogout = () => {
    localStorage.removeItem('love-chat-user')
    onLogout()
  }

  return (
    <div className="h-dvh flex flex-col bg-love-50/50 dark:bg-love-950/20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-love-950/80 backdrop-blur-xl border-b border-love-200/50 dark:border-love-800/30">
        <div className="flex items-center justify-between px-4 h-16 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-love-200 dark:ring-love-800">
                <AvatarFallback className="bg-love-100 dark:bg-love-900/40 text-love-600 dark:text-love-300 font-semibold">
                  {partnerName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-love-950 transition-colors duration-300 ${
                  isPartnerOnline
                    ? 'bg-green-500'
                    : 'bg-love-300 dark:bg-love-700'
                }`}
              />
            </div>
            <div>
              <h2 className="font-semibold text-love-800 dark:text-love-200 text-sm leading-tight">
                {partnerName}
              </h2>
              <p className="text-xs text-love-400 dark:text-love-500">
                {isPartnerTyping
                  ? 'typing...'
                  : isPartnerOnline
                    ? 'Online'
                    : 'Offline'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-love-300 dark:text-love-600">
              {DISPLAY_NAMES[user || '']}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-love-400 hover:text-love-600 hover:bg-love-100 dark:hover:bg-love-900/30 h-9 w-9"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto chat-scroll px-4 py-4 max-w-2xl mx-auto w-full relative"
      >
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-love-300 animate-spin" />
              <p className="text-love-400 text-sm">Loading...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-love-100 dark:bg-love-900/30">
                <Send className="w-7 h-7 text-love-400" />
              </div>
              <div>
                <p className="text-love-500 dark:text-love-400 font-medium">
                  Say hi to {partnerName}!
                </p>
                <p className="text-love-300 dark:text-love-600 text-sm mt-1">
                  Start your conversation here
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messageGroups.map((group) => (
              <div key={group.date}>
                {/* Date Separator */}
                <div className="flex justify-center mb-3">
                  <span className="text-xs text-love-400 dark:text-love-500 bg-white/70 dark:bg-love-900/30 px-3 py-1 rounded-full">
                    {group.date}
                  </span>
                </div>

                {/* Messages */}
                <div className="space-y-2">
                  {group.messages.map((msg, idx) => {
                    const isMine = msg.sender === user
                    const showAvatar =
                      idx === 0 ||
                      group.messages[idx - 1].sender !== msg.sender
                    const prevMsg =
                      idx > 0 ? group.messages[idx - 1] : null
                    const sameTime =
                      prevMsg &&
                      prevMsg.sender === msg.sender &&
                      new Date(msg.createdAt).getTime() -
                        new Date(prevMsg.createdAt).getTime() <
                        60000

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          isMine ? 'justify-end' : 'justify-start'
                        } ${showAvatar ? 'mt-3' : ''}`}
                      >
                        <div
                          className={`flex items-end gap-2 max-w-[80%] ${
                            isMine ? 'flex-row-reverse' : ''
                          }`}
                        >
                          {/* Avatar */}
                          {showAvatar && !isMine && (
                            <Avatar className="h-7 w-7 shrink-0 mt-1">
                              <AvatarFallback className="bg-love-100 dark:bg-love-900/40 text-love-500 dark:text-love-400 text-xs font-semibold">
                                {msg.sender === 'eayashen' ? 'E' : 'N'}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {!showAvatar && !isMine && <div className="w-7" />}

                          {/* Message Bubble */}
                          <div
                            className={`message-appear rounded-2xl px-4 py-2.5 ${
                              isMine
                                ? 'bg-love-500 text-white rounded-br-md'
                                : 'bg-white dark:bg-love-900/40 text-love-800 dark:text-love-200 rounded-bl-md shadow-sm border border-love-100 dark:border-love-800/30'
                            }`}
                          >
                            <p className="text-[0.9rem] leading-relaxed whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                            {!sameTime && (
                              <p
                                className={`text-[0.65rem] mt-1 ${
                                  isMine
                                    ? 'text-love-200 text-right'
                                    : 'text-love-400 dark:text-love-500'
                                }`}
                              >
                                {formatTime(msg.createdAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll to bottom button */}
        {showScrollDown && (
          <button
            onClick={() => scrollToBottom()}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-10 bg-love-500 text-white rounded-full p-2.5 shadow-lg shadow-love-300/40 dark:shadow-love-900/40 hover:bg-love-600 transition-all active:scale-95"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}
      </main>

      {/* Typing Indicator */}
      {isPartnerTyping && (
        <div className="px-4 py-1 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="bg-love-100 dark:bg-love-900/40 text-love-500 text-[0.6rem] font-semibold">
                {partnerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="bg-white dark:bg-love-900/40 rounded-full px-3 py-1.5 shadow-sm border border-love-100 dark:border-love-800/30">
              <div className="flex gap-1">
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-love-400 dark:bg-love-500" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-love-400 dark:bg-love-500" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-love-400 dark:bg-love-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <footer className="sticky bottom-0 z-20 bg-white/80 dark:bg-love-950/80 backdrop-blur-xl border-t border-love-200/50 dark:border-love-800/30">
        <form
          onSubmit={sendMessage}
          className="flex items-end gap-2 px-4 py-3 max-w-2xl mx-auto w-full"
        >
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${partnerName}...`}
              rows={1}
              className="w-full resize-none rounded-xl bg-love-50 dark:bg-love-900/20 border border-love-200 dark:border-love-800 px-4 py-2.5 text-sm text-love-800 dark:text-love-200 placeholder:text-love-300 dark:placeholder:text-love-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-love-400 dark:focus-visible:ring-love-600 transition-all max-h-28 overflow-y-auto"
              style={{
                height: 'auto',
                minHeight: '42px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height =
                  Math.min(target.scrollHeight, 112) + 'px'
              }}
            />
          </div>
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            size="icon"
            className="h-[42px] w-[42px] shrink-0 bg-love-500 hover:bg-love-600 text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-love-300/40 dark:hover:shadow-love-900/40 active:scale-95 disabled:opacity-40 disabled:hover:shadow-none"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </footer>
    </div>
  )
}

// ============ Main App ============
export default function LoveChatApp() {
  const [user, setUser] = useState<User>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('love-chat-user') as User
      if (savedUser === 'eayashen' || savedUser === 'nusaiba') {
        return savedUser
      }
    }
    return null
  })

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  return <ChatPage user={user} onLogout={() => setUser(null)} />
}
