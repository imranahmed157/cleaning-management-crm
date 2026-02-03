import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover' as any,
});

export async function POST() {
  try {
    console.log('🔄 Starting Stripe customer sync...');

    // Fetch all customers from Stripe
    const customers = await stripe.customers.list({
      limit: 100, // Adjust if you have more than 100 customers
    });

    console.log(`📥 Found ${customers.data.length} customers in Stripe`);

    let syncedCount = 0;
    let updatedCount = 0;

    for (const customer of customers.data) {
      // Skip deleted customers
      if (customer.deleted) continue;

      // Get customer's payment methods
      let defaultPaymentMethodId = null;
      
      if (customer.invoice_settings?.default_payment_method) {
        defaultPaymentMethodId = customer.invoice_settings.default_payment_method as string;
      }

      // Check if customer already exists in our database
      const existingClient = await prisma.client.findUnique({
        where: { stripeCustomerId: customer.id },
      });

      if (existingClient) {
        // Update existing client
        await prisma.client.update({
          where: { id: existingClient.id },
          data: {
            name: customer.name || customer.email || 'Unknown',
            email: customer.email || existingClient.email,
            phone: customer.phone || existingClient.phone,
            defaultPaymentMethodId,
          },
        });
        updatedCount++;
      } else {
        // Create new client
        await prisma.client.create({
          data: {
            name: customer.name || customer.email || 'Unknown',
            email: customer.email || `stripe_${customer.id}@placeholder.com`,
            phone: customer.phone,
            stripeCustomerId: customer.id,
            defaultPaymentMethodId,
          },
        });
        syncedCount++;
      }
    }

    console.log(`✅ Sync complete: ${syncedCount} new, ${updatedCount} updated`);

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} new customers, updated ${updatedCount} existing`,
      total: customers.data.length,
    });
  } catch (error: any) {
    console.error('❌ Error syncing Stripe customers:', error);
    return NextResponse.json(
      { error: 'Failed to sync customers', details: error.message },
      { status: 500 }
    );
  }
}
