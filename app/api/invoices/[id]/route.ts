import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await request.json();
    const { id } = await context.params;

    const updateData: any = { status };

    if (status === 'PAID') {
      const invoice = await prisma.manualInvoice.findUnique({
        where: { id },
      });

      if (invoice) {
        updateData.paidAt = new Date();
        updateData.paidAmount = invoice.total;
      }
    }

    const updatedInvoice = await prisma.manualInvoice.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        cleanerUser: true,
        manager: true,
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}
