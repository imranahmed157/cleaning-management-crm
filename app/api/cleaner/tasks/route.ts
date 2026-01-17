import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/cleaner/tasks - List cleaner's assigned tasks
export async function GET() {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'CLEANER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    const tasks = await prisma.task.findMany({
      where: {
        cleanerId: userId,
      },
      include: {
        transactions: {
          select: {
            id: true,
            cleanerFee: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching cleaner tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}
