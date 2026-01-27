import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const invoices = await prisma.manualInvoice.findMany({
include: {
  client: {
    select: {
      name: true,
      email: true,
    },
  },
  cleanerUser: {
    select: {
      name: true,
      email: true,
    },
  },
  manager: {
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

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const {
      clientId,
cleanerId,
  recipientType,
      dueDate,
      subtotal,
      tax,
      discount,
      total,
      lineItems,
      notes,
      terms,
      managerEmail,
    } = await request.json();

if ((!clientId && !cleanerId) || !dueDate || !total || !lineItems || !managerEmail || !recipientType) {
      return NextResponse.json(
        { error: 'Client, due date, line items, and manager are required' },
        { status: 400 }
      );
    }

    const manager = await prisma.user.findUnique({
      where: { email: managerEmail },
    });

    if (!manager) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    if (manager.role !== 'MANAGER' && manager.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only managers and admins can create invoices' },
        { status: 403 }
      );
    }

    const count = await prisma.manualInvoice.count();
    const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;

    const invoice = await prisma.manualInvoice.create({
data: {
  invoiceNumber,
  status: 'DRAFT',
  recipientType,
  dueDate: new Date(dueDate),
  subtotal,
  tax,
  discount,
  total,
  lineItems,
  notes,
  terms,
  clientId: clientId || null,
  cleanerUserId: cleanerId || null,
  managerId: manager.id,
},
include: {
  client: true,
  cleanerUser: true,
  manager: true,
},
    });

    console.log('✅ Invoice created:', invoiceNumber);

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
