import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // For now, let's just return all transactions
    // We'll add proper auth after we confirm it works
    
    const transactions = await prisma. transaction.findMany({
      include: {
        cleaner: {
          select: {
            name: true,
            email: true,
          },
        },
        task: {
          select:  {
            propertyName: true,
          },
        },
        client: {
          select: {
            name: true,
            email: true,
            stripeCustomerId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
