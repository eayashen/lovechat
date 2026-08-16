import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

interface ChatMessage {
  id: string
  sender: 'eayashen' | 'nusaiba'
  content: string
  createdAt: string
}

// Track online users
const onlineUsers = new Set<string>()

const generateId = () => Math.random().toString(36).substr(2, 9)

io.on('connection', (socket) => {
  let currentUser: string | null = null

  console.log(`Socket connected: ${socket.id}`)

  socket.on('join', (data: { user: string }) => {
    currentUser = data.user
    if (currentUser === 'eayashen' || currentUser === 'nusaiba') {
      onlineUsers.add(currentUser)
      // Notify everyone about online status
      io.emit('online-status', { users: Array.from(onlineUsers) })
      console.log(`${currentUser} is now online. Online: ${Array.from(onlineUsers).join(', ')}`)
    }
  })

  socket.on('message', (data: { sender: string; content: string; id?: string; createdAt?: string }) => {
    if (!currentUser) return
    
    const message: ChatMessage = {
      id: data.id || generateId(),
      sender: data.sender,
      content: data.content,
      createdAt: data.createdAt || new Date().toISOString()
    }

    // Broadcast to all connected clients
    io.emit('message', message)
    console.log(`[${message.sender}]: ${message.content}`)
  })

  socket.on('typing', (data: { user: string; isTyping: boolean }) => {
 if (!currentUser) return
    // Broadcast typing status to the other person
    socket.broadcast.emit('typing', { user: data.user, isTyping: data.isTyping })
  })

  socket.on('disconnect', () => {
    if (currentUser) {
      onlineUsers.delete(currentUser)
      io.emit('online-status', { users: Array.from(onlineUsers) })
      console.log(`${currentUser} disconnected. Online: ${Array.from(onlineUsers).join(', ')}`)
    }
    console.log(`Socket disconnected: ${socket.id}`)
  })

  socket.on('error', (error) => {
    console.error(`Socket error (${socket.id}):`, error)
  })
})

const PORT = 3004
httpServer.listen(PORT, () => {
  console.log(`Love chat WebSocket server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('Shutting down love chat service...')
  httpServer.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('Shutting down love chat service...')
  httpServer.close(() => process.exit(0))
})
