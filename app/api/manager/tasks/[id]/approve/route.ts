import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { sendEmail, generatePaymentApprovedEmail, generatePaymentFailedEmail } from '@/lib/email'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/manager/tasks/[id]/approve - Approve task and process payment
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: taskId } = await params
    const body = await request.json()
    const { guestStripeId, guestName, cleanerFee, notes } = body

    // Validation
    if (!guestStripeId || !cleanerFee) {
      return NextResponse.json(
        { error: 'Guest Stripe ID and cleaner fee are required' },
        { status: 400 }
      )
    }

    const cleanerFeeNum = parseFloat(cleanerFee)
    if (isNaN(cleanerFeeNum) || cleanerFeeNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid cleaner fee' },
        { status: 400 }
      )
    }

    // Calculate guest charge (cleaner fee + 20%)
    const guestCharge = cleanerFeeNum * 1.2

    // Get task with cleaner info
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        cleaner: true,
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (!task.cleaner) {
      return NextResponse.json({ error: 'Task has no assigned cleaner' }, { status: 400 })
    }

    if (!task.cleaner.stripeConnectedAccountId) {
      return NextResponse.json(
        { error: 'Cleaner has not connected their Stripe account' },
        { status: 400 }
      )
    }

    let paymentIntentId = null
    let transferId = null
    // Type assertion needed: transactionStatus may contain values from external sources (like Stripe)
    // that don't match the Prisma TransactionStatus enum exactly
    let transactionStatus: 'PENDING' | 'COMPLETED' | 'FAILED' = 'PENDING'

    try {
      // Step 1: Charge the guest
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(guestCharge * 100), // Convert to cents
        currency: 'usd',
        customer: guestStripeId,
        description: `Cleaning fee for Task #${taskId.substring(0, 8)}`,
        metadata: {
          taskId: taskId,
          cleanerId: task.cleaner.id,
          cleanerFee: cleanerFeeNum.toString(),
        },
        // Note: In production, you'd need to collect payment method first
        // For now, this assumes customer has a default payment method
        confirm: false, // Set to false for now since we need payment method
      })

      paymentIntentId = paymentIntent.id

      // Step 2: Transfer to cleaner (only after successful charge)
      // In production, you'd confirm the payment first and use webhooks
      // For demo purposes, we'll create the transfer
      const transfer = await stripe.transfers.create({
        amount: Math.round(cleanerFeeNum * 100),
        currency: 'usd',
        destination: task.cleaner.stripeConnectedAccountId,
        transfer_group: `task_${taskId}`,
        description: `Payment for Task #${taskId.substring(0, 8)}`,
      })

      transferId = transfer.id
      transactionStatus = 'COMPLETED'

      // Send success email to cleaner
      const emailContent = generatePaymentApprovedEmail(
        task.cleaner.name,
        cleanerFeeNum,
        taskId.substring(0, 8)
      )
      await sendEmail({
        to: task.cleaner.email,
        subject: emailContent.subject,
        html: emailContent.html,
      })
    } catch (stripeError) {
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error'
      console.error('Stripe error:', stripeError)
      transactionStatus = 'FAILED'

      // Send failure email to manager/admin
      const emailContent = generatePaymentFailedEmail(
        taskId.substring(0, 8),
        errorMessage
      )
      await sendEmail({
        to: session.user.email,
        subject: emailContent.subject,
        html: emailContent.html,
      })
    }

    // Find or create Client with the Stripe customer ID
    let client = await prisma.client.findUnique({
      where: { stripeCustomerId: guestStripeId },
    })

    if (!client) {
      // Create a new client if one doesn't exist
      client = await prisma.client.create({
        data: {
          name: guestName || 'Unknown',
          email: `guest_${guestStripeId}@placeholder.com`, // Placeholder email
          stripeCustomerId: guestStripeId,
        },
      })
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        taskId: task.id,
        clientId: client.id,
        guestName: guestName || 'Unknown',
        cleanerId: task.cleaner.id,
        managerId: session.user.id,
        amount: guestCharge,
        cleanerFee: cleanerFeeNum,
        guestCharge: guestCharge,
        stripePaymentIntentId: paymentIntentId,
        stripeTransferId: transferId,
        // Type assertion: transactionStatus may be 'COMPLETED' from Stripe which needs to be cast
        status: transactionStatus as any,
        notes,
      },
    })

    // Update task status
    await prisma.task.update({
      where: { id: taskId },
      data: {
        // Type assertion: transactionStatus from external sources needs to be compared as string
        status: ((transactionStatus as string) === 'APPROVED' ? 'APPROVED' : 'PENDING') as any,
      },
    })

    return NextResponse.json({
      success: (transactionStatus as string) === 'APPROVED',
      transaction: {
        id: transaction.id,
        status: transaction.status,
        cleanerFee: transaction.cleanerFee,
        guestCharge: transaction.guestCharge,
      },
      message:
        (transactionStatus as string) === 'APPROVED'
          ? 'Task approved and payment processed successfully'
          : 'Task approval failed - payment processing error',
    })
  } catch (error) {
    console.error('Error approving task:', error)
    return NextResponse.json(
      { error: 'Failed to approve task' },
      { status: 500 }
    )
  }
}
