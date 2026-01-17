import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/manager/tasks - List all pending tasks
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING_REVIEW'

    const tasks = await prisma.task.findMany({
      where: {
        status: status as any,
      },
      include: {
        cleaner: {
          select: {
            id: true,
            name: true,
            email: true,
            stripeConnectedAccountId: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}
