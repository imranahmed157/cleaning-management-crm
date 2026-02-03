import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        cleaner: {
          select: {
            name: true,
            email: true,
          },
        },
        task: {
          select: {
            propertyName: true,
          },
        },
        client: {
          select: {
            name: true,
            email: true,
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

export async function POST(request: Request) {
  try {
    const { clientId, cleanerId, propertyName, guestCharge, cleanerFee, notes } =
      await request.json();

    // Create task first
    const task = await prisma.task.create({
      data: {
        guestyTaskId: `task_${Date.now()}`, // Temporary ID
        propertyName,
        cleanerId,
        status: 'PENDING_REVIEW',
      },
    });

    // Get current user (manager/admin creating the transaction)
    // For now, we'll use the first admin as manager
    const manager = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        taskId: task.id,
        cleanerId,
        managerId: manager!.id,
        clientId,
        amount: guestCharge,
        guestCharge,
        cleanerFee,
        notes,
        status: 'PENDING',
      },
      include: {
        cleaner: true,
        client: true,
        task: true,
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
