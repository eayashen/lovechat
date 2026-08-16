import { NextResponse } from 'next/server'
import { getMongoDB, MessageModel } from '@/lib/mongodb'

export async function GET() {
  try {
    await getMongoDB()
    const messages = await MessageModel.find().sort({ createdAt: 1 }).lean()

    // Convert _id and format for frontend
    const formatted = messages.map((msg) => ({
      id: String(msg._id),
      sender: msg.sender,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    }))

    return NextResponse.json({ messages: formatted })
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: 'Failed to load messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { sender, content } = await request.json()

    if (!sender || !content || !['eayashen', 'nusaiba'].includes(sender)) {
      return NextResponse.json(
        { error: 'Invalid message data' },
        { status: 400 }
      )
    }

    await getMongoDB()
    const message = await MessageModel.create({ sender, content })

    const formatted = {
      id: String(message._id),
      sender: message.sender,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    }

    return NextResponse.json({ message: formatted }, { status: 201 })
  } catch (error) {
    console.error('Failed to save message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
