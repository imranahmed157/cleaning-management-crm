import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail, generateInvitationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, role } = await request.json();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Generate a secure random token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create the user with invite token (no password yet)
    const user = await prisma.user.create({
      data: {
        email,
        name: email.split('@')[0], // Temporary name
        passwordHash: '', // No password yet - user will set it
        role,
        isActive: false, // Inactive until they complete signup
        inviteToken,
        inviteTokenExpiry,
        invitedAt: new Date(),
      },
    });

    // Generate the invitation email
    const emailContent = generateInvitationEmail(user.name, inviteToken, role);

    // Send the email
    const emailResult = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@revarity.help',
    });

    if (!emailResult.success) {
      // Rollback - delete the user if email fails
      await prisma.user.delete({ where: { id: user.id } });
      
      return NextResponse.json(
        { error: 'Failed to send invitation email. Please try again.' },
        { status: 500 }
      );
    }

    console.log('✅ Invitation email sent successfully to:', email);

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      emailSent: true,
    });
  } catch (error) {
    console.error('❌ Error inviting user:', error);
    return NextResponse.json(
      { error: 'Failed to invite user' },
      { status: 500 }
    );
  }
}
