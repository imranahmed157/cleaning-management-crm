# Cleaning Management CRM

A complete web-based CRM for managing cleaning tasks, payments, and users for an Airbnb cleaning business. Integrates with Guesty (task management) and Stripe (payments) with role-based access control.

## Features

- **Authentication**: NextAuth.js v5 with credentials provider
- **Role-Based Access Control**: Admin, Manager, and Cleaner roles
- **User Management**: Email invitations with password setup
- **Task Management**: Sync completed tasks from Guesty via webhooks
- **Payment Processing**: Stripe Payment Intents for charging guests
- **Payouts**: Stripe Connect for paying cleaners
- **Email Notifications**: SendGrid/Gmail for invitations and payment notifications

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + TailwindCSS
- **Backend**: Next.js API routes (serverless)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Payments**: Stripe + Stripe Connect
- **Email**: SendGrid / Gmail
- **Hosting**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or cloud-based like Vercel Postgres)
- Stripe account
- Guesty account (for webhook integration)
- SendGrid or Gmail account (for emails)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/imranahmed157/cleaning-management-crm.git
cd cleaning-management-crm
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cleaning_crm"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-random-secret-here"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Guesty
GUESTY_CLIENT_ID="..."
GUESTY_CLIENT_SECRET="..."
GUESTY_WEBHOOK_SECRET="..."
GUESTY_API_URL="https://open-api.guesty.com"

# SendGrid
SENDGRID_API_KEY="..."
SENDGRID_FROM_EMAIL="your-email@example.com"

# Gmail (alternative to SendGrid)
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"

# App
APP_URL="http://localhost:3000"
```

4. Generate Prisma client:
```bash
npm run db:generate
```

5. Push database schema (for development):
```bash
npm run db:push
```

Or run migrations (for production):
```bash
npm run db:migrate
```

6. Seed the database with admin user:
```bash
npm run db:seed
```

This creates an admin user:
- Email: `imranahmed0153@gmail.com`
- Password: `admin123`
- Role: `ADMIN`

> ⚠️ **SECURITY WARNING:** These are default development credentials. In production, change the admin password immediately after first login or update the seed script with secure credentials.

7. Run the development server:
```bash
npm run dev
```

8. Open [http://localhost:3000](http://localhost:3000) and log in with the admin credentials.

## User Roles & Features

### Admin
- Full system access
- Add/remove managers and cleaners
- View all transactions
- System configuration

**Routes**: `/admin`, `/admin/users`

### Manager
- View completed cleaning tasks
- Approve/deny cleaner payments
- Select guest to charge (from Stripe customer list)
- Set cleaning fees (cleaner amount + 20% markup)
- View transaction history

**Routes**: `/manager`, `/manager/tasks`, `/manager/transactions`

### Cleaner
- View assigned tasks
- See payment status
- Connect Stripe account (for receiving payouts)
- View payment history

**Routes**: `/cleaner`, `/cleaner/tasks`, `/cleaner/payments`

## API Routes

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints
- `POST /api/auth/setup-password` - Set password after invitation

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user and send invitation

### Manager
- `GET /api/manager/tasks` - List pending tasks
- `POST /api/manager/tasks/[id]/approve` - Approve task and process payment

### Cleaner
- `GET /api/cleaner/tasks` - List assigned tasks
- `GET /api/cleaner/stripe-connect` - Check Stripe Connect status
- `POST /api/cleaner/stripe-connect` - Create Stripe Connect onboarding link

### Stripe
- `GET /api/stripe/customers` - List all Stripe customers

### Webhooks
- `POST /api/webhooks/guesty` - Handle Guesty task completion webhooks

## Database Schema

The application uses Prisma with the following models:

- **User**: Users with roles (Admin, Manager, Cleaner)
- **Task**: Cleaning tasks synced from Guesty
- **Transaction**: Payment transactions linking tasks, guests, and cleaners
- **InvitationToken**: Temporary tokens for user invitations

See `prisma/schema.prisma` for the complete schema.

## Deployment

### Vercel Deployment

1. Push your code to GitHub

2. Connect your repository to Vercel:
   - Go to [Vercel](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository

3. Configure environment variables in Vercel:
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.example`

4. Deploy:
   - Vercel will automatically deploy on push to main branch

5. Set up database:
   - Create a Vercel Postgres database
   - Run migrations: `npx prisma migrate deploy`
   - Seed the database: `npm run db:seed`

6. Configure webhooks:
   - Guesty webhook URL: `https://your-app.vercel.app/api/webhooks/guesty`
   - Stripe webhook URL: `https://your-app.vercel.app/api/webhooks/stripe`

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database (dev)
npm run db:migrate   # Run migrations (production)
npm run db:seed      # Seed database with admin user
npm run db:studio    # Open Prisma Studio (database GUI)
```

## Security Considerations

- All API routes are protected with authentication
- Role-based middleware enforces access control
- Webhook endpoints should verify signatures
- Never commit `.env` files to version control
- Use strong passwords for admin accounts
- Keep dependencies up to date

## Troubleshooting

### Database connection issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall/network settings

### Email not sending
- Verify SendGrid API key or Gmail app password
- Check SMTP settings
- Look for errors in server logs

### Stripe Connect issues
- Ensure Stripe secret key is correct
- Verify Stripe account is in the correct mode (test/live)
- Check connected account status in Stripe Dashboard

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please open an issue on GitHub.
