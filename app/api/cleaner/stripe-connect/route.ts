import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

// POST /api/cleaner/stripe-connect - Create Stripe Connect onboarding link
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'CLEANER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let accountId = user.stripeConnectedAccountId

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          transfers: { requested: true },
        },
      })

      accountId = account.id

      // Save to database
      await prisma.user.update({
        where: { id: userId },
        data: { stripeConnectedAccountId: accountId },
      })
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.APP_URL}/cleaner/dashboard?refresh=true`,
      return_url: `${process.env.APP_URL}/cleaner/dashboard?success=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      url: accountLink.url,
    })
  } catch (error) {
    console.error('Error creating Stripe Connect link:', error)
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect link' },
      { status: 500 }
    )
  }
}

// GET /api/cleaner/stripe-connect - Check Stripe Connect status
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'CLEANER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.stripeConnectedAccountId) {
      return NextResponse.json({
        connected: false,
        detailsSubmitted: false,
        chargesEnabled: false,
      })
    }

    // Get account details from Stripe
    const account = await stripe.accounts.retrieve(user.stripeConnectedAccountId)

    return NextResponse.json({
      connected: true,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    })
  } catch (error) {
    console.error('Error checking Stripe Connect status:', error)
    return NextResponse.json(
      { error: 'Failed to check Stripe Connect status' },
      { status: 500 }
    )
  }
}
