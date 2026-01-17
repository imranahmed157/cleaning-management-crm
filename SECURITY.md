# Security Policy

## Overview

This document outlines the security practices and considerations for the Cleaning Management CRM application.

## Reporting Security Issues

If you discover a security vulnerability, please report it by emailing the maintainers directly. **Do not** create a public GitHub issue for security vulnerabilities.

## Security Features

### Authentication & Authorization

1. **NextAuth.js v5** - Industry-standard authentication
   - Secure session management with JWT
   - CSRF protection built-in
   - HTTP-only cookies for session tokens

2. **Password Security**
   - Passwords hashed with bcrypt (10 rounds)
   - Minimum 8 characters required
   - No password stored in plain text

3. **Role-Based Access Control (RBAC)**
   - Three distinct roles: Admin, Manager, Cleaner
   - Middleware-level route protection
   - API route authorization checks
   - Client-side role verification

### Data Protection

1. **Environment Variables**
   - All sensitive credentials stored in environment variables
   - Never committed to version control
   - `.env` files excluded in `.gitignore`

2. **Database Security**
   - Prisma ORM with parameterized queries (SQL injection protection)
   - Connection pooling for performance
   - Encrypted connections to database

3. **API Security**
   - All API routes protected with authentication checks
   - Input validation on all endpoints
   - Error messages don't leak sensitive information

### Payment Security

1. **Stripe Integration**
   - PCI-compliant payment processing
   - No credit card data stored in database
   - Stripe handles all card information
   - Webhook signature verification

2. **Stripe Connect**
   - Express accounts for cleaners
   - Stripe manages identity verification
   - Secure transfer of funds

### Email Security

1. **SendGrid/Gmail**
   - API keys/app passwords stored securely
   - Email validation before sending
   - Rate limiting to prevent abuse

2. **Invitation Tokens**
   - Cryptographically secure random tokens
   - 24-hour expiration
   - Single-use only
   - Marked as used after first use

## Security Best Practices

### For Developers

1. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

2. **Code Review**
   - Review all code changes for security issues
   - Check for hardcoded secrets
   - Validate input handling
   - Ensure proper error handling

3. **Testing**
   - Test authentication flows
   - Verify authorization checks
   - Test webhook signature validation
   - Validate input sanitization

4. **Secrets Management**
   - Never commit secrets to Git
   - Use environment variables
   - Rotate credentials regularly
   - Use different keys for dev/staging/production

### For Deployment

1. **HTTPS Only**
   - Always use HTTPS in production
   - Vercel provides this by default
   - Redirect HTTP to HTTPS

2. **Environment Variables**
   - Set all variables in hosting platform
   - Never hardcode credentials
   - Use strong random values for secrets

3. **Database**
   - Use strong database passwords
   - Enable SSL/TLS connections
   - Restrict database access by IP if possible
   - Regular backups

4. **Monitoring**
   - Monitor for unusual activity
   - Set up error tracking (Sentry, etc.)
   - Review logs regularly
   - Alert on failed login attempts

### For Administrators

1. **User Management**
   - Change default admin password immediately
   - Use strong passwords for all accounts
   - Remove inactive users promptly
   - Review user list regularly

2. **Access Control**
   - Grant minimum necessary permissions
   - Review manager/cleaner assignments
   - Audit role assignments

3. **Payment Monitoring**
   - Review transactions regularly
   - Monitor for unusual patterns
   - Verify Stripe webhook deliveries
   - Check for failed payments

## Known Limitations

1. **Rate Limiting**
   - Currently relies on Vercel's built-in protection
   - Consider adding application-level rate limiting for production

2. **Password Reset**
   - Password reset flow not implemented
   - Admins must manually reset user accounts

3. **Two-Factor Authentication**
   - Not currently implemented
   - Consider adding for admin accounts

4. **Audit Logging**
   - Basic logging to console
   - Consider implementing comprehensive audit logs

## Compliance

### Data Privacy

1. **User Data**
   - Store only necessary user information
   - Email, name, role, Stripe account ID
   - No credit card information stored

2. **Transaction Data**
   - Store transaction metadata
   - Reference Stripe IDs for details
   - Retain for business purposes

3. **GDPR Considerations**
   - Users should be able to export their data
   - Implement data deletion procedures
   - Maintain data processing agreements

### PCI Compliance

- **No card data stored**: All payment processing handled by Stripe
- **PCI DSS Level 1 Service Provider**: Stripe is certified
- **Webhook security**: Signatures verified

## Security Checklist

### Initial Setup
- [ ] Change default admin password
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Use production Stripe keys (not test keys)
- [ ] Enable database SSL/TLS
- [ ] Configure webhook signature verification
- [ ] Set up error monitoring
- [ ] Enable HTTPS only

### Regular Maintenance
- [ ] Update dependencies monthly
- [ ] Review access logs weekly
- [ ] Audit user accounts monthly
- [ ] Rotate API keys quarterly
- [ ] Review Stripe transactions weekly
- [ ] Check for security updates
- [ ] Backup database regularly

### Before Each Release
- [ ] Run `npm audit`
- [ ] Check for hardcoded secrets
- [ ] Review new dependencies
- [ ] Test authentication flows
- [ ] Verify authorization checks
- [ ] Test error handling
- [ ] Review environment variables

## Incident Response

If a security incident occurs:

1. **Contain** - Immediately revoke compromised credentials
2. **Assess** - Determine scope and impact
3. **Notify** - Inform affected users if required
4. **Remediate** - Fix the vulnerability
5. **Document** - Record incident details
6. **Review** - Update security practices

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NextAuth.js Security](https://next-auth.js.org/security)
- [Stripe Security](https://stripe.com/docs/security)
- [Prisma Security](https://www.prisma.io/docs/guides/security)
- [Vercel Security](https://vercel.com/docs/security)

## Updates

This security policy will be reviewed and updated quarterly or when significant changes are made to the application.

Last Updated: January 2026
