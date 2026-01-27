import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const invoice = await prisma.manualInvoice.findUnique({
      where: { id },
      include: {
        client: true,
        cleanerUser: true,
        manager: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const recipientEmail = invoice.client?.email || invoice.cleanerUser?.email;
    const recipientName = invoice.client?.name || invoice.cleanerUser?.name;

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Recipient email not found' },
        { status: 400 }
      );
    }

    const html = `
      <h2>Invoice ${invoice.invoiceNumber}</h2>
      <p>Hello, ${recipientName},</p>
      <p>You have a new invoice from Cleaning Management CRM:</p>
      <ul>
        <li><strong>Amount:</strong> $${invoice.total.toFixed(2)}</li>
        <li><strong>Status:</strong> ${invoice.status}</li>
        <li><strong>Due:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</li>
      </ul>
      <h4>Line Items:</h4>
      <ul>
        ${(invoice.lineItems as any[])
          .map(item => `<li>${item.description}: ${item.quantity} × $${item.rate.toFixed(2)} = $${(item.quantity*item.rate).toFixed(2)}</li>`)
          .join('')
        }
      </ul>
      <p>Notes: ${invoice.notes || ''}</p>
      <p><small>Sent by Cleaning Management CRM</small></p>
    `;

    const result = await sendEmail({
      to: recipientEmail,
      subject: `Invoice ${invoice.invoiceNumber} from Cleaning Management CRM`,
      html,
    });

    if (!result.success) {
      return NextResponse.json({ error: `Failed to send invoice: ${result.error}` }, { status: 500 });
    }


    // TODO: Implement actual email sending (using Resend, SendGrid, etc.)
    console.log('📧 Sending invoice to:', recipientEmail);
    console.log('Invoice Number:', invoice.invoiceNumber);
    console.log('Amount:', invoice.total);

    // For now, just mark as SENT
    await prisma.manualInvoice.update({
      where: { id },
      data: { status: 'SENT' },
    });

    // TODO: Replace this with actual email sending
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'invoices@yourdomain.com',
    //   to: recipientEmail,
    //   subject: `Invoice ${invoice.invoiceNumber}`,
    //   html: `Invoice details...`,
    // });

    return NextResponse.json({
      success: true,
      message: `Invoice sent to ${recipientEmail}`,
    });
  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json(
      { error: 'Failed to send invoice' },
      { status: 500 }
    );
  }
}
