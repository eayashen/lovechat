import { NextResponse } from 'next/server'

const USERS: Record<string, string> = {
  eayashen: 'Eayashen',
  nusaiba: 'Nusaiba',
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    const user = USERS[password.toLowerCase().trim()]

    if (!user) {
      return NextResponse.json(
        { error: 'Wrong password 💔' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: password.toLowerCase().trim(),
      displayName: user,
    })
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
