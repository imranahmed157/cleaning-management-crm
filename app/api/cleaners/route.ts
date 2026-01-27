import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cleaners = await prisma.user.findMany({
      where: {
        role: 'CLEANER',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json(cleaners);
  } catch (error) {
    console.error('Error fetching cleaners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cleaners' },
      { status: 500 }
    );
  }
}

