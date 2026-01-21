# 🚀 Setup Instructions for Cleaning Management CRM

## Current Issue: Prisma Module Not Found

You're experiencing: `Cannot find module '@prisma/engines'`

This happens when Prisma packages are not properly installed or are corrupted.

## ✅ Complete Fix (Run These Commands in Order)

### Step 1: Clean Everything
```bash
# Remove all Prisma-related files and caches
rm -rf node_modules
rm -rf .next
rm -rf node_modules/.prisma
rm package-lock.json
```

### Step 2: Reinstall Dependencies
```bash
# Install all dependencies fresh
npm install
```

### Step 3: Generate Prisma Client
```bash
# This should now work without errors
npx prisma generate
```

### Step 4: Setup Database
```bash
# Push schema to database (will prompt to reset if needed)
npx prisma db push

# Seed the database with admin user
npx prisma db seed
```

### Step 5: Start Development Server
```bash
# Start the app
npm run dev
```

### Step 6: Test Login
Open your browser to: http://localhost:3000

Default login credentials (⚠️ **CHANGE THESE IN PRODUCTION!**):
- **Email:** `imranahmed0153@gmail.com`
- **Password:** `admin123`

> ⚠️ **SECURITY WARNING:** These are default development credentials. Change them immediately in production environments!

---

## 🔍 What Was Fixed

1. **Moved `@prisma/client` to dependencies** - It was incorrectly in devDependencies
2. **Fixed `@prisma/adapter-pg` version** - Changed from 7.2.0 to 5.22.0 to match Prisma version
3. **Locked Prisma versions** - Using exact version 5.22.0 (not ^5.22.0) to prevent version conflicts

## 📋 Quick Reference Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes to database
npm run db:push

# Seed database
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## ⚠️ Troubleshooting

### If `npx prisma generate` still fails:
```bash
# Try clearing npm cache
npm cache clean --force

# Then reinstall
rm -rf node_modules package-lock.json
npm install
```

### If database connection fails:
Check your `.env` or `.env.local` file has:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/cleaning_crm"
```

### If login fails after seeding:
```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma Client
npx prisma generate

# Restart dev server
npm run dev
```

## 🎯 Expected Output

After running `npx prisma generate`, you should see:
```
✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client
```

After running `npx prisma db seed`, you should see:
```
Seeding database...
✓ Admin user created: imranahmed0153@gmail.com
Database seeding completed!
```

---

## 📞 Need Help?

If you're still stuck after following these steps, check:
1. PostgreSQL is running
2. DATABASE_URL in .env is correct
3. Node.js version is 18 or higher (`node --version`)
4. npm version is 8 or higher (`npm --version`)
