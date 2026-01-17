import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/webhooks/guesty - Handle Guesty webhook for completed tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify webhook signature if available
    const signature = request.headers.get('x-guesty-signature')
    if (process.env.GUESTY_WEBHOOK_SECRET && signature) {
      // TODO: Implement signature verification
      // For now, we'll skip this in development
    }

    // Extract task information from webhook payload
    // The exact structure depends on Guesty's webhook format
    const {
      taskId,
      propertyName,
      cleanerEmail,
      completedAt,
      status,
    } = body

    // Validate required fields
    if (!taskId || !propertyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Only process completed tasks
    if (status !== 'completed' && !completedAt) {
      return NextResponse.json(
        { message: 'Task not completed, skipping' },
        { status: 200 }
      )
    }

    // Find cleaner by email if provided
    let cleanerId = null
    if (cleanerEmail) {
      const cleaner = await prisma.user.findFirst({
        where: {
          email: cleanerEmail,
          role: 'CLEANER',
        },
      })
      cleanerId = cleaner?.id || null
    }

    // Check if task already exists
    const existingTask = await prisma.task.findUnique({
      where: { guestyTaskId: taskId },
    })

    if (existingTask) {
      // Update existing task
      await prisma.task.update({
        where: { guestyTaskId: taskId },
        data: {
          status: 'PENDING_REVIEW',
          completedAt: completedAt ? new Date(completedAt) : new Date(),
          cleanerId,
        },
      })

      return NextResponse.json({
        message: 'Task updated successfully',
        taskId: existingTask.id,
      })
    }

    // Create new task
    const task = await prisma.task.create({
      data: {
        guestyTaskId: taskId,
        propertyName,
        cleanerId,
        status: 'PENDING_REVIEW',
        completedAt: completedAt ? new Date(completedAt) : new Date(),
      },
    })

    console.log(`New task created from Guesty webhook: ${task.id}`)

    return NextResponse.json({
      message: 'Task created successfully',
      taskId: task.id,
    })
  } catch (error) {
    console.error('Error processing Guesty webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}
