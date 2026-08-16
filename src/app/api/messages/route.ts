import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const messages = await db.message.findMany({
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ messages })
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

    const message = await db.message.create({
      data: { sender, content },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Failed to save message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
