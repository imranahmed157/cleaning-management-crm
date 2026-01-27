import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    const { isActive } = await request.json();

    const user = await prisma.user.update({
      where: { id: params.userId },
      data: { isActive },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
