import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

  // Get the logged-in user's session
export async function POST(request: Request) {
  try {
    const { 
      clientId, 
      amount, 
      description, 
      cleanerId, 
      cleanerPayout,
      platformFeeType = 'AUTO_20_PERCENT',
      managerEmail  // ← We'll pass this from frontend
    } = await request.json();

    // Validate input
    if (!clientId || !amount || !managerEmail) {
      return NextResponse.json(
        { error: 'Client, amount, and manager email are required' },
        { status: 400 }
      );
    }

    // Get the manager from the email
    const currentUser = await prisma.user.findUnique({
      where: { email: managerEmail },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

if (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN') {
  return NextResponse.json(
    { error: 'Only managers and admins can charge clients' },
    { status: 403 }
  );
}

// Calculate platform fee and cleaner payout
let finalCleanerPayout = 0;
let finalPlatformFee = 0;

if (platformFeeType === 'AUTO_20_PERCENT') {
  // Automatic 20% platform fee
  finalPlatformFee = amount * 0.20;
  finalCleanerPayout = amount - finalPlatformFee;
} else if (platformFeeType === 'MANUAL') {
  // Manual cleaner payout
  if (!cleanerPayout) {
    return NextResponse.json(
      { error: 'Cleaner payout is required for manual fee calculation' },
      { status: 400 }
    );
  }
  
  finalCleanerPayout = cleanerPayout;
  finalPlatformFee = amount - cleanerPayout;

  if (finalPlatformFee < 0) {
    return NextResponse.json(
      { error: 'Cleaner payout cannot exceed client charge' },
      { status: 400 }
    );
  }
}

    // Get client with Stripe customer ID
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!client.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Client does not have a Stripe customer ID. Please sync from Stripe first.' },
        { status: 400 }
      );
    }

    // Get the client's default payment method
    const customer = await stripe.customers.retrieve(client.stripeCustomerId);
    
    if (customer.deleted) {
      return NextResponse.json(
        { error: 'Customer has been deleted from Stripe' },
        { status: 400 }
      );
    }

    const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;

    if (!defaultPaymentMethod) {
      return NextResponse.json(
        { error: 'Client does not have a default payment method. Please add one in Stripe.' },
        { status: 400 }
      );
    }

    // Create a Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: client.stripeCustomerId,
      payment_method: defaultPaymentMethod as string,
      off_session: true,
      confirm: true,
      description: description || 'Cleaning service payment',
      metadata: {
        clientId,
        clientEmail: client.email,
        managerId: currentUser.id,
        cleanerId: cleanerId || 'unassigned',
      },
    });

    // Calculate fees (Stripe takes 2.9% + $0.30)
    const stripeFee = Math.round((amount * 0.029 + 0.30) * 100) / 100;
    const netAmount = Math.round((amount - stripeFee) * 100) / 100;

    // Create transaction in database
const transaction = await prisma.transaction.create({
    data: {
      amount,
      description,
      status: paymentIntent.status === 'succeeded' ? 'CHARGED' : 'PENDING',
      cleanerPayout: finalCleanerPayout,
      platformFee: finalPlatformFee,
      platformFeeType,
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: paymentIntent.latest_charge as string,
      stripeFee,
      netAmount,
      clientId,
      cleanerId: cleanerId || null,
      managerId: currentUser.id,
    },
  include: {
    client: true,
    cleaner: true,
    manager: true,
  },
});   

    console.log('✅ Payment charged successfully:', {
      transactionId: transaction.id,
      amount: `$${amount}`,
      client: client.email,
      paymentIntentId: paymentIntent.id,
    });


return NextResponse.json({
  success: true,
  transaction,
  paymentIntent: {
    id: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount / 100,
  },
  breakdown: {
    clientCharge: amount,
    cleanerPayout: finalCleanerPayout,
    platformFee: finalPlatformFee,
    platformFeePercent: `${((finalPlatformFee / amount) * 100).toFixed(1)}%`,
    stripeFee,
    netPlatformFee: (finalPlatformFee - stripeFee),
  },
});
  } catch (error: any) {
    console.error('❌ Error charging client:', error);

    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: `Card error: ${error.message}` },
        { status: 400 }
      );
    }

    if (error.code === 'payment_intent_authentication_failure') {
      return NextResponse.json(
        { error: 'Payment authentication failed. Card may require 3D Secure.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to charge client' },
      { status: 500 }
    );
  }
}
