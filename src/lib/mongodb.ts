import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!
const MONGODB_DB = process.env.MONGODB_DB || 'nusaiba_chat'

let cachedConnection: typeof mongoose | null = null

export async function getMongoDB() {
  if (cachedConnection) return cachedConnection

  const conn = await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB,
  })

  cachedConnection = conn
  return conn
}

export interface IMessage {
  sender: string
  content: string
  createdAt: Date
}

const messageSchema = new mongoose.Schema<IMessage>({
  sender: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

export const MessageModel =
  (mongoose.models.Message as mongoose.Model<IMessage>) ||
  mongoose.model<IMessage>('Message', messageSchema)
