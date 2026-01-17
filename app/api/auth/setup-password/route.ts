import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/auth/setup-password - Set password for new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Find and validate token
    const invitationToken = await prisma.invitationToken.findUnique({
      where: { token },
    })

    if (!invitationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      )
    }

    if (invitationToken.used) {
      return NextResponse.json(
        { error: 'Token has already been used' },
        { status: 400 }
      )
    }

    if (new Date() > invitationToken.expiresAt) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Update user with password and activate account
    const user = await prisma.user.update({
      where: { email: invitationToken.email },
      data: {
        passwordHash,
        isActive: true,
      },
    })

    // Mark token as used
    await prisma.invitationToken.update({
      where: { token },
      data: { used: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Password set successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Error setting up password:', error)
    return NextResponse.json(
      { error: 'Failed to set up password' },
      { status: 500 }
    )
  }
}
