# Deployment Guide

## Prerequisites

Before deploying, ensure you have:

1. A Vercel account
2. A PostgreSQL database (Vercel Postgres, Supabase, or other)
3. Stripe account with API keys
4. Guesty account with API credentials
5. SendGrid account OR Gmail with app password

## Step-by-Step Deployment

### 1. Database Setup

#### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Create a new Postgres database
3. Copy the `DATABASE_URL` connection string

#### Option B: Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Navigate to Settings → Database
3. Copy the connection string (use "Connection pooling" for better performance)

#### Option C: Other PostgreSQL providers

Use any PostgreSQL provider (Railway, Heroku, AWS RDS, etc.) and obtain the connection string.

### 2. Environment Variables

Create the following environment variables in Vercel (or your hosting platform):

```bash
# Database
DATABASE_URL="postgresql://..." # Your database URL

# NextAuth
NEXTAUTH_URL="https://your-app-domain.vercel.app" # Your production URL
NEXTAUTH_SECRET="your-very-long-random-secret-here" # Generate with: openssl rand -base64 32

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..." # Your Stripe publishable key
STRIPE_SECRET_KEY="sk_live_..." # Your Stripe secret key
STRIPE_WEBHOOK_SECRET="whsec_..." # Get this after creating webhook

# Guesty
GUESTY_CLIENT_ID="your-client-id"
GUESTY_CLIENT_SECRET="your-client-secret"
GUESTY_WEBHOOK_SECRET="your-webhook-secret"
GUESTY_API_URL="https://open-api.guesty.com"

# Email (choose one)
# Option 1: SendGrid
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="your-verified-email@domain.com"

# Option 2: Gmail
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-specific-password" # Generate at myaccount.google.com/apppasswords

# App
APP_URL="https://your-app-domain.vercel.app"
```

### 3. Deploy to Vercel

#### Method 1: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add all environment variables
6. Click "Deploy"

#### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 4. Database Migration

After deployment, run the database migration:

```bash
# Using Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Or SSH into your deployment if supported
```

Alternatively, you can use Prisma Data Platform or run migrations locally connected to the production database.

### 5. Seed the Database

Create the initial admin user:

```bash
# Connect to production database
DATABASE_URL="your-production-database-url" npm run db:seed
```

The default admin credentials will be:
- **Email**: `imranahmed0153@gmail.com`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change the admin password immediately after first login!

### 6. Configure Webhooks

#### Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter URL: `https://your-app-domain.vercel.app/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.failed`
   - `transfer.created`
   - `transfer.failed`
5. Copy the signing secret and add it to `STRIPE_WEBHOOK_SECRET` environment variable

#### Guesty Webhooks

1. Go to your Guesty account settings
2. Navigate to Webhooks section
3. Add webhook URL: `https://your-app-domain.vercel.app/api/webhooks/guesty`
4. Subscribe to task completion events
5. Copy the webhook secret (if provided)

### 7. Test the Application

1. Navigate to your deployed URL
2. Log in with admin credentials
3. Create a test manager and cleaner
4. Verify email delivery
5. Test Stripe Connect onboarding for cleaner
6. Send a test webhook from Guesty (if available)

## Post-Deployment Checklist

- [ ] Database migrations completed successfully
- [ ] Admin user can log in
- [ ] Email invitations are being sent
- [ ] Stripe Connect onboarding works
- [ ] Webhooks are configured and receiving events
- [ ] Admin password has been changed
- [ ] All environment variables are set correctly
- [ ] SSL/HTTPS is working
- [ ] Domain is properly configured

## Troubleshooting

### Build Fails

**Error**: Prisma can't connect to database
**Solution**: Ensure `DATABASE_URL` is set correctly in Vercel environment variables

**Error**: TypeScript compilation errors
**Solution**: Run `npm run build` locally first to catch errors

### Runtime Errors

**Error**: Authentication not working
**Solution**: Check that `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set correctly

**Error**: Emails not sending
**Solution**: Verify SendGrid API key or Gmail app password is correct

**Error**: Stripe errors
**Solution**: Ensure you're using the correct API keys (test vs. live mode)

### Database Issues

**Error**: Can't connect to database
**Solution**: 
1. Check that the database is running
2. Verify the connection string is correct
3. Ensure your IP is whitelisted (if required)

**Error**: Prisma migrations fail
**Solution**:
1. Try running `npx prisma migrate reset` (⚠️ destroys data)
2. Or manually apply migrations using `npx prisma db push`

## Security Recommendations

1. **Change default admin password** immediately after deployment
2. **Use environment-specific API keys** (test for staging, live for production)
3. **Enable rate limiting** on API routes (consider using Vercel's built-in features)
4. **Monitor webhook failures** and set up alerts
5. **Regularly update dependencies** with `npm audit` and `npm update`
6. **Use strong NEXTAUTH_SECRET** - generate with `openssl rand -base64 32`
7. **Implement HTTPS only** - Vercel does this by default
8. **Review Stripe webhook signatures** are being validated

## Scaling Considerations

### Performance

- Enable Vercel Edge functions for global distribution
- Use database connection pooling (PgBouncer)
- Consider caching with Redis for frequently accessed data
- Optimize images with Next.js Image component

### Monitoring

- Set up Vercel Analytics
- Use Sentry for error tracking
- Monitor Stripe Dashboard for payment issues
- Set up uptime monitoring (UptimeRobot, Pingdom, etc.)

### Backup

- Enable automated database backups
- Export critical data regularly
- Keep versioned copies of environment variables

## Support

For issues or questions:
1. Check this deployment guide
2. Review the main README.md
3. Open an issue on GitHub
4. Contact the development team

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
