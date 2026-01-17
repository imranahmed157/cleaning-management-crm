import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminEmail = 'imranahmed0153@gmail.com'
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    })

    console.log(`✓ Admin user created: ${admin.email}`)
  } else {
    console.log(`✓ Admin user already exists: ${adminEmail}`)
  }

  console.log('Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
