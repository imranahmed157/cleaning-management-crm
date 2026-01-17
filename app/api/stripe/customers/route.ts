import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'

// GET /api/stripe/customers - List all Stripe customers for dropdown
export async function GET() {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customers = await stripe.customers.list({
      limit: 100,
    })

    const formattedCustomers = customers.data.map(customer => ({
      id: customer.id,
      name: customer.name || customer.email || 'Unknown',
      email: customer.email,
    }))

    return NextResponse.json({ customers: formattedCustomers })
  } catch (error) {
    console.error('Error fetching Stripe customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
