import sgMail from '@sendgrid/mail'
import nodemailer from 'nodemailer'

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

// Configure Gmail transporter as fallback
const gmailTransporter = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  : null

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  const fromEmail = from || process.env.SENDGRID_FROM_EMAIL || process.env.GMAIL_USER || 'noreply@example.com'

  try {
    // Try SendGrid first
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send({
        to,
        from: fromEmail,
        subject,
        html,
      })
      console.log(`Email sent via SendGrid to ${to}`)
      return { success: true, provider: 'sendgrid' }
    }

    // Fallback to Gmail
    if (gmailTransporter) {
      await gmailTransporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
      })
      console.log(`Email sent via Gmail to ${to}`)
      return { success: true, provider: 'gmail' }
    }

    // No email provider configured
    console.log(`Email would be sent to ${to} with subject: ${subject}`)
    console.log('HTML content:', html)
    return { success: false, error: 'No email provider configured' }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: String(error) }
  }
}

export function generateInvitationEmail(name: string, token: string, role: string) {
const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'}/auth/signup?token=${token}`  
  return {
    subject: "You've been invited to Cleaning Management CRM",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Cleaning Management CRM</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>You've been invited to join Cleaning Management CRM as a <strong>${role}</strong>.</p>
              <p>To complete your registration and set up your password, please click the button below:</p>
              <a href="${setupUrl}" class="button">Set Up Your Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #2563eb;">${setupUrl}</p>
              <p>This link will expire in 24 hours.</p>
            </div>
            <div class="footer">
              <p>© 2026 Cleaning Management CRM. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

export function generatePaymentApprovedEmail(name: string, amount: number, taskId: string) {
  return {
    subject: `Payment Approved - $${amount.toFixed(2)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Approved!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Great news! Your cleaning task has been approved and payment has been processed.</p>
              <div class="amount">$${amount.toFixed(2)}</div>
              <p><strong>Task ID:</strong> ${taskId}</p>
              <p>The payment has been sent to your connected Stripe account and should arrive within 2-3 business days.</p>
              <p>Thank you for your excellent work!</p>
            </div>
            <div class="footer">
              <p>© 2026 Cleaning Management CRM. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

export function generatePaymentFailedEmail(taskId: string, error: string) {
  return {
    subject: `Payment Failed - Task #${taskId}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9fafb; }
            .error { background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Failed</h1>
            </div>
            <div class="content">
              <h2>Payment Processing Error</h2>
              <p>There was an error processing payment for Task #${taskId}.</p>
              <div class="error">
                <strong>Error Details:</strong><br>
                ${error}
              </div>
              <p>Please review the transaction and try again, or contact support if the issue persists.</p>
            </div>
            <div class="footer">
              <p>© 2026 Cleaning Management CRM. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}
