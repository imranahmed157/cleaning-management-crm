#!/bin/bash

# 🚀 Automated Prisma Fix Script for Cleaning Management CRM
# This script fixes the "Cannot find module '@prisma/engines'" error

set -e  # Exit on any error

echo "=========================================="
echo "🔧 Fixing Prisma Installation"
echo "=========================================="
echo ""

# Step 1: Clean everything
echo "📦 Step 1/5: Cleaning old installations..."
rm -rf node_modules
rm -rf .next
rm -rf node_modules/.prisma
rm -f package-lock.json
echo "✓ Cleaned successfully"
echo ""

# Step 2: Install dependencies
echo "📦 Step 2/5: Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Step 3: Generate Prisma Client
echo "🔨 Step 3/5: Generating Prisma Client..."
npx prisma generate
echo "✓ Prisma Client generated"
echo ""

# Step 4: Setup database
echo "🗄️  Step 4/5: Setting up database..."
echo "⚠️  You may be prompted to reset the database. Type 'y' if asked."
npx prisma db push
echo ""

# Step 5: Seed database
echo "🌱 Step 5/5: Seeding database..."
npx prisma db seed
echo "✓ Database seeded"
echo ""

echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "🚀 To start the development server, run:"
echo "   npm run dev"
echo ""
echo "🔐 Default login credentials (for development):"
echo "   Email: imranahmed0153@gmail.com"
echo "   Password: admin123"
echo ""
echo "⚠️  SECURITY WARNING: Change default credentials in production!"
echo ""
echo "🌐 Open your browser to: http://localhost:3000"
echo ""
